import React, { useRef, useState } from 'react';
import { Upload, X, CheckCircle, Sparkles } from 'lucide-react';
import {
  resizeImageToMaxDimension,
  loadPresetImage,
  formatBytes,
  type ProcessedImage,
} from '../lib/image-processor';

export interface StudioPreset {
  id: string;
  name: string;
  subtitle: string;
  url: string;
  filename: string;
  description?: string;
}

interface UploadDropzoneProps {
  id: string;
  title: string;
  subtitle: string;
  badge?: string;
  image: ProcessedImage | null;
  onImageChange: (image: ProcessedImage | null) => void;
  disabled?: boolean;
  presets?: StudioPreset[];
  onPresetSelect?: (preset: StudioPreset) => void;
}

export const UploadDropzone: React.FC<UploadDropzoneProps> = ({
  id,
  title,
  subtitle,
  badge,
  image,
  onImageChange,
  disabled = false,
  presets = [],
  onPresetSelect,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activePresetId, setActivePresetId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setErrorMessage(null);
    setActivePresetId(null);
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please upload a valid high-resolution image (JPEG, PNG, or WebP).');
      return;
    }

    try {
      setIsProcessing(true);
      const processed = await resizeImageToMaxDimension(file, 1024);
      onImageChange(processed);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to process image');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSelectPreset = async (preset: StudioPreset) => {
    if (disabled || isProcessing) return;
    setErrorMessage(null);
    setActivePresetId(preset.id);
    try {
      setIsProcessing(true);
      const processed = await loadPresetImage(preset.url, preset.filename);
      onImageChange(processed);
      if (onPresetSelect) {
        onPresetSelect(preset);
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to load preset');
    } finally {
      setIsProcessing(false);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onImageChange(null);
    setActivePresetId(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="upload-card">
      <div className="upload-card-header">
        <div className="header-info">
          <h3 className="card-title">{title}</h3>
          <p className="card-subtitle">{subtitle}</p>
        </div>
        {badge && <span className="pill-badge">{badge}</span>}
      </div>

      <div
        id={id}
        className={`dropzone ${isDragging ? 'dragging' : ''} ${image ? 'has-image' : ''} ${
          disabled ? 'disabled' : ''
        }`}
        onClick={() => !disabled && !image && fileInputRef.current?.click()}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        role="button"
        tabIndex={0}
        aria-label={`Upload or select ${title}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden-file-input"
          onChange={onInputChange}
          disabled={disabled}
        />

        {isProcessing ? (
          <div className="dropzone-state processing-state">
            <div className="luxury-spinner">
              <div className="spinner-ring"></div>
            </div>
            <p className="state-text">Optimizing canvas silhouette...</p>
            <p className="state-subtext">Ephemeral in-memory buffer</p>
          </div>
        ) : image ? (
          <div className="preview-container">
            <img src={image.dataUrl} alt={title} className="preview-image" />
            <div className="preview-overlay">
              <button
                type="button"
                className="remove-btn"
                onClick={handleRemove}
                title="Remove image"
                aria-label="Remove image"
              >
                <X size={15} />
              </button>
            </div>
            <div className="specs-bar">
              <span className="spec-item">
                <CheckCircle size={13} className="spec-icon text-gold" />
                {image.width} × {image.height}px
              </span>
              <span className="spec-divider">•</span>
              <span className="spec-item">{formatBytes(image.processedSizeBytes)}</span>
            </div>
          </div>
        ) : (
          <div className="dropzone-state empty-state">
            <div className="upload-icon-wrapper">
              <Upload size={22} className="upload-icon" />
            </div>
            <p className="primary-prompt">
              Drop image here or <span className="text-highlight">browse studio files</span>
            </p>
            <p className="secondary-prompt">JPG, PNG, WebP • Auto-fitted to 1024px</p>
          </div>
        )}
      </div>

      {/* Preset Look Quick-Picks */}
      {presets.length > 0 && (
        <div className="presets-wrapper">
          <div className="presets-header">
            <Sparkles size={12} className="text-gold" />
            <span>Or choose an Atelier studio preset:</span>
          </div>
          <div className="preset-chips">
            {presets.map((preset) => (
              <button
                key={preset.id}
                type="button"
                className={`preset-chip ${activePresetId === preset.id ? 'active' : ''}`}
                onClick={() => handleSelectPreset(preset)}
                disabled={disabled || isProcessing}
              >
                <span className="preset-thumb-wrap">
                  <img src={preset.url} alt={preset.name} className="preset-thumb" />
                </span>
                <div className="preset-text">
                  <span className="preset-name">{preset.name}</span>
                  <span className="preset-sub">{preset.subtitle}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {errorMessage && <p className="dropzone-error">{errorMessage}</p>}
    </div>
  );
};
