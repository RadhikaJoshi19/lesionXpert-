#!/usr/bin/env python3
"""
LesionXpert AI - Model Management Service
Retrieves model metadata, comparison data, and handles switching between architectures.
"""

import os
import sys
import json
from pathlib import Path
from typing import Dict, Any, List

ROOT_DIR = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(ROOT_DIR))

class ModelService:
    @staticmethod
    def get_all_models() -> List[Dict[str, Any]]:
        models_info = []
        for arch in ["mobilenet", "resnet"]:
            meta_path = Path(f"models/{arch}/metadata.json")
            weights_path = Path(f"models/{arch}/{arch}_v1.keras")
            is_available = weights_path.exists()
            if meta_path.exists():
                with open(meta_path, "r") as f:
                    data = json.load(f)
                    data["is_available"] = is_available
                    models_info.append(data)
            else:
                models_info.append({
                    "model_name": "MobileNetV2" if arch == "mobilenet" else "ResNet50",
                    "model_version": f"{arch}_v1",
                    "is_available": is_available,
                    "status": "Ready for training" if not is_available else "Trained and Available"
                })
        return models_info

    @staticmethod
    def get_comparison() -> Dict[str, Any]:
        comp_csv = Path("reports/model_comparison.csv")
        if comp_csv.exists():
            import pandas as pd
            df = pd.read_csv(comp_csv)
            return {"available": True, "data": df.to_dict(orient="records")}
        return {"available": False, "data": []}

model_service = ModelService()
