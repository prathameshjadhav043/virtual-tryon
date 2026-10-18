import React, { useState } from 'react';
import { Download, RotateCcw, Sparkles, SplitSquareVertical, Eye, ShieldCheck } from 'lucide-react';
import type { ProcessedImage } from '../lib/image-processor';

interface ResultSectionProps {
  resultUrl: string;
  personImage: ProcessedImage | null;
  garmentImage: ProcessedImage | null;
  modelSpace?: string;
  onReset: () => void;
}

export const ResultSection: React.FC<ResultSectionProps> = ({
  resultUrl,
  personImage,
  garmentImage,
  modelSpace,
  onReset,
}) => {
  const [viewMode, setViewMode] = useState<'result' | 'comparison'>('result');

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = resultUrl;
    link.download = `tryon-result-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <section className="result-section" id="result-view" aria-label="Try-On Result Showcase">
      <div className="result-card">
        <div className="result-header">
          <div className="result-title-group">
            <div className="sparkle-badge">
              <Sparkles size={18} className="text-accent" />
            </div>
            <div>
              <h2 className="result-title">Your AI Try-On Result</h2>
              <p className="result-subtitle">
                Synthesized by {modelSpace || 'IDM-VTON'} • 100% ephemeral in-memory rendering
              </p>
            </div>
          </div>

          <div className="result-actions">
            <div className="view-toggle-group">
              <button
                type="button"
                className={`toggle-btn ${viewMode === 'result' ? 'active' : ''}`}
                onClick={() => setViewMode('result')}
                title="View Result"
              >
                <Eye size={15} />
                <span>Result</span>
              </button>
              <button
                type="button"
                className={`toggle-btn ${viewMode === 'comparison' ? 'active' : ''}`}
                onClick={() => setViewMode('comparison')}
                title="Compare with Original"
              >
                <SplitSquareVertical size={15} />
                <span>Comparison</span>
              </button>
            </div>

            <button
              type="button"
              className="action-btn download-btn"
              onClick={handleDownload}
              title="Download Result Image"
            >
              <Download size={16} />
              <span>Download</span>
            </button>

            <button
              type="button"
              className="action-btn secondary-btn"
              onClick={onReset}
              title="Try another garment"
            >
              <RotateCcw size={16} />
              <span>Try Another</span>
            </button>
          </div>
        </div>

        <div className="result-display-area">
          {viewMode === 'result' ? (
            <div className="single-result-frame">
              <img src={resultUrl} alt="AI Virtual Try-On Result" className="result-main-image" />
            </div>
          ) : (
            <div className="comparison-grid">
              {personImage && (
                <div className="comparison-item">
                  <span className="comparison-label">Original Photo</span>
                  <div className="comparison-frame">
                    <img src={personImage.dataUrl} alt="Original User" />
                  </div>
                </div>
              )}
              {garmentImage && (
                <div className="comparison-item">
                  <span className="comparison-label">Selected Garment</span>
                  <div className="comparison-frame">
                    <img src={garmentImage.dataUrl} alt="Garment Product" />
                  </div>
                </div>
              )}
              <div className="comparison-item highlight-item">
                <span className="comparison-label highlight-label">AI Try-On Result</span>
                <div className="comparison-frame">
                  <img src={resultUrl} alt="AI Try-On Result" />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="result-footer-banner">
          <ShieldCheck size={16} className="text-success" />
          <span>Privacy confirmed: Uploaded photos have been discarded from server memory.</span>
        </div>
      </div>
    </section>
  );
};
