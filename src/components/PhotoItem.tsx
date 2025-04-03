
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

  // Handle initial image setup and window resize
  useEffect(() => {
    const img = imageRef.current;
    
    const handleImageSetup = () => {
      if (img && img.complete) {
        updateDimensions();
      }
    };
    
    // Set up image load handler
    if (img) {
      img.onload = handleImageSetup;
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
  }, [src, updateDimensions]);
  
  // Separate effect to reset transform when src changes to avoid loops
  useEffect(() => {
    if (resetTransform) {
      resetTransform();
    }
  }, [src, resetTransform]); // Include resetTransform as it's now stable due to useCallback

  return (
    <div 
      ref={containerRef}
      className="photo-container relative w-full h-full bg-black overflow-hidden"
      onTouchStart={(e) => {
        // Always prevent default for touch events in our container
        e.preventDefault();
        if (isZoomed) {
          e.stopPropagation(); // Completely stop event bubbling when zoomed
        }
        handleTouchStart(e);
      }}
      onTouchMove={(e) => {
        e.preventDefault();
        if (isZoomed) {
          e.stopPropagation(); // Completely stop event bubbling when zoomed
        }
        handleTouchMove(e);
      }}
      onTouchEnd={(e) => {
        e.preventDefault();
        if (isZoomed) {
          e.stopPropagation(); // Completely stop event bubbling when zoomed
        }
        handleTouchEnd(e);
      }}
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
            WebkitUserDrag: 'none',
            touchAction: 'none' // Disable browser handling of all touch gestures
          }}
          draggable={false}
          onDragStart={(e) => e.preventDefault()} // Extra precaution against dragging
        />
      </div>
    </div>
  );
};

export default PhotoItem;
