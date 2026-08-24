#!/usr/bin/env python3
"""
LesionXpert AI - Corrected 5-Class ResNet50 Training Pipeline
"""

import os
import sys
import json
from pathlib import Path
import numpy as np
import tensorflow as tf
from tensorflow.keras import layers, models, callbacks
from sklearn.utils.class_weight import compute_class_weight

SEED = 42
IMG_SIZE = (224, 224)
BATCH_SIZE = 16
STAGE1_EPOCHS = 20
STAGE2_EPOCHS = 15

def train_resnet50_opmd(dataset_dir: str = "dataset"):
    tf.random.set_seed(SEED)
    np.random.seed(SEED)

    train_dir = os.path.join(dataset_dir, "train")
    val_dir = os.path.join(dataset_dir, "val")

    if not os.path.exists(train_dir):
        print(f"[ERROR] Training directory '{train_dir}' not found.")
        sys.exit(1)

    print("\n============================================================")
    print("LESIONXPERT - RESNET50 5-CLASS TRAINING PIPELINE")
    print("============================================================")

    # 1. Load Dataset (keep raw [0, 255] for ResNet50 preprocess_input)
    train_ds = tf.keras.utils.image_dataset_from_directory(
        train_dir,
        labels="categorical",
        label_mode="categorical",
        image_size=IMG_SIZE,
        batch_size=BATCH_SIZE,
        shuffle=True,
        seed=SEED
    )

    class_names = train_ds.class_names
    num_classes = len(class_names)
    print(f"Detected Classes ({num_classes}): {class_names}")

    # Map class index to class name and export
    class_map = {i: c for i, c in enumerate(class_names)}
    os.makedirs("models", exist_ok=True)
    with open("models/class_indices.json", "w") as f:
        json.dump(class_map, f, indent=2)
    print("Exported class mapping to 'models/class_indices.json'")

    val_ds = tf.keras.utils.image_dataset_from_directory(
        val_dir,
        labels="categorical",
        label_mode="categorical",
        image_size=IMG_SIZE,
        batch_size=BATCH_SIZE,
        shuffle=False
    ) if os.path.exists(val_dir) else None

    # 2. Compute Balanced Class Weights from Training Split
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
    print(f"Computed Class Weights: {json.dumps(class_weights_dict, indent=2)}")

    # 3. Augmentation & ResNet50 ImageNet Preprocessing
    data_augmentation = tf.keras.Sequential([
        layers.RandomRotation(0.04, fill_mode="reflect"),
        layers.RandomTranslation(0.05, 0.05, fill_mode="reflect"),
        layers.RandomZoom(0.08, fill_mode="reflect"),
        layers.RandomFlip("horizontal")
    ], name="augmentation")

    def preprocess_train(x, y):
        x = data_augmentation(x, training=True)
        x = tf.keras.applications.resnet50.preprocess_input(x)
        return x, y

    def preprocess_eval(x, y):
        x = tf.keras.applications.resnet50.preprocess_input(x)
        return x, y

    train_ds = train_ds.map(preprocess_train, num_parallel_calls=tf.data.AUTOTUNE).prefetch(tf.data.AUTOTUNE)
    if val_ds:
        val_ds = val_ds.map(preprocess_eval, num_parallel_calls=tf.data.AUTOTUNE).prefetch(tf.data.AUTOTUNE)

    # 4. Model Architecture Construction
    inputs = layers.Input(shape=(224, 224, 3), name="input_image")
    
    base_backbone = tf.keras.applications.ResNet50(
        include_top=False,
        weights="imagenet",
        input_tensor=inputs
    )
    base_backbone.trainable = False

    # Pass through frozen backbone with training=False to protect BatchNorm moving stats
    x = base_backbone(inputs, training=False)
    x = layers.GlobalAveragePooling2D(name="global_avg_pool")(x)
    x = layers.BatchNormalization(name="head_bn")(x)
    x = layers.Dense(256, activation="relu", name="head_dense_256")(x)
    x = layers.Dropout(0.35, name="head_dropout")(x)
    outputs = layers.Dense(num_classes, activation="softmax", name="class_probabilities")(x)

    model = models.Model(inputs=inputs, outputs=outputs, name="ResNet50_OPMD_Classifier")

    # STAGE 1: Warmup Dense Head
    print("\n--- STAGE 1: WARM-UP CLASSIFICATION HEAD ---")
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=1e-3),
        loss=tf.keras.losses.CategoricalCrossentropy(),
        metrics=["accuracy"]
    )

    checkpoint_cb = callbacks.ModelCheckpoint(
        filepath="models/resnet50_opmd.keras",
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

    history_stage1 = model.fit(
        train_ds,
        validation_data=val_ds,
        epochs=STAGE1_EPOCHS,
        class_weight=class_weights_dict,
        callbacks=[checkpoint_cb, early_stop_cb]
    )

    # STAGE 2: Deep Fine-Tuning (Top 25 Layers at 1e-5 LR with BatchNorm Frozen)
    print("\n--- STAGE 2: DEEP FINE-TUNING ---")
    base_backbone.trainable = True
    for layer in base_backbone.layers[:-25]:
        layer.trainable = False
    for layer in base_backbone.layers[-25:]:
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
        initial_epoch=len(history_stage1.history["loss"]),
        class_weight=class_weights_dict,
        callbacks=[checkpoint_cb, early_stop_cb]
    )

    model.save("models/resnet50_opmd.keras")
    print("\nSaved final validated model to 'models/resnet50_opmd.keras'")

if __name__ == "__main__":
    dataset_path = sys.argv[1] if len(sys.argv) > 1 else "dataset"
    train_resnet50_opmd(dataset_path)