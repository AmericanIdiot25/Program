
import React, { useRef, useEffect } from 'react';
import { useImageGestures } from '../hooks/useImageGestures';

interface PhotoItemProps {
  src: string;
  onZoomChange?: (isZoomed: boolean) => void;
  disableCarousel?: boolean;
}

const PhotoItem = ({ src, onZoomChange, disableCarousel = false }: PhotoItemProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  
  const {
    transform,
    isZoomed,
    updateDimensions,
    resetTransform,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd
  } = useImageGestures({
    onZoomChange,
    disableCarousel,
    containerRef,
    imageRef
  });

  useEffect(() => {
    // Create a reference to the current image to avoid stale closures
    const img = imageRef.current;
    
    // Handle initial setup when src changes
    const handleImageSetup = () => {
      if (img && img.complete) {
        updateDimensions();
      }
    };
    
    // Reset transform when source changes
    if (resetTransform) {
      resetTransform();
    }
    
    // Set up image load handler
    if (img) {
      img.onload = handleImageSetup;
      
      // If image is already loaded, update dimensions immediately
      if (img.complete) {
        handleImageSetup();
      }
    }
    
    // Update dimensions on window resize
    window.addEventListener('resize', updateDimensions);
    
    // Cleanup
    return () => {
      if (img) {
        img.onload = null;
      }
      window.removeEventListener('resize', updateDimensions);
    };
  }, [src, updateDimensions]); // Intentionally omitting resetTransform to prevent infinite loop

  return (
    <div 
      ref={containerRef}
      className="photo-container w-full h-full bg-black"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ pointerEvents: 'auto', overflow: 'hidden' }}
    >
      <div className="w-full h-full flex items-center justify-center">
        <img
          ref={imageRef}
          src={src}
          alt="Gallery item"
          className="photo-item max-h-full max-w-full object-contain select-none"
          style={{ 
            transform: `scale(${transform.scale}) translate(${transform.translateX / transform.scale}px, ${transform.translateY / transform.scale}px)`,
            transition: isZoomed ? 'none' : 'transform 0.3s ease-out',
            userSelect: 'none',
            WebkitUserDrag: 'none'
          }}
          draggable={false}
        />
      </div>
    </div>
  );
};

export default PhotoItem;
