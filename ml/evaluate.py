#!/usr/bin/env python3
"""
LesionXpert AI - Test Set Evaluation, Confusion Matrices & Metrics Engine
Evaluates ONLY on the untouched test set and exports clinical diagnostic reports.
"""

import os
import sys
import json
import argparse
from pathlib import Path
import numpy as np

# Ensure project root is in sys.path
ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR))

from ml.dataset_inspector import REQUIRED_CLASSES
from ml.preprocessing import load_and_preprocess_image, IMG_SIZE_DEFAULT

def parse_args():
    parser = argparse.ArgumentParser(description="Evaluate Trained LesionXpert Model")
    parser.add_argument("--model", type=str, choices=["mobilenet", "resnet", "mobilenetv2", "resnet50"], default="mobilenet")
    parser.add_argument("--dataset", type=str, default="mouth_data")
    parser.add_argument("--manifest", type=str, default="reports/dataset_split_manifest.json")
    return parser.parse_args()

def evaluate_model(args):
    model_choice = "mobilenet" if "mobilenet" in args.model.lower() else "resnet"
    arch_display = "MobileNetV2" if model_choice == "mobilenet" else "ResNet50"
    model_path = Path(f"models/{model_choice}/{model_choice}_v1.keras")
    
    if not model_path.exists():
        print(f"\n[ERROR] Model weights not found at: {model_path}")
        print(f"Please train the model first with: python ml/train.py --model {model_choice}")
        sys.exit(1)

    if not os.path.exists(args.manifest):
        print(f"\n[ERROR] Dataset split manifest not found at: {args.manifest}")
        print("Please run: python ml/dataset_split.py first.")
        sys.exit(1)

    with open(args.manifest, "r") as f:
        split_manifest = json.load(f)

    test_files = split_manifest.get("test", {})
    
    # Load class indices from model folder
    class_map_file = Path(f"models/{model_choice}/class_indices.json")
    if class_map_file.exists():
        with open(class_map_file, "r") as f:
            class_map = json.load(f)
            class_names = [class_map[str(i)] for i in range(len(class_map))]
    else:
        class_names = list(test_files.keys())

    class_to_idx = {c: i for i, c in enumerate(class_names)}
    num_classes = len(class_names)

    import tensorflow as tf
    from sklearn.metrics import confusion_matrix, classification_report, accuracy_score, precision_score, recall_score, f1_score
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    import seaborn as sns
    import pandas as pd

    print(f"\nLoading trained {arch_display} model from {model_path}...")
    model = tf.keras.models.load_model(str(model_path))

    # Preload and batch all test images for fast vectorised evaluation
    print(f"Loading test set samples for {arch_display}...")
    test_images = []
    y_true = []

    for c, file_paths in test_files.items():
        if c in class_to_idx:
            for p in file_paths:
                if os.path.exists(p):
                    arr = load_and_preprocess_image(p, model_type=model_choice)
                    test_images.append(arr)
                    y_true.append(class_to_idx[c])

    if len(y_true) == 0:
        print("[ERROR] No valid test images found to evaluate.")
        sys.exit(1)

    x_test = np.array(test_images, dtype=np.float32)
    y_true = np.array(y_true)

    print(f"Running batch inference on {len(x_test)} untouched test samples...")
    y_pred_probs = model.predict(x_test, batch_size=32, verbose=0)
    y_pred = np.argmax(y_pred_probs, axis=1)

    # Calculate overall metrics
    acc = accuracy_score(y_true, y_pred)
    macro_prec = precision_score(y_true, y_pred, average="macro", zero_division=0)
    weighted_prec = precision_score(y_true, y_pred, average="weighted", zero_division=0)
    macro_sens = recall_score(y_true, y_pred, average="macro", zero_division=0)
    weighted_sens = recall_score(y_true, y_pred, average="weighted", zero_division=0)
    macro_f1 = f1_score(y_true, y_pred, average="macro", zero_division=0)
    weighted_f1 = f1_score(y_true, y_pred, average="weighted", zero_division=0)

    # Confusion matrix
    cm = confusion_matrix(y_true, y_pred, labels=list(range(num_classes)))
    row_sums = cm.sum(axis=1)[:, np.newaxis]
    cm_norm = np.divide(cm.astype('float'), row_sums, out=np.zeros_like(cm, dtype=float), where=row_sums!=0)

    # Per-class specificity, sensitivity, precision, recall, f1, support
    per_class_rows = []
    short_labels = [c.replace("Oral ", "").replace(" (OSMF)", "").replace(" (OLP)", "").replace(" (OCA)", "") for c in class_names]

    for i, c in enumerate(class_names):
        tp = cm[i, i]
        fn = np.sum(cm[i, :]) - tp
        fp = np.sum(cm[:, i]) - tp
        tn = np.sum(cm) - tp - fn - fp

        sens = tp / (tp + fn) if (tp + fn) > 0 else 0.0
        spec = tn / (tn + fp) if (tn + fp) > 0 else 0.0
        prec = tp / (tp + fp) if (tp + fp) > 0 else 0.0
        f1 = (2 * prec * sens) / (prec + sens) if (prec + sens) > 0 else 0.0
        support = tp + fn

        per_class_rows.append({
            "Class": c,
            "Code": short_labels[i],
            "Precision": round(prec, 4),
            "Recall": round(sens, 4),
            "Sensitivity": round(sens, 4),
            "Specificity": round(spec, 4),
            "F1": round(f1, 4),
            "Support": int(support)
        })

    os.makedirs("reports", exist_ok=True)

    # 1. Save Per-Class Metrics CSV
    df_per_class = pd.DataFrame(per_class_rows)
    df_per_class.to_csv("reports/per_class_metrics.csv", index=False)

    # 2. Save Classification Report Text
    cls_report = classification_report(
        y_true,
        y_pred,
        target_names=class_names,
        zero_division=0
    )
    with open("reports/classification_report.txt", "w") as f:
        f.write(f"LesionXpert AI - Test Set Classification Report\nModel: {arch_display}\n\n")
        f.write(cls_report)

    # 3. Generate Raw Confusion Matrix Plot
    plt.figure(figsize=(9, 7))
    sns.heatmap(cm, annot=True, fmt="d", cmap="Blues", xticklabels=short_labels, yticklabels=short_labels)
    plt.title(f"LesionXpert AI - Test Set Confusion Matrix ({arch_display})", fontsize=12, fontweight="bold", pad=12)
    plt.xlabel("Predicted Class", fontweight="bold")
    plt.ylabel("True Class", fontweight="bold")
    plt.tight_layout()
    plt.savefig("reports/confusion_matrix.png", dpi=200)
    plt.close()

    # 4. Generate Normalized Confusion Matrix Plot
    plt.figure(figsize=(9, 7))
    sns.heatmap(cm_norm, annot=True, fmt=".2f", cmap="GnBu", xticklabels=short_labels, yticklabels=short_labels)
    plt.title(f"LesionXpert AI - Normalized Confusion Matrix ({arch_display})", fontsize=12, fontweight="bold", pad=12)
    plt.xlabel("Predicted Class", fontweight="bold")
    plt.ylabel("True Class", fontweight="bold")
    plt.tight_layout()
    plt.savefig("reports/confusion_matrix_normalized.png", dpi=200)
    plt.close()

    # 5. Generate Training & Validation Graphs if history exists
    history_file = Path(f"experiments/{model_choice}_v1/training_history.csv")
    if history_file.exists():
        try:
            df_hist = pd.read_csv(history_file)
            # Accuracy graph
            plt.figure(figsize=(8, 5))
            plt.plot(df_hist["epoch"] + 1, df_hist["accuracy"] * 100, label="Training Accuracy", color="#0d9488", lw=2)
            plt.plot(df_hist["epoch"] + 1, df_hist["val_accuracy"] * 100, label="Validation Accuracy", color="#2563eb", lw=2)
            plt.title(f"Training vs Validation Accuracy ({arch_display})", fontweight="bold")
            plt.xlabel("Epoch", fontweight="bold")
            plt.ylabel("Accuracy (%)", fontweight="bold")
            plt.grid(True, linestyle="--", alpha=0.5)
            plt.legend()
            plt.tight_layout()
            plt.savefig("reports/training_accuracy.png", dpi=200)
            plt.close()

            # Loss graph
            plt.figure(figsize=(8, 5))
            plt.plot(df_hist["epoch"] + 1, df_hist["loss"], label="Training Loss", color="#dc2626", lw=2)
            plt.plot(df_hist["epoch"] + 1, df_hist["val_loss"], label="Validation Loss", color="#d97706", lw=2)
            plt.title(f"Training vs Validation Loss ({arch_display})", fontweight="bold")
            plt.xlabel("Epoch", fontweight="bold")
            plt.ylabel("Loss", fontweight="bold")
            plt.grid(True, linestyle="--", alpha=0.5)
            plt.legend()
            plt.tight_layout()
            plt.savefig("reports/training_loss.png", dpi=200)
            plt.close()
        except Exception:
            pass

    # Print Formatted Evaluation Output
    print("\n" + "="*60)
    print(f"FINAL TEST SET EVALUATION ({arch_display})")
    print("="*60)
    print(f"Test Accuracy:         {round(acc * 100, 2)}%")
    print(f"Macro Precision:       {round(macro_prec * 100, 2)}%")
    print(f"Weighted Precision:    {round(weighted_prec * 100, 2)}%")
    print(f"Macro Sensitivity:     {round(macro_sens * 100, 2)}%")
    print(f"Weighted Sensitivity:  {round(weighted_sens * 100, 2)}%")
    print(f"Macro F1-Score:        {round(macro_f1, 4)}")
    print(f"Weighted F1-Score:     {round(weighted_f1, 4)}")
    print("\n" + "-"*60)
    print("PER-CLASS METRICS (TEST SET):")
    print("-" * 60)
    print(f"{'Class':<30} {'Sens':>8} {'Spec':>8} {'Prec':>8} {'F1':>8} {'N':>5}")
    print("-" * 60)
    for r in per_class_rows:
        print(f"{r['Class'][:28]:<30} {r['Sensitivity']*100:>7.1f}% {r['Specificity']*100:>7.1f}% {r['Precision']*100:>7.1f}% {r['F1']:>8.3f} {r['Support']:>5}")
    print("="*60 + "\n")

    return {
        "accuracy": acc,
        "precision": weighted_prec,
        "sensitivity": weighted_sens,
        "f1": weighted_f1
    }

if __name__ == "__main__":
    args = parse_args()
    evaluate_model(args)
