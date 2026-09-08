#!/usr/bin/env python3
"""
OPMD-AI: Multi-Architecture Transfer Learning & Fine-Tuning Pipeline
Trains ResNet50, MobileNetV2, and VGG16 with two-stage transfer learning.
"""

import os
import sys
import json
import argparse
from typing import Tuple
from pathlib import Path
import numpy as np
import tensorflow as tf
from tensorflow.keras import layers, models, callbacks
from sklearn.utils.class_weight import compute_class_weight

ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR))

from src.config import CLASS_NAMES

SEED = 42
IMG_SIZE = (224, 224)
BATCH_SIZE = 16
STAGE1_EPOCHS = 18
STAGE2_EPOCHS = 14

def parse_args():
    parser = argparse.ArgumentParser(description="Train OPMD-AI Models")
    parser.add_argument("--model", type=str, choices=["resnet50", "mobilenetv2", "vgg16", "all"], default="resnet50")
    parser.add_argument("--dataset-dir", type=str, default="dataset", help="Root directory containing train/ and val/")
    parser.add_argument("--batch-size", type=int, default=BATCH_SIZE)
    return parser.parse_args()

def build_model(arch: str, num_classes: int = 5) -> Tuple[tf.keras.Model, tf.keras.Model]:
    inputs = layers.Input(shape=(224, 224, 3), name="input_image")
    arch = arch.lower().replace("-", "").replace("_", "")

    if "mobilenet" in arch:
        base_backbone = tf.keras.applications.MobileNetV2(
            include_top=False,
            weights="imagenet",
            input_tensor=inputs
        )
        base_backbone.trainable = False
        x = base_backbone(inputs, training=False)
        x = layers.GlobalAveragePooling2D(name="global_avg_pool")(x)
        x = layers.BatchNormalization(name="head_bn")(x)
        x = layers.Dense(256, activation="relu", name="head_dense")(x)
        x = layers.Dropout(0.30, name="head_dropout")(x)
        outputs = layers.Dense(num_classes, activation="softmax", name="class_probabilities")(x)
        model = models.Model(inputs=inputs, outputs=outputs, name="MobileNetV2_OPMD")

    elif "vgg" in arch:
        base_backbone = tf.keras.applications.VGG16(
            include_top=False,
            weights="imagenet",
            input_tensor=inputs
        )
        base_backbone.trainable = False
        x = base_backbone(inputs, training=False)
        x = layers.GlobalAveragePooling2D(name="global_avg_pool")(x)
        x = layers.Dense(256, activation="relu", name="head_dense")(x)
        x = layers.Dropout(0.40, name="head_dropout")(x)
        outputs = layers.Dense(num_classes, activation="softmax", name="class_probabilities")(x)
        model = models.Model(inputs=inputs, outputs=outputs, name="VGG16_OPMD")

    else:
        # Default ResNet50
        base_backbone = tf.keras.applications.ResNet50(
            include_top=False,
            weights="imagenet",
            input_tensor=inputs
        )
        base_backbone.trainable = False
        x = base_backbone(inputs, training=False)
        x = layers.GlobalAveragePooling2D(name="global_avg_pool")(x)
        x = layers.BatchNormalization(name="head_bn")(x)
        x = layers.Dense(256, activation="relu", name="head_dense")(x)
        x = layers.Dropout(0.35, name="head_dropout")(x)
        outputs = layers.Dense(num_classes, activation="softmax", name="class_probabilities")(x)
        model = models.Model(inputs=inputs, outputs=outputs, name="ResNet50_OPMD")

    return model, base_backbone

