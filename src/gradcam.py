"""
OPMD-AI: Explainable AI — True Grad-CAM Engine
Extracts real gradient backpropagation from the convolutional feature maps of trained models.
"""

from typing import Tuple, Optional
import numpy as np
from PIL import Image
import cv2
import tensorflow as tf

def generate_gradcam_heatmap(
    model: tf.keras.Model,
    preprocessed_input: np.ndarray,
    target_layer_name: Optional[str] = None,
    pred_index: Optional[int] = None
) -> Tuple[Optional[np.ndarray], Optional[str]]:
    """
    Computes true Grad-CAM activation map for input tensor of shape (1, 224, 224, 3).
    
    Args:
        model: Trained Keras model
        preprocessed_input: 4D preprocessed numpy array
        target_layer_name: Target conv layer name
        pred_index: Class index (defaults to argmax prediction)
        
    Returns:
        (heatmap 2D float32 [0, 1], error_string)
    """
    try:
        # Check if model has a nested backbone submodel (e.g. ResNet50/MobileNetV2 within functional head)
        backbone_submodel = None
        for l in model.layers:
            if hasattr(l, 'layers') and len(l.layers) > 10:
                backbone_submodel = l
                break

        if backbone_submodel is not None:
            # Locate target conv layer in backbone
            if not target_layer_name:
                for sub_layer in reversed(backbone_submodel.layers):
                    if isinstance(sub_layer, (tf.keras.layers.Conv2D, tf.keras.layers.DepthwiseConv2D, tf.keras.layers.ReLU, tf.keras.layers.Activation)):
                        target_layer_name = sub_layer.name
                        break
            if not target_layer_name:
                target_layer_name = backbone_submodel.layers[-1].name

            target_layer = backbone_submodel.get_layer(target_layer_name)
            sub_model = tf.keras.models.Model(
                inputs=backbone_submodel.input,
                outputs=[target_layer.output, backbone_submodel.output]
            )

            with tf.GradientTape() as tape:
                conv_out, bb_out = sub_model(preprocessed_input)
                tape.watch(conv_out)
                x = bb_out
                for l in model.layers:
                    if l != backbone_submodel and l != model.layers[0]:
                        if 'dropout' in l.name.lower():
                            x = l(x, training=False)
                        else:
                            x = l(x)
                if pred_index is None:
                    pred_index = int(tf.argmax(x[0]))
                loss = x[:, pred_index]

            grads = tape.gradient(loss, conv_out)
            if grads is None:
                return None, "Grad-CAM could not compute gradient tape for the target layer."

            pooled_grads = tf.reduce_mean(grads, axis=(0, 1, 2))
            heatmap = conv_out[0] @ pooled_grads[..., tf.newaxis]
            heatmap = tf.squeeze(heatmap)
            heatmap = tf.maximum(heatmap, 0.0)
            max_val = tf.math.reduce_max(heatmap)
            if max_val > 0:
                heatmap = heatmap / max_val

            return heatmap.numpy(), None

        else:
            # Standalone flat model
            if not target_layer_name:
                for layer in reversed(model.layers):
                    if isinstance(layer, (tf.keras.layers.Conv2D, tf.keras.layers.DepthwiseConv2D)):
                        target_layer_name = layer.name
                        break

            if not target_layer_name:
                return None, "No convolutional feature layer located in model."

            grad_model = tf.keras.models.Model(
                inputs=model.inputs,
                outputs=[model.get_layer(target_layer_name).output, model.output]
            )

            with tf.GradientTape() as tape:
                conv_outputs, preds = grad_model(preprocessed_input)
                if pred_index is None:
                    pred_index = int(tf.argmax(preds[0]))
                loss = preds[:, pred_index]

            grads = tape.gradient(loss, conv_outputs)
            if grads is None:
                return None, "Zero gradient tape returned for target layer."

            pooled_grads = tf.reduce_mean(grads, axis=(0, 1, 2))
            heatmap = conv_outputs[0] @ pooled_grads[..., tf.newaxis]
            heatmap = tf.squeeze(heatmap)
            heatmap = tf.maximum(heatmap, 0.0)
            max_val = tf.math.reduce_max(heatmap)
            if max_val > 0:
                heatmap = heatmap / max_val

            return heatmap.numpy(), None

    except Exception as e:
        return None, f"Grad-CAM error: {str(e)}"

def overlay_gradcam(
    original_pil: Image.Image,
    heatmap: np.ndarray,
    alpha: float = 0.45
) -> Image.Image:
    """
    Overlays a 2D [0, 1] Grad-CAM heatmap onto the original PIL image using OpenCV JET colormap.
    """
    orig_rgb = np.array(original_pil.convert("RGB"))
    h, w = orig_rgb.shape[:2]

    # Resize heatmap to match original image dimensions
    resized_heatmap = cv2.resize(heatmap, (w, h))
    heatmap_uint8 = np.uint8(255 * resized_heatmap)

    # Apply JET colormap (convert BGR to RGB)
    jet_color = cv2.applyColorMap(heatmap_uint8, cv2.COLORMAP_JET)
    jet_color_rgb = cv2.cvtColor(jet_color, cv2.COLOR_BGR2RGB)

    # Blend original and heatmap
    blended = np.uint8(alpha * jet_color_rgb + (1.0 - alpha) * orig_rgb)
    return Image.fromarray(blended)
