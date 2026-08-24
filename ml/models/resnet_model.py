#!/usr/bin/env python3
"""
LesionXpert AI - ResNet50 Architecture Implementation
ImageNet-pretrained ResNet50 with custom dense head, batchnorm, dropout, and 2-stage fine-tuning.
"""

from typing import Tuple
import tensorflow as tf
from tensorflow.keras import layers, models
from .base_model import BaseLesionModel

class ResNet50LesionModel(BaseLesionModel):
    def __init__(self, num_classes: int = 5, input_shape: Tuple[int, int, int] = (224, 224, 3), version: str = "resnet50_v1"):
        super().__init__(num_classes=num_classes, input_shape=input_shape)
        self.architecture_name = "ResNet50"
        self.version = version

    def build(self) -> tf.keras.Model:
        # Load ImageNet-pretrained ResNet50 without top
        self.backbone = tf.keras.applications.ResNet50(
            input_shape=self.input_shape,
            include_top=False,
            weights="imagenet"
        )
        self.backbone.trainable = False  # Freeze for Stage 1

        inputs = layers.Input(shape=self.input_shape, name="input_image")
        x = self.backbone(inputs, training=False)
        x = layers.GlobalAveragePooling2D(name="global_avg_pool")(x)
        x = layers.BatchNormalization(name="head_batchnorm")(x)
        x = layers.Dense(256, activation="relu", name="head_dense_256")(x)
        x = layers.Dropout(0.35, name="head_dropout")(x)
        outputs = layers.Dense(self.num_classes, activation="softmax", name="oral_lesion_probabilities")(x)

        self.model = models.Model(inputs=inputs, outputs=outputs, name=f"LesionXpert_{self.architecture_name}")
        return self.model

    def compile_stage1(self, learning_rate: float = 1e-3):
        if self.backbone:
            self.backbone.trainable = False
        optimizer = tf.keras.optimizers.Adam(learning_rate=learning_rate)
        self.model.compile(
            optimizer=optimizer,
            loss="categorical_crossentropy",
            metrics=["accuracy", tf.keras.metrics.Precision(name="precision"), tf.keras.metrics.Recall(name="recall")]
        )

    def compile_stage2_finetune(self, learning_rate: float = 1e-5, unfreeze_layers: int = 25):
        if self.backbone:
            self.backbone.trainable = True
            # Freeze all but top residual block (conv5 block)
            num_layers = len(self.backbone.layers)
            freeze_until = max(0, num_layers - unfreeze_layers)
            for layer in self.backbone.layers[:freeze_until]:
                layer.trainable = False
            for layer in self.backbone.layers[freeze_until:]:
                # Freeze BatchNorm statistics to protect moving mean/var
                if isinstance(layer, layers.BatchNormalization):
                    layer.trainable = False
                else:
                    layer.trainable = True

        optimizer = tf.keras.optimizers.Adam(learning_rate=learning_rate)
        self.model.compile(
            optimizer=optimizer,
            loss="categorical_crossentropy",
            metrics=["accuracy", tf.keras.metrics.Precision(name="precision"), tf.keras.metrics.Recall(name="recall")]
        )

    def get_gradcam_target_layer_name(self) -> str:
        # Final residual conv block in ResNet50 is 'conv5_block3_out'
        return "conv5_block3_out"
