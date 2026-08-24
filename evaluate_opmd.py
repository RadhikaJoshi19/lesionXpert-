#!/usr/bin/env python3
"""
LesionXpert AI - Test Dataset Evaluation & Confusion Matrix Diagnostic Tool
"""

import os
import sys
import json
from pathlib import Path
import numpy as np
import tensorflow as tf
from PIL import Image, ImageOps
from sklearn.metrics import confusion_matrix, classification_report

def evaluate_test_dataset(dataset_test_dir: str = "dataset/test", model_path: str = "models/resnet50_opmd.keras"):
    if not os.path.exists(model_path):
        print(f"[ERROR] Model file not found at: {model_path}")
        sys.exit(1)

    print(f"Loading ResNet50 model from {model_path}...")
    model = tf.keras.models.load_model(model_path)

    class_indices_file = Path(model_path).parent / "class_indices.json"
    if class_indices_file.exists():
        with open(class_indices_file, "r") as f:
            class_map = json.load(f)
            class_names = [class_map[str(i)] for i in range(len(class_map))]
    else:
        subdirs = sorted([d.name for d in Path(dataset_test_dir).iterdir() if d.is_dir() and not d.name.startswith(".")])
        class_names = subdirs

    class_to_idx = {c: i for i, c in enumerate(class_names)}
    y_true, y_pred = [], []
    actual_counts = {c: 0 for c in class_names}
    pred_counts = {c: 0 for c in class_names}

    print(f"Evaluating images in '{dataset_test_dir}'...")
    for class_folder in Path(dataset_test_dir).iterdir():
        if not class_folder.is_dir() or class_folder.name.startswith("."):
            continue
        cname = class_folder.name
        if cname not in class_to_idx:
            continue
        true_idx = class_to_idx[cname]

        for img_file in class_folder.iterdir():
            if img_file.suffix.lower() in [".jpg", ".jpeg", ".png"]:
                with Image.open(img_file) as img:
                    img = ImageOps.exif_transpose(img).convert("RGB")
                    img = img.resize((224, 224), Image.Resampling.BILINEAR)
                    img_arr = np.array(img, dtype=np.float32)

                preprocessed = tf.keras.applications.resnet50.preprocess_input(img_arr)
                probs = model.predict(np.expand_dims(preprocessed, axis=0), verbose=0)[0]
                p_idx = int(np.argmax(probs))
                p_name = class_names[p_idx]

                y_true.append(true_idx)
                y_pred.append(p_idx)
                actual_counts[cname] += 1
                pred_counts[p_name] += 1

    total = len(y_true)
    print("\n" + "=" * 60)
    print(f"EVALUATION SUMMARY ({total} Test Images)")
    print("=" * 60)
    print("\nActual distribution:")
    for c in class_names:
        print(f"  {c:<10}: {actual_counts[c]}")
    print("\nPredicted distribution:")
    for c in class_names:
        print(f"  {c:<10}: {pred_counts[c]}")

    max_p = max(pred_counts.values())
    dom_class = [k for k, v in pred_counts.items() if v == max_p][0]
    if (max_p / total) > 0.8:
        print(f"\n[ALERT - MODEL COLLAPSE DETECTED]: {(max_p/total)*100:.1f}% predicted as '{dom_class}'. Retraining required.")
    else:
        print(f"\n[SUCCESS]: Healthy distribution across classes. Dominant class represents {(max_p/total)*100:.1f}%.")

    print("\nCONFUSION MATRIX:")
    print(confusion_matrix(y_true, y_pred))
    print("\nCLASSIFICATION REPORT:")
    print(classification_report(y_true, y_pred, target_names=class_names, zero_division=0))

if __name__ == "__main__":
    t_dir = sys.argv[1] if len(sys.argv) > 1 else "dataset/test"
    evaluate_test_dataset(t_dir)