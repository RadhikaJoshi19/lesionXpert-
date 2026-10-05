from pydantic import BaseModel
from typing import Optional


class HealthResponse(BaseModel):
    status: str
    model: str
    device: str
    model_loaded: bool


class CaptionResponse(BaseModel):
    success: bool
    caption: str
    inference_time: float
    model: str


class ErrorResponse(BaseModel):
    success: bool = False
    error: str
    detail: Optional[str] = None
