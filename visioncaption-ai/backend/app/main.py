import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, File, UploadFile, HTTPException, status, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError

from app.schemas import HealthResponse, CaptionResponse, ErrorResponse
from app.preprocessing import validate_and_preprocess_image
from app.model import BlipCaptionModel

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("visioncaption-api")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Startup & Shutdown lifecycle manager.
    Loads the BLIP Deep Learning model into memory once at application startup.
    """
    logger.info("Initializing VisionCaption AI backend...")
    model_instance = BlipCaptionModel.get_instance()
    try:
        model_instance.load()
        logger.info(f"Model successfully loaded on {model_instance.device}.")
    except Exception as e:
        logger.critical(f"Critical failure loading BLIP model on startup: {e}")
        # We don't crash the server so health checks and informative errors can be reported
    yield
    logger.info("Shutting down VisionCaption AI backend...")


app = FastAPI(
    title="VisionCaption AI API",
    description="Natural-Language Image Captioning API powered by Salesforce BLIP & PyTorch",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Configuration - Allow local Vite dev server and common frontend URLs
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:4173",
        "http://127.0.0.1:4173",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Exception Handlers to sanitize all responses and prevent raw stack trace exposure
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    logger.warning(f"HTTP {exc.status_code} error on {request.url.path}: {exc.detail}")
    return JSONResponse(
        status_code=exc.status_code,
        content={"success": False, "error": str(exc.detail)}
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    logger.warning(f"Validation error on {request.url.path}: {exc}")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"success": False, "error": "Invalid request parameters. Please verify your input."}
    )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception on {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"success": False, "error": "An unexpected error occurred during processing. Please try again."}
    )


@app.get("/api/health", response_model=HealthResponse)
async def health_check():
    """
    Returns backend readiness and BLIP model loading status.
    """
    model_instance = BlipCaptionModel.get_instance()
    return HealthResponse(
        status="healthy" if model_instance.is_loaded else "degraded",
        model=model_instance.model_name,
        device=model_instance.device,
        model_loaded=model_instance.is_loaded
    )


@app.post("/api/caption", response_model=CaptionResponse)
async def generate_caption(image: UploadFile = File(...)):
    """
    Accepts an uploaded image file, validates and preprocesses it,
    runs the Salesforce BLIP model, and returns natural language caption.
    """
    model_instance = BlipCaptionModel.get_instance()

    if not model_instance.is_loaded:
        # Attempt lazy reload if startup failed
        try:
            model_instance.load()
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Deep Learning model is currently unavailable. Please check server logs."
            )

    # 1. Validation & Preprocessing (PIL Image in RGB)
    pil_image = await validate_and_preprocess_image(image)

    # 2. Deep Learning Inference
    try:
        caption, inference_time = model_instance.generate_caption(pil_image)
    except Exception as e:
        logger.error(f"Inference error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate caption for the uploaded image."
        )

    # 3. Clean Response
    return CaptionResponse(
        success=True,
        caption=caption,
        inference_time=inference_time,
        model=model_instance.model_name
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
