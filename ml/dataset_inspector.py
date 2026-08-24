#!/usr/bin/env python3
"""
LesionXpert AI - Clinical Dataset Inspector
Deep automated quality auditing, class verification, deduplication, and leakage analysis.
"""

import os
import sys
import json
import hashlib
import re
from pathlib import Path
from typing import Dict, List, Tuple, Any, Optional

# Standard 7 Target Classes for Oral Mucosal Lesion Classification
REQUIRED_CLASSES = [
    "Oral Leukoplakia",
    "Oral Submucous Fibrosis (OSMF)",
    "Oral Lichen Planus (OLP)",
    "Erythroplakia",
    "Actinic Cheilitis",
    "Chronic Hyperplastic Candidiasis",
    "Normal Oral Tissue"
]

# Canonical Mapping for clinical variations in dataset directory names
CLASS_ALIASES = {
    "oral leukoplakia": "Oral Leukoplakia",
    "leukoplakia": "Oral Leukoplakia",
    "olk": "Oral Leukoplakia",
    "oral_leukoplakia": "Oral Leukoplakia",
    "oral submucous fibrosis": "Oral Submucous Fibrosis (OSMF)",
    "oral submucous fibrosis (osmf)": "Oral Submucous Fibrosis (OSMF)",
    "osmf": "Oral Submucous Fibrosis (OSMF)",
    "osf": "Oral Submucous Fibrosis (OSMF)",
    "oral_submucous_fibrosis": "Oral Submucous Fibrosis (OSMF)",
    "oral lichen planus": "Oral Lichen Planus (OLP)",
    "oral lichen planus (olp)": "Oral Lichen Planus (OLP)",
    "lichen planus": "Oral Lichen Planus (OLP)",
    "olp": "Oral Lichen Planus (OLP)",
    "oral_lichen_planus": "Oral Lichen Planus (OLP)",
    "erythroplakia": "Erythroplakia",
    "oral erythroplakia": "Erythroplakia",
    "oral_erythroplakia": "Erythroplakia",
    "actinic cheilitis": "Actinic Cheilitis",
    "actinic_cheilitis": "Actinic Cheilitis",
    "cheilitis": "Actinic Cheilitis",
    "chronic hyperplastic candidiasis": "Chronic Hyperplastic Candidiasis",
    "chronic_hyperplastic_candidiasis": "Chronic Hyperplastic Candidiasis",
    "hyperplastic candidiasis": "Chronic Hyperplastic Candidiasis",
    "candidiasis": "Chronic Hyperplastic Candidiasis",
    "chc": "Chronic Hyperplastic Candidiasis",
    "normal oral tissue": "Normal Oral Tissue",
    "normal": "Normal Oral Tissue",
    "normal mucosa": "Normal Oral Tissue",
    "normal_oral_tissue": "Normal Oral Tissue",
    "normal_mucosa": "Normal Oral Tissue",
    "norm": "Normal Oral Tissue",
    "benign": "Normal Oral Tissue",
    "oca": "Oral Carcinoma (OCA)",
    "oral cancer": "Oral Carcinoma (OCA)",
    "cancer": "Oral Carcinoma (OCA)",
    "oscc": "Oral Carcinoma (OCA)",
    "carcinoma": "Oral Carcinoma (OCA)"
}

VALID_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".webp", ".tif", ".tiff"}

def compute_file_hash(filepath: Path) -> str:
    """Computes SHA-256 hash of a file for exact duplicate detection."""
    sha256 = hashlib.sha256()
    with open(filepath, "rb") as f:
        while chunk := f.read(65536):
            sha256.update(chunk)
    return sha256.hexdigest()

def extract_patient_id(filename: str) -> Optional[str]:
    """
    Extracts potential patient identifier from filename patterns
    (e.g., P001_img.jpg, patient_45_01.png, pt-12-a.jpg).
    """
    patterns = [
        r'^(?:P|PATIENT|PT|SUB|CASE)[-_]?([0-9a-zA-Z]+)',
        r'([0-9a-zA-Z]+)[-_](?:left|right|buccal|tongue|palate|lesion)'
    ]
    for pat in patterns:
        m = re.search(pat, filename, re.IGNORECASE)
        if m:
            return m.group(1).upper()
    return None

def resolve_dataset_root(dataset_dir: str = "mouth_data") -> Path:
    """Resolves potential nested structures such as mouth_data/mouth_data."""
    p = Path(dataset_dir)
    if not p.exists():
        return p
    nested = p / "mouth_data"
    if nested.exists() and nested.is_dir():
        subdirs = [d for d in nested.iterdir() if d.is_dir() and not d.name.startswith('.')]
        if len(subdirs) >= 2:
            return nested
    return p

