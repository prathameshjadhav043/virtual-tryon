import React from 'react';
import { X, Shield, Lock, EyeOff, Server, Trash2, UserRound } from 'lucide-react';

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <Shield className="modal-icon text-accent" size={24} />
            <div>
              <h2 className="modal-title">Privacy & Data Handling</h2>
              <p className="modal-subtitle">How photos, sign-in, and activity analytics are used</p>
            </div>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close privacy policy"
          >
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div className="privacy-pill-banner">
            <Lock size={16} />
            <span>Your photos are sent to the selected try-on provider. Avoid uploading sensitive photos.</span>
          </div>

          <div className="policy-section">
            <h3 className="section-title">
              <Trash2 size={18} className="inline-icon text-success" />
              1. Photo Processing
            </h3>
            <p>
              Photos are resized in your browser, sent over HTTPS to our Cloudflare Worker, and forwarded
              to the Hugging Face IDM-VTON Space for generation. This app does not save photos to a
              Firebase database or storage bucket. The AI provider may process or retain request data
              under its own policies, so we cannot promise zero storage by every service involved.
            </p>
          </div>

          <div className="policy-section">
            <h3 className="section-title">
              <Server size={18} className="inline-icon text-accent" />
              2. Google Sign-In
            </h3>
            <p>
              Google sign-in is provided by Firebase Authentication. Firebase receives the account
              information needed to authenticate you. The app uses your signed-in account to authorize
              try-on requests; your name and email are not sent as analytics event parameters.
            </p>
          </div>

          <div className="policy-section">
            <h3 className="section-title">
              <EyeOff size={18} className="inline-icon text-warning" />
              3. Usage Analytics
            </h3>
            <p>
              Google Analytics 4 tracks sign-in method and operational events such as fitting starts,
              completions, failures, garment view count, and duration. The app does not include photo
              content, filenames, email addresses, or Firebase user IDs in these custom events. Google
              Analytics may collect standard device and usage information as described in Google's policy.
            </p>
          </div>

          <div className="policy-section">
            <h3 className="section-title">
              <UserRound size={18} className="inline-icon text-accent" />
              4. Activity View
            </h3>
            <p>
              Usage events are available in the connected Google Analytics property. This version does
              not provide a personal activity-history page inside the app.
            </p>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="primary-action-btn" onClick={onClose}>
            I Understand & Agree
          </button>
        </div>
      </div>
    </div>
  );
};
