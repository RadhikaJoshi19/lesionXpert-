"""
OPMD-AI: Architecture-Specific Image Preprocessing Pipeline
Enforces exact mathematical consistency between training and inference.
"""

from typing import Union, Tuple
import io
import numpy as np
from PIL import Image, ImageOps
import tensorflow as tf

IMG_SIZE = (224, 224)

def load_image_rgb(image_input: Union[str, bytes, bytearray, io.BytesIO, Image.Image, np.ndarray]) -> Image.Image:
    """
    Standardizes any input format into an EXIF-corrected RGB PIL Image.
    """
    if isinstance(image_input, Image.Image):
        img = image_input
    elif isinstance(image_input, (str, bytes, bytearray, io.BytesIO)):
        if isinstance(image_input, (bytes, bytearray)):
            img = Image.open(io.BytesIO(image_input))
        elif isinstance(image_input, io.BytesIO):
            img = Image.open(image_input)
        else:
            img = Image.open(image_input)
    elif isinstance(image_input, np.ndarray):
        img = Image.fromarray(image_input.astype('uint8'))
    else:
        raise ValueError(f"Unsupported image input type: {type(image_input)}")

    # Correct EXIF rotation (critical for clinical intraoral photos taken with mobile phones)
    img = ImageOps.exif_transpose(img)
    return img.convert("RGB")

def preprocess_for_model(
    pil_image: Image.Image,
    model_type: str = "resnet50",
    target_size: Tuple[int, int] = IMG_SIZE
) -> np.ndarray:
    """
    Preprocesses a PIL image for the target architecture.
    
    Args:
        pil_image: PIL RGB image
        model_type: 'resnet50', 'mobilenetv2', 'vgg16'
        target_size: (224, 224)
        
    Returns:
        np.ndarray with shape (1, 224, 224, 3) ready for model.predict()
    """
    # Bilinear resize to standard input shape
    resized = pil_image.resize(target_size, Image.Resampling.BILINEAR)
    arr = np.array(resized, dtype=np.float32)

    model_key = model_type.lower().replace("-", "").replace("_", "")

    if "mobilenet" in model_key:
        # MobileNetV2 uses [-1, 1] scaling
        preprocessed = tf.keras.applications.mobilenet_v2.preprocess_input(arr)
    elif "vgg" in model_key:
        # VGG16 uses ImageNet mean-subtraction in BGR format
        preprocessed = tf.keras.applications.vgg16.preprocess_input(arr)
    else:
        # ResNet50 (and default) uses ImageNet mean-subtraction in BGR format
        preprocessed = tf.keras.applications.resnet50.preprocess_input(arr)

    return np.expand_dims(preprocessed, axis=0)

def preprocess_numpy_batch(batch_images: np.ndarray, model_type: str = "resnet50") -> np.ndarray:
    """
    Applies model preprocessing to a 4D NumPy batch [N, H, W, C] in [0, 255].
    """
    model_key = model_type.lower().replace("-", "").replace("_", "")
    if "mobilenet" in model_key:
        return tf.keras.applications.mobilenet_v2.preprocess_input(batch_images.astype(np.float32))
    elif "vgg" in model_key:
        return tf.keras.applications.vgg16.preprocess_input(batch_images.astype(np.float32))
    else:
        return tf.keras.applications.resnet50.preprocess_input(batch_images.astype(np.float32))
