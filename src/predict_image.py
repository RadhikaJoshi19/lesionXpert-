#!/usr/bin/env python3
"""
OPMD-AI: Single-Image Diagnostic CLI Tool
Usage:
    python src/predict_image.py "path/to/image.jpg" [--model resnet50|mobilenetv2|vgg16]
"""

import os
import sys
import json
import argparse
from pathlib import Path
import numpy as np
from PIL import Image
import tensorflow as tf

ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR))

from src.preprocessing import load_image_rgb, preprocess_for_model
from src.image_quality import assess_image_quality
from src.config import CLASS_NAMES, CLASS_DISPLAY_NAMES, CLASS_DESCRIPTIONS, RISK_TIERS

def parse_args():
    parser = argparse.ArgumentParser(description="OPMD-AI Single-Image Diagnostic Tool")
    parser.add_argument("image_path", type=str, help="Path to clinical photograph")
    parser.add_argument("--model", type=str, default="resnet50", choices=["resnet50", "mobilenetv2", "vgg16"], help="Model architecture")
    parser.add_argument("--model-file", type=str, default="", help="Custom model path")
    parser.add_argument("--gradcam", action="store_true", help="Generate and save Grad-CAM overlay")
    return parser.parse_args()

def predict_single_image(args):
    img_path = Path(args.image_path)
    if not img_path.exists():
        print(f"[ERROR] Image file '{img_path}' not found.")
        sys.exit(1)

    # Determine model path
    if args.model_file:
        model_path = Path(args.model_file)
    else:
        if args.model == "resnet50":
            model_path = Path("models/resnet50_opmd.keras")
            if not model_path.exists():
                model_path = Path("models/resnet/resnet_v1.keras")
        elif args.model == "mobilenetv2":
            model_path = Path("models/mobilenetv2_opmd.keras")
            if not model_path.exists():
                model_path = Path("models/mobilenet/mobilenet_v1.keras")
        elif args.model == "vgg16":
            model_path = Path("models/vgg16_opmd.keras")
        else:
            model_path = Path("models/resnet50_opmd.keras")

    if not model_path.exists():
        print(f"[ERROR] Model file not found at '{model_path}'.")
        print(f"Please train the model first with: python src/train_models.py --model {args.model}")
        sys.exit(1)

    # Class mapping
    class_names = CLASS_NAMES
    class_indices_file = model_path.parent / "class_indices.json"
    if class_indices_file.exists():
        try:
            with open(class_indices_file, "r") as f:
                cmap = json.load(f)
                class_names = [cmap[str(i)] if str(i) in cmap else cmap[i] for i in range(len(cmap))]
        except Exception:
            pass

    # Load and assess image
    pil_img = load_image_rgb(str(img_path))
    quality = assess_image_quality(pil_img)

    # Preprocess
    input_tensor = preprocess_for_model(pil_img, model_type=args.model)

    # Load model and predict
    model = tf.keras.models.load_model(str(model_path))
    raw_probs = model.predict(input_tensor, verbose=0)[0]
    pred_idx = int(np.argmax(raw_probs))
    predicted_class = class_names[pred_idx]
    confidence = float(raw_probs[pred_idx])

    # Print exact required diagnostic output
    print("\n" + "=" * 55)
    print("OPMD-AI SINGLE-IMAGE DIAGNOSTIC REPORT")
    print("=" * 55)
    print(f"Image:          {img_path}")
    print(f"Model:          {args.model.upper()} ({model_path.name})")
    print(f"Input shape:    {input_tensor.shape}")
    print(f"Preprocessing:  {args.model} (Standardized)")
    print(f"Class mapping:  {dict(enumerate(class_names))}")
    print(f"Image Quality:  {quality['status']} (Sharpness={quality['metrics']['blur_score']}, Mean Lux={quality['metrics']['mean_brightness']})")

    print("\nPrediction:")
    print("-" * 55)
    for idx, c in enumerate(class_names):
        prob = float(raw_probs[idx])
        bar = "#" * int(prob * 20)
        print(f"  {c:<8}: {prob * 100:>6.2f}%  {bar}")
    print("-" * 55)

    print(f"\nPredicted class: {predicted_class}")
    print(f"Confidence:      {confidence * 100:.2f}%")
    print(f"Risk Assessment: {RISK_TIERS.get(predicted_class, 'Clinical correlation required')}")
    print("=" * 55 + "\n")

    if args.gradcam:
        from src.gradcam import generate_gradcam_heatmap, overlay_gradcam
        heatmap, err = generate_gradcam_heatmap(model, input_tensor, pred_index=pred_idx)
        if heatmap is not None:
            overlay_img = overlay_gradcam(pil_img, heatmap)
            out_p = img_path.parent / f"{img_path.stem}_gradcam.jpg"
            overlay_img.save(out_p)
            print(f"[Grad-CAM] Saved attention overlay to: {out_p}")

if __name__ == "__main__":
    args = parse_args()
    predict_single_image(args)
