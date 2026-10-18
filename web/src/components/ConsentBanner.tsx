import React from 'react';
import { ShieldCheck } from 'lucide-react';

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
      <div className="consent-card">
        <div className="consent-icon-col">
          <ShieldCheck size={20} className="shield-icon" />
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
              I consent to temporary, in-memory AI processing of my uploaded photo. I understand that{' '}
              <strong>photos are never stored</strong> and are discarded immediately after rendering.{' '}
              <button
                type="button"
                className="privacy-link-btn"
                onClick={(e) => {
                  e.preventDefault();
                  onOpenPrivacyModal();
                }}
              >
                Read Privacy Policy
              </button>
            </span>
          </label>
        </div>
      </div>
    </div>
  );
};
