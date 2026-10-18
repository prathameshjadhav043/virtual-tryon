import React from 'react';
import { X, Shield, Lock, EyeOff, Server, Trash2 } from 'lucide-react';

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
              <h2 className="modal-title">Privacy Policy & Photo Handling</h2>
              <p className="modal-subtitle">Zero-Storage Commitment & Data Safeguards</p>
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
            <span>We never store, persist, sell, or train models on your uploaded photos.</span>
          </div>

          <div className="policy-section">
            <h3 className="section-title">
              <Trash2 size={18} className="inline-icon text-success" />
              1. Zero-Storage Architecture
            </h3>
            <p>
              When you upload a photo, it is resized locally in your web browser using HTML5 Canvas.
              It is transmitted over an encrypted HTTPS connection to our serverless edge proxy
              (Cloudflare Worker) solely for in-memory forwarding to the AI try-on inference engine.
              The images are never written to any database, disk, cloud bucket, or persistent storage.
            </p>
          </div>

          <div className="policy-section">
            <h3 className="section-title">
              <Server size={18} className="inline-icon text-accent" />
              2. Ephemeral AI Inference
            </h3>
            <p>
              Virtual try-on generation is performed using open-source diffusion models (e.g., IDM-VTON).
              Once the result image is computed and returned to your browser session, the input images
              are discarded from memory.
            </p>
          </div>

          <div className="policy-section">
            <h3 className="section-title">
              <EyeOff size={18} className="inline-icon text-warning" />
              3. Privacy-Preserving Analytics
            </h3>
            <p>
              We use Google Analytics 4 strictly to count operational health and error rates (such as
              tryon completion counts and performance duration). We explicitly do{' '}
              <strong>not</strong> log or collect filenames, image content, personal identifiers, or
              facial metadata in any telemetry stream.
            </p>
          </div>

          <div className="policy-section">
            <h3 className="section-title">4. Third-Party Services & Free Tier Disclosures</h3>
            <p>
              This app is engineered to run on free-tier infrastructure (Cloudflare Workers, Firebase
              Hosting, Hugging Face). No personal profile is required to preview outfits during Phase 1.
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
