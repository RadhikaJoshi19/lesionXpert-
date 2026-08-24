#!/usr/bin/env python3
"""
LesionXpert AI - Clinical Grad-CAM Visual Attention Engine
Extracts real gradients and activation maps from the designated convolutional backbone.
"""

from typing import Tuple, Optional, Any
import numpy as np

def generate_gradcam_heatmap(
    model,
    img_array: np.ndarray,
    target_layer_name: Optional[str] = None,
    pred_index: Optional[int] = None
) -> Tuple[Optional[np.ndarray], Optional[str]]:
    """
    Computes true Grad-CAM class activation heatmap for an input image.
    
    Args:
        model: Trained tf.keras.Model
        img_array: Preprocessed image tensor with shape (1, 224, 224, 3)
        target_layer_name: Name of target convolutional layer
        pred_index: Specific class index (default is argmax of predictions)
    """
    import tensorflow as tf

    try:
        backbone_submodel = None
        for l in model.layers:
            if hasattr(l, 'layers') and len(l.layers) > 10:
                backbone_submodel = l
                break

        if backbone_submodel:
            # Locate conv layer in backbone
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
                conv_out, bb_out = sub_model(img_array)
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
                return None, "AI attention visualization unavailable for the current model: Zero gradient tape returned."

            pooled_grads = tf.reduce_mean(grads, axis=(0, 1, 2))
            heatmap = conv_out[0] @ pooled_grads[..., tf.newaxis]
            heatmap = tf.squeeze(heatmap)
            heatmap = tf.maximum(heatmap, 0.0)
            max_val = tf.math.reduce_max(heatmap)
            if max_val > 0:
                heatmap = heatmap / max_val

            return heatmap.numpy(), None

        else:
            # Direct flat model
            if not target_layer_name:
                for layer in reversed(model.layers):
                    if isinstance(layer, (tf.keras.layers.Conv2D, tf.keras.layers.DepthwiseConv2D)):
                        target_layer_name = layer.name
                        break

            if not target_layer_name:
                return None, "AI attention visualization unavailable for the current model: No convolutional feature layer located."

            grad_model = tf.keras.models.Model(
                inputs=model.inputs,
                outputs=[model.get_layer(target_layer_name).output, model.output]
            )
            with tf.GradientTape() as tape:
                conv_outputs, preds = grad_model(img_array)
                if pred_index is None:
                    pred_index = int(tf.argmax(preds[0]))
                loss = preds[:, pred_index]

            grads = tape.gradient(loss, conv_outputs)
            if grads is None:
                return None, "AI attention visualization unavailable for the current model: Zero gradient tape returned."

            pooled_grads = tf.reduce_mean(grads, axis=(0, 1, 2))
            heatmap = conv_outputs[0] @ pooled_grads[..., tf.newaxis]
            heatmap = tf.squeeze(heatmap)
            heatmap = tf.maximum(heatmap, 0.0)
            max_val = tf.math.reduce_max(heatmap)
            if max_val > 0:
                heatmap = heatmap / max_val

            return heatmap.numpy(), None

    except Exception as e:
        return None, f"AI attention visualization unavailable for the current model: {str(e)}"

def overlay_gradcam_on_image(
    heatmap: np.ndarray,
    orig_img_rgb: np.ndarray,
    alpha: float = 0.45
) -> np.ndarray:
    """
    Overlays normalized [0, 1] Grad-CAM heatmap using Jet colormap onto original RGB image.
    """
    import cv2

    h, w = orig_img_rgb.shape[:2]
    # Resize heatmap to match original image
    resized_heatmap = cv2.resize(heatmap, (w, h))
    
    # Convert to 8-bit [0, 255]
    heatmap_uint8 = np.uint8(255 * resized_heatmap)
    
    # Apply JET colormap
    jet_color = cv2.applyColorMap(heatmap_uint8, cv2.COLORMAP_JET)
    jet_color = cv2.cvtColor(jet_color, cv2.COLOR_BGR2RGB)

    # Superimpose
    superimposed = (alpha * jet_color + (1 - alpha) * orig_img_rgb).astype(np.uint8)
    return superimposed
