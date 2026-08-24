#!/usr/bin/env python3
"""
LesionXpert AI - Patient-Aware Stratified Dataset Splitter
Prevents data leakage, handles patient grouping, removes duplicates, and generates reproducible splits.
"""

import os
import sys
import json
import random
import shutil
import hashlib
from pathlib import Path
from typing import Dict, List, Tuple, Any

# Ensure project root is in sys.path
ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR))

from ml.dataset_inspector import (
    REQUIRED_CLASSES, 
    CLASS_ALIASES, 
    VALID_EXTENSIONS, 
    extract_patient_id, 
    compute_file_hash,
    resolve_dataset_root
)

SEED = 42

def create_deterministic_splits(
    dataset_dir: str = "mouth_data",
    train_ratio: float = 0.70,
    val_ratio: float = 0.15,
    test_ratio: float = 0.15,
    seed: int = SEED
) -> Dict[str, Any]:
    random.seed(seed)
    dataset_path = resolve_dataset_root(dataset_dir)

    if not dataset_path.exists():
        print(f"[ERROR] Source dataset directory '{dataset_dir}' not found.")
        return {"status": "error", "message": f"'{dataset_dir}' not found."}

    # Discover and map files
    raw_class_files: Dict[str, List[Path]] = {}
    for sub_d in dataset_path.iterdir():
        if sub_d.is_dir() and not sub_d.name.startswith('.'):
            raw_name = sub_d.name.strip().lower()
            canonical = CLASS_ALIASES.get(raw_name, sub_d.name)
            raw_class_files.setdefault(canonical, [])
            for f in sub_d.rglob('*'):
                if f.is_file() and f.suffix.lower() in VALID_EXTENSIONS:
                    raw_class_files[canonical].append(f)

    # 1. Deduplication using SHA-256 to prevent leakage
    seen_hashes = set()
    deduped_class_files: Dict[str, List[Path]] = {}
    removed_duplicates = 0

    for c, files in raw_class_files.items():
        deduped_class_files[c] = []
        for f in sorted(files, key=lambda x: str(x)):
            try:
                f_hash = compute_file_hash(f)
                if f_hash not in seen_hashes:
                    seen_hashes.add(f_hash)
                    deduped_class_files[c].append(f)
                else:
                    removed_duplicates += 1
            except Exception:
                deduped_class_files[c].append(f)

    # 2. Check for Patient ID Grouping
    patient_map: Dict[str, Dict[str, List[Path]]] = {} # patient_id -> class -> list of files
    unassigned_by_class: Dict[str, List[Path]] = {c: [] for c in deduped_class_files}
    patient_id_count = 0

    for c, files in deduped_class_files.items():
        for f in files:
            pid = extract_patient_id(f.name)
            if pid:
                patient_id_count += 1
                patient_map.setdefault(pid, {}).setdefault(c, []).append(f)
            else:
                unassigned_by_class[c].append(f)

    use_patient_splitting = len(patient_map) >= 20

    active_classes = list(deduped_class_files.keys())
    split_manifest = {
        "train": {c: [] for c in active_classes},
        "val": {c: [] for c in active_classes},
        "test": {c: [] for c in active_classes}
    }

    if use_patient_splitting:
        print(f"[INFO] Discovered {len(patient_map)} distinct patient identifiers. Performing patient-level disjoint split...")
        patient_list = sorted(list(patient_map.keys()))
        random.Random(seed).shuffle(patient_list)

        n_p = len(patient_list)
        n_train = int(n_p * train_ratio)
        n_val = int(n_p * val_ratio)

        train_patients = set(patient_list[:n_train])
        val_patients = set(patient_list[n_train:n_train + n_val])
        test_patients = set(patient_list[n_train + n_val:])

        for pid, cls_dict in patient_map.items():
            split_key = "train" if pid in train_patients else ("val" if pid in val_patients else "test")
            for c, flist in cls_dict.items():
                split_manifest[split_key][c].extend([str(p) for p in flist])

        # Distribute unassigned items via stratified split
        for c, flist in unassigned_by_class.items():
            flist_sorted = sorted(flist, key=lambda x: str(x))
            random.Random(seed).shuffle(flist_sorted)
            n_tot = len(flist_sorted)
            n_tr = int(n_tot * train_ratio)
            n_v = int(n_tot * val_ratio)
            split_manifest["train"][c].extend([str(p) for p in flist_sorted[:n_tr]])
            split_manifest["val"][c].extend([str(p) for p in flist_sorted[n_tr:n_tr + n_v]])
            split_manifest["test"][c].extend([str(p) for p in flist_sorted[n_tr + n_v:]])
    else:
        print("[INFO] Patient identifiers could not be fully verified across files. Performing deterministic stratified class split (SEED=42).")
        for c, flist in deduped_class_files.items():
            flist_sorted = sorted(flist, key=lambda x: str(x))
            random.Random(seed).shuffle(flist_sorted)
            n_tot = len(flist_sorted)
            n_tr = int(n_tot * train_ratio)
            n_v = int(n_tot * val_ratio)
            split_manifest["train"][c].extend([str(p) for p in flist_sorted[:n_tr]])
            split_manifest["val"][c].extend([str(p) for p in flist_sorted[n_tr:n_tr + n_v]])
            split_manifest["test"][c].extend([str(p) for p in flist_sorted[n_tr + n_v:]])

    # Summary of split counts
    train_count = sum(len(v) for v in split_manifest["train"].values())
    val_count = sum(len(v) for v in split_manifest["val"].values())
    test_count = sum(len(v) for v in split_manifest["test"].values())
    total_split_images = train_count + val_count + test_count

    summary = {
        "random_seed": seed,
        "train_ratio": train_ratio,
        "val_ratio": val_ratio,
        "test_ratio": test_ratio,
        "duplicates_removed": removed_duplicates,
        "patient_level_disjoint": use_patient_splitting,
        "total_images": total_split_images,
        "train_count": train_count,
        "val_count": val_count,
        "test_count": test_count,
        "classes": active_classes,
        "per_class_split": {
            c: {
                "train": len(split_manifest["train"][c]),
                "val": len(split_manifest["val"][c]),
                "test": len(split_manifest["test"][c]),
                "total": len(split_manifest["train"][c]) + len(split_manifest["val"][c]) + len(split_manifest["test"][c])
            }
            for c in active_classes
        }
    }

    os.makedirs("reports", exist_ok=True)
    with open("reports/dataset_split_summary.json", "w") as f:
        json.dump(summary, f, indent=2)

    with open("reports/dataset_split_manifest.json", "w") as f:
        json.dump(split_manifest, f, indent=2)

    print("\n" + "="*48)
    print("DATASET SPLIT SUMMARY")
    print("="*48)
    print(f"Training Samples:   {train_count:>5} ({round(train_count/max(1,total_split_images)*100, 1)}%)")
    print(f"Validation Samples: {val_count:>5} ({round(val_count/max(1,total_split_images)*100, 1)}%)")
    print(f"Test Samples:       {test_count:>5} ({round(test_count/max(1,total_split_images)*100, 1)}%)")
    print(f"Total:              {total_split_images:>5}")
    print(f"Patient Disjoint:   {'YES' if use_patient_splitting else 'NO (Stratified Image-Level, Leakage Protected)'}")
    print("="*48 + "\n")

    return summary

if __name__ == "__main__":
    target = sys.argv[1] if len(sys.argv) > 1 else "mouth_data"
    create_deterministic_splits(target)
