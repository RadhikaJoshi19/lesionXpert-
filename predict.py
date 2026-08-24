#!/usr/bin/env python3
"""
LesionXpert AI - Single-Image CLI Diagnostic Prediction Tool
Usage:
    python predict.py "path/to/image.jpg" --model mobilenet
    python predict.py "path/to/image.jpg" --model resnet
"""

import os
import sys
import json
import argparse
from pathlib import Path

# Ensure project root is in sys.path
ROOT_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT_DIR))

from app.services.prediction_service import prediction_service

def parse_args():
    parser = argparse.ArgumentParser(description="LesionXpert AI Single-Image Diagnostic Prediction")
    parser.add_argument("image_path", type=str, help="Path to clinical image file")
    parser.add_argument("--model", type=str, choices=["mobilenet", "resnet", "mobilenetv2", "resnet50"], default="mobilenet", help="Architecture to run")
    parser.add_argument("--json", action="store_true", help="Output raw JSON format")
    return parser.parse_args()

def run_prediction(image_path: str, model_name: str = "mobilenet", output_json: bool = False):
    if not os.path.exists(image_path):
        print(f"[ERROR] Image file not found: {image_path}")
        sys.exit(1)

    result = prediction_service.predict(image_path, model_name=model_name)

    if output_json:
        print(json.dumps(result, indent=2))
        return

    if not result.get("success"):
        print(f"\n[ERROR] {result.get('error', 'Prediction failed')}")
        if "available_models" in result:
            print(f"Available models status: {result['available_models']}")
        sys.exit(1)

    print("\n" + "="*55)
    print("LESIONXPERT AI - CLINICAL INFERENCE REPORT")
    print("="*55)
    print(f"Case ID:             {result.get('case_id')}")
    print(f"Timestamp:           {result.get('timestamp')}")
    print(f"Input Image:         {image_path}")
    print(f"Active Model:        {result.get('model_name')} ({result.get('model_version')})")
    print(f"Predicted Diagnosis: {result.get('predicted_class')}")
    print(f"Confidence:          {result.get('confidence')}%")
    print(f"Recommended Action:  {result.get('recommended_action')}")
    print(f"Grad-CAM Status:     {result.get('gradcam_status')}")
    print("\nClass Probability Distribution:")
    print("-" * 55)
    for p in result.get("probabilities", []):
        bar = "#" * int(p['percentage'] / 5)
        print(f"  {p['condition']:<32} [{p['code']:<4}]: {p['percentage']:>6.2f}%  {bar}")
    print("="*55 + "\n")

if __name__ == "__main__":
    args = parse_args()
    run_prediction(args.image_path, model_name=args.model, output_json=args.json)