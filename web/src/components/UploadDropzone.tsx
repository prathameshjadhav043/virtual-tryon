import React, { useRef, useState } from 'react';
import { Upload, X, CheckCircle } from 'lucide-react';
import { resizeImageToMaxDimension, formatBytes, type ProcessedImage } from '../lib/image-processor';

interface UploadDropzoneProps {
  id: string;
  title: string;
  subtitle: string;
  badge?: string;
  image: ProcessedImage | null;
  onImageChange: (image: ProcessedImage | null) => void;
  disabled?: boolean;
}

export const UploadDropzone: React.FC<UploadDropzoneProps> = ({
  id,
  title,
  subtitle,
  badge,
  image,
  onImageChange,
  disabled = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setErrorMessage(null);
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please upload a valid image (JPEG, PNG, or WebP).');
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
        aria-label={`Upload ${title}`}
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
            <div className="spinner"></div>
            <p className="state-text">Optimizing image to 1024px...</p>
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
                <X size={16} />
              </button>
            </div>
            <div className="specs-bar">
              <span className="spec-item">
                <CheckCircle size={13} className="spec-icon text-success" />
                {image.width} × {image.height}px
              </span>
              <span className="spec-divider">•</span>
              <span className="spec-item">{formatBytes(image.processedSizeBytes)}</span>
              {image.originalSizeBytes > image.processedSizeBytes && (
                <span className="spec-savings">
                  (saved {formatBytes(image.originalSizeBytes - image.processedSizeBytes)})
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="dropzone-state empty-state">
            <div className="upload-icon-wrapper">
              <Upload size={24} className="upload-icon" />
            </div>
            <p className="primary-prompt">
              Click to browse or <strong>drag & drop</strong>
            </p>
            <p className="secondary-prompt">JPG, PNG, WebP (auto-resized to 1024px)</p>
          </div>
        )}
      </div>

      {errorMessage && <p className="dropzone-error">{errorMessage}</p>}
    </div>
  );
};
