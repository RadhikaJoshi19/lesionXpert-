#!/usr/bin/env python3
"""
OPMD-AI: Model Diagnostic & Test Set Evaluation Engine
Evaluates models strictly on the untouched test set (dataset/test).
Computes:
- Total test images & Actual class distribution
- Predicted class distribution & Collapse Detection
- Confusion matrix
- Per-class precision, recall/sensitivity, specificity, F1-score, support
- Overall accuracy, Balanced accuracy, Macro F1, Weighted F1, Cohen's Kappa
"""

import os
import sys
import json
import argparse
from pathlib import Path
import numpy as np
from PIL import Image, ImageOps
import tensorflow as tf
from sklearn.metrics import (
    confusion_matrix, classification_report, accuracy_score,
    balanced_accuracy_score, precision_score, recall_score, f1_score, cohen_kappa_score
)

def parse_args():
    parser = argparse.ArgumentParser(description="OPMD-AI Model Diagnostic Tool")
    parser.add_argument("--model-path", type=str, default="models/resnet/resnet_v1.keras", help="Path to .keras model")
    parser.add_argument("--test-dir", type=str, default="dataset/test", help="Path to test dataset directory")
    parser.add_argument("--preprocessing", type=str, choices=["auto", "resnet50", "mobilenet_v2", "vgg16", "zero_one", "minus_one_one"], default="auto", help="Preprocessing method")
    parser.add_argument("--class-indices", type=str, default="", help="Path to class_indices.json")
    return parser.parse_args()

def preprocess_image(pil_img: Image.Image, method: str) -> np.ndarray:
    img = ImageOps.exif_transpose(pil_img).convert("RGB")
    img = img.resize((224, 224), Image.Resampling.BILINEAR)
    arr = np.array(img, dtype=np.float32)

    if method in ["resnet50", "vgg16"]:
        # ImageNet mean-subtraction in BGR format
        return tf.keras.applications.resnet50.preprocess_input(arr)
    elif method in ["mobilenet_v2", "minus_one_one"]:
        # Normalized to [-1, 1]
        return tf.keras.applications.mobilenet_v2.preprocess_input(arr)
    elif method == "zero_one":
        # Normalized to [0, 1]
        return arr / 255.0
    else:
        # Default standard [0, 255] float
        return arr

