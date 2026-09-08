"""
OPMD-AI: Clinical Image Quality Assessment Module
Performs non-destructive quality checks for resolution, blur, and lighting conditions.
"""

from typing import Dict, Any, Tuple
import numpy as np
from PIL import Image
import cv2

from src.config import (
    MIN_IMAGE_DIMENSION,
    LAPLACIAN_BLUR_THRESHOLD,
    DARKNESS_THRESHOLD,
    BRIGHTNESS_THRESHOLD
)

def assess_image_quality(pil_image: Image.Image) -> Dict[str, Any]:
    """
    Evaluates clinical intraoral photograph quality against documented thresholds.
    
    Returns:
        Dict containing:
        - passed: bool (True if all critical criteria are met)
        - status: 'Good' | 'Acceptable' | 'Insufficient'
        - metrics: Dict of measured values (width, height, blur_score, mean_brightness)
        - warnings: List of clinical recommendations if quality is sub-optimal
    """
    width, height = pil_image.size
    np_img = np.array(pil_image)

    # Convert to grayscale for variance and lighting checks
    if len(np_img.shape) == 3:
        gray = cv2.cvtColor(np_img, cv2.COLOR_RGB2GRAY)
    else:
        gray = np_img

    # 1. Resolution Check
    resolution_ok = (width >= MIN_IMAGE_DIMENSION) and (height >= MIN_IMAGE_DIMENSION)

    # 2. Blur / Sharpness Check (Variance of the Laplacian)
    laplacian = cv2.Laplacian(gray, cv2.CV_64F)
    blur_score = float(laplacian.var())
    sharpness_ok = blur_score >= LAPLACIAN_BLUR_THRESHOLD

    # 3. Illumination / Lighting Check
    mean_brightness = float(np.mean(gray))
    not_too_dark = mean_brightness >= DARKNESS_THRESHOLD
    not_too_bright = mean_brightness <= BRIGHTNESS_THRESHOLD
    lighting_ok = not_too_dark and not_too_bright

    warnings = []
    if not resolution_ok:
        warnings.append(f"Image resolution ({width}x{height}px) is below recommended minimum ({MIN_IMAGE_DIMENSION}x{MIN_IMAGE_DIMENSION}px).")
    if not sharpness_ok:
        warnings.append(f"Image appears blurry or out of focus (sharpness score {blur_score:.1f} vs threshold {LAPLACIAN_BLUR_THRESHOLD:.1f}). Focus on lesion edges.")
    if not not_too_dark:
        warnings.append(f"Image is under-illuminated (mean luminance {mean_brightness:.1f} vs threshold {DARKNESS_THRESHOLD:.1f}). Use adequate clinical lighting.")
    if not not_too_bright:
        warnings.append(f"Image exhibits over-exposure / flash glare (mean luminance {mean_brightness:.1f} vs threshold {BRIGHTNESS_THRESHOLD:.1f}). Avoid direct camera flash reflections.")

    # Status classification
    critical_failures = sum([not resolution_ok, not sharpness_ok, not not_too_dark])
    if critical_failures == 0 and not_too_bright:
        status = "Good"
        passed = True
    elif critical_failures <= 1:
        status = "Acceptable"
        passed = True
    else:
        status = "Insufficient"
        passed = False

    return {
        "passed": passed,
        "status": status,
        "metrics": {
            "width": width,
            "height": height,
            "blur_score": round(blur_score, 1),
            "mean_brightness": round(mean_brightness, 1),
            "blur_threshold": LAPLACIAN_BLUR_THRESHOLD,
            "darkness_threshold": DARKNESS_THRESHOLD,
            "brightness_threshold": BRIGHTNESS_THRESHOLD,
            "min_dimension": MIN_IMAGE_DIMENSION
        },
        "warnings": warnings
    }
