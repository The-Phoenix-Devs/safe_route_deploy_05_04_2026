import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  fallback?: string;
  className?: string;
  placeholder?: React.ReactNode;
  rootMargin?: string;
  threshold?: number;
}

export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  fallback = '/placeholder.svg',
  className,
  placeholder,
  rootMargin = '50px',
  threshold = 0.1,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin,
        threshold,
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [rootMargin, threshold]);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    setHasError(true);
    setIsLoaded(true);
  };

  const imageSrc = hasError ? fallback : src;
  const shouldLoad = isInView || isLoaded;

  return (
    <div
      ref={imgRef}
      className={cn(
        'relative overflow-hidden bg-muted',
        className
      )}
    >
      {/* Placeholder */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          {placeholder || (
            <div className="animate-pulse bg-muted-foreground/20 w-full h-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-muted-foreground/40"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          )}
        </div>
      )}

      {/* Actual Image */}
      {shouldLoad && (
        <img
          src={imageSrc}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            'w-full h-full object-cover transition-opacity duration-300',
            isLoaded ? 'opacity-100' : 'opacity-0'
          )}
          {...props}
        />
      )}

      {/* Loading shimmer effect */}
      {!isLoaded && (
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      )}
    </div>
  );
};

// Hook for preloading images
export const useImagePreloader = (imageUrls: string[]) => {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);

  const preloadImages = async () => {
    setIsLoading(true);
    
    const loadPromises = imageUrls.map(url => {
      return new Promise<string>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(url);
        img.onerror = () => reject(url);
        img.src = url;
      });
    });

    try {
      const loaded = await Promise.allSettled(loadPromises);
      const successfulUrls = loaded
        .filter((result): result is PromiseFulfilledResult<string> => 
          result.status === 'fulfilled'
        )
        .map(result => result.value);
      
      setLoadedImages(new Set(successfulUrls));
    } catch (error) {
      console.error('Image preloading failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    preloadImages,
    loadedImages,
    isLoading,
    isImageLoaded: (url: string) => loadedImages.has(url)
  };
};