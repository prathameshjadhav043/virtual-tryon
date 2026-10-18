import { logEvent } from 'firebase/analytics';
import { analyticsInstance } from './firebase';

/**
 * Privacy-safe Google Analytics 4 event logger.
 * STRICT PRIVACY GUARANTEE: Never logs photos, URLs, file names, or personal data.
 */

export interface UploadStartedParams {
  person_image_size_kb?: number;
  garment_image_size_kb?: number;
}

export interface TryonCompletedParams {
  duration_ms: number;
  model_space?: string;
}

export interface TryonFailedParams {
  error_code?: string;
  duration_ms?: number;
}

/**
 * Dispatches upload_started event to GA4
 */
export function trackUploadStarted(params: UploadStartedParams = {}): void {
  try {
    if (analyticsInstance) {
      logEvent(analyticsInstance, 'upload_started', {
        person_image_size_kb: params.person_image_size_kb ?? 0,
        garment_image_size_kb: params.garment_image_size_kb ?? 0,
      });
    }
  } catch (err) {
    console.debug('[GA4] upload_started event ignored:', err);
  }
}

/**
 * Dispatches tryon_completed event to GA4
 */
export function trackTryonCompleted(params: TryonCompletedParams): void {
  try {
    if (analyticsInstance) {
      logEvent(analyticsInstance, 'tryon_completed', {
        duration_ms: Math.round(params.duration_ms),
        model_space: params.model_space || 'unknown',
      });
    }
  } catch (err) {
    console.debug('[GA4] tryon_completed event ignored:', err);
  }
}

/**
 * Dispatches tryon_failed event to GA4
 */
export function trackTryonFailed(params: TryonFailedParams): void {
  try {
    if (analyticsInstance) {
      logEvent(analyticsInstance, 'tryon_failed', {
        error_code: params.error_code || 'GENERIC_ERROR',
        duration_ms: params.duration_ms ? Math.round(params.duration_ms) : 0,
      });
    }
  } catch (err) {
    console.debug('[GA4] tryon_failed event ignored:', err);
  }
}
