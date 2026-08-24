#!/usr/bin/env python3
"""
LesionXpert AI - Base Abstract Model Interface for Medical Image Classification
"""

from abc import ABC, abstractmethod
from typing import Tuple, Optional, Any
import tensorflow as tf

class BaseLesionModel(ABC):
    """
    Standardized abstract base class for Oral Lesion Neural Classifiers.
    Provides uniform API for Stage-1 Head Training, Stage-2 Fine Tuning, and Grad-CAM.
    """
    def __init__(self, num_classes: int = 5, input_shape: Tuple[int, int, int] = (224, 224, 3)):
        self.num_classes = num_classes
        self.input_shape = input_shape
        self.model: Optional[tf.keras.Model] = None
        self.backbone: Optional[tf.keras.Model] = None
        self.architecture_name = "BaseModel"
        self.version = "v1"

    @abstractmethod
    def build(self) -> tf.keras.Model:
        """Constructs the transfer learning architecture."""
        pass

    @abstractmethod
    def compile_stage1(self, learning_rate: float = 1e-3):
        """Freezes the backbone and compiles for classification head warm-up."""
        pass

    @abstractmethod
    def compile_stage2_finetune(self, learning_rate: float = 1e-5, unfreeze_layers: int = 30):
        """Selectively unfreezes deeper layers with lower learning rate."""
        pass

    @abstractmethod
    def get_gradcam_target_layer_name(self) -> str:
        """Returns the name of the final convolutional feature layer for Grad-CAM."""
        pass

    def save(self, filepath: str):
        if self.model:
            self.model.save(filepath)

    def load(self, filepath: str):
        self.model = tf.keras.models.load_model(filepath)
        return self.model
