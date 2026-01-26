import { useState, useRef, useEffect } from "react";
import { categoryFallbacks } from "../../data/locationImages";

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  category?: string;
  priority?: boolean;
}

const OptimizedImage = ({
  src,
  alt,
  className = "",
  category,
  priority = false,
}: OptimizedImageProps) => {
  const [imageSrc, setImageSrc] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (priority) {
      // Load immediately for priority images
      setImageSrc(src);
    } else {
      // Lazy load for non-priority images
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            setImageSrc(src);
            observer.disconnect();
          }
        },
        { threshold: 0.1 },
      );

      if (imgRef.current) {
        observer.observe(imgRef.current);
      }

      return () => observer.disconnect();
    }
  }, [src, priority]);

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setHasError(true);
    setIsLoading(false);
    // Use category fallback if available
    if (category && categoryFallbacks[category]) {
      setImageSrc(categoryFallbacks[category]);
      setHasError(false);
      setIsLoading(true);
    }
  };

  return (
    <div ref={imgRef} className={`relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-muted animate-pulse rounded-lg flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {imageSrc && (
        <img
          src={imageSrc}
          alt={alt}
          className={`${className} ${isLoading ? "opacity-0" : "opacity-100"} transition-opacity duration-300`}
          onLoad={handleLoad}
          onError={handleError}
          loading={priority ? "eager" : "lazy"}
        />
      )}

      {hasError && !category && (
        <div
          className={`${className} bg-muted rounded-lg flex items-center justify-center`}
        >
          <div className="text-muted-foreground text-sm">Image unavailable</div>
        </div>
      )}
    </div>
  );
};

export default OptimizedImage;
