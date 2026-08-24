#!/usr/bin/env python3
"""
LesionXpert AI - Split Structure B and Train ResNet50 Pipeline
Splits 5 raw class folders (70% Train, 15% Val, 15% Test) and trains ResNet50 with class weights.
"""

import os
import sys
import shutil
import random
from pathlib import Path

def prepare_and_train(raw_dataset_dir: str):
    if not os.path.exists(raw_dataset_dir):
        print(f"[ERROR] Source dataset directory '{raw_dataset_dir}' not found!")
        sys.exit(1)

    raw_path = Path(raw_dataset_dir)
    target_dir = Path("dataset")

    # Verify that the source folder contains class folders
    class_folders = [d for d in raw_path.iterdir() if d.is_dir() and not d.name.startswith(".")]
    print(f"Found {len(class_folders)} class folders in '{raw_dataset_dir}': {[d.name for d in class_folders]}")

    if len(class_folders) < 2:
        print("[ERROR] Expected at least 5 class folders (Normal, OCA, OLK, OLP, OSF).")
        sys.exit(1)

    print("\n--- STEP 1: Creating Stratified Train (70%), Val (15%), Test (15%) Splits ---")
    random.seed(42)

    for split in ["train", "val", "test"]:
        for c in class_folders:
            (target_dir / split / c.name).mkdir(parents=True, exist_ok=True)

    valid_exts = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}

    for c in class_folders:
        images = [f for f in c.iterdir() if f.suffix.lower() in valid_exts]
        random.shuffle(images)
        n = len(images)
        n_train = int(0.70 * n)
        n_val = int(0.15 * n)

        train_imgs = images[:n_train]
        val_imgs = images[n_train:n_train + n_val]
        test_imgs = images[n_train + n_val:]

        print(f"Class '{c.name}': Total={n} -> Train={len(train_imgs)}, Val={len(val_imgs)}, Test={len(test_imgs)}")

        for img in train_imgs:
            shutil.copy2(img, target_dir / "train" / c.name / img.name)
        for img in val_imgs:
            shutil.copy2(img, target_dir / "val" / c.name / img.name)
        for img in test_imgs:
            shutil.copy2(img, target_dir / "test" / c.name / img.name)

    print("\n[SUCCESS] Dataset split completed in './dataset/'.")

    # Execute training
    from train_opmd import train_resnet50_opmd
    print("\n--- STEP 2: Launching ResNet50 Training Pipeline ---")
    train_resnet50_opmd("dataset")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python split_and_train.py <path_to_raw_dataset_folder>")
        sys.exit(1)
    prepare_and_train(sys.argv[1])
