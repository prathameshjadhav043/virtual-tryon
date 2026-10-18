import React, { useState } from 'react';
import {
  Sparkles,
  AlertCircle,
  Shield,
  Loader2,
  ExternalLink,
  Layers,
  Wand2,
} from 'lucide-react';
import { UploadDropzone, type StudioPreset } from './components/UploadDropzone';
import { ConsentBanner } from './components/ConsentBanner';
import { PrivacyPolicyModal } from './components/PrivacyPolicyModal';
import { ResultSection } from './components/ResultSection';
import { type ProcessedImage } from './lib/image-processor';
import { trackUploadStarted, trackTryonCompleted, trackTryonFailed } from './lib/analytics';

const WORKER_URL = import.meta.env.VITE_TRYON_WORKER_URL || 'http://localhost:8787';

const MODEL_PRESETS: StudioPreset[] = [
  {
    id: 'model-elena',
    name: 'Elena',
    subtitle: 'Studio Editorial',
    url: '/presets/model-female.jpg',
    filename: 'model-female.jpg',
  },
  {
    id: 'model-julian',
    name: 'Julian',
    subtitle: 'Sartorial Tailored',
    url: '/presets/model-male.jpg',
    filename: 'model-male.jpg',
  },
];

const GARMENT_PRESETS: StudioPreset[] = [
  {
    id: 'garment-jacket',
    name: 'Onyx Biker Jacket',
    subtitle: 'Black Moto Leather',
    url: '/presets/garment-jacket.jpg',
    filename: 'garment-jacket.jpg',
    description: 'Tailored black biker leather jacket with asymmetric silver hardware',
  },
  {
    id: 'garment-blouse',
    name: 'Emerald Silk Blouse',
    subtitle: 'Draped Satin Top',
    url: '/presets/garment-blouse.jpg',
    filename: 'garment-blouse.jpg',
    description: 'Emerald green draped silk satin blouse with pearl cuff details',
  },
];

export const App: React.FC = () => {
  const [personImage, setPersonImage] = useState<ProcessedImage | null>(null);
  const [garmentImage, setGarmentImage] = useState<ProcessedImage | null>(null);
  const [garmentDescription, setGarmentDescription] = useState<string>('');
  const [hasConsented, setHasConsented] = useState<boolean>(true); // Pre-check with clear zero-trace notice

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [modelSpaceUsed, setModelSpaceUsed] = useState<string>('yisol/IDM-VTON');
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState<boolean>(false);

  const canSubmit = Boolean(personImage && garmentImage && hasConsented && !isLoading);

  const handleTryOn = async () => {
    if (!personImage || !garmentImage) {
      setErrorMessage('Please provide both your silhouette photo and a garment image.');
      return;
    }

    if (!hasConsented) {
      setErrorMessage('Please confirm the zero-trace privacy consent to continue.');
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);
    setLoadingStep('Dispatching in-memory buffers to Cloudflare Worker proxy...');
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

      setLoadingStep('Synthesizing neural draping on Hugging Face (IDM-VTON diffusion model)...');

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

  const handleGarmentPresetSelect = (preset: StudioPreset) => {
    if (preset.description) {
      setGarmentDescription(preset.description);
    }
  };

  return (
    <div className="app-container">
      {/* Background Decorative Ambient Gradients */}
      <div className="ambient-blur ambient-gold" />
      <div className="ambient-blur ambient-violet" />
      <div className="ambient-grid-overlay" />

      {/* Header */}
      <header className="app-header">
        <div className="header-container">
          <div className="brand-group">
            <div className="brand-monogram">
              <Sparkles size={18} className="text-gold" />
            </div>
            <div>
              <div className="brand-title-row">
                <h1 className="brand-title">ATELIER AI</h1>
                <span className="couture-badge">HAUTE COUTURE STUDIO</span>
              </div>
              <p className="brand-tagline">Generative Neural Fitting Engine</p>
            </div>
          </div>

          <div className="header-actions">
            <button
              type="button"
              className="text-link-btn"
              onClick={() => setIsPrivacyModalOpen(true)}
            >
              <Shield size={14} className="text-gold" />
              <span>Zero-Trace Privacy</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        {/* Hero Section */}
        <section className="hero-section">
          <div className="hero-pill">
            <Wand2 size={13} className="text-gold" />
            <span>IDM-VTON Neural Diffusion Engine</span>
          </div>
          <h2 className="hero-heading">
            Preview any garment on <span className="gold-shimmer-text">your real silhouette</span>
          </h2>
          <p className="hero-subheading">
            Photorealistic AI virtual fitting with zero digital footprint. Select a studio look to test instantly,
            or upload your own silhouette and any clothing item.
          </p>
        </section>

        {/* Studio Upload Workspace */}
        <div className="upload-grid-container">
          <div className="upload-columns">
            {/* Person Photo Card */}
            <div className="column-card">
              <UploadDropzone
                id="person-photo-uploader"
                title="Your Silhouette"
                subtitle="Full body or torso facing front in neutral lighting"
                badge="Step 01"
                image={personImage}
                onImageChange={setPersonImage}
                disabled={isLoading}
                presets={MODEL_PRESETS}
              />
            </div>

            {/* Garment Image Card */}
            <div className="column-card">
              <UploadDropzone
                id="garment-photo-uploader"
                title="Garment Item"
                subtitle="Clean product shot, model photo, or garment cutout"
                badge="Step 02"
                image={garmentImage}
                onImageChange={setGarmentImage}
                disabled={isLoading}
                presets={GARMENT_PRESETS}
                onPresetSelect={handleGarmentPresetSelect}
              />

              <div className="garment-detail-card">
                <label htmlFor="garment-description-input" className="input-label">
                  <Layers size={13} className="text-gold" />
                  <span>Garment description (optional)</span>
                </label>
                <input
                  id="garment-description-input"
                  type="text"
                  className="text-input"
                  placeholder="e.g. Tailored black leather biker jacket with silver hardware"
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
                <p className="error-title">Fitting Could Not Complete</p>
                <p className="error-message">{errorMessage}</p>
                {errorMessage.includes('Failed to fetch') && (
                  <p className="error-hint">
                    Check that your edge worker is active on port 8787.
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
                  <Loader2 size={18} className="spin-icon" />
                  <span>Synthesizing Haute Couture...</span>
                </>
              ) : (
                <>
                  <Sparkles size={18} className="text-gold" />
                  <span>Synthesize Virtual Fitting</span>
                </>
              )}
            </button>

            {isLoading && (
              <div className="loading-status-bar">
                <div className="progress-pulse-line">
                  <div className="progress-shimmer"></div>
                </div>
                <div className="loading-milestones">
                  <p className="loading-step-text">{loadingStep}</p>
                  <p className="loading-subtext">
                    IDM-VTON runs in ephemeral GPU memory • 15–30s
                  </p>
                </div>
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
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <div className="footer-container">
          <div className="footer-left">
            <p className="footer-copyright">
              © {new Date().getFullYear()} ATELIER AI. Ephemeral Virtual Haute Couture Studio.
            </p>
            <p className="footer-subtext">
              Cloudflare Worker Edge Proxy • React 18 + Vite • IDM-VTON Neural Architecture
            </p>
          </div>
          <div className="footer-links">
            <button
              type="button"
              className="footer-link-btn"
              onClick={() => setIsPrivacyModalOpen(true)}
            >
              Zero-Trace Privacy Policy
            </button>
            <span className="dot">•</span>
            <a
              href="https://huggingface.co/spaces/yisol/IDM-VTON"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-external-link"
            >
              <span>Diffusion Architecture</span>
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
