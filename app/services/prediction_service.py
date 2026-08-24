#!/usr/bin/env python3
"""
LesionXpert AI - Unified Model Prediction Service
Supports dynamic switching between MobileNetV2 and ResNet50 without modifying frontend code.
"""

import os
import sys
import json
import datetime
from pathlib import Path
from typing import Dict, Any, Optional, Tuple
import numpy as np

ROOT_DIR = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(ROOT_DIR))

from ml.dataset_inspector import REQUIRED_CLASSES
from ml.preprocessing import load_and_preprocess_image, IMG_SIZE_DEFAULT

RISK_MAP = {
    "Oral Leukoplakia": "high",
    "Oral Submucous Fibrosis (OSMF)": "high",
    "Oral Lichen Planus (OLP)": "moderate",
    "Oral Carcinoma (OCA)": "high",
    "Erythroplakia": "high",
    "Actinic Cheilitis": "moderate",
    "Chronic Hyperplastic Candidiasis": "moderate",
    "Normal Oral Tissue": "low"
}

CODE_MAP = {
    "Oral Leukoplakia": "OLK",
    "Oral Submucous Fibrosis (OSMF)": "OSMF",
    "Oral Lichen Planus (OLP)": "OLP",
    "Oral Carcinoma (OCA)": "OCA",
    "Erythroplakia": "ERY",
    "Actinic Cheilitis": "AC",
    "Chronic Hyperplastic Candidiasis": "CHC",
    "Normal Oral Tissue": "NORM"
}

class PredictionService:
    def __init__(self, default_model: str = "mobilenet"):
        self.active_model_name = os.environ.get("ACTIVE_MODEL", default_model).lower()
        self._loaded_models: Dict[str, Any] = {}
        self._class_maps: Dict[str, list] = {}

    def set_active_model(self, model_name: str) -> Dict[str, Any]:
        cleaned = model_name.strip().lower()
        if "resnet" in cleaned:
            target = "resnet"
        elif "mobilenet" in cleaned:
            target = "mobilenet"
        else:
            target = cleaned

        self.active_model_name = target
        return {
            "status": "success",
            "active_model": target,
            "is_available": self.is_model_available(target)
        }

    def is_model_available(self, model_name: Optional[str] = None) -> bool:
        target = model_name or self.active_model_name
        model_path = Path(f"models/{target}/{target}_v1.keras")
        return model_path.exists()

    def get_model_info(self, model_name: Optional[str] = None) -> Dict[str, Any]:
        target = model_name or self.active_model_name
        meta_path = Path(f"models/{target}/metadata.json")
        weights_path = Path(f"models/{target}/{target}_v1.keras")
        is_avail = weights_path.exists()

        if meta_path.exists():
            with open(meta_path, "r") as f:
                data = json.load(f)
                data["is_available"] = is_avail
                return data
        return {
            "model_name": "MobileNetV2" if target == "mobilenet" else "ResNet50",
            "model_version": f"{target}_v1",
            "is_available": is_avail,
            "status": "Selected model is not currently available." if not is_avail else "Available"
        }

    def _get_or_load_model(self, model_name: str):
        if model_name in self._loaded_models:
            return self._loaded_models[model_name]

        model_path = Path(f"models/{model_name}/{model_name}_v1.keras")
        if not model_path.exists():
            return None

        import tensorflow as tf
        model = tf.keras.models.load_model(str(model_path))
        self._loaded_models[model_name] = model

        # Load class indices
        class_map_file = Path(f"models/{model_name}/class_indices.json")
        if class_map_file.exists():
            with open(class_map_file, "r") as f:
                cmap = json.load(f)
                self._class_maps[model_name] = [cmap[str(i)] for i in range(len(cmap))]
        else:
            self._class_maps[model_name] = REQUIRED_CLASSES

        return model

    def predict(self, image_data: Any, model_name: Optional[str] = None) -> Dict[str, Any]:
        target_model_name = (model_name or self.active_model_name).lower()
        if "resnet" in target_model_name:
            target_model_name = "resnet"
        elif "mobilenet" in target_model_name:
            target_model_name = "mobilenet"

        # Check if model exists
        if not self.is_model_available(target_model_name):
            return {
                "success": False,
                "error": "Selected model is not currently available.",
                "available_models": {
                    "mobilenet": self.is_model_available("mobilenet"),
                    "resnet": self.is_model_available("resnet")
                }
            }

        try:
            model = self._get_or_load_model(target_model_name)
            if model is None:
                return {"success": False, "error": "Selected model is not currently available."}

            class_names = self._class_maps.get(target_model_name, REQUIRED_CLASSES)

            # Preprocess image
            arr = load_and_preprocess_image(image_data, model_type=target_model_name)
            arr_batch = np.expand_dims(arr, axis=0)

            # Inference
            raw_probs = model.predict(arr_batch, verbose=0)[0]
            pred_idx = int(np.argmax(raw_probs))
            predicted_class = class_names[pred_idx]
            confidence = float(raw_probs[pred_idx] * 100)

            # Probability Distribution
            probabilities = []
            for idx, c in enumerate(class_names):
                pct = float(raw_probs[idx] * 100)
                probabilities.append({
                    "condition": c,
                    "code": CODE_MAP.get(c, f"C{idx+1}"),
                    "percentage": round(pct, 2),
                    "risk": RISK_MAP.get(c, "moderate")
                })

            # Grad-CAM Visual Attention
            from ml.gradcam import generate_gradcam_heatmap
            heatmap, grad_err = generate_gradcam_heatmap(model, arr_batch, pred_index=pred_idx)
            
            gradcam_region = {"x": 50, "y": 50, "radius": 25, "intensity": 0.85}
            if heatmap is not None and isinstance(heatmap, np.ndarray) and heatmap.size > 0:
                y_indices, x_indices = np.where(heatmap > 0.5)
                if len(x_indices) > 0 and len(y_indices) > 0:
                    gradcam_region = {
                        "x": round(float(np.mean(x_indices) / heatmap.shape[1] * 100), 1),
                        "y": round(float(np.mean(y_indices) / heatmap.shape[0] * 100), 1),
                        "radius": 25,
                        "intensity": round(float(np.max(heatmap)), 2)
                    }

            # Recommendation based on finding
            if "Normal" in predicted_class:
                rec_action = "Routine Monitoring"
            elif "Carcinoma" in predicted_class or "Cancer" in predicted_class or "OCA" in predicted_class:
                rec_action = "Urgent Biopsy & Oncologic Referral"
            elif "Leukoplakia" in predicted_class or "Fibrosis" in predicted_class or "Erythroplakia" in predicted_class:
                rec_action = "Specialist Biopsy Recommended"
            else:
                rec_action = "2-Week Clinical Followup"

            meta = self.get_model_info(target_model_name)

            return {
                "success": True,
                "case_id": f"LPX-{datetime.datetime.now().strftime('%Y%m%d%H%M%S')}",
                "timestamp": datetime.datetime.now().isoformat(),
                "model_name": meta.get("model_name", target_model_name.upper()),
                "model_version": meta.get("model_version", f"{target_model_name}_v1"),
                "predicted_class": predicted_class,
                "confidence": round(confidence, 2),
                "probabilities": probabilities,
                "gradcam_region": gradcam_region,
                "recommended_action": rec_action,
                "gradcam_status": "generated" if heatmap is not None else (grad_err or "AI attention visualization unavailable for the current model.")
            }
        except Exception as e:
            return {
                "success": False,
                "error": f"Prediction error: {str(e)}"
            }

# Singleton instance
prediction_service = PredictionService()