def inspect_dataset(dataset_dir: str = "mouth_data") -> Dict[str, Any]:
    dataset_path = resolve_dataset_root(dataset_dir)
    
    if not dataset_path.exists():
        print(f"\n[ERROR] Dataset directory not found: '{dataset_dir}'")
        print("Please ensure the dataset folder 'mouth_data' is present in the workspace root.")
        return {
            "status": "error",
            "message": f"Dataset directory '{dataset_dir}' does not exist.",
            "classes_found": [],
            "missing_classes": REQUIRED_CLASSES,
            "total_images": 0
        }

    # Discover subdirectories and images
    class_dirs = [d for d in dataset_path.iterdir() if d.is_dir() and not d.name.startswith('.')]
    
    # Check if train/val/test splits already exist inside dataset
    split_subdirs = {"train", "val", "validation", "test"}
    existing_splits = [d.name.lower() for d in class_dirs if d.name.lower() in split_subdirs]
    has_predefined_splits = len(existing_splits) >= 2

    # Map discovered folders
    discovered_classes: Dict[str, List[Path]] = {}
    raw_folder_counts: Dict[str, int] = {}
    unmapped_folders: List[str] = []
    
    if has_predefined_splits:
        for split_name in existing_splits:
            split_dir = dataset_path / split_name
            for sub_d in split_dir.iterdir():
                if sub_d.is_dir() and not sub_d.name.startswith('.'):
                    raw_name = sub_d.name.strip().lower()
                    canonical = CLASS_ALIASES.get(raw_name, sub_d.name)
                    discovered_classes.setdefault(canonical, [])
                    files = [f for f in sub_d.rglob('*') if f.is_file() and f.suffix.lower() in VALID_EXTENSIONS]
                    discovered_classes[canonical].extend(files)
                    raw_folder_counts[sub_d.name] = raw_folder_counts.get(sub_d.name, 0) + len(files)
    else:
        for sub_d in class_dirs:
            raw_name = sub_d.name.strip().lower()
            canonical = CLASS_ALIASES.get(raw_name, sub_d.name)
            discovered_classes.setdefault(canonical, [])
            files = [f for f in sub_d.rglob('*') if f.is_file() and f.suffix.lower() in VALID_EXTENSIONS]
            discovered_classes[canonical].extend(files)
            raw_folder_counts[sub_d.name] = len(files)

    total_images = sum(len(files) for files in discovered_classes.values())

    # Check for missing required 7 classes
    missing_classes = [c for c in REQUIRED_CLASSES if c not in discovered_classes or len(discovered_classes[c]) == 0]
    
    # Image format, dimensions, corrupted, and duplicate analysis
    image_formats: Dict[str, int] = {}
    dimensions_summary: Dict[str, int] = {}
    corrupted_images: List[str] = []
    hash_map: Dict[str, List[str]] = {}
    patient_ids_found: Dict[str, int] = {}

    try:
        from PIL import Image
        pil_available = True
    except ImportError:
        pil_available = False

    for canonical_name, file_list in discovered_classes.items():
        for file_path in file_list:
            ext = file_path.suffix.lower()
            image_formats[ext] = image_formats.get(ext, 0) + 1
            
            # Check duplicate hash
            try:
                f_hash = compute_file_hash(file_path)
                hash_map.setdefault(f_hash, []).append(str(file_path))
            except Exception as e:
                corrupted_images.append(f"{file_path} (Hash error: {str(e)})")

            # Check patient IDs
            pid = extract_patient_id(file_path.name)
            if pid:
                patient_ids_found[pid] = patient_ids_found.get(pid, 0) + 1

            # Check dimensions & integrity
            if pil_available:
                try:
                    with Image.open(file_path) as img:
                        img.verify()
                    with Image.open(file_path) as img:
                        dim_key = f"{img.size[0]}x{img.size[1]}"
                        dimensions_summary[dim_key] = dimensions_summary.get(dim_key, 0) + 1
                except Exception as err:
                    corrupted_images.append(f"{file_path} (Corrupt: {str(err)})")

    duplicates = {h: paths for h, paths in hash_map.items() if len(paths) > 1}
    duplicate_count = sum(len(paths) - 1 for paths in duplicates.values())

    # Class counts
    class_counts = {c: len(discovered_classes.get(c, [])) for c in discovered_classes}
    required_7_counts = {c: len(discovered_classes.get(c, [])) for c in REQUIRED_CLASSES}

    # Imbalance calculation
    non_zero_counts = [cnt for cnt in class_counts.values() if cnt > 0]
    imbalance_ratio = (max(non_zero_counts) / min(non_zero_counts)) if len(non_zero_counts) > 1 else 1.0

    report = {
        "dataset_directory": str(dataset_path.absolute()),
        "total_images": total_images,
        "classes_required_7": REQUIRED_CLASSES,
        "classes_discovered": list(discovered_classes.keys()),
        "raw_folder_counts": raw_folder_counts,
        "missing_from_7_classes": missing_classes,
        "class_counts": class_counts,
        "required_7_counts": required_7_counts,
        "image_formats": image_formats,
        "dimensions_summary": dict(sorted(dimensions_summary.items(), key=lambda item: item[1], reverse=True)[:10]),
        "corrupted_images_count": len(corrupted_images),
        "corrupted_images": corrupted_images,
        "duplicate_images_count": duplicate_count,
        "duplicate_groups_count": len(duplicates),
        "imbalance_ratio": round(imbalance_ratio, 2),
        "patient_level_ids_available": len(patient_ids_found) > 15,
        "unique_patients_detected": len(patient_ids_found),
        "predefined_splits_found": has_predefined_splits
    }

    # Ensure reports directory exists
    os.makedirs("reports", exist_ok=True)

    with open("reports/dataset_report.json", "w") as f:
        json.dump(report, f, indent=2)

    with open("reports/dataset_quality_report.json", "w") as f:
        quality_summary = {
            "dataset": str(dataset_path),
            "total_images": total_images,
            "classes_discovered": list(discovered_classes.keys()),
            "missing_from_7_class_spec": missing_classes,
            "corrupted_images_count": len(corrupted_images),
            "corrupted_files": corrupted_images,
            "duplicate_files_count": duplicate_count,
            "patient_level_tracking_available": len(patient_ids_found) > 15,
            "imbalance_ratio": round(imbalance_ratio, 2),
            "quality_status": "VALIDATED" if (total_images > 0 and len(corrupted_images) == 0) else "ACTION_REQUIRED"
        }
        json.dump(quality_summary, f, indent=2)

    # Generate dataset distribution chart if matplotlib is available
    try:
        import matplotlib
        matplotlib.use('Agg')
        import matplotlib.pyplot as plt
        
        plt.figure(figsize=(10, 6))
        display_classes = list(discovered_classes.keys())
        counts = [len(discovered_classes[c]) for c in display_classes]
        colors = ['#0d9488', '#0891b2', '#2563eb', '#dc2626', '#d97706', '#9333ea', '#10b981'][:len(display_classes)]
        
        bars = plt.bar(display_classes, counts, color=colors, edgecolor='#334155', alpha=0.9)
        plt.title('LesionXpert AI - Clinical Dataset Distribution (mouth_data)', fontsize=14, fontweight='bold', pad=15)
        plt.xlabel('Clinical Lesion Category', fontsize=11, fontweight='semibold')
        plt.ylabel('Image Sample Count', fontsize=11, fontweight='semibold')
        plt.xticks(rotation=20, ha='right', fontsize=9)
        plt.grid(axis='y', linestyle='--', alpha=0.4)
        
        for bar in bars:
            yval = bar.get_height()
            plt.text(bar.get_x() + bar.get_width()/2.0, yval + 1.5, int(yval), ha='center', va='bottom', fontsize=9, fontweight='bold')
            
        plt.tight_layout()
        plt.savefig('reports/dataset_distribution.png', dpi=200)
        plt.close()
    except Exception as plot_err:
        pass

    # Formatted Terminal Output
    print("\n" + "="*48)
    print("DATASET REPORT")
    print("="*48)
    for c, cnt in class_counts.items():
        print(f"{c:<34} {cnt:>5} images")
    print("-" * 48)
    print(f"{'Total:':<34} {total_images:>5}")
    print("="*48 + "\n")

    if missing_classes:
        print("[DATASET QUALITY AUDIT]: 7-Class Clinical Comparison")
        print(f"  Present in mouth_data ({len(discovered_classes)}): {', '.join(discovered_classes.keys())}")
        print(f"  Missing from 7-class spec ({len(missing_classes)}): {', '.join(missing_classes)}")
        print("  Class mapping configured for production transfer learning pipeline.\n")

    if corrupted_images:
        print(f"[WARNING]: Detected {len(corrupted_images)} unreadable/corrupted images.")

    if duplicate_count > 0:
        print(f"[INFO]: Detected {duplicate_count} exact duplicate image files.")

    return report

if __name__ == "__main__":
    dataset_target = sys.argv[1] if len(sys.argv) > 1 else "mouth_data"
    inspect_dataset(dataset_target)
