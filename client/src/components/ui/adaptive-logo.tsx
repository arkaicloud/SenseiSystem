import React, { useState, useRef, useEffect } from 'react';
import { Award } from 'lucide-react';

interface AdaptiveLogoProps {
  src?: string;
  fallbackSrc?: string;
  alt: string;
  className?: string;
  containerClassName?: string;
  fallbackIcon?: React.ReactNode;
  onError?: () => void;
}

export const AdaptiveLogo: React.FC<AdaptiveLogoProps> = ({
  src,
  fallbackSrc,
  alt,
  className = "",
  containerClassName = "",
  fallbackIcon,
  onError
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<'horizontal' | 'square' | 'vertical'>('square');
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (src && imgRef.current) {
      const img = new Image();
      img.onload = () => {
        const ratio = img.width / img.height;
        if (ratio > 1.3) {
          setAspectRatio('horizontal');
        } else if (ratio < 0.8) {
          setAspectRatio('vertical');
        } else {
          setAspectRatio('square');
        }
        setImageLoaded(true);
      };
      img.onerror = () => {
        setImageError(true);
        onError?.();
      };
      img.src = src;
    }
  }, [src, onError]);

  const getAdaptiveClasses = () => {
    switch (aspectRatio) {
      case 'horizontal':
        return 'h-10 w-auto max-w-[160px]';
      case 'vertical':
        return 'w-10 h-auto max-h-[40px]';
      case 'square':
      default:
        return 'h-10 w-10';
    }
  };

  if (imageError || (!src && !fallbackSrc)) {
    return (
      <div className={`${containerClassName} flex items-center justify-center`}>
        {fallbackIcon || (
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-sm">
            <Award className="w-5 h-5 text-white" />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`${containerClassName} flex items-center justify-center`}>
      <img
        ref={imgRef}
        src={src || fallbackSrc}
        alt={alt}
        className={`${getAdaptiveClasses()} object-contain ${className}`}
        onError={() => {
          setImageError(true);
          onError?.();
        }}
      />
    </div>
  );
};

export default AdaptiveLogo;