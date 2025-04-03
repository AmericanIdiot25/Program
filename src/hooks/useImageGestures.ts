
import { useState, useRef, useCallback } from 'react';

export interface Transform {
  scale: number;
  translateX: number;
  translateY: number;
}

export interface Dimensions {
  width: number;
  height: number;
  ratio?: number;
}

interface UseImageGesturesProps {
  onZoomChange?: (isZoomed: boolean) => void;
  disableCarousel?: boolean;
  containerRef: React.RefObject<HTMLDivElement>;
  imageRef: React.RefObject<HTMLImageElement>;
}

export const useImageGestures = ({
  onZoomChange,
  disableCarousel = false,
  containerRef,
  imageRef
}: UseImageGesturesProps) => {
  const [transform, setTransform] = useState<Transform>({ scale: 1, translateX: 0, translateY: 0 });
  const [isZoomed, setIsZoomed] = useState(false);
  const [imageDimensions, setImageDimensions] = useState<Dimensions>({ width: 0, height: 0, ratio: 1 });
  const [containerDimensions, setContainerDimensions] = useState<Dimensions>({ width: 0, height: 0 });

  // Touch gesture state tracking
  const touchStartRef = useRef({ x: 0, y: 0 });
  const lastTouchRef = useRef({ x: 0, y: 0 });
  const initialTouchDistanceRef = useRef(0);
  const initialTransformRef = useRef<Transform>({ scale: 1, translateX: 0, translateY: 0 });
  const lastTapTimeRef = useRef(0);
  const doubleTapToZoomRef = useRef(false);

  // Notify parent component when zoom state changes
  const updateZoomState = useCallback((zoomed: boolean) => {
    setIsZoomed(zoomed);
    onZoomChange?.(zoomed);
  }, [onZoomChange]);

  // Update dimensions when needed
  const updateDimensions = useCallback(() => {
    if (!imageRef.current || !containerRef.current) return;
    
    const img = imageRef.current;
    const container = containerRef.current;
    const containerRect = container.getBoundingClientRect();
    
    // Get the actual rendered dimensions of the image (not the natural dimensions)
    const imgRect = img.getBoundingClientRect();
    
    setContainerDimensions({
      width: containerRect.width,
      height: containerRect.height
    });
    
    setImageDimensions({
      width: imgRect.width,
      height: imgRect.height,
      ratio: img.naturalWidth / img.naturalHeight
    });
  }, [containerRef, imageRef]);

  const resetTransform = useCallback(() => {
    setTransform({ scale: 1, translateX: 0, translateY: 0 });
    updateZoomState(false);
  }, [updateZoomState]);

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

  // Constraint function that calculates boundaries similar to iPhone Photos app
  const constrainTransform = (transform: Transform): Transform => {
    if (!imageRef.current || !containerRef.current) return transform;
    
    const { scale, translateX, translateY } = transform;
    
    // If not zoomed in, reset to center
    if (scale <= 1) {
      return { scale: 1, translateX: 0, translateY: 0 };
    }
    
    const maxTranslateX = Math.max(0, (imageDimensions.width * scale - containerDimensions.width) / 2);
    const maxTranslateY = Math.max(0, (imageDimensions.height * scale - containerDimensions.height) / 2);
    
    return {
      scale,
      translateX: Math.max(-maxTranslateX, Math.min(maxTranslateX, translateX)),
      translateY: Math.max(-maxTranslateY, Math.min(maxTranslateY, translateY))
    };
  };

  // Handle double tap to zoom in and out
  const handleTap = (e: React.TouchEvent) => {
    const currentTime = new Date().getTime();
    const tapLength = currentTime - lastTapTimeRef.current;
    
    // Detect double tap (time between taps less than 300ms)
    if (tapLength < 300 && tapLength > 0) {
      doubleTapToZoomRef.current = true;
      
      if (transform.scale > 1) {
        // If already zoomed in, reset with animation
        resetTransform();
        console.log("Double tap to zoom out detected");
      } else {
        // Zoom in to the point that was double-tapped
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;
        
        const x = e.touches[0].clientX - rect.left;
        const y = e.touches[0].clientY - rect.top;
        
        const targetScale = 2.5;
        
        console.log("Double tap to zoom in detected");
        setTransform({
          scale: targetScale,
          translateX: (containerDimensions.width / 2 - x) * (targetScale / 2),
          translateY: (containerDimensions.height / 2 - y) * (targetScale / 2)
        });
        updateZoomState(true);
      }
      
      // Reset tap time reference
      lastTapTimeRef.current = 0;
    } else {
      // This is a single tap
      lastTapTimeRef.current = currentTime;
      doubleTapToZoomRef.current = false;
    }
  };

  // Handle touch start
  const handleTouchStart = (e: React.TouchEvent) => {
    // When carousel is disabled (image is zoomed), make sure all touch events are captured here
    if (disableCarousel || isZoomed) {
      e.stopPropagation();
    }
    
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
        updateZoomState(true);
      }
      
      // Store the center point for reference
      const center = getTouchCenter(e.touches);
      lastTouchRef.current = { x: center.x, y: center.y };
    }
  };

  // Handle touch move
  const handleTouchMove = (e: React.TouchEvent) => {
    // Don't handle touch move for double taps
    if (doubleTapToZoomRef.current) {
      return;
    }

    // Stop propagation when carousel should be disabled
    if (disableCarousel || isZoomed) {
      e.stopPropagation();
    }
    
    if (e.touches.length === 1 && transform.scale > 1) {
      // Handle panning when zoomed in
      e.preventDefault(); // Prevent scrolling
      
      const dx = e.touches[0].clientX - lastTouchRef.current.x;
      const dy = e.touches[0].clientY - lastTouchRef.current.y;
      
      lastTouchRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      };
      
      // Calculate new position with constraints
      setTransform(prev => {
        const newTranslateX = prev.translateX + dx;
        const newTranslateY = prev.translateY + dy;
        
        return constrainTransform({
          scale: prev.scale,
          translateX: newTranslateX,
          translateY: newTranslateY
        });
      });
    } 
    else if (e.touches.length === 2) {
      // Handle pinch zoom
      e.preventDefault(); // Prevent scrolling/default gestures
      
      // Calculate new scale based on finger distance
      const currentDistance = getTouchDistance(e.touches);
      
      // Only proceed if we have a valid initial distance
      if (initialTouchDistanceRef.current > 0 && currentDistance > 0) {
        const pinchScale = currentDistance / initialTouchDistanceRef.current;
        
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
        
        const newScale = Math.max(1, Math.min(4, initialTransformRef.current.scale * pinchScale));
        const scaleFactor = newScale / initialTransformRef.current.scale;
        
        // Calculate new position by scaling from the pinch center
        const dx = (touchX - containerCenterX);
        const dy = (touchY - containerCenterY);
        
        const newTranslateX = initialTransformRef.current.translateX + dx * (1 - scaleFactor);
        const newTranslateY = initialTransformRef.current.translateY + dy * (1 - scaleFactor);
        
        const newTransform = constrainTransform({
          scale: newScale,
          translateX: newTranslateX,
          translateY: newTranslateY
        });
        
        setTransform(newTransform);
        updateZoomState(newScale > 1);
      }
    }
  };

  // Handle touch end
  const handleTouchEnd = (e: React.TouchEvent) => {
    // Reset double tap flag after touch end
    setTimeout(() => {
      doubleTapToZoomRef.current = false;
    }, 10);
    
    // Stop propagation when carousel should be disabled
    if (disableCarousel || isZoomed) {
      e.stopPropagation();
    }
    
    // Update initial state for next gesture
    initialTouchDistanceRef.current = 0;
    
    if (transform.scale <= 1) {
      // Reset when zoomed all the way out
      resetTransform();
    } else if (transform.scale < 1.1) {
      // Snap back to scale 1 if very close to it
      resetTransform();
    } else {
      // Apply constraints to ensure image stays within bounds
      setTransform(prev => constrainTransform(prev));
    }
  };

  return {
    transform: constrainTransform(transform),
    isZoomed,
    updateDimensions,
    resetTransform,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd
  };
};