def diagnose(args):
    model_path = Path(args.model_path)
    if not model_path.exists():
        print(f"[ERROR] Model not found at: {model_path}")
        sys.exit(1)

    test_dir = Path(args.test_dir)
    if not test_dir.exists():
        print(f"[ERROR] Test directory not found at: {test_dir}")
        sys.exit(1)

    # Determine class mapping
    class_folders = sorted([d.name for d in test_dir.iterdir() if d.is_dir() and not d.name.startswith(".")])
    if not class_folders:
        print(f"[ERROR] No class directories found in {test_dir}")
        sys.exit(1)

    class_names = class_folders
    class_indices_path = Path(args.class_indices) if args.class_indices else model_path.parent / "class_indices.json"
    if class_indices_path.exists():
        try:
            with open(class_indices_path, "r") as f:
                c_map = json.load(f)
                # Map integer string keys to names
                if all(str(i) in c_map for i in range(len(c_map))):
                    loaded_names = [c_map[str(i)] for i in range(len(c_map))]
                    # Check if loaded names correspond to folder names
                    if len(loaded_names) == len(class_folders):
                        class_names = class_folders  # Keep clean folder codes
        except Exception as e:
            print(f"[WARN] Could not parse class_indices.json: {e}")

    class_to_idx = {c: i for i, c in enumerate(class_names)}
    num_classes = len(class_names)

    # Determine preprocessing mode
    prep_mode = args.preprocessing
    if prep_mode == "auto":
        m_name = str(model_path).lower()
        if "resnet" in m_name:
            prep_mode = "resnet50"
        elif "mobilenet" in m_name:
            prep_mode = "mobilenet_v2"
        elif "vgg" in m_name:
            prep_mode = "vgg16"
        else:
            prep_mode = "resnet50"

    print("\n" + "=" * 65)
    print("OPMD-AI MODEL DIAGNOSTIC REPORT")
    print("=" * 65)
    print(f"Model Path:         {model_path}")
    print(f"Test Directory:     {test_dir}")
    print(f"Preprocessing:      {prep_mode}")
    print(f"Class Mapping:      {class_to_idx}")

    print(f"\nLoading model weights...")
    model = tf.keras.models.load_model(str(model_path))

    # Preload and batch inference
    y_true = []
    y_pred = []
    y_probs = []
    file_list = []

    actual_counts = {c: 0 for c in class_names}
    pred_counts = {c: 0 for c in class_names}

    test_tensors = []
    for c in class_names:
        folder = test_dir / c
        if not folder.exists():
            continue
        for img_path in sorted(folder.iterdir()):
            if img_path.suffix.lower() in [".jpg", ".jpeg", ".png", ".webp"]:
                try:
                    with Image.open(img_path) as img:
                        arr = preprocess_image(img, prep_mode)
                        test_tensors.append(arr)
                        y_true.append(class_to_idx[c])
                        actual_counts[c] += 1
                        file_list.append(str(img_path))
                except Exception as e:
                    print(f"[WARN] Skipping corrupted image {img_path}: {e}")

    if not test_tensors:
        print("[ERROR] No valid test images found.")
        sys.exit(1)

    X_test = np.array(test_tensors, dtype=np.float32)
    y_true = np.array(y_true, dtype=np.int32)
    total_samples = len(y_true)

    print(f"Running batch prediction on {total_samples} test images...")
    raw_preds = model.predict(X_test, batch_size=32, verbose=0)
    y_pred = np.argmax(raw_preds, axis=1)

    for p in y_pred:
        pred_counts[class_names[p]] += 1

    # Metrics
    acc = accuracy_score(y_true, y_pred)
    bal_acc = balanced_accuracy_score(y_true, y_pred)
    macro_f1 = f1_score(y_true, y_pred, average="macro", zero_division=0)
    weighted_f1 = f1_score(y_true, y_pred, average="weighted", zero_division=0)
    macro_prec = precision_score(y_true, y_pred, average="macro", zero_division=0)
    weighted_prec = precision_score(y_true, y_pred, average="weighted", zero_division=0)
    macro_recall = recall_score(y_true, y_pred, average="macro", zero_division=0)
    weighted_recall = recall_score(y_true, y_pred, average="weighted", zero_division=0)
    kappa = cohen_kappa_score(y_true, y_pred)

    cm = confusion_matrix(y_true, y_pred, labels=list(range(num_classes)))

    # Per-class sensitivity, specificity, precision, recall, F1
    per_class_data = []
    for i, c in enumerate(class_names):
        tp = cm[i, i]
        fn = np.sum(cm[i, :]) - tp
        fp = np.sum(cm[:, i]) - tp
        tn = np.sum(cm) - tp - fn - fp

        sens = tp / (tp + fn) if (tp + fn) > 0 else 0.0
        spec = tn / (tn + fp) if (tn + fp) > 0 else 0.0
        prec = tp / (tp + fp) if (tp + fp) > 0 else 0.0
        f1_val = (2 * prec * sens) / (prec + sens) if (prec + sens) > 0 else 0.0
        support = tp + fn

        per_class_data.append({
            "class": c,
            "sensitivity": sens,
            "specificity": spec,
            "precision": prec,
            "f1": f1_val,
            "support": int(support),
            "predicted_count": pred_counts[c]
        })

    # Class Collapse Assessment
    max_pred_class_count = max(pred_counts.values())
    max_pred_class_name = [k for k, v in pred_counts.items() if v == max_pred_class_count][0]
    collapse_percentage = (max_pred_class_count / total_samples) * 100
    is_collapsed = collapse_percentage >= 80.0

    print("\n" + "-" * 65)
    print(f"CLASS DISTRIBUTION COMPARISON ({total_samples} Total Test Images)")
    print("-" * 65)
    print(f"{'Class Name':<12} | {'Actual Count':<14} | {'Predicted Count':<16} | {'Pred Ratio (%)'}")
    print("-" * 65)
    for c in class_names:
        act = actual_counts[c]
        prd = pred_counts[c]
        ratio = (prd / total_samples) * 100
        print(f"{c:<12} | {act:<14} | {prd:<16} | {ratio:>6.2f}%")
    print("-" * 65)

    if is_collapsed:
        print(f"\n[ALERT - SEVERE CLASSIFICATION COLLAPSE DETECTED!]")
        print(f">> {collapse_percentage:.1f}% of all test images are predicted as '{max_pred_class_name}'!")
        print(f">> Model is failing to discriminate between lesion types under current settings.")
    else:
        print(f"\n[STATUS: NO SEVERE COLLAPSE DETECTED]")
        print(f">> Predictions are distributed across multiple classes (Max class '{max_pred_class_name}' = {collapse_percentage:.1f}%).")

    print("\n" + "-" * 65)
    print("GLOBAL PERFORMANCE METRICS:")
    print("-" * 65)
    print(f"Overall Accuracy:        {acc * 100:.2f}%")
    print(f"Balanced Accuracy:       {bal_acc * 100:.2f}%")
    print(f"Macro F1-Score:          {macro_f1:.4f}")
    print(f"Weighted F1-Score:       {weighted_f1:.4f}")
    print(f"Macro Precision:         {macro_prec * 100:.2f}%")
    print(f"Weighted Precision:      {weighted_prec * 100:.2f}%")
    print(f"Macro Recall / Sens:     {macro_recall * 100:.2f}%")
    print(f"Weighted Recall / Sens:  {weighted_recall * 100:.2f}%")
    print(f"Cohen's Kappa (k):       {kappa:.4f}")

    print("\n" + "-" * 65)
    print("PER-CLASS CLINICAL DIAGNOSTIC METRICS:")
    print("-" * 65)
    print(f"{'Class':<10} | {'Sensitivity':>11} | {'Specificity':>11} | {'Precision':>10} | {'F1-Score':>8} | {'N':>4}")
    print("-" * 65)
    for row in per_class_data:
        print(f"{row['class']:<10} | {row['sensitivity']*100:>10.1f}% | {row['specificity']*100:>10.1f}% | {row['precision']*100:>9.1f}% | {row['f1']:>8.4f} | {row['support']:>4}")
    print("-" * 65)

    print("\nCONFUSION MATRIX (Rows: True Class, Columns: Predicted Class):")
    print(f"Classes: {class_names}")
    print(cm)
    print("=" * 65 + "\n")

    return {
        "model_path": str(model_path),
        "total_samples": total_samples,
        "overall_accuracy": acc,
        "balanced_accuracy": bal_acc,
        "macro_f1": macro_f1,
        "weighted_f1": weighted_f1,
        "cohen_kappa": kappa,
        "is_collapsed": is_collapsed,
        "per_class": per_class_data,
        "confusion_matrix": cm.tolist()
    }

if __name__ == "__main__":
    args = parse_args()
    diagnose(args)
