
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
  
  // Reset transform when the component unmounts or the image changes
  useEffect(() => {
    resetTransform();
    
    // Wait for the image to load to get its natural dimensions
    if (imageRef.current && imageRef.current.complete) {
      updateDimensions();
    } else if (imageRef.current) {
      imageRef.current.onload = updateDimensions;
    }
    
    // Add resize listener to update bounds when window size changes
    const handleResize = () => {
      updateDimensions();
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [src, resetTransform, updateDimensions]);
  
  const transformStyle = `scale(${transform.scale}) translate(${transform.translateX / transform.scale}px, ${transform.translateY / transform.scale}px)`;

  return (
    <div 
      ref={containerRef}
      className="photo-container w-full h-full bg-black"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ pointerEvents: 'auto', overflow: 'hidden' }} // Ensure touch events are captured and content is clipped
    >
      <div className="w-full h-full flex items-center justify-center">
        <img
          ref={imageRef}
          src={src}
          alt="Gallery item"
          className="photo-item max-h-full max-w-full object-contain select-none"
          style={{ 
            transform: transformStyle, 
            transition: isZoomed ? 'none' : 'transform 0.3s ease-out',
            userSelect: 'none',
            WebkitUserDrag: 'none' 
          }}
          draggable={false}
          onLoad={updateDimensions}
        />
      </div>
    </div>
  );
};

export default PhotoItem;
