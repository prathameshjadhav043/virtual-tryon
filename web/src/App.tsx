import React, { useEffect, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import {
  Sparkles,
  AlertCircle,
  Shield,
  Loader2,
  ExternalLink,
  Wand2,
} from 'lucide-react';
import { UploadDropzone, type StudioPreset } from './components/UploadDropzone';
import { GarmentSourcePanel, type GarmentSourceMode } from './components/GarmentSourcePanel';
import { ConsentBanner } from './components/ConsentBanner';
import { PrivacyPolicyModal } from './components/PrivacyPolicyModal';
import { ResultSection } from './components/ResultSection';
import { AuthControl } from './components/AuthControl';
import { type ProcessedImage } from './lib/image-processor';
import { authInstance } from './lib/firebase';
import { signInWithGoogle, signOutUser } from './lib/auth';
import {
  trackGoogleLogin,
  trackLogout,
  trackTryonStarted,
  trackUploadStarted,
  trackTryonCompleted,
  trackTryonFailed,
} from './lib/analytics';

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

interface TryOnView {
  imageUrl: string;
  contentType: string;
  spaceUsed: string;
  garmentImageIndex: number;
}

export const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [personImage, setPersonImage] = useState<ProcessedImage | null>(null);
  const [garmentImages, setGarmentImages] = useState<ProcessedImage[]>([]);
  const [garmentSourceMode, setGarmentSourceMode] = useState<GarmentSourceMode>('image');
  const [productUrl, setProductUrl] = useState<string>('');
  const [garmentDescription, setGarmentDescription] = useState<string>('');
  const [hasConsented, setHasConsented] = useState<boolean>(false);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [tryOnViews, setTryOnViews] = useState<TryOnView[]>([]);
  const [modelSpaceUsed, setModelSpaceUsed] = useState<string>('yisol/IDM-VTON');
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState<boolean>(false);

  useEffect(() => {
    if (!authInstance) {
      setAuthReady(true);
      return;
    }

    return onAuthStateChanged(authInstance, (authenticatedUser) => {
      setUser(authenticatedUser);
      setAuthReady(true);
    });
  }, []);

  const handleGoogleSignIn = async () => {
    await signInWithGoogle();
    trackGoogleLogin();
  };

  const handleSignOut = async () => {
    trackLogout();
    await signOutUser();
    setTryOnViews([]);
    setHasConsented(false);
  };

  const hasGarmentSource = garmentSourceMode === 'image'
    ? garmentImages.length > 0
    : garmentSourceMode === 'link'
      ? Boolean(productUrl.trim())
      : Boolean(garmentDescription.trim());
  const canSubmit = Boolean(authReady && user && personImage && hasGarmentSource && hasConsented && !isLoading);

  const handleTryOn = async () => {
    if (!user) {
      setErrorMessage('Sign in with Google before generating a virtual fitting.');
      return;
    }

    if (!personImage || !hasGarmentSource) {
      setErrorMessage('Please provide your silhouette photo and choose a garment source.');
      return;
    }

    if (garmentSourceMode !== 'image') {
      setErrorMessage(
        garmentSourceMode === 'link'
          ? 'Product-link fitting is not connected yet. Choose Upload image to generate a fitting.'
          : 'Description-only fitting is not connected yet. Choose Upload image to generate a fitting.'
      );
      return;
    }

    if (garmentImages.length === 0) {
      setErrorMessage('Please upload a garment image to generate a fitting.');
      return;
    }

    if (!hasConsented) {
      setErrorMessage('Please accept the photo processing notice to continue.');
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);
    setLoadingStep(
      `Preparing ${garmentImages.length} garment view${garmentImages.length === 1 ? '' : 's'} for synthesis...`
    );
    const startTime = performance.now();

    // Fire upload_started telemetry (strictly sanitized metadata)
    trackUploadStarted({
      person_image_size_kb: Math.round(personImage.processedSizeBytes / 1024),
      garment_image_size_kb: Math.round(
        garmentImages.reduce((total, image) => total + image.processedSizeBytes, 0) / 1024
      ),
    });
    trackTryonStarted(garmentImages.length);

    try {
      const formData = new FormData();
      formData.append('person_image', personImage.file);
      garmentImages.forEach((image) => formData.append('garment_image', image.file));
      if (garmentDescription.trim()) {
        formData.append('garment_description', garmentDescription.trim());
      }

      setLoadingStep(
        `Generating one try-on result for each of the ${garmentImages.length} garment view${garmentImages.length === 1 ? '' : 's'}...`
      );

      const idToken = await user.getIdToken();

      const response = await fetch(`${WORKER_URL}/tryon`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${idToken}` },
        body: formData,
      });

      const responseData = await response.json();

      if (!response.ok || !responseData.success) {
        const errorMsg =
          responseData.error || `Server responded with status code ${response.status}`;
        throw new Error(errorMsg);
      }

      const durationMs = performance.now() - startTime;
      const generatedViews: TryOnView[] = Array.isArray(responseData.results)
        ? responseData.results
        : [{
            imageUrl: responseData.imageUrl,
            contentType: responseData.contentType || 'image/png',
            spaceUsed: responseData.spaceUsed || 'yisol/IDM-VTON',
            garmentImageIndex: 0,
          }];
      if (generatedViews.length === 0 || !generatedViews[0].imageUrl) {
        throw new Error('The try-on service returned no result images.');
      }

      trackTryonCompleted({
        duration_ms: durationMs,
        model_space: generatedViews[0].spaceUsed,
      });

      setTryOnViews(generatedViews);
      if (generatedViews[0].spaceUsed) {
        setModelSpaceUsed(generatedViews[0].spaceUsed);
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
    setTryOnViews([]);
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
            <AuthControl
              user={user}
              ready={authReady}
              onSignIn={handleGoogleSignIn}
              onSignOut={handleSignOut}
            />
            <button
              type="button"
              className="text-link-btn"
              onClick={() => setIsPrivacyModalOpen(true)}
            >
              <Shield size={14} className="text-gold" />
              <span>Privacy &amp; Data Handling</span>
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
            Photorealistic AI virtual fitting. Select a studio look to test instantly,
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
              <GarmentSourcePanel
                mode={garmentSourceMode}
                onModeChange={setGarmentSourceMode}
                images={garmentImages}
                onImagesChange={setGarmentImages}
                productUrl={productUrl}
                onProductUrlChange={setProductUrl}
                description={garmentDescription}
                onDescriptionChange={setGarmentDescription}
                disabled={isLoading}
                presets={GARMENT_PRESETS}
                onPresetSelect={handleGarmentPresetSelect}
              />
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
                {errorMessage.includes('ZeroGPU quota') && (
                  <p className="error-hint">
                    The shared Hugging Face GPU capacity is busy or limited. Try again later. A Google sign-in does not add dedicated model capacity.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Action Trigger */}
          <div className="action-row">
            {!user && (
              <p className="signin-required-note">
                Sign in with Google to use the shared free try-on model.
              </p>
            )}
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
                    {garmentImages.length > 1
                      ? `One separate inference per garment view (${garmentImages.length} total)`
                      : 'The shared Hugging Face model may queue your request'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Result Area */}
        {tryOnViews.length > 0 && (
          <ResultSection
            results={tryOnViews}
            personImage={personImage}
            garmentImages={garmentImages}
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
              Privacy &amp; Data Handling
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
