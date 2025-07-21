
import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/context/TranslationContext';

interface ImageCropperProps {
  imageSrc: string;
  onCropComplete: (croppedImageBlob: Blob) => void;
  onCancel: () => void;
}

const ImageCropper: React.FC<ImageCropperProps> = ({ imageSrc, onCropComplete, onCancel }) => {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [cropArea, setCropArea] = useState({ x: 50, y: 50, size: 200 });
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });

  const handleImageLoad = useCallback(() => {
    if (imageRef.current) {
      const { naturalWidth, naturalHeight } = imageRef.current;
      setImageSize({ width: naturalWidth, height: naturalHeight });
      
      // Set initial crop area to center of image
      const displayWidth = imageRef.current.clientWidth;
      const displayHeight = imageRef.current.clientHeight;
      const minSize = Math.min(displayWidth, displayHeight) * 0.6;
      
      setCropArea({
        x: (displayWidth - minSize) / 2,
        y: (displayHeight - minSize) / 2,
        size: minSize
      });
    }
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    e.preventDefault();
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !imageRef.current) return;

    const rect = imageRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - cropArea.size / 2;
    const y = e.clientY - rect.top - cropArea.size / 2;

    setCropArea(prev => ({
      ...prev,
      x: Math.max(0, Math.min(x, rect.width - prev.size)),
      y: Math.max(0, Math.min(y, rect.height - prev.size))
    }));
  }, [isDragging, cropArea.size]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleCrop = useCallback(async () => {
    if (!imageRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = imageRef.current;

    if (!ctx) return;

    // Set canvas size for profile picture (e.g., 200x200)
    canvas.width = 200;
    canvas.height = 200;

    // Calculate scale factors
    const scaleX = imageSize.width / img.clientWidth;
    const scaleY = imageSize.height / img.clientHeight;

    // Calculate source rectangle
    const sourceX = cropArea.x * scaleX;
    const sourceY = cropArea.y * scaleY;
    const sourceSize = cropArea.size * Math.min(scaleX, scaleY);

    // Draw cropped image
    ctx.drawImage(
      img,
      sourceX, sourceY, sourceSize, sourceSize,
      0, 0, canvas.width, canvas.height
    );

    // Convert to blob
    canvas.toBlob((blob) => {
      if (blob) {
        onCropComplete(blob);
      }
    }, 'image/jpeg', 0.9);
  }, [cropArea, imageSize, onCropComplete]);

  return (
    <div className="space-y-4">
      <div className="relative inline-block">
        <img
          ref={imageRef}
          src={imageSrc}
          alt="Crop preview"
          onLoad={handleImageLoad}
          className="max-w-full max-h-96 object-contain"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
        
        {/* Crop overlay - transparent with border */}
        <div
          className="absolute border-2 border-gray-600 bg-transparent cursor-move"
          style={{
            left: cropArea.x,
            top: cropArea.y,
            width: cropArea.size,
            height: cropArea.size,
          }}
          onMouseDown={handleMouseDown}
        >
          <div className="absolute inset-0 border border-white border-dashed" />
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />

      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onCancel}>
          {t('common.cancel')}
        </Button>
        <Button onClick={handleCrop} className="bg-polygon-purple hover:bg-polygon-darkpurple">
          {t('profile.uploadPicture')}
        </Button>
      </div>
    </div>
  );
};

export default ImageCropper;
