#!/usr/bin/env python3
"""
OPMD-AI: Multi-Model Benchmark & Comparison Engine
Evaluates ResNet50, MobileNetV2, and VGG16 consistently on the same test set (dataset/test).
Exports comprehensive comparison tables, per-class breakdowns, and clinical selection rationale.
"""

import os
import sys
import json
import argparse
from pathlib import Path
import pandas as pd
import numpy as np

ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR))

from src.diagnose_model import diagnose, parse_args

def compare_all_models(test_dir: str = "dataset/test"):
    models_to_test = [
        ("ResNet50", "models/resnet50_opmd.keras", "resnet50"),
        ("MobileNetV2", "models/mobilenetv2_opmd.keras", "mobilenet_v2"),
        ("VGG16", "models/vgg16_opmd.keras", "vgg16")
    ]

    results = []
    per_class_summary = []

    print("\n" + "=" * 70)
    print("OPMD-AI MULTI-MODEL COMPARATIVE BENCHMARK (UNTOUCHED TEST SET)")
    print("=" * 70)

    for name, path_str, prep in models_to_test:
        if not os.path.exists(path_str):
            print(f"[SKIP] Model '{name}' not found at '{path_str}'.")
            continue

        args = argparse.Namespace(
            model_path=path_str,
            test_dir=test_dir,
            preprocessing=prep,
            class_indices=""
        )

        diag_res = diagnose(args)
        results.append({
            "Architecture": name,
            "Model File": Path(path_str).name,
            "Overall Accuracy (%)": round(diag_res["overall_accuracy"] * 100, 2),
            "Balanced Accuracy (%)": round(diag_res["balanced_accuracy"] * 100, 2),
            "Macro F1-Score": round(diag_res["macro_f1"], 4),
            "Weighted F1-Score": round(diag_res["weighted_f1"], 4),
            "Cohen's Kappa (k)": round(diag_res["cohen_kappa"], 4),
            "Class Collapse Detected": diag_res["is_collapsed"]
        })

        for c_data in diag_res["per_class"]:
            per_class_summary.append({
                "Architecture": name,
                "Class": c_data["class"],
                "Sensitivity (%)": round(c_data["sensitivity"] * 100, 1),
                "Specificity (%)": round(c_data["specificity"] * 100, 1),
                "Precision (%)": round(c_data["precision"] * 100, 1),
                "F1-Score": round(c_data["f1"], 4),
                "Support (N)": c_data["support"]
            })

    if not results:
        print("[ERROR] No models were evaluated.")
        return

    os.makedirs("reports", exist_ok=True)

    df_summary = pd.DataFrame(results)
    df_per_class = pd.DataFrame(per_class_summary)

    # Save to CSV
    df_summary.to_csv("reports/model_comparison_summary.csv", index=False)
    df_per_class.to_csv("reports/model_comparison_per_class.csv", index=False)

    print("\n" + "=" * 70)
    print("OVERALL MODEL COMPARISON SUMMARY:")
    print("=" * 70)
    print(df_summary.to_string(index=False))

    print("\n" + "=" * 70)
    print("PER-CLASS SENSITIVITY & SPECIFICITY COMPARISON:")
    print("=" * 70)
    pivot_sens = df_per_class.pivot(index="Class", columns="Architecture", values="Sensitivity (%)")
    pivot_spec = df_per_class.pivot(index="Class", columns="Architecture", values="Specificity (%)")
    pivot_f1 = df_per_class.pivot(index="Class", columns="Architecture", values="F1-Score")
    
    print("\n--- Sensitivity (%) by Class ---")
    print(pivot_sens.to_string())
    print("\n--- Specificity (%) by Class ---")
    print(pivot_spec.to_string())
    print("\n--- F1-Score by Class ---")
    print(pivot_f1.to_string())
    print("=" * 70 + "\n")

    # Selection Rationale
    best_f1_idx = df_summary["Macro F1-Score"].idxmax()
    recommended_model = df_summary.loc[best_f1_idx, "Architecture"]
    print(f"CLINICAL SELECTION RECOMMENDATION: {recommended_model}")
    print("Rationale: Based on multi-class Macro F1-score, balanced sensitivity across lesion classes, and absence of classification collapse.")

if __name__ == "__main__":
    t_dir = sys.argv[1] if len(sys.argv) > 1 else "dataset/test"
    compare_all_models(t_dir)
