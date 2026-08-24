#!/usr/bin/env python3
"""
LesionXpert AI - Flask Application & API Server
Serves clinical inference endpoints, model switching, analytics, and metadata.
"""

import os
import sys
import json
import base64
from pathlib import Path
from flask import Flask, request, jsonify

# Ensure project root is in sys.path
ROOT_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT_DIR))

from app.services.prediction_service import prediction_service
from app.services.model_service import model_service
from app.services.analytics_service import analytics_service

app = Flask(__name__)

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({
        "status": "ok",
        "service": "LesionXpert AI Flask ML Engine",
        "active_model": prediction_service.active_model_name,
        "available_models": {
            "mobilenet": prediction_service.is_model_available("mobilenet"),
            "resnet": prediction_service.is_model_available("resnet")
        }
    })

@app.route('/api/models', methods=['GET'])
def get_models():
    models_info = model_service.get_all_models()
    return jsonify({
        "success": True,
        "activeModel": prediction_service.active_model_name,
        "models": models_info
    })

@app.route('/api/models/select', methods=['POST'])
def select_model():
    data = request.get_json(silent=True) or {}
    model_name = data.get("model")
    if not model_name:
        return jsonify({"success": False, "error": "Model identifier required ('mobilenet' or 'resnet')."}), 400

    res = prediction_service.set_active_model(model_name)
    return jsonify({
        "success": True,
        "message": f"Active model set to {prediction_service.active_model_name}",
        "activeModel": prediction_service.active_model_name,
        "isAvailable": res["is_available"]
    })

@app.route('/api/analytics/dataset-report', methods=['GET'])
def dataset_report():
    return jsonify(analytics_service.get_dataset_report())

@app.route('/api/analytics/model-comparison', methods=['GET'])
def model_comparison():
    return jsonify(model_service.get_comparison())

@app.route('/api/analytics/per-class', methods=['GET'])
def per_class_metrics():
    return jsonify(analytics_service.get_per_class_metrics())

@app.route('/api/predict', methods=['POST'])
def predict():
    try:
        data = request.get_json(silent=True) or {}
        image_data = data.get("imageUrl") or data.get("image")
        model_name = data.get("modelName") or data.get("model")

        if not image_data:
            return jsonify({"success": False, "error": "Missing image input (imageUrl or image parameter)."}), 400

        # Handle base64 encoded strings
        if isinstance(image_data, str) and image_data.startswith("data:image"):
            header, base64_str = image_data.split(",", 1)
            image_bytes = base64.b64decode(base64_str)
            result = prediction_service.predict(image_bytes, model_name=model_name)
        elif isinstance(image_data, str) and os.path.exists(image_data):
            result = prediction_service.predict(image_data, model_name=model_name)
        else:
            try:
                image_bytes = base64.b64decode(image_data)
                result = prediction_service.predict(image_bytes, model_name=model_name)
            except Exception:
                result = prediction_service.predict(image_data, model_name=model_name)

        status_code = 200 if result.get("success") else 404 if "not currently available" in result.get("error", "") else 500
        return jsonify(result), status_code

    except Exception as e:
        return jsonify({"success": False, "error": f"Inference error: {str(e)}"}), 500

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)
