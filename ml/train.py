#!/usr/bin/env python3
"""
LesionXpert AI - Production 2-Stage Model Training Pipeline
Performs Transfer Learning (Stage 1) and Deep Fine-Tuning (Stage 2) with Class Weighting,
Learning Rate Scheduling, Early Stopping, and Experiment Logging.
"""

import os
import sys
import json
import argparse
import datetime
from pathlib import Path
from typing import Dict, List, Tuple, Any

# Ensure project root is in sys.path
ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR))

from ml.dataset_inspector import inspect_dataset, REQUIRED_CLASSES
from ml.dataset_split import create_deterministic_splits, SEED
from ml.preprocessing import load_and_preprocess_image, create_augmentation_pipeline, IMG_SIZE_DEFAULT
from ml.models import MobileNetV2LesionModel, ResNet50LesionModel

def parse_args():
    parser = argparse.ArgumentParser(description="LesionXpert AI Clinical Training Pipeline")
    parser.add_argument("--model", type=str, choices=["mobilenet", "resnet", "mobilenetv2", "resnet50"], default="mobilenet", help="Model architecture")
    parser.add_argument("--config", type=str, default="configs/training_config.yaml", help="Path to config file")
    parser.add_argument("--dataset", type=str, default="mouth_data", help="Path to mouth_data folder")
    parser.add_argument("--epochs", type=int, default=None, help="Override stage 1 epochs")
    parser.add_argument("--fine-tune-epochs", type=int, default=None, help="Override stage 2 epochs")
    parser.add_argument("--batch-size", type=int, default=None, help="Override batch size")
    parser.add_argument("--version", type=str, default=None, help="Custom model version tag")
    return parser.parse_args()

def load_config(config_path: str) -> dict:
    if os.path.exists(config_path):
        with open(config_path, "r") as f:
            if config_path.endswith(".yaml") or config_path.endswith(".yml"):
                try:
                    import yaml
                    return yaml.safe_load(f)
                except Exception:
                    pass
            try:
                return json.load(f)
            except Exception:
                pass
    # Fallback to json
    json_path = "configs/training_config.json"
    if os.path.exists(json_path):
        with open(json_path, "r") as f:
            return json.load(f)
    return {}

def train_pipeline(args):
    model_choice = "mobilenet" if "mobilenet" in args.model.lower() else "resnet"
    arch_display = "MobileNetV2" if model_choice == "mobilenet" else "ResNet50"
    print("\n" + "="*60)
    print(f"LESIONXPERT AI - CLINICAL ML TRAINING PIPELINE [{arch_display}]")
    print("="*60)

    # 1. Inspect Dataset
    print("\n[STEP 1/6] Inspecting dataset integrity...")
    report = inspect_dataset(args.dataset)

    if report.get("status") == "error" or report.get("total_images", 0) == 0:
        print(f"\n[BLOCKED] Training cannot proceed: {report.get('message')}")
        print(f"Please provide the dataset in '{args.dataset}'.")
        sys.exit(1)

    # 2. Create / Verify Deterministic Split
    print("\n[STEP 2/6] Verifying data leakage prevention and deterministic stratified split...")
    manifest_path = Path("reports/dataset_split_manifest.json")
    if not manifest_path.exists():
        create_deterministic_splits(dataset_dir=args.dataset, seed=SEED)
    
    with open(manifest_path, "r") as f:
        split_manifest = json.load(f)

    # Determine active classes in split
    active_classes = list(split_manifest["train"].keys())
    class_to_idx = {c: i for i, c in enumerate(active_classes)}
    num_classes = len(active_classes)

    print(f"Active Training Classes ({num_classes}): {active_classes}")

    # 3. Load Config
    config = load_config(args.config)
    m_cfg = config.get(model_choice, {})
    
    batch_size = args.batch_size or m_cfg.get("batch_size", 16)
    stage1_epochs = args.epochs or m_cfg.get("stage1", {}).get("epochs", 15)
    stage2_epochs = args.fine_tune_epochs or m_cfg.get("stage2_fine_tune", {}).get("epochs", 12)
    
    version_tag = args.version or f"{model_choice}_v1"
    
    # 4. Compute Class Weights on TRAINING SET ONLY
    print("\n[STEP 3/6] Calculating class balance weights from training set only...")
    import numpy as np
    from sklearn.utils.class_weight import compute_class_weight

    train_labels = []
    for c, paths in split_manifest["train"].items():
        train_labels.extend([class_to_idx[c]] * len(paths))

    train_labels = np.array(train_labels)
    unique_classes = np.unique(train_labels)
    
    class_weights_arr = compute_class_weight(
        class_weight="balanced",
        classes=unique_classes,
        y=train_labels
    )
    class_weights_dict = {int(cls): float(weight) for cls, weight in zip(unique_classes, class_weights_arr)}

    os.makedirs("reports", exist_ok=True)
    with open("reports/class_weights.json", "w") as f:
        json.dump({
            "class_weights": class_weights_dict,
            "classes": active_classes,
            "training_samples_per_class": {c: len(split_manifest["train"][c]) for c in active_classes}
        }, f, indent=2)

    print(f"Computed Class Weights: {json.dumps(class_weights_dict, indent=2)}")

    # 5. Build and Train Model
    import tensorflow as tf
    # Set seeds for reproducibility
    tf.random.set_seed(SEED)
    np.random.seed(SEED)

    print(f"\n[STEP 4/6] Initializing {arch_display} architecture with ImageNet backbone...")
    if model_choice == "mobilenet":
        lesion_model = MobileNetV2LesionModel(num_classes=num_classes, version=version_tag)
    else:
        lesion_model = ResNet50LesionModel(num_classes=num_classes, version=version_tag)

    model = lesion_model.build()

    # Preload arrays to memory for fast efficient training
    print("Loading image arrays for training, validation, and test splits...")
    def prepare_arrays(split_name: str):
        images = []
        labels = []
        for c, paths in split_manifest[split_name].items():
            for p in paths:
                if os.path.exists(p):
                    arr = load_and_preprocess_image(p, model_type=model_choice)
                    images.append(arr)
                    labels.append(class_to_idx[c])
        x_arr = np.array(images, dtype=np.float32)
        y_one_hot = tf.keras.utils.to_categorical(labels, num_classes=num_classes)
        return x_arr, y_one_hot

    x_train, y_train = prepare_arrays("train")
    x_val, y_val = prepare_arrays("val")
    x_test, y_test = prepare_arrays("test")

    n_train = len(x_train)
    n_val = len(x_val)
    n_test = len(x_test)
    print(f"Loaded: Train={n_train}, Val={n_val}, Test={n_test}")

    # Build tf.data pipeline
    train_ds = tf.data.Dataset.from_tensor_slices((x_train, y_train))
    train_ds = train_ds.shuffle(buffer_size=min(500, n_train), seed=SEED)
    aug_pipe = create_augmentation_pipeline(config)
    train_ds = train_ds.map(lambda x, y: (aug_pipe(x, training=True), y), num_parallel_calls=tf.data.AUTOTUNE)
    train_ds = train_ds.batch(batch_size).prefetch(tf.data.AUTOTUNE)

    val_ds = tf.data.Dataset.from_tensor_slices((x_val, y_val)).batch(batch_size).prefetch(tf.data.AUTOTUNE)
    test_ds = tf.data.Dataset.from_tensor_slices((x_test, y_test)).batch(batch_size).prefetch(tf.data.AUTOTUNE)

    exp_dir = Path(f"experiments/{version_tag}")
    exp_dir.mkdir(parents=True, exist_ok=True)
    
    callbacks = [
        tf.keras.callbacks.EarlyStopping(monitor="val_loss", patience=5, restore_best_weights=True, verbose=1),
        tf.keras.callbacks.ModelCheckpoint(filepath=str(exp_dir / "best_model.keras"), monitor="val_loss", save_best_only=True, verbose=1),
        tf.keras.callbacks.ReduceLROnPlateau(monitor="val_loss", factor=0.5, patience=3, min_lr=1e-6, verbose=1),
        tf.keras.callbacks.CSVLogger(str(exp_dir / "training_history.csv"))
    ]

    # STAGE 1: Train Head (Transfer Learning)
    print("\n" + "="*50)
    print(f"STAGE 1: WARM-UP CLASSIFICATION HEAD ({stage1_epochs} epochs max)")
    print("="*50)
    lesion_model.compile_stage1(learning_rate=m_cfg.get("stage1", {}).get("learning_rate", 1e-3))
    
    history_s1 = model.fit(
        train_ds,
        validation_data=val_ds,
        epochs=stage1_epochs,
        class_weight=class_weights_dict,
        callbacks=callbacks
    )

    # STAGE 2: Fine-Tuning
    print("\n" + "="*50)
    print(f"STAGE 2: DEEP FINE-TUNING ({stage2_epochs} epochs max)")
    print("="*50)
    lesion_model.compile_stage2_finetune(
        learning_rate=m_cfg.get("stage2_fine_tune", {}).get("learning_rate", 1e-5),
        unfreeze_layers=m_cfg.get("stage2_fine_tune", {}).get("unfreeze_layers_from_end", 30)
    )

    history_s2 = model.fit(
        train_ds,
        validation_data=val_ds,
        epochs=stage1_epochs + stage2_epochs,
        initial_epoch=len(history_s1.history.get("loss", [])),
        class_weight=class_weights_dict,
        callbacks=callbacks
    )

    # Save final model
    target_model_dir = Path(f"models/{model_choice}")
    target_model_dir.mkdir(parents=True, exist_ok=True)
    final_model_path = target_model_dir / f"{model_choice}_v1.keras"
    model.save(str(final_model_path))

    # Save class indices
    class_map = {i: c for i, c in enumerate(active_classes)}
    with open(target_model_dir / "class_indices.json", "w") as f:
        json.dump(class_map, f, indent=2)

    # 6. Evaluation on UNTOUCHED Test Set
    print("\n[STEP 5/6] Running final evaluation on untouched test set...")
    from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix, classification_report

    y_pred_probs = model.predict(x_test, verbose=0)
    y_pred = np.argmax(y_pred_probs, axis=1)
    y_true = np.argmax(y_test, axis=1)

    test_acc = accuracy_score(y_true, y_pred)
    test_prec = precision_score(y_true, y_pred, average="weighted", zero_division=0)
    test_sens = recall_score(y_true, y_pred, average="weighted", zero_division=0)
    test_f1 = f1_score(y_true, y_pred, average="weighted", zero_division=0)

    # Specificity calculation
    cm = confusion_matrix(y_true, y_pred, labels=list(range(num_classes)))
    specificities = []
    for i in range(num_classes):
        tn = np.sum(np.delete(np.delete(cm, i, axis=0), i, axis=1))
        fp = np.sum(np.delete(cm[:, i], i))
        spec = tn / (tn + fp) if (tn + fp) > 0 else 0.0
        specificities.append(spec)
    test_spec = float(np.mean(specificities))

    best_val_acc = max(history_s2.history.get("val_accuracy", [0.0]))
    best_epoch = int(np.argmax(history_s2.history.get("val_accuracy", [0.0]))) + 1

    # Save Model Metadata
    metadata = {
        "model_name": lesion_model.architecture_name,
        "model_version": version_tag,
        "class_names": active_classes,
        "num_classes": num_classes,
        "image_size": IMG_SIZE_DEFAULT,
        "training_dataset": args.dataset,
        "training_date": datetime.datetime.now().isoformat(),
        "hyperparameters": {
            "batch_size": batch_size,
            "stage1_lr": m_cfg.get("stage1", {}).get("learning_rate", 1e-3),
            "stage2_lr": m_cfg.get("stage2_fine_tune", {}).get("learning_rate", 1e-5),
            "random_seed": SEED
        },
        "best_epoch": best_epoch,
        "validation_metrics": {
            "val_accuracy": round(float(best_val_acc), 4),
            "val_loss": round(float(min(history_s2.history.get("val_loss", [0.0]))), 4)
        },
        "test_metrics": {
            "accuracy": round(float(test_acc), 4),
            "precision": round(float(test_prec), 4),
            "sensitivity": round(float(test_sens), 4),
            "specificity": round(float(test_spec), 4),
            "f1": round(float(test_f1), 4)
        }
    }

    with open(target_model_dir / "metadata.json", "w") as f:
        json.dump(metadata, f, indent=2)

    with open(exp_dir / "metadata.json", "w") as f:
        json.dump(metadata, f, indent=2)

    # 7. Print Required Training Output Block
    print("\n" + "="*60)
    print("MODEL TRAINING COMPLETE")
    print("="*60)
    print(f"\nModel:\n{lesion_model.architecture_name}")
    print(f"\nDataset:\n{args.dataset}")
    print(f"\nClasses:\n{num_classes}")
    print(f"\nTraining Images:\n{n_train}")
    print(f"\nValidation Images:\n{n_val}")
    print(f"\nTest Images:\n{n_test}")
    print(f"\nBest Epoch:\n{best_epoch}")
    print(f"\nBest Validation Accuracy:\n{round(best_val_acc * 100, 2)}%")
    print(f"\nTest Accuracy:\n{round(test_acc * 100, 2)}%")
    print(f"\nTest Precision:\n{round(test_prec * 100, 2)}%")
    print(f"\nTest Sensitivity:\n{round(test_sens * 100, 2)}%")
    print(f"\nTest Specificity:\n{round(test_spec * 100, 2)}%")
    print(f"\nTest F1:\n{round(test_f1, 4)}")
    print("\n" + "="*60 + "\n")

    return metadata

if __name__ == "__main__":
    cli_args = parse_args()
    train_pipeline(cli_args)
