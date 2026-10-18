import React from 'react';
import { AlignLeft, ImagePlus, Link2 } from 'lucide-react';
import type { StudioPreset } from './UploadDropzone';
import { MultiImageDropzone } from './MultiImageDropzone';
import type { ProcessedImage } from '../lib/image-processor';

export type GarmentSourceMode = 'image' | 'link' | 'description';

interface GarmentSourcePanelProps {
  mode: GarmentSourceMode;
  onModeChange: (mode: GarmentSourceMode) => void;
  images: ProcessedImage[];
  onImagesChange: (images: ProcessedImage[]) => void;
  productUrl: string;
  onProductUrlChange: (url: string) => void;
  description: string;
  onDescriptionChange: (description: string) => void;
  presets: StudioPreset[];
  onPresetSelect: (preset: StudioPreset) => void;
  disabled?: boolean;
}

const SOURCE_OPTIONS: Array<{
  id: GarmentSourceMode;
  title: string;
  detail: string;
  Icon: typeof ImagePlus;
}> = [
  { id: 'image', title: 'Upload photos', detail: 'Up to 3 garment angles', Icon: ImagePlus },
  { id: 'link', title: 'Product link', detail: 'Paste a product URL', Icon: Link2 },
  { id: 'description', title: 'Describe it', detail: 'Write a few details', Icon: AlignLeft },
];

export const GarmentSourcePanel: React.FC<GarmentSourcePanelProps> = ({
  mode,
  onModeChange,
  images,
  onImagesChange,
  productUrl,
  onProductUrlChange,
  description,
  onDescriptionChange,
  presets,
  onPresetSelect,
  disabled = false,
}) => {
  return (
    <section className="garment-source-panel" aria-labelledby="garment-source-title">
      <div className="garment-source-header">
        <div className="upload-card-header">
          <div className="header-info">
            <h3 id="garment-source-title" className="card-title">Garment Item</h3>
            <p className="card-subtitle">
              Upload garment photos, paste a product link, or describe the item.
            </p>
          </div>
          <span className="pill-badge">STEP 02</span>
        </div>

        <div className="garment-source-options" role="group" aria-label="Choose garment source">
          {SOURCE_OPTIONS.map(({ id, title, detail, Icon }) => (
            <button
              key={id}
              type="button"
              className={`garment-source-option ${mode === id ? 'active' : ''}`}
              onClick={() => onModeChange(id)}
              disabled={disabled}
              aria-pressed={mode === id}
            >
              <Icon size={17} aria-hidden="true" />
              <span className="garment-source-option-copy">
                <span className="garment-source-option-title">{title}</span>
                <span className="garment-source-option-detail">{detail}</span>
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="garment-source-content">
        {mode === 'image' && (
          <MultiImageDropzone
            images={images}
            onImagesChange={onImagesChange}
            disabled={disabled}
            presets={presets}
            onPresetSelect={onPresetSelect}
          />
        )}

        {mode === 'link' && (
          <div className="garment-detail-card garment-source-field-card">
            <label htmlFor="garment-product-url" className="input-label">
              <Link2 size={14} className="text-gold" />
              <span>Product page link</span>
            </label>
            <input
              id="garment-product-url"
              type="url"
              className="text-input"
              placeholder="https://store.example.com/products/…"
              value={productUrl}
              onChange={(event) => onProductUrlChange(event.target.value)}
              disabled={disabled}
              maxLength={2048}
              autoComplete="url"
            />
            <p className="garment-source-helper">
              Paste the public page for the item you want to try on.
            </p>
            <p className="garment-source-capability-note">
              Product-link fitting needs server support that is not connected yet.
            </p>
          </div>
        )}

        {mode === 'description' && (
          <div className="garment-detail-card garment-source-field-card">
            <label htmlFor="garment-description-input" className="input-label">
              <AlignLeft size={14} className="text-gold" />
              <span>Describe the garment</span>
            </label>
            <textarea
              id="garment-description-input"
              className="text-input garment-description-textarea"
              placeholder="For example: a cropped black leather jacket with silver zippers and a wide collar"
              value={description}
              onChange={(event) => onDescriptionChange(event.target.value)}
              disabled={disabled}
              maxLength={300}
              rows={4}
            />
            <p className="garment-source-helper">
              Include the type, color, fit, material, and details you care about.
            </p>
            <p className="garment-source-capability-note">
              Description-only fitting needs image-generation support that is not connected yet.
            </p>
          </div>
        )}
      </div>
    </section>
  );
};
