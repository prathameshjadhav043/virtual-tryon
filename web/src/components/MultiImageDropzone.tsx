import React, { useRef, useState } from 'react';
import { CheckCircle, Plus, Sparkles, Upload, X } from 'lucide-react';
import {
  formatBytes,
  loadPresetImage,
  resizeImageToMaxDimension,
  type ProcessedImage,
} from '../lib/image-processor';
import type { StudioPreset } from './UploadDropzone';

const MAX_GARMENT_VIEWS = 3;

interface MultiImageDropzoneProps {
  images: ProcessedImage[];
  onImagesChange: (images: ProcessedImage[]) => void;
  presets: StudioPreset[];
  onPresetSelect: (preset: StudioPreset) => void;
  disabled?: boolean;
}

export const MultiImageDropzone: React.FC<MultiImageDropzoneProps> = ({
  images,
  onImagesChange,
  presets,
  onPresetSelect,
  disabled = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activePresetId, setActivePresetId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const canAddMore = images.length < MAX_GARMENT_VIEWS;

  const addFiles = async (files: FileList | File[]) => {
    const availableSlots = MAX_GARMENT_VIEWS - images.length;
    const allSelectedFiles = Array.from(files);
    const selectedFiles = allSelectedFiles.slice(0, availableSlots);
    if (selectedFiles.length === 0) {
      setErrorMessage(`You can add up to ${MAX_GARMENT_VIEWS} garment views.`);
      return;
    }

    const invalidFile = selectedFiles.find((file) => !file.type.startsWith('image/'));
    if (invalidFile) {
      setErrorMessage('Please choose image files in JPEG, PNG, or WebP format.');
      return;
    }

    setErrorMessage(
      allSelectedFiles.length > availableSlots
        ? `Only ${availableSlots} more view${availableSlots === 1 ? '' : 's'} fit. The first ${availableSlots} image${availableSlots === 1 ? '' : 's'} will be added.`
        : null
    );
    setActivePresetId(null);
    setIsProcessing(true);
    try {
      const processedImages: ProcessedImage[] = [];
      for (const file of selectedFiles) {
        processedImages.push(await resizeImageToMaxDimension(file, 1024));
      }
      onImagesChange([...images, ...processedImages]);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to process garment images.');
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const selectPreset = async (preset: StudioPreset) => {
    if (disabled || isProcessing) return;
    setErrorMessage(null);
    setActivePresetId(preset.id);
    setIsProcessing(true);
    try {
      const image = await loadPresetImage(preset.url, preset.filename);
      onImagesChange([image]);
      onPresetSelect(preset);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to load preset.');
    } finally {
      setIsProcessing(false);
    }
  };

  const removeImage = (index: number) => {
    onImagesChange(images.filter((_, imageIndex) => imageIndex !== index));
    setActivePresetId(null);
    setErrorMessage(null);
  };

  return (
    <div className="multi-image-upload">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden-file-input"
        onChange={(event) => {
          if (event.target.files?.length) void addFiles(event.target.files);
        }}
        disabled={disabled || isProcessing || !canAddMore}
      />

      <div
        className={`multi-image-dropzone dropzone ${isDragging ? 'dragging' : ''} ${images.length ? 'has-image' : ''} ${disabled ? 'disabled' : ''}`}
        onClick={() => !disabled && !isProcessing && canAddMore && fileInputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled && canAddMore) setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          if (!disabled && !isProcessing && event.dataTransfer.files.length) {
            void addFiles(event.dataTransfer.files);
          }
        }}
        role="group"
        aria-label="Garment photos from different angles"
      >
        {isProcessing ? (
          <div className="dropzone-state processing-state">
            <div className="luxury-spinner"><div className="spinner-ring" /></div>
            <p className="state-text">Preparing garment views…</p>
            <p className="state-subtext">Images are resized in your browser</p>
          </div>
        ) : (
          <div className="multi-image-dropzone-content">
            {images.length > 0 && (
              <div className="multi-image-preview-grid">
                {images.map((image, index) => (
                  <div className="multi-image-preview-card" key={`${image.file.name}-${index}`}>
                    <img src={image.dataUrl} alt={`Garment view ${index + 1}`} />
                    <span className="multi-image-angle-label">View {index + 1}</span>
                    <button
                      type="button"
                      className="remove-btn multi-image-remove"
                      onClick={(event) => {
                        event.stopPropagation();
                        removeImage(index);
                      }}
                      aria-label={`Remove garment view ${index + 1}`}
                      title="Remove image"
                    >
                      <X size={14} />
                    </button>
                    <span className="multi-image-specs">
                      <CheckCircle size={12} className="text-gold" />
                      {image.width} × {image.height}px · {formatBytes(image.processedSizeBytes)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {canAddMore ? (
              <button
                type="button"
                className="multi-image-add-prompt"
                disabled={disabled || isProcessing}
                onClick={(event) => {
                  event.stopPropagation();
                  fileInputRef.current?.click();
                }}
              >
                {images.length === 0 ? <Upload size={21} /> : <Plus size={18} />}
                <span>{images.length === 0 ? 'Drop garment photos here or browse' : 'Add another angle'}</span>
                <small>JPEG, PNG, WebP · up to {MAX_GARMENT_VIEWS} views</small>
              </button>
            ) : (
              <p className="multi-image-limit-note">Maximum of {MAX_GARMENT_VIEWS} views reached</p>
            )}
          </div>
        )}
      </div>

      <p className="multi-image-helper">
        Add front, side, or back photos of the same item. We’ll generate one fitting for each photo.
      </p>

      {presets.length > 0 && (
        <div className="presets-wrapper">
          <div className="presets-header">
            <Sparkles size={12} className="text-gold" />
            <span>Or choose a studio preset:</span>
          </div>
          <div className="preset-chips">
            {presets.map((preset) => (
              <button
                key={preset.id}
                type="button"
                className={`preset-chip ${activePresetId === preset.id ? 'active' : ''}`}
                onClick={() => void selectPreset(preset)}
                disabled={disabled || isProcessing}
              >
                <span className="preset-thumb-wrap">
                  <img src={preset.url} alt={preset.name} className="preset-thumb" />
                </span>
                <span className="preset-text">
                  <span className="preset-name">{preset.name}</span>
                  <span className="preset-sub">{preset.subtitle}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {errorMessage && <p className="dropzone-error" role="alert">{errorMessage}</p>}
    </div>
  );
};
