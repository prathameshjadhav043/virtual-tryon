/**
 * Client-side image processor for Virtual Try-On.
 * Resizes images down to a maximum dimension (default: 1024px)
 * preserving aspect ratio using HTML5 Canvas.
 */

export interface ProcessedImage {
  file: File;
  blob: Blob;
  dataUrl: string;
  originalWidth: number;
  originalHeight: number;
  width: number;
  height: number;
  originalSizeBytes: number;
  processedSizeBytes: number;
}

/**
 * Resizes an image file to fit within maxDimension (width or height <= maxDimension)
 * while maintaining aspect ratio and exporting as high-quality WebP or JPEG.
 */
export async function resizeImageToMaxDimension(
  file: File,
  maxDimension: number = 1024,
  quality: number = 0.92
): Promise<ProcessedImage> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error('Failed to read image file'));

    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to decode image'));

      img.onload = () => {
        const originalWidth = img.naturalWidth || img.width;
        const originalHeight = img.naturalHeight || img.height;

        let targetWidth = originalWidth;
        let targetHeight = originalHeight;

        // Downscale only if larger than maxDimension
        if (originalWidth > maxDimension || originalHeight > maxDimension) {
          if (originalWidth >= originalHeight) {
            targetWidth = maxDimension;
            targetHeight = Math.round((originalHeight * maxDimension) / originalWidth);
          } else {
            targetHeight = maxDimension;
            targetWidth = Math.round((originalWidth * maxDimension) / originalHeight);
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;

        const ctx = canvas.getContext('2d', { alpha: false });
        if (!ctx) {
          reject(new Error('Could not get 2D canvas context'));
          return;
        }

        // Use high quality image smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Draw image onto canvas
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

        // Export as WebP if supported, fallback to JPEG
        const outputMimeType = 'image/jpeg';
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to compress image on canvas'));
              return;
            }

            const processedFile = new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), {
              type: outputMimeType,
              lastModified: Date.now(),
            });

            const dataUrl = canvas.toDataURL(outputMimeType, quality);

            resolve({
              file: processedFile,
              blob,
              dataUrl,
              originalWidth,
              originalHeight,
              width: targetWidth,
              height: targetHeight,
              originalSizeBytes: file.size,
              processedSizeBytes: blob.size,
            });
          },
          outputMimeType,
          quality
        );
      };

      img.src = reader.result as string;
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Format bytes into human readable format (e.g. 1.2 MB, 340 KB)
 */
export function formatBytes(bytes: number, decimals: number = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}
