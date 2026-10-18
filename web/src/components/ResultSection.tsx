import React, { useState } from 'react';
import {
  Download,
  RotateCcw,
  Sparkles,
  SlidersHorizontal,
  LayoutGrid,
  Maximize2,
  ShieldCheck,
  Check,
} from 'lucide-react';
import type { ProcessedImage } from '../lib/image-processor';
import { BeforeAfterSlider } from './BeforeAfterSlider';

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
  const [viewMode, setViewMode] = useState<'slider' | 'side-by-side' | 'spotlight'>('slider');
  const [copied, setCopied] = useState<boolean>(false);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = resultUrl;
    link.download = `atelier-tryon-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="result-section" id="result-view" aria-label="Atelier Try-On Showcase">
      <div className="result-card">
        {/* Header */}
        <div className="result-header">
          <div className="result-title-group">
            <div className="gold-accent-badge">
              <Sparkles size={16} className="text-gold" />
            </div>
            <div>
              <h2 className="result-title">Atelier Synthesis Complete</h2>
              <p className="result-subtitle">
                Rendered with high-fidelity diffusion ({modelSpace || 'IDM-VTON'}) • Ephemeral In-Memory Buffer
              </p>
            </div>
          </div>

          <div className="result-actions">
            {/* View Mode Switcher */}
            <div className="view-toggle-group">
              {personImage && (
                <button
                  type="button"
                  className={`toggle-btn ${viewMode === 'slider' ? 'active' : ''}`}
                  onClick={() => setViewMode('slider')}
                  title="Interactive Before/After Slider"
                >
                  <SlidersHorizontal size={14} />
                  <span>Split Slider</span>
                </button>
              )}
              <button
                type="button"
                className={`toggle-btn ${viewMode === 'side-by-side' ? 'active' : ''}`}
                onClick={() => setViewMode('side-by-side')}
                title="Side by Side Comparison"
              >
                <LayoutGrid size={14} />
                <span>Gallery</span>
              </button>
              <button
                type="button"
                className={`toggle-btn ${viewMode === 'spotlight' ? 'active' : ''}`}
                onClick={() => setViewMode('spotlight')}
                title="Spotlight Single View"
              >
                <Maximize2 size={14} />
                <span>Spotlight</span>
              </button>
            </div>

            {/* Action Buttons */}
            <button
              type="button"
              className="action-btn luxury-download-btn"
              onClick={handleDownload}
              title="Download Master Image"
            >
              {copied ? <Check size={16} /> : <Download size={16} />}
              <span>{copied ? 'Saved' : 'Export Look'}</span>
            </button>

            <button
              type="button"
              className="action-btn secondary-btn"
              onClick={onReset}
              title="Try another garment"
            >
              <RotateCcw size={15} />
              <span>New Fitting</span>
            </button>
          </div>
        </div>

        {/* Display Canvas */}
        <div className="result-display-area">
          {viewMode === 'slider' && personImage ? (
            <div className="slider-wrapper">
              <BeforeAfterSlider
                beforeImage={personImage.dataUrl}
                afterImage={resultUrl}
                beforeLabel="Original Silhouette"
                afterLabel="Atelier Haute Couture"
              />
              <p className="slider-instruction">
                Drag the divider or use keyboard arrows to inspect garment draping and texture integration
              </p>
            </div>
          ) : viewMode === 'side-by-side' ? (
            <div className="comparison-grid">
              {personImage && (
                <div className="comparison-item">
                  <span className="comparison-label">01. Silhouette</span>
                  <div className="comparison-frame">
                    <img src={personImage.dataUrl} alt="Original Silhouette" />
                  </div>
                </div>
              )}
              {garmentImage && (
                <div className="comparison-item">
                  <span className="comparison-label">02. Garment Piece</span>
                  <div className="comparison-frame">
                    <img src={garmentImage.dataUrl} alt="Selected Garment Piece" />
                  </div>
                </div>
              )}
              <div className="comparison-item highlight-item">
                <span className="comparison-label highlight-label">
                  <Sparkles size={11} className="text-gold" /> 03. Atelier Result
                </span>
                <div className="comparison-frame">
                  <img src={resultUrl} alt="Atelier Haute Couture Result" />
                </div>
              </div>
            </div>
          ) : (
            <div className="single-result-frame">
              <img src={resultUrl} alt="AI Virtual Try-On Result" className="result-main-image" />
            </div>
          )}
        </div>

        {/* Ephemeral Privacy Footer */}
        <div className="result-footer-banner">
          <ShieldCheck size={15} className="text-gold" />
          <span>
            Verified Zero-Trace Session: Uploaded imagery was processed strictly in RAM and has been wiped from server memory.
          </span>
        </div>
      </div>
    </section>
  );
};
