
import React, { useRef, useEffect, useState } from 'react';
import { useImageGestures } from '../hooks/useImageGestures';

interface PhotoItemProps {
  src: string;
  onZoomChange?: (isZoomed: boolean) => void;
  disableCarousel?: boolean;
}

const PhotoItem = ({ src, onZoomChange, disableCarousel = false }: PhotoItemProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [showZoomIndicator, setShowZoomIndicator] = useState(false);
  
  const {
    transform,
    isZoomed,
    updateDimensions,
    resetTransform,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleDoubleClick
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
  }, [updateDimensions]);
  
  // Use a separate effect to reset transform when src changes to avoid dependency loops
  useEffect(() => {
    resetTransform();
  }, [src, resetTransform]);

  // Show zoom indicator temporarily when zoomed state changes
  useEffect(() => {
    if (isZoomed) {
      setShowZoomIndicator(true);
      const timer = setTimeout(() => {
        setShowZoomIndicator(false);
      }, 1500);
      return () => clearTimeout(timer);
    } else {
      setShowZoomIndicator(false);
    }
  }, [isZoomed]);

  return (
    <div 
      ref={containerRef}
      className="photo-container relative w-full h-full bg-black overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onDoubleClick={handleDoubleClick}
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
            touchAction: 'none',
            pointerEvents: 'none'
          }}
          draggable={false}
          onDragStart={(e) => e.preventDefault()}
        />
      </div>
      
      {/* Zoom indicator */}
      {showZoomIndicator && (
        <div className="absolute bottom-4 left-0 right-0 text-center text-white text-xs bg-black bg-opacity-50 py-1 px-2 mx-auto max-w-[200px] rounded-full transition-opacity duration-300">
          {transform.scale > 1 ? 'Pinch or double-tap to zoom out' : 'Pinch or double-tap to zoom in'}
        </div>
      )}
    </div>
  );
};

export default PhotoItem;
