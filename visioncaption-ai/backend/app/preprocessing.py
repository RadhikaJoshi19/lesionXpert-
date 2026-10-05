import io
import logging
from PIL import Image, UnidentifiedImageError
from fastapi import UploadFile, HTTPException, status

logger = logging.getLogger(__name__)

# Max allowed image size: 10 Megabytes
MAX_FILE_SIZE = 10 * 1024 * 1024
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp"}


async def validate_and_preprocess_image(file: UploadFile) -> Image.Image:
    """
    Validates uploaded file size, extension, MIME type, and Pillow readability.
    Converts and returns a clean RGB PIL Image.
    Does not save to disk, keeping processing secure and memory-bound.
    """
    if not file or not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No image file provided. Please select an image."
        )

    # Check extension
    filename_lower = file.filename.lower()
    has_valid_ext = any(filename_lower.endswith(ext) for ext in ALLOWED_EXTENSIONS)
    if not has_valid_ext:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported file format. Please upload a JPG, JPEG, or PNG image."
        )

    # Read file content safely
    try:
        contents = await file.read()
    except Exception as e:
        logger.error(f"Failed to read uploaded file: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not read uploaded image data."
        )

    # Validate file size
    if len(contents) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded file is empty. Please upload a valid image."
        )

    if len(contents) > MAX_FILE_SIZE:
        max_mb = MAX_FILE_SIZE // (1024 * 1024)
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds the maximum limit of {max_mb}MB. Please upload a smaller image."
        )

    # Validate image via Pillow
    try:
        image_stream = io.BytesIO(contents)
        image = Image.open(image_stream)
        # Verify integrity
        image.verify()
        # Re-open after verify() as recommended by Pillow docs
        image_stream.seek(0)
        image = Image.open(image_stream)
    except (UnidentifiedImageError, OSError) as e:
        logger.warning(f"Corrupted or invalid image: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or corrupted image file. Please provide a standard image file."
        )

    # Normalize image to RGB mode (handles PNG RGBA with alpha channel, P palette mode, Grayscale L, etc.)
    try:
        if image.mode != "RGB":
            # For transparent PNGs/WebP, composite onto a neutral background or convert directly
            if image.mode in ("RGBA", "LA") or (image.mode == "P" and "transparency" in image.info):
                alpha = image.convert("RGBA")
                background = Image.new("RGBA", alpha.size, (255, 255, 255, 255))
                alpha_composite = Image.alpha_composite(background, alpha)
                image = alpha_composite.convert("RGB")
            else:
                image = image.convert("RGB")
    except Exception as e:
        logger.error(f"Error converting image to RGB: {e}")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Failed to preprocess image color channels."
        )

    return image
