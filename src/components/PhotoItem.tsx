
import React, { useState, useRef, useEffect } from 'react';

interface PhotoItemProps {
  src: string;
  onZoomChange?: (isZoomed: boolean) => void;
}

interface Transform {
  scale: number;
  translateX: number;
  translateY: number;
}

const PhotoItem = ({ src, onZoomChange }: PhotoItemProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [transform, setTransform] = useState<Transform>({ scale: 1, translateX: 0, translateY: 0 });
  const [isZoomed, setIsZoomed] = useState(false);
  
  // Touch gesture state tracking
  const touchStartRef = useRef({ x: 0, y: 0 });
  const lastTouchRef = useRef({ x: 0, y: 0 });
  const initialTouchDistanceRef = useRef(0);
  const initialTransformRef = useRef<Transform>({ scale: 1, translateX: 0, translateY: 0 });
  const lastTapTimeRef = useRef(0);
  
  // Reset transform when the component unmounts or the image changes
  useEffect(() => {
    resetTransform();
  }, [src]);
  
  // Notify parent component when zoom state changes
  useEffect(() => {
    onZoomChange?.(isZoomed);
  }, [isZoomed, onZoomChange]);

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
  const handleTap = (e: React.TouchEvent) => {
    e.preventDefault();
    
    const currentTime = new Date().getTime();
    const tapLength = currentTime - lastTapTimeRef.current;
    
    // Detect double tap (time between taps less than 300ms)
    if (tapLength < 300 && tapLength > 0) {
      if (transform.scale > 1) {
        // If already zoomed in, reset
        resetTransform();
      } else {
        // Zoom in to the point that was double-tapped
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;
        
        const x = e.touches[0].clientX - rect.left;
        const y = e.touches[0].clientY - rect.top;
        
        const targetScale = 2.5;
        
        setTransform({
          scale: targetScale,
          translateX: (rect.width / 2 - x) * targetScale / 2,
          translateY: (rect.height / 2 - y) * targetScale / 2
        });
        setIsZoomed(true);
      }
      
      // Reset tap time reference
      lastTapTimeRef.current = 0;
    } else {
      // This is a single tap
      lastTapTimeRef.current = currentTime;
    }
  };

  // Handle touch start
  const handleTouchStart = (e: React.TouchEvent) => {
    // Store the current touch position
    if (e.touches.length === 1) {
      // Single touch - prepare for panning
      touchStartRef.current = { 
        x: e.touches[0].clientX, 
        y: e.touches[0].clientY 
      };
      lastTouchRef.current = { 
        x: e.touches[0].clientX, 
        y: e.touches[0].clientY 
      };
      initialTransformRef.current = { ...transform };
      
      // Handle tap/double tap
      handleTap(e);
    } 
    else if (e.touches.length === 2) {
      // Prevent default behavior for pinch gestures
      e.preventDefault();
      
      // Store initial touch distance and positions for pinch zoom
      initialTouchDistanceRef.current = getTouchDistance(e.touches);
      initialTransformRef.current = { ...transform };
      
      // Update the zoom state
      if (transform.scale > 1 || initialTouchDistanceRef.current > 0) {
        setIsZoomed(true);
      }
      
      // Store the center point for reference
      const center = getTouchCenter(e.touches);
      lastTouchRef.current = { x: center.x, y: center.y };
    }
  };

  // Handle touch move
  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && transform.scale > 1) {
      // Handle panning when zoomed in
      e.preventDefault(); // Prevent scrolling
      
      const dx = e.touches[0].clientX - lastTouchRef.current.x;
      const dy = e.touches[0].clientY - lastTouchRef.current.y;
      
      lastTouchRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      };
      
      setTransform(prev => ({
        scale: prev.scale,
        translateX: prev.translateX + dx,
        translateY: prev.translateY + dy
      }));
    } 
    else if (e.touches.length === 2) {
      // Handle pinch zoom
      e.preventDefault(); // Prevent scrolling/default gestures
      
      // Calculate new scale based on finger distance
      const currentDistance = getTouchDistance(e.touches);
      const pinchScale = currentDistance / initialTouchDistanceRef.current;
      
      if (initialTouchDistanceRef.current > 0 && pinchScale !== 1) {
        // Get container dimensions
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;
        
        // Get the center point between the two fingers
        const center = getTouchCenter(e.touches);
        
        // Calculate the touch center relative to the container
        const touchX = center.x - rect.left;
        const touchY = center.y - rect.top;
        
        // Calculate how much to translate based on the pinch center
        const containerCenterX = rect.width / 2;
        const containerCenterY = rect.height / 2;
        
        const newScale = Math.max(1, Math.min(5, initialTransformRef.current.scale * pinchScale));
        const scaleFactor = newScale / initialTransformRef.current.scale;
        
        // Calculate new position by scaling from the pinch center
        const dx = (touchX - containerCenterX);
        const dy = (touchY - containerCenterY);
        
        const newTranslateX = initialTransformRef.current.translateX + dx * (1 - scaleFactor);
        const newTranslateY = initialTransformRef.current.translateY + dy * (1 - scaleFactor);
        
        setTransform({
          scale: newScale,
          translateX: newTranslateX,
          translateY: newTranslateY
        });
        
        setIsZoomed(newScale > 1);
      }
    }
  };

  // Handle touch end
  const handleTouchEnd = (e: React.TouchEvent) => {
    // Update initial state for next gesture
    initialTouchDistanceRef.current = 0;
    
    if (transform.scale <= 1) {
      // Reset when zoomed all the way out
      resetTransform();
    }
  };

  // Apply limits to the transform to keep image within bounds when zoomed
  const constrainedTransform = () => {
    if (!imageRef.current || !containerRef.current) return transform;
    
    const { scale, translateX, translateY } = transform;
    const container = containerRef.current.getBoundingClientRect();
    const image = imageRef.current.getBoundingClientRect();
    
    if (scale <= 1) {
      return { scale, translateX: 0, translateY: 0 };
    }
    
    // Calculate constraints based on scale
    const scaledWidth = image.width * scale;
    const scaledHeight = image.height * scale;
    
    const maxTranslateX = Math.max(0, (scaledWidth - container.width) / 2);
    const maxTranslateY = Math.max(0, (scaledHeight - container.height) / 2);
    
    return {
      scale,
      translateX: Math.max(-maxTranslateX, Math.min(maxTranslateX, translateX)),
      translateY: Math.max(-maxTranslateY, Math.min(maxTranslateY, translateY))
    };
  };
  
  const { scale, translateX, translateY } = constrainedTransform();
  const transformStyle = `scale(${scale}) translate(${translateX / scale}px, ${translateY / scale}px)`;

  return (
    <div 
      ref={containerRef}
      className="photo-container w-full h-full bg-black"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="w-full h-full flex items-center justify-center">
        <img
          ref={imageRef}
          src={src}
          alt="Gallery item"
          className="photo-item max-h-full max-w-full object-contain"
          style={{ transform: transformStyle, transition: isZoomed ? 'none' : 'transform 0.2s ease' }}
          draggable={false}
        />
      </div>
    </div>
  );
};

export default PhotoItem;
