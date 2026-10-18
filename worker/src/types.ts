export interface Env {
  ALLOWED_ORIGIN?: string;
  FIREBASE_API_KEY?: string;
  HF_SPACE?: string;
  HF_TOKEN?: string;
}

export interface TryOnOptions {
  garmentDescription?: string;
  category?: 'upper_body' | 'lower_body' | 'dresses';
  denoiseSteps?: number;
  seed?: number;
}

export interface TryOnResult {
  imageUrl: string;
  contentType: string;
  spaceUsed: string;
}

export interface TryOnErrorResponse {
  success: false;
  error: string;
  code: string;
}

export interface TryOnSuccessResponse {
  success: true;
  imageUrl: string;
  contentType: string;
  spaceUsed: string;
  results: Array<TryOnResult & { garmentImageIndex: number }>;
}
