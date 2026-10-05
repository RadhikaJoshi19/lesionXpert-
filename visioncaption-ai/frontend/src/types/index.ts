export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'offline';
  model: string;
  device: string;
  model_loaded: boolean;
}

export interface CaptionResponse {
  success: boolean;
  caption: string;
  inference_time: number;
  model: string;
  error?: string;
}

export interface HistoryItem {
  id: string;
  thumbnail: string;
  caption: string;
  timestamp: string;
  model: string;
  inference_time: number;
  fileName: string;
  fileSize: number;
}
