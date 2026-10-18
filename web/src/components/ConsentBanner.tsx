import React from 'react';
import { Lock } from 'lucide-react';

interface ConsentBannerProps {
  hasConsented: boolean;
  onConsentChange: (consented: boolean) => void;
  onOpenPrivacyModal: () => void;
}

export const ConsentBanner: React.FC<ConsentBannerProps> = ({
  hasConsented,
  onConsentChange,
  onOpenPrivacyModal,
}) => {
  return (
    <div className="consent-container">
      <div className={`consent-card ${hasConsented ? 'consented' : ''}`}>
        <div className="consent-icon-col">
          <div className="shield-badge">
            <Lock size={15} className="shield-icon" />
          </div>
        </div>
        <div className="consent-content-col">
          <label htmlFor="privacy-consent-checkbox" className="consent-label">
            <input
              id="privacy-consent-checkbox"
              type="checkbox"
              className="consent-checkbox"
              checked={hasConsented}
              onChange={(e) => onConsentChange(e.target.checked)}
            />
            <span className="consent-text">
              I consent to ephemeral in-memory neural synthesis of my uploaded photo.{' '}
              <span className="highlight-pill">No photos are stored</span> on any persistent disk or database and are immediately discarded post-inference.{' '}
              <button
                type="button"
                className="privacy-link-btn"
                onClick={(e) => {
                  e.preventDefault();
                  onOpenPrivacyModal();
                }}
              >
                Read Zero-Trace Policy
              </button>
            </span>
          </label>
        </div>
      </div>
    </div>
  );
};
