#!/usr/bin/env python3
"""
LesionXpert AI - Clinical Analytics & Report Serving Service
Connects to actual generated evaluation files in reports/ without hard-coded fake metrics.
"""

import os
import sys
import json
from pathlib import Path
from typing import Dict, Any

ROOT_DIR = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(ROOT_DIR))

class AnalyticsService:
    @staticmethod
    def get_dataset_report() -> Dict[str, Any]:
        report_path = Path("reports/dataset_report.json")
        if report_path.exists():
            with open(report_path, "r") as f:
                return {"available": True, "report": json.load(f)}
        return {"available": False, "report": None, "message": "Run ml/dataset_inspector.py to generate dataset audit."}

    @staticmethod
    def get_per_class_metrics() -> Dict[str, Any]:
        metrics_csv = Path("reports/per_class_metrics.csv")
        if metrics_csv.exists():
            import pandas as pd
            df = pd.read_csv(metrics_csv)
            return {"available": True, "data": df.to_dict(orient="records")}
        return {"available": False, "data": []}

    @staticmethod
    def get_evaluation_summary() -> Dict[str, Any]:
        cls_report_path = Path("reports/classification_report.txt")
        split_summary_path = Path("reports/dataset_split_summary.json")

        summary = {
            "has_classification_report": cls_report_path.exists(),
            "has_split_summary": split_summary_path.exists(),
            "classification_report": cls_report_path.read_text() if cls_report_path.exists() else None,
            "split_summary": json.loads(split_summary_path.read_text()) if split_summary_path.exists() else None
        }
        return summary

analytics_service = AnalyticsService()
