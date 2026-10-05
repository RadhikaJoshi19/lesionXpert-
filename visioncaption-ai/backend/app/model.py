import time
import logging
from typing import Optional, Tuple
from PIL import Image
import torch
from transformers import BlipProcessor, BlipForConditionalGeneration

logger = logging.getLogger(__name__)

MODEL_ID = "Salesforce/blip-image-captioning-base"


class BlipCaptionModel:
    _instance: Optional["BlipCaptionModel"] = None

    def __init__(self):
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.model_name = MODEL_ID
        self.processor: Optional[BlipProcessor] = None
        self.model: Optional[BlipForConditionalGeneration] = None
        self.is_loaded: bool = False

    @classmethod
    def get_instance(cls) -> "BlipCaptionModel":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def load(self) -> None:
        """
        Loads the BLIP Processor and Model weights into memory once.
        Moves model to CUDA if available, otherwise CPU.
        """
        if self.is_loaded:
            logger.info("BLIP model is already loaded.")
            return

        logger.info(f"Loading BLIP model '{self.model_name}' on device '{self.device}'...")
        try:
            self.processor = BlipProcessor.from_pretrained(self.model_name)
            self.model = BlipForConditionalGeneration.from_pretrained(self.model_name)
            self.model.to(self.device)
            self.model.eval()
            self.is_loaded = True
            logger.info(f"BLIP model successfully loaded on {self.device}.")
        except Exception as e:
            logger.error(f"Failed to load BLIP model: {e}")
            self.is_loaded = False
            raise RuntimeError(f"Unable to initialize BLIP model: {e}")

    def generate_caption(
        self,
        image: Image.Image,
        max_new_tokens: int = 50,
        num_beams: int = 4
    ) -> Tuple[str, float]:
        """
        Generates a natural-language caption for the given PIL Image.
        Uses torch.inference_mode() for optimized execution.
        Returns a tuple of (caption_text, inference_time_in_seconds).
        """
        if not self.is_loaded or self.model is None or self.processor is None:
            raise RuntimeError("BLIP model has not been loaded.")

        start_time = time.perf_counter()

        with torch.inference_mode():
            # Preprocess image into PyTorch tensors
            inputs = self.processor(images=image, return_tensors="pt").to(self.device)

            # Generate token sequence using beam search
            output_tokens = self.model.generate(
                **inputs,
                max_new_tokens=max_new_tokens,
                num_beams=num_beams,
                min_length=5,
                repetition_penalty=1.2,
                early_stopping=True
            )

            # Decode token sequence into human-readable text
            raw_caption = self.processor.decode(output_tokens[0], skip_special_tokens=True)

        elapsed_time = round(time.perf_counter() - start_time, 2)

        # Post-process: clean and capitalize
        caption = raw_caption.strip()
        if caption:
            caption = caption[0].upper() + caption[1:]
            if not caption.endswith((".", "!", "?")):
                caption += "."

        return caption, elapsed_time
