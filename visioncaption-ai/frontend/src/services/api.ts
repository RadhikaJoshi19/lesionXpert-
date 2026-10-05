import { CaptionResponse, HealthStatus } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

/**
 * Checks backend and model status
 */
export async function checkBackendHealth(): Promise<HealthStatus> {
  try {
    const res = await fetch(`${API_BASE}/health`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!res.ok) {
      return {
        status: 'degraded',
        model: 'Salesforce/blip-image-captioning-base',
        device: 'unknown',
        model_loaded: false,
      };
    }

    const data = await res.json();
    return {
      status: data.status === 'healthy' ? 'healthy' : 'degraded',
      model: data.model || 'Salesforce/blip-image-captioning-base',
      device: data.device || 'cpu',
      model_loaded: Boolean(data.model_loaded),
    };
  } catch (error) {
    return {
      status: 'offline',
      model: 'Salesforce/blip-image-captioning-base',
      device: 'unavailable',
      model_loaded: false,
    };
  }
}

/**
 * Sends image file to FastAPI backend for deep learning BLIP caption generation
 */
export async function generateImageCaption(file: File): Promise<CaptionResponse> {
  const formData = new FormData();
  formData.append('image', file);

  try {
    const res = await fetch(`${API_BASE}/caption`, {
      method: 'POST',
      body: formData,
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const errorMessage = data?.error || data?.detail || `Server error (${res.status})`;
      throw new Error(errorMessage);
    }

    if (!data || !data.success) {
      throw new Error(data?.error || 'Failed to generate image caption.');
    }

    return {
      success: true,
      caption: data.caption,
      inference_time: data.inference_time,
      model: data.model,
    };
  } catch (err: unknown) {
    if (err instanceof Error) {
      if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
        throw new Error('Cannot connect to the FastAPI backend. Please ensure the Python server is running on port 8000.');
      }
      throw err;
    }
    throw new Error('An unexpected network error occurred.');
  }
}
