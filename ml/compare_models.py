#!/usr/bin/env python3
"""
LesionXpert AI - Model Comparison & Clinical Selection Engine
Compares MobileNetV2 and ResNet50 models on the untouched test set and produces comparative reports.
"""

import os
import sys
import json
from pathlib import Path
import pandas as pd
import numpy as np

# Ensure project root is in sys.path
ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR))

def compare_models():
    mobilenet_meta_path = Path("models/mobilenet/metadata.json")
    resnet_meta_path = Path("models/resnet/metadata.json")

    mobilenet_exists = mobilenet_meta_path.exists()
    resnet_exists = resnet_meta_path.exists()

    if not mobilenet_exists and not resnet_exists:
        print("\n[INFO] Neither MobileNetV2 nor ResNet50 has been trained yet.")
        print("Please train models with:")
        print("  python ml/train.py --model mobilenet")
        print("  python ml/train.py --model resnet")
        return

    records = []
    
    if mobilenet_exists:
        with open(mobilenet_meta_path, "r") as f:
            m_data = json.load(f)
            t_m = m_data.get("test_metrics", {})
            v_m = m_data.get("validation_metrics", {})
            records.append({
                "Model": "MobileNetV2",
                "Version": m_data.get("model_version", "mobilenetv2_v1"),
                "Validation Accuracy": v_m.get("val_accuracy", 0.0),
                "Accuracy": t_m.get("accuracy", 0.0),
                "Precision": t_m.get("precision", 0.0),
                "Sensitivity": t_m.get("sensitivity", 0.0),
                "Specificity": t_m.get("specificity", 0.0),
                "F1": t_m.get("f1", 0.0)
            })

    if resnet_exists:
        with open(resnet_meta_path, "r") as f:
            r_data = json.load(f)
            t_m = r_data.get("test_metrics", {})
            v_m = r_data.get("validation_metrics", {})
            records.append({
                "Model": "ResNet50",
                "Version": r_data.get("model_version", "resnet50_v1"),
                "Validation Accuracy": v_m.get("val_accuracy", 0.0),
                "Accuracy": t_m.get("accuracy", 0.0),
                "Precision": t_m.get("precision", 0.0),
                "Sensitivity": t_m.get("sensitivity", 0.0),
                "Specificity": t_m.get("specificity", 0.0),
                "F1": t_m.get("f1", 0.0)
            })

    df = pd.DataFrame(records)
    os.makedirs("reports", exist_ok=True)
    df.to_csv("reports/model_comparison.csv", index=False)

    print("\n" + "="*60)
    print("MODEL COMPARISON (UNTOUCHED TEST SET)")
    print("="*60)
    print(df.to_string(index=False))
    print("="*60)

    # Generate Comparison Visualization if matplotlib is available
    try:
        import matplotlib
        matplotlib.use("Agg")
        import matplotlib.pyplot as plt

        metrics = ["Accuracy", "Precision", "Sensitivity", "Specificity", "F1"]
        x = np.arange(len(metrics))
        width = 0.35

        fig, ax = plt.subplots(figsize=(10, 6))

        if len(records) == 2:
            m_vals = [records[0][m] for m in metrics]
            r_vals = [records[1][m] for m in metrics]

            rects1 = ax.bar(x - width/2, m_vals, width, label='MobileNetV2', color='#0d9488')
            rects2 = ax.bar(x + width/2, r_vals, width, label='ResNet50', color='#2563eb')

            ax.set_ylabel('Metric Score', fontweight='bold')
            ax.set_title('LesionXpert AI - Model Architecture Comparison (Test Set)', fontweight='bold', pad=15)
            ax.set_xticks(x)
            ax.set_xticklabels(metrics, fontweight='bold')
            ax.legend()
            ax.set_ylim(0, 1.1)
            ax.grid(axis='y', linestyle='--', alpha=0.5)

            for bar in rects1:
                y = bar.get_height()
                ax.text(bar.get_x() + bar.get_width()/2.0, y + 0.02, f"{y:.3f}", ha='center', va='bottom', fontsize=8, fontweight='bold')

            for bar in rects2:
                y = bar.get_height()
                ax.text(bar.get_x() + bar.get_width()/2.0, y + 0.02, f"{y:.3f}", ha='center', va='bottom', fontsize=8, fontweight='bold')

            plt.tight_layout()
            plt.savefig("reports/model_comparison.png", dpi=200)
            plt.close()
        elif len(records) == 1:
            m_vals = [records[0][m] for m in metrics]
            bars = ax.bar(x, m_vals, width, label=records[0]["Model"], color='#0d9488')
            ax.set_ylabel('Metric Score', fontweight='bold')
            ax.set_title(f'LesionXpert AI - {records[0]["Model"]} Performance (Test Set)', fontweight='bold', pad=15)
            ax.set_xticks(x)
            ax.set_xticklabels(metrics, fontweight='bold')
            ax.set_ylim(0, 1.1)
            ax.grid(axis='y', linestyle='--', alpha=0.5)
            for bar in bars:
                y = bar.get_height()
                ax.text(bar.get_x() + bar.get_width()/2.0, y + 0.02, f"{y:.3f}", ha='center', va='bottom', fontsize=8, fontweight='bold')
            plt.tight_layout()
            plt.savefig("reports/model_comparison.png", dpi=200)
            plt.close()
    except Exception as e:
        print(f"[NOTE] Comparison visualization skipped: {e}")

    # Best Model Selection Reasoning
    if len(records) == 2:
        best = max(records, key=lambda r: (r["F1"], r["Sensitivity"]))
        runner_up = min(records, key=lambda r: (r["F1"], r["Sensitivity"]))
        diff = abs(best["F1"] - runner_up["F1"])
        print(f"\nBest Performing Model: {best['Model']}")
        if diff < 0.015:
            print(f"Selection Reason: Both architectures show highly comparable diagnostic performance (delta F1 = {round(diff, 4)}). MobileNetV2 offers lower latency (ideal for mobile/edge intraoral probes), whereas ResNet50 provides deeper feature extraction.")
        else:
            print(f"Selection Reason: Higher overall F1-Score ({best['F1']:.4f}) and clinical sensitivity ({best['Sensitivity']:.4f}) across oral mucosal lesions.")
    elif len(records) == 1:
        print(f"\nCurrently Trained Model: {records[0]['Model']}")
        print("Train the second model to produce a head-to-head comparison.")

if __name__ == "__main__":
    compare_models()
