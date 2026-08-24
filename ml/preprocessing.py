#!/usr/bin/env python3
"""
LesionXpert AI - Clinical Image Preprocessing & Augmentation Engine
Deterministic inference preprocessing and medically conservative training augmentation.
"""

import os
from typing import Tuple, Optional, Any
import numpy as np

IMG_SIZE_DEFAULT = 224

def load_and_preprocess_image(
    image_path_or_bytes: Any,
    target_size: Tuple[int, int] = (IMG_SIZE_DEFAULT, IMG_SIZE_DEFAULT),
    model_type: str = "mobilenet",
    is_training: bool = False
) -> np.ndarray:
    """
    Standard clinical preprocessing pipeline for training and inference:
    1. Robust RGB byte / file reading
    2. EXIF auto-rotation preservation
    3. High-quality bilinear resizing
    4. Model-specific normalization:
       - mobilenet: scales to [-1, 1] via MobileNetV2 standard
       - resnet: scales using ImageNet BGR zero-centering (preprocess_input) or [0, 1]
    """
    from PIL import Image, ImageOps
    import io

    if isinstance(image_path_or_bytes, (str, os.PathLike)):
        with Image.open(image_path_or_bytes) as img:
            img = ImageOps.exif_transpose(img) # Preserve optical orientation
            img = img.convert("RGB")
            img = img.resize(target_size, Image.Resampling.BILINEAR)
            arr = np.array(img, dtype=np.float32)
    elif isinstance(image_path_or_bytes, bytes):
        with Image.open(io.BytesIO(image_path_or_bytes)) as img:
            img = ImageOps.exif_transpose(img)
            img = img.convert("RGB")
            img = img.resize(target_size, Image.Resampling.BILINEAR)
            arr = np.array(img, dtype=np.float32)
    elif isinstance(image_path_or_bytes, Image.Image):
        img = ImageOps.exif_transpose(image_path_or_bytes).convert("RGB")
        img = img.resize(target_size, Image.Resampling.BILINEAR)
        arr = np.array(img, dtype=np.float32)
    elif isinstance(image_path_or_bytes, np.ndarray):
        arr = image_path_or_bytes.astype(np.float32)
        if arr.ndim == 2:
            arr = np.stack([arr]*3, axis=-1)
        elif arr.shape[-1] == 4:
            arr = arr[:, :, :3]
    else:
        raise ValueError(f"Unsupported image input type: {type(image_path_or_bytes)}")

    # Model specific normalization
    m_type = model_type.lower()
    if "mobilenet" in m_type:
        # Scale [0, 255] to [-1, 1]
        arr = (arr / 127.5) - 1.0
    elif "resnet" in m_type:
        import tensorflow as tf
        arr = tf.keras.applications.resnet50.preprocess_input(arr)
    else:
        arr = arr / 255.0

    return arr

def create_augmentation_pipeline(config: dict = None):
    """
    Constructs a Keras Sequential data augmentation pipeline
    adhering strictly to medically conservative clinical constraints.
    Applied ONLY to the training split.
    """
    import tensorflow as tf
    from tensorflow.keras import layers

    aug_cfg = (config or {}).get("augmentation", {})
    rot = aug_cfg.get("rotation_range", 15.0) / 360.0
    zoom = aug_cfg.get("zoom_range", 0.10)
    w_shift = aug_cfg.get("width_shift_range", 0.08)
    h_shift = aug_cfg.get("height_shift_range", 0.08)

    aug_layers = [
        layers.RandomRotation(factor=rot, fill_mode="reflect"),
        layers.RandomZoom(height_factor=(-zoom, zoom), width_factor=(-zoom, zoom), fill_mode="reflect"),
        layers.RandomTranslation(height_factor=(-h_shift, h_shift), width_factor=(-w_shift, w_shift), fill_mode="reflect")
    ]

    if aug_cfg.get("horizontal_flip", True):
        aug_layers.append(layers.RandomFlip("horizontal"))

    # Strictly NO vertical flips, heavy solarization, or extreme saturation distortion for oral mucosa

    return tf.keras.Sequential(aug_layers, name="clinical_augmentation")