def train_single_architecture(arch: str, dataset_dir: str = "dataset", batch_size: int = BATCH_SIZE):
    tf.random.set_seed(SEED)
    np.random.seed(SEED)

    train_path = os.path.join(dataset_dir, "train")
    val_path = os.path.join(dataset_dir, "val")

    if not os.path.exists(train_path):
        print(f"[ERROR] Training path '{train_path}' does not exist.")
        sys.exit(1)

    print("\n" + "=" * 65)
    print(f"TRAINING PIPELINE: {arch.upper()}")
    print("=" * 65)

    # 1. Load Dataset
    train_ds = tf.keras.utils.image_dataset_from_directory(
        train_path,
        labels="inferred",
        label_mode="categorical",
        image_size=IMG_SIZE,
        batch_size=batch_size,
        shuffle=True,
        seed=SEED
    )

    class_names = train_ds.class_names
    num_classes = len(class_names)
    print(f"Discovered Classes ({num_classes}): {class_names}")

    val_ds = tf.keras.utils.image_dataset_from_directory(
        val_path,
        labels="inferred",
        label_mode="categorical",
        image_size=IMG_SIZE,
        batch_size=batch_size,
        shuffle=False
    ) if os.path.exists(val_path) else None

    # Export class map
    class_map = {i: c for i, c in enumerate(class_names)}
    os.makedirs("models", exist_ok=True)
    with open("models/class_indices.json", "w") as f:
        json.dump(class_map, f, indent=2)

    # 2. Compute Class Weights
    train_labels = []
    for _, y_batch in train_ds:
        train_labels.extend(np.argmax(y_batch.numpy(), axis=1))
    train_labels = np.array(train_labels)

    unique_classes = np.unique(train_labels)
    class_weights_arr = compute_class_weight(
        class_weight="balanced",
        classes=unique_classes,
        y=train_labels
    )
    class_weights_dict = {int(cls): float(weight) for cls, weight in zip(unique_classes, class_weights_arr)}
    print(f"Balanced Class Weights: {json.dumps(class_weights_dict, indent=2)}")

    # 3. Augmentation & Architecture Preprocessing
    data_augmentation = tf.keras.Sequential([
        layers.RandomRotation(0.04, fill_mode="reflect"),
        layers.RandomTranslation(0.05, 0.05, fill_mode="reflect"),
        layers.RandomZoom(0.08, fill_mode="reflect"),
        layers.RandomFlip("horizontal")
    ], name="augmentation")

    arch_key = arch.lower().replace("-", "").replace("_", "")

    def preprocess_train(x, y):
        x = data_augmentation(x, training=True)
        if "mobilenet" in arch_key:
            x = tf.keras.applications.mobilenet_v2.preprocess_input(x)
        elif "vgg" in arch_key:
            x = tf.keras.applications.vgg16.preprocess_input(x)
        else:
            x = tf.keras.applications.resnet50.preprocess_input(x)
        return x, y

    def preprocess_eval(x, y):
        if "mobilenet" in arch_key:
            x = tf.keras.applications.mobilenet_v2.preprocess_input(x)
        elif "vgg" in arch_key:
            x = tf.keras.applications.vgg16.preprocess_input(x)
        else:
            x = tf.keras.applications.resnet50.preprocess_input(x)
        return x, y

    train_ds = train_ds.map(preprocess_train, num_parallel_calls=tf.data.AUTOTUNE).prefetch(tf.data.AUTOTUNE)
    if val_ds:
        val_ds = val_ds.map(preprocess_eval, num_parallel_calls=tf.data.AUTOTUNE).prefetch(tf.data.AUTOTUNE)

    # 4. Construct Architecture
    model, base_backbone = build_model(arch, num_classes=num_classes)

    # Target model destination
    if "mobilenet" in arch_key:
        dest_model_path = "models/mobilenetv2_opmd.keras"
    elif "vgg" in arch_key:
        dest_model_path = "models/vgg16_opmd.keras"
    else:
        dest_model_path = "models/resnet50_opmd.keras"

    # STAGE 1: Head Warmup
    print("\n--- STAGE 1: CLASSIFICATION HEAD WARM-UP ---")
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=1e-3),
        loss=tf.keras.losses.CategoricalCrossentropy(),
        metrics=["accuracy"]
    )

    checkpoint_cb = callbacks.ModelCheckpoint(
        filepath=dest_model_path,
        monitor="val_accuracy" if val_ds else "accuracy",
        save_best_only=True,
        verbose=1
    )
    early_stop_cb = callbacks.EarlyStopping(
        monitor="val_loss" if val_ds else "loss",
        patience=5,
        restore_best_weights=True,
        verbose=1
    )

    history1 = model.fit(
        train_ds,
        validation_data=val_ds,
        epochs=STAGE1_EPOCHS,
        class_weight=class_weights_dict,
        callbacks=[checkpoint_cb, early_stop_cb]
    )

    # STAGE 2: Deep Fine-Tuning
    print("\n--- STAGE 2: DEEP FINE-TUNING ---")
    base_backbone.trainable = True
    
    if "mobilenet" in arch_key:
        unfreeze_count = 30
    elif "vgg" in arch_key:
        unfreeze_count = 4
    else:
        unfreeze_count = 25

    for layer in base_backbone.layers[:-unfreeze_count]:
        layer.trainable = False
    for layer in base_backbone.layers[-unfreeze_count:]:
        if isinstance(layer, layers.BatchNormalization):
            layer.trainable = False
        else:
            layer.trainable = True

    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=1e-5),
        loss=tf.keras.losses.CategoricalCrossentropy(),
        metrics=["accuracy"]
    )

    model.fit(
        train_ds,
        validation_data=val_ds,
        epochs=STAGE1_EPOCHS + STAGE2_EPOCHS,
        initial_epoch=len(history1.history["loss"]),
        class_weight=class_weights_dict,
        callbacks=[checkpoint_cb, early_stop_cb]
    )

    model.save(dest_model_path)
    print(f"\n[SUCCESS] Model saved to '{dest_model_path}'")
    return dest_model_path

if __name__ == "__main__":
    args = parse_args()
    if args.model == "all":
        for a in ["resnet50", "mobilenetv2", "vgg16"]:
            train_single_architecture(a, dataset_dir=args.dataset_dir, batch_size=args.batch_size)
    else:
        train_single_architecture(args.model, dataset_dir=args.dataset_dir, batch_size=args.batch_size)
