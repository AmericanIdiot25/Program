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
  const lastPinchCenterRef = useRef({ x: 0, y: 0 });
  const touchMoveCountRef = useRef(0);
  const isTouchActiveRef = useRef(false);

  // Constants
  const MIN_SCALE = 1;
  const MAX_SCALE = 4;
  const DOUBLE_TAP_MAX_DELAY = 250;

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
    doubleTapToZoomRef.current = false;
    isTouchActiveRef.current = false;
  }, [updateZoomState]);

  // Calculate distance between two touch points
  const getTouchDistance = useCallback((touches: React.TouchList): number => {
    if (touches.length < 2) return 0;
    
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }, []);

  // Get center point between touches
  const getTouchCenter = useCallback((touches: React.TouchList): { x: number, y: number } => {
    if (touches.length < 2) {
      return { x: touches[0].clientX, y: touches[0].clientY };
    }
    
    return {
      x: (touches[0].clientX + touches[1].clientX) / 2,
      y: (touches[0].clientY + touches[1].clientY) / 2
    };
  }, []);

  // Constraint function that calculates boundaries
  const constrainTransform = useCallback((newTransform: Transform): Transform => {
    if (!imageRef.current || !containerRef.current) return newTransform;
    
    const { scale, translateX, translateY } = newTransform;
    
    // If not zoomed in, reset to center
    if (scale <= MIN_SCALE) {
      return { scale: MIN_SCALE, translateX: 0, translateY: 0 };
    }
    
    // Calculate constraints based on current scale
    const scaledImageWidth = imageDimensions.width * scale;
    const scaledImageHeight = imageDimensions.height * scale;
    
    // Calculate maximum translation values
    const maxTranslateX = Math.max(0, (scaledImageWidth - containerDimensions.width) / 2);
    const maxTranslateY = Math.max(0, (scaledImageHeight - containerDimensions.height) / 2);
    
    return {
      scale: Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale)),
      translateX: Math.max(-maxTranslateX, Math.min(maxTranslateX, translateX)),
      translateY: Math.max(-maxTranslateY, Math.min(maxTranslateY, translateY))
    };
  }, [imageDimensions, containerDimensions]);

  // Handle double tap to zoom
  const handleDoubleTap = useCallback((point: { x: number, y: number }) => {
    doubleTapToZoomRef.current = true;
    
    if (transform.scale > MIN_SCALE) {
      // Zoom out with animation
      resetTransform();
    } else {
      // Zoom in to the point that was double-tapped
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      
      const targetScale = 2.5;
      
      setTransform({
        scale: targetScale,
        translateX: (containerDimensions.width / 2 - point.x) * (targetScale / 2),
        translateY: (containerDimensions.height / 2 - point.y) * (targetScale / 2)
      });
      updateZoomState(true);
    }
    
    // Reset for next gesture
    setTimeout(() => {
      doubleTapToZoomRef.current = false;
    }, 300);
  }, [containerDimensions, transform.scale, containerRef, resetTransform, updateZoomState]);

  // Handle double click for desktop
  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    handleDoubleTap({ x, y });
  }, [containerRef, handleDoubleTap]);

  // Handle touch start
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    // Always prevent default for touch events in our container
    e.preventDefault();
    
    // When zoomed or carousel disabled, stop propagation to prevent carousel movement
    if (disableCarousel || isZoomed) {
      e.stopPropagation();
    }
    
    // Set touch as active
    isTouchActiveRef.current = true;
    touchMoveCountRef.current = 0;
    
    // Handle tap and potential double tap
    const currentTime = new Date().getTime();
    const tapLength = currentTime - lastTapTimeRef.current;
    
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
      
      // Check for double tap
      if (tapLength < DOUBLE_TAP_MAX_DELAY && tapLength > 0) {
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect) {
          const x = e.touches[0].clientX - rect.left;
          const y = e.touches[0].clientY - rect.top;
          handleDoubleTap({ x, y });
        }
        lastTapTimeRef.current = 0; // Reset tap time
      } else {
        // This is a single tap
        lastTapTimeRef.current = currentTime;
      }
    } 
    else if (e.touches.length === 2) {
      // Store initial touch distance and positions for pinch zoom
      initialTouchDistanceRef.current = getTouchDistance(e.touches);
      initialTransformRef.current = { ...transform };
      
      // Store the touch center for reference
      const center = getTouchCenter(e.touches);
      lastTouchRef.current = center;
      lastPinchCenterRef.current = center;
      
      // Update the zoom state
      if (transform.scale > 1) {
        updateZoomState(true);
      }
    }
  }, [disableCarousel, isZoomed, transform, containerRef, getTouchDistance, getTouchCenter, updateZoomState, handleDoubleTap]);

  // Handle touch move
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    // Always prevent default to stop native browser behaviors
    e.preventDefault();
    
    // Increment move count to track movement
    touchMoveCountRef.current++;
    
    // When zoomed or carousel disabled, stop propagation
    if (disableCarousel || isZoomed) {
      e.stopPropagation();
    }
    
    // Don't handle touch moves during double tap animation
    if (doubleTapToZoomRef.current) {
      return;
    }
    
    if (e.touches.length === 1 && transform.scale > 1) {
      // Only handle panning when zoomed in
      const currentX = e.touches[0].clientX;
      const currentY = e.touches[0].clientY;
      
      const dx = currentX - lastTouchRef.current.x;
      const dy = currentY - lastTouchRef.current.y;
      
      // Update last touch position
      lastTouchRef.current = { x: currentX, y: currentY };
      
      // Apply panning with constraints
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
      const currentDistance = getTouchDistance(e.touches);
      const center = getTouchCenter(e.touches);
      
      // Only proceed if we have a valid initial distance
      if (initialTouchDistanceRef.current > 0 && currentDistance > 0) {
        const pinchScale = currentDistance / initialTouchDistanceRef.current;
        
        // Get the container rect for position calculations
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;
        
        // Calculate pinch center point relative to container
        const pinchCenterX = center.x - rect.left;
        const pinchCenterY = center.y - rect.top;
        
        // Calculate new scale based on initial scale
        const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, initialTransformRef.current.scale * pinchScale));
        
        // Calculate how much we need to translate to maintain the pinch center point
        const scaleDiff = newScale / initialTransformRef.current.scale;
        
        // Convert touch center to image relative coordinates considering current transform
        const imageRelativeX = pinchCenterX - containerDimensions.width / 2 - initialTransformRef.current.translateX;
        const imageRelativeY = pinchCenterY - containerDimensions.height / 2 - initialTransformRef.current.translateY;
        
        // Calculate new translation to keep pinch center fixed
        const newTranslateX = initialTransformRef.current.translateX + (imageRelativeX * (1 - scaleDiff));
        const newTranslateY = initialTransformRef.current.translateY + (imageRelativeY * (1 - scaleDiff));
        
        // Update the last touch center
        lastPinchCenterRef.current = center;
        
        // Apply new transform with constraints
        const newTransform = constrainTransform({
          scale: newScale,
          translateX: newTranslateX,
          translateY: newTranslateY
        });
        
        setTransform(newTransform);
        updateZoomState(newScale > 1);
      }
    }
  }, [disableCarousel, isZoomed, transform.scale, containerRef, containerDimensions, getTouchDistance, getTouchCenter, constrainTransform, updateZoomState]);

  // Handle touch end
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    
    // When carousel should be disabled, stop propagation
    if (disableCarousel || isZoomed) {
      e.stopPropagation();
    }
    
    // Reset touch state
    isTouchActiveRef.current = false;
    initialTouchDistanceRef.current = 0;
    
    // Apply snap behavior
    if (touchMoveCountRef.current < 3 && !doubleTapToZoomRef.current) {
      // This was mostly a tap, not a drag, so don't apply snap behavior
      return;
    }
    
    if (transform.scale <= 1.05) {
      // If close to 1, snap back to unzoomed state
      resetTransform();
    } else {
      // Apply constraints to ensure image stays within bounds
      setTransform(prev => constrainTransform(prev));
    }
    
    // Reset move count
    touchMoveCountRef.current = 0;
  }, [disableCarousel, isZoomed, transform.scale, resetTransform, constrainTransform]);

  return {
    transform,
    isZoomed,
    updateDimensions,
    resetTransform,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleDoubleClick
  };
};
