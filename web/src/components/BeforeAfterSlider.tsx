import React, { useState, useRef, useCallback, useEffect } from 'react';
import { ChevronsLeftRight, Sparkles } from 'lucide-react';

interface BeforeAfterSliderProps {
  beforeImage: string;
  afterImage: string;
  beforeLabel?: string;
  afterLabel?: string;
}

export const BeforeAfterSlider: React.FC<BeforeAfterSliderProps> = ({
  beforeImage,
  afterImage,
  beforeLabel = 'Original Photo',
  afterLabel = 'AI Haute Couture Result',
}) => {
  const [sliderPosition, setSliderPosition] = useState<number>(50);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  }, []);

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!isDragging) return;
      handleMove(e.touches[0].clientX);
    },
    [isDragging, handleMove]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;
      handleMove(e.clientX);
    },
    [isDragging, handleMove]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      setSliderPosition((prev) => Math.max(0, prev - 5));
    } else if (e.key === 'ArrowRight') {
      setSliderPosition((prev) => Math.min(100, prev + 5));
    }
  };

  return (
    <div
      ref={containerRef}
      className={`slider-container ${isDragging ? 'dragging' : ''}`}
      onMouseDown={() => setIsDragging(true)}
      onTouchStart={() => setIsDragging(true)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="slider"
      aria-valuenow={Math.round(sliderPosition)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Before and after try-on comparison slider"
    >
      {/* Background (After / Try-on Result Image) */}
      <img
        src={afterImage}
        alt={afterLabel}
        className="slider-image after-image"
        draggable={false}
      />

      {/* Foreground (Before / Original Image, clipped) */}
      <div
        className="slider-clip-layer"
        style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
      >
        <img
          src={beforeImage}
          alt={beforeLabel}
          className="slider-image before-image"
          draggable={false}
        />
      </div>

      {/* Splitter Line and Handle */}
      <div
        className="slider-divider-line"
        style={{ left: `${sliderPosition}%` }}
      >
        <div className="slider-handle">
          <ChevronsLeftRight size={16} className="slider-handle-icon" />
        </div>
      </div>

      {/* Floating Badges */}
      <div className="slider-badge slider-badge-before">
        <span>{beforeLabel}</span>
      </div>
      <div className="slider-badge slider-badge-after">
        <Sparkles size={12} className="text-gold" />
        <span>{afterLabel}</span>
      </div>
    </div>
  );
};
