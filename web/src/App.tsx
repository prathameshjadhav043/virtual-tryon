import React, { useState } from 'react';
import {
  Sparkles,
  AlertCircle,
  Shield,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { UploadDropzone } from './components/UploadDropzone';
import { ConsentBanner } from './components/ConsentBanner';
import { PrivacyPolicyModal } from './components/PrivacyPolicyModal';
import { AdSensePlaceholder } from './components/AdSensePlaceholder';
import { ResultSection } from './components/ResultSection';
import { type ProcessedImage } from './lib/image-processor';
import { trackUploadStarted, trackTryonCompleted, trackTryonFailed } from './lib/analytics';

const WORKER_URL = import.meta.env.VITE_TRYON_WORKER_URL || 'http://localhost:8787';

export const App: React.FC = () => {
  const [personImage, setPersonImage] = useState<ProcessedImage | null>(null);
  const [garmentImage, setGarmentImage] = useState<ProcessedImage | null>(null);
  const [garmentDescription, setGarmentDescription] = useState<string>('');
  const [hasConsented, setHasConsented] = useState<boolean>(false);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [modelSpaceUsed, setModelSpaceUsed] = useState<string>('yisol/IDM-VTON');
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState<boolean>(false);

  const canSubmit = Boolean(personImage && garmentImage && hasConsented && !isLoading);

  const handleTryOn = async () => {
    if (!personImage || !garmentImage) {
      setErrorMessage('Please upload both a front photo and a product garment image.');
      return;
    }

    if (!hasConsented) {
      setErrorMessage('Please accept the privacy consent checkbox before continuing.');
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);
    setLoadingStep('Optimizing & dispatching to Cloudflare Worker proxy...');
    const startTime = performance.now();

    // Fire upload_started telemetry (strictly sanitized metadata)
    trackUploadStarted({
      person_image_size_kb: Math.round(personImage.processedSizeBytes / 1024),
      garment_image_size_kb: Math.round(garmentImage.processedSizeBytes / 1024),
    });

    try {
      const formData = new FormData();
      formData.append('person_image', personImage.file);
      formData.append('garment_image', garmentImage.file);
      if (garmentDescription.trim()) {
        formData.append('garment_description', garmentDescription.trim());
      }

      setLoadingStep('Inference in progress on Hugging Face (IDM-VTON diffusion model)...');

      const response = await fetch(`${WORKER_URL}/tryon`, {
        method: 'POST',
        body: formData,
      });

      const responseData = await response.json();

      if (!response.ok || !responseData.success) {
        const errorMsg =
          responseData.error || `Server responded with status code ${response.status}`;
        throw new Error(errorMsg);
      }

      const durationMs = performance.now() - startTime;
      trackTryonCompleted({
        duration_ms: durationMs,
        model_space: responseData.spaceUsed,
      });

      setResultUrl(responseData.imageUrl);
      if (responseData.spaceUsed) {
        setModelSpaceUsed(responseData.spaceUsed);
      }

      // Smooth scroll to result area
      setTimeout(() => {
        document.getElementById('result-view')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err) {
      const durationMs = performance.now() - startTime;
      const message = err instanceof Error ? err.message : 'Try-on processing encountered an unexpected error';
      setErrorMessage(message);

      trackTryonFailed({
        error_code: 'TRYON_REQUEST_ERROR',
        duration_ms: durationMs,
      });
    } finally {
      setIsLoading(false);
      setLoadingStep('');
    }
  };

  const handleReset = () => {
    setResultUrl(null);
    setErrorMessage(null);
  };

  return (
    <div className="app-container">
      {/* Background Decorative Ambient Gradients */}
      <div className="ambient-blur ambient-1" />
      <div className="ambient-blur ambient-2" />

      {/* Header */}
      <header className="app-header">
        <div className="header-container">
          <div className="brand-group">
            <div className="brand-icon">
              <Sparkles size={22} className="text-accent" />
            </div>
            <div>
              <div className="brand-title-row">
                <h1 className="brand-title">FitCraft AI</h1>
                <span className="free-badge">Zero Budget • 100% Free</span>
              </div>
              <p className="brand-tagline">Open-Source AI Virtual Try-On Studio</p>
            </div>
          </div>

          <div className="header-actions">
            <button
              type="button"
              className="text-link-btn"
              onClick={() => setIsPrivacyModalOpen(true)}
            >
              <Shield size={16} />
              <span>Zero-Storage Guarantee</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        {/* Top AdSense Banner Placeholder */}
        <AdSensePlaceholder slotName="Header Leaderboard" format="leaderboard" />

        {/* Hero Section */}
        <section className="hero-section">
          <span className="hero-pill">
            <Sparkles size={14} className="text-accent" /> Powered by IDM-VTON & Gradio
          </span>
          <h2 className="hero-heading">
            Preview any outfit on <span className="gradient-text">your real photo</span>
          </h2>
          <p className="hero-subheading">
            Upload your front photo and any garment. Our edge worker runs the try-on diffusion model
            ephemerally in memory—no accounts, no subscriptions, and zero photos stored.
          </p>
        </section>

        {/* Upload Studio Grid */}
        <div className="upload-grid-container">
          <div className="upload-columns">
            {/* Person Photo Card */}
            <div className="column-card">
              <UploadDropzone
                id="person-photo-uploader"
                title="Your Front Photo"
                subtitle="Full body or torso facing front. Clear lighting gives best results."
                badge="Required"
                image={personImage}
                onImageChange={setPersonImage}
                disabled={isLoading}
              />
            </div>

            {/* Garment Image Card */}
            <div className="column-card">
              <UploadDropzone
                id="garment-photo-uploader"
                title="Garment / Product Image"
                subtitle="Clean product shot, model photo, or transparent garment PNG."
                badge="Required"
                image={garmentImage}
                onImageChange={setGarmentImage}
                disabled={isLoading}
              />

              <div className="optional-inputs">
                <label htmlFor="garment-description-input" className="input-label">
                  Garment description (optional)
                </label>
                <input
                  id="garment-description-input"
                  type="text"
                  className="text-input"
                  placeholder="e.g. Vintage oversized denim jacket or Floral silk blouse"
                  value={garmentDescription}
                  onChange={(e) => setGarmentDescription(e.target.value)}
                  disabled={isLoading}
                  maxLength={100}
                />
              </div>
            </div>
          </div>

          {/* Privacy Consent Checkbox */}
          <ConsentBanner
            hasConsented={hasConsented}
            onConsentChange={setHasConsented}
            onOpenPrivacyModal={() => setIsPrivacyModalOpen(true)}
          />

          {/* Error Banner */}
          {errorMessage && (
            <div className="error-banner" role="alert">
              <AlertCircle size={20} className="error-icon" />
              <div className="error-details">
                <p className="error-title">Try-On Could Not Complete</p>
                <p className="error-message">{errorMessage}</p>
                {errorMessage.includes('Failed to fetch') && (
                  <p className="error-hint">
                    Check that your Cloudflare Worker is running locally on port 8787 or deployed.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Action Trigger */}
          <div className="action-row">
            <button
              id="tryon-submit-btn"
              type="button"
              className={`submit-btn ${!canSubmit ? 'btn-disabled' : ''}`}
              onClick={handleTryOn}
              disabled={!canSubmit}
            >
              {isLoading ? (
                <>
                  <Loader2 size={20} className="spin-icon" />
                  <span>Synthesizing Try-On...</span>
                </>
              ) : (
                <>
                  <Sparkles size={20} />
                  <span>Generate Virtual Try-On</span>
                </>
              )}
            </button>

            {isLoading && (
              <div className="loading-status-bar">
                <div className="progress-pulse-line"></div>
                <p className="loading-step-text">{loadingStep}</p>
                <p className="loading-subtext">
                  (Free Hugging Face spaces take 15–45s depending on GPU queue)
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Result Area */}
        {resultUrl && (
          <ResultSection
            resultUrl={resultUrl}
            personImage={personImage}
            garmentImage={garmentImage}
            modelSpace={modelSpaceUsed}
            onReset={handleReset}
          />
        )}

        {/* Bottom AdSense Placeholder */}
        <div className="bottom-ad-wrapper">
          <AdSensePlaceholder slotName="Footer Banner Slot" format="leaderboard" />
        </div>
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <div className="footer-container">
          <div className="footer-left">
            <p className="footer-copyright">
              © {new Date().getFullYear()} FitCraft AI. Built with zero paid APIs.
            </p>
            <p className="footer-subtext">
              Cloudflare Worker Edge Proxy • React 18 + Vite • Hugging Face Space Engine
            </p>
          </div>
          <div className="footer-links">
            <button
              type="button"
              className="footer-link-btn"
              onClick={() => setIsPrivacyModalOpen(true)}
            >
              Privacy Policy
            </button>
            <span className="dot">•</span>
            <a
              href="https://huggingface.co/spaces/yisol/IDM-VTON"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-external-link"
            >
              <span>IDM-VTON Model</span>
              <ExternalLink size={12} />
            </a>
          </div>
        </div>
      </footer>

      {/* Privacy Policy Modal */}
      <PrivacyPolicyModal
        isOpen={isPrivacyModalOpen}
        onClose={() => setIsPrivacyModalOpen(false)}
      />
    </div>
  );
};
