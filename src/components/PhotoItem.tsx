import React, { useState, useRef, useEffect } from 'react';

interface PhotoItemProps {
  src: string;
}

interface Transform {
  scale: number;
  translateX: number;
  translateY: number;
}

const PhotoItem = ({ src }: PhotoItemProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [transform, setTransform] = useState<Transform>({ scale: 1, translateX: 0, translateY: 0 });
  const [isZoomed, setIsZoomed] = useState(false);
  
  // Touch gesture state tracking
  const touchStartRef = useRef({ x: 0, y: 0 });
  const initialTouchDistanceRef = useRef(0);
  const initialTransformRef = useRef<Transform>({ scale: 1, translateX: 0, translateY: 0 });
  
  // Reset transform when the component unmounts or the image changes
  useEffect(() => {
    resetTransform();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  const resetTransform = () => {
    setTransform({ scale: 1, translateX: 0, translateY: 0 });
    setIsZoomed(false);
  };

  // Calculate distance between two touch points
  const getTouchDistance = (touches: React.TouchList): number => {
    if (touches.length < 2) return 0;
    
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Get center point between touches
  const getTouchCenter = (touches: React.TouchList): { x: number, y: number } => {
    if (touches.length < 2) {
      return { x: touches[0].clientX, y: touches[0].clientY };
    }
    
    return {
      x: (touches[0].clientX + touches[1].clientX) / 2,
      y: (touches[0].clientY + touches[1].clientY) / 2
    };
  };

  // Handle double tap to zoom in and out
  const handleDoubleTap = (e: React.TouchEvent) => {
    e.preventDefault();
    
    if (transform.scale > 1) {
      // If already zoomed in, reset
      resetTransform();
    } else {
      // Zoom in to the point that was double-tapped
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      
      const x = e.touches[0].clientX - rect.left;
      const y = e.touches[0].clientY - rect.top;
      
      // Calculate the point to zoom to (in the image's coordinate space)
      const containerWidth = rect.width;
      const containerHeight = rect.height;
      
      const targetScale = 2.5;
      const translateX = (containerWidth / 2 - x) * targetScale;
      const translateY = (containerHeight / 2 - y) * targetScale;
      
      setTransform({
        scale: targetScale,
        translateX,
        translateY
      });
      setIsZoomed(true);
    }
  };

  // Handle touch start
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      // Single touch - prepare for panning
      touchStartRef.current = { 
        x: e.touches[0].clientX, 
        y: e.touches[0].clientY 
      };
      initialTransformRef.current = { ...transform };
    } 
    else if (e.touches.length === 2) {
      // Pinch gesture - prepare for zooming
      initialTouchDistanceRef.current = getTouchDistance(e.touches);
      initialTransformRef.current = { ...transform };
    }
  };

  // Handle touch move
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isZoomed && transform.scale === 1) {
      // Don't prevent default scrolling when not zoomed
      return;
    }
    
    e.preventDefault(); // Prevent scrolling when zoomed
    
    if (e.touches.length === 1 && transform.scale > 1) {
      // Handle panning when zoomed in
      const dx = e.touches[0].clientX - touchStartRef.current.x;
      const dy = e.touches[0].clientY - touchStartRef.current.y;
      
      setTransform({
        scale: transform.scale,
        translateX: initialTransformRef.current.translateX + dx,
        translateY: initialTransformRef.current.translateY + dy
      });
    } 
    else if (e.touches.length === 2) {
      // Handle pinch zoom
      const currentDistance = getTouchDistance(e.touches);
      const center = getTouchCenter(e.touches);
      
      if (initialTouchDistanceRef.current > 0) {
        // Calculate new scale based on finger distance
        const scaleFactor = currentDistance / initialTouchDistanceRef.current;
        const newScale = Math.max(0.5, Math.min(5, initialTransformRef.current.scale * scaleFactor));
        
        // Get container dimensions
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;
        
        // Calculate the touch center relative to the container
        const touchX = center.x - rect.left;
        const touchY = center.y - rect.top;
        
        // Apply the transform
        setTransform({
          scale: newScale,
          translateX: initialTransformRef.current.translateX,
          translateY: initialTransformRef.current.translateY
        });
        
        setIsZoomed(newScale > 1);
      }
    }
  };

  // Handle touch end
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (transform.scale <= 1) {
      // Reset when zoomed out
      resetTransform();
    }
  };

  // Apply limits to the transform to keep image within bounds when zoomed
  const constrainedTransform = () => {
    if (!imageRef.current || !containerRef.current) return transform;
    
    const { scale, translateX, translateY } = transform;
    const container = containerRef.current.getBoundingClientRect();
    const image = imageRef.current.getBoundingClientRect();
    
    const maxTranslateX = (scale - 1) * (container.width / 2);
    const maxTranslateY = (scale - 1) * (container.height / 2);
    
    return {
      scale,
      translateX: Math.max(-maxTranslateX, Math.min(maxTranslateX, translateX)),
      translateY: Math.max(-maxTranslateY, Math.min(maxTranslateY, translateY))
    };
  };
  
  const { scale, translateX, translateY } = constrainedTransform();
  const transformStyle = `scale(${scale}) translateX(${translateX / scale}px) translateY(${translateY / scale}px)`;

  return (
    <div 
      ref={containerRef}
      className="photo-container bg-gallery-background"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onDoubleClick={() => resetTransform()}
    >
      <div 
        className="w-full h-full flex items-center justify-center"
        onTouchStart={(e) => {
          if (e.touches.length === 2) e.preventDefault();
        }}
      >
        <img
          ref={imageRef}
          src={src}
          alt="Gallery item"
          className="photo-item max-h-full max-w-full object-contain"
          style={{ transform: transformStyle }}
          onDoubleClick={(e) => {
            e.stopPropagation();
            handleDoubleTap(e as unknown as React.TouchEvent);
          }}
          draggable={false}
        />
      </div>
    </div>
  );
};

export default PhotoItem;
