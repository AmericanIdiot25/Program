
import { useState, useRef, useCallback, useEffect } from 'react';

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

interface Velocity {
  x: number;
  y: number;
  scale: number;
}

export const useImageGestures = ({
  onZoomChange,
  disableCarousel = false,
  containerRef,
  imageRef
}: UseImageGesturesProps) => {
  const [transform, setTransform] = useState<Transform>({ scale: 1, translateX: 0, translateY: 0 });
  const [isZoomed, setIsZoomed] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [imageDimensions, setImageDimensions] = useState<Dimensions>({ width: 0, height: 0, ratio: 1 });
  const [containerDimensions, setContainerDimensions] = useState<Dimensions>({ width: 0, height: 0 });

  // Touch gesture state tracking
  const touchStartRef = useRef({ x: 0, y: 0, time: 0 });
  const lastTouchRef = useRef({ x: 0, y: 0, time: 0 });
  const initialTouchDistanceRef = useRef(0);
  const initialTransformRef = useRef<Transform>({ scale: 1, translateX: 0, translateY: 0 });
  const lastTapTimeRef = useRef(0);
  const doubleTapToZoomRef = useRef(false);
  const lastPinchCenterRef = useRef({ x: 0, y: 0 });
  const touchMoveCountRef = useRef(0);
  const isTouchActiveRef = useRef(false);
  const velocityRef = useRef<Velocity>({ x: 0, y: 0, scale: 0 });
  const animationFrameRef = useRef<number | null>(null);
  const momentumAnimationRef = useRef<number | null>(null);

  // Constants
  const MIN_SCALE = 1;
  const MAX_SCALE = 4;
  const DOUBLE_TAP_MAX_DELAY = 250;
  const MOMENTUM_FRICTION = 0.95;
  const MIN_VELOCITY_FOR_MOMENTUM = 0.5;
  const ANIMATION_DURATION = 300;
  const MOMENTUM_DURATION = 800;

  // Notify parent component when zoom state changes
  const updateZoomState = useCallback((zoomed: boolean) => {
    setIsZoomed(zoomed);
    onZoomChange?.(zoomed);
  }, [onZoomChange]);

  // Clean up any ongoing animations
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (momentumAnimationRef.current) {
        cancelAnimationFrame(momentumAnimationRef.current);
      }
    };
  }, []);

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
    // Stop any ongoing animations
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (momentumAnimationRef.current) {
      cancelAnimationFrame(momentumAnimationRef.current);
    }
    
    setTransform({ scale: 1, translateX: 0, translateY: 0 });
    updateZoomState(false);
    doubleTapToZoomRef.current = false;
    isTouchActiveRef.current = false;
    touchMoveCountRef.current = 0;
    velocityRef.current = { x: 0, y: 0, scale: 0 };
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

  // Animate transform to target with easing
  const animateTransformTo = useCallback((targetTransform: Transform, duration: number = ANIMATION_DURATION) => {
    const startTransform = { ...transform };
    const startTime = Date.now();
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    setIsAnimating(true);
    
    const animate = () => {
      const currentTime = Date.now();
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease out cubic: progress = 1 - Math.pow(1 - progress, 3);
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      
      if (progress < 1) {
        setTransform({
          scale: startTransform.scale + (targetTransform.scale - startTransform.scale) * easedProgress,
          translateX: startTransform.translateX + (targetTransform.translateX - startTransform.translateX) * easedProgress,
          translateY: startTransform.translateY + (targetTransform.translateY - startTransform.translateY) * easedProgress
        });
        
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        setTransform(targetTransform);
        setIsAnimating(false);
        animationFrameRef.current = null;
      }
    };
    
    animationFrameRef.current = requestAnimationFrame(animate);
  }, [transform]);

  // Apply momentum after touch end
  const applyMomentum = useCallback((velocity: Velocity) => {
    if (momentumAnimationRef.current) {
      cancelAnimationFrame(momentumAnimationRef.current);
    }
    
    const startTime = Date.now();
    const startTransform = { ...transform };
    
    // Only apply momentum if velocity is significant
    if (Math.abs(velocity.x) < MIN_VELOCITY_FOR_MOMENTUM && 
        Math.abs(velocity.y) < MIN_VELOCITY_FOR_MOMENTUM) {
      return;
    }
    
    setIsAnimating(true);
    
    const animateMomentum = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / MOMENTUM_DURATION, 1);
      
      // Decrease velocity over time with friction
      velocity.x *= MOMENTUM_FRICTION;
      velocity.y *= MOMENTUM_FRICTION;
      
      // Update transform based on velocity
      const newTransform = {
        scale: startTransform.scale,
        translateX: transform.translateX + velocity.x,
        translateY: transform.translateY + velocity.y
      };
      
      // Apply constraints
      const constrained = constrainTransform(newTransform);
      
      // If we hit boundaries, stop momentum
      if (constrained.translateX !== newTransform.translateX || 
          constrained.translateY !== newTransform.translateY) {
        velocity.x *= 0.5;
        velocity.y *= 0.5;
      }
      
      setTransform(constrained);
      
      if (progress < 1 && (Math.abs(velocity.x) > 0.1 || Math.abs(velocity.y) > 0.1)) {
        momentumAnimationRef.current = requestAnimationFrame(animateMomentum);
      } else {
        setIsAnimating(false);
        momentumAnimationRef.current = null;
      }
    };
    
    momentumAnimationRef.current = requestAnimationFrame(animateMomentum);
  }, [transform]);

  // Constraint function with improved boundary calculations
  const constrainTransform = useCallback((newTransform: Transform): Transform => {
    if (!imageRef.current || !containerRef.current) return newTransform;
    
    const { scale, translateX, translateY } = newTransform;
    
    // If not zoomed in, reset to center
    if (scale <= MIN_SCALE) {
      return { scale: MIN_SCALE, translateX: 0, translateY: 0 };
    }
    
    // Calculate constraints based on current scale and image dimensions
    const scaledImageWidth = imageDimensions.width * scale;
    const scaledImageHeight = imageDimensions.height * scale;
    
    // Calculate maximum translation values with a small buffer
    const horizontalOverflow = Math.max(0, (scaledImageWidth - containerDimensions.width) / 2);
    const verticalOverflow = Math.max(0, (scaledImageHeight - containerDimensions.height) / 2);
    
    // Apply constraints with improved smoothing
    return {
      scale: Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale)),
      translateX: Math.max(-horizontalOverflow, Math.min(horizontalOverflow, translateX)),
      translateY: Math.max(-verticalOverflow, Math.min(verticalOverflow, translateY))
    };
  }, [imageDimensions, containerDimensions]);

  // Improved double tap to zoom with better center point calculation
  const handleDoubleTap = useCallback((point: { x: number, y: number }) => {
    doubleTapToZoomRef.current = true;
    
    if (transform.scale > MIN_SCALE) {
      // Zoom out with animation
      animateTransformTo({ scale: 1, translateX: 0, translateY: 0 });
      updateZoomState(false);
    } else {
      // Zoom in to the point that was double-tapped
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      
      const targetScale = 2.5;
      
      // Calculate the center point relative to container center
      const pointRelativeToContainerCenterX = point.x - rect.width / 2;
      const pointRelativeToContainerCenterY = point.y - rect.height / 2;
      
      // Apply zoom centered on tap point with animation
      const newTransform = constrainTransform({
        scale: targetScale,
        translateX: -pointRelativeToContainerCenterX * (targetScale - 1) / targetScale,
        translateY: -pointRelativeToContainerCenterY * (targetScale - 1) / targetScale
      });
      
      animateTransformTo(newTransform);
      updateZoomState(true);
    }
    
    // Reset for next gesture
    setTimeout(() => {
      doubleTapToZoomRef.current = false;
    }, 300);
  }, [transform.scale, containerRef, updateZoomState, constrainTransform, animateTransformTo]);

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

  // Handle touch start with improved gesture detection
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    // Always prevent default for touch events in our container
    e.preventDefault();
    
    // Stop any ongoing animations
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (momentumAnimationRef.current) {
      cancelAnimationFrame(momentumAnimationRef.current);
      momentumAnimationRef.current = null;
    }
    
    setIsAnimating(false);
    
    // When zoomed or carousel disabled, stop propagation to prevent carousel movement
    if (disableCarousel || isZoomed) {
      e.stopPropagation();
    }
    
    // Set touch as active
    isTouchActiveRef.current = true;
    touchMoveCountRef.current = 0;
    
    // Reset velocity tracking for new gesture
    velocityRef.current = { x: 0, y: 0, scale: 0 };
    
    // Handle tap and potential double tap
    const currentTime = new Date().getTime();
    const tapLength = currentTime - lastTapTimeRef.current;
    
    // Store the current touch position
    if (e.touches.length === 1) {
      // Single touch - prepare for panning
      touchStartRef.current = { 
        x: e.touches[0].clientX, 
        y: e.touches[0].clientY,
        time: currentTime
      };
      lastTouchRef.current = { 
        x: e.touches[0].clientX, 
        y: e.touches[0].clientY,
        time: currentTime
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
      lastTouchRef.current = { x: center.x, y: center.y, time: currentTime };
      lastPinchCenterRef.current = center;
      
      // Update the zoom state
      if (transform.scale > 1) {
        updateZoomState(true);
      }
    }
  }, [disableCarousel, isZoomed, transform, containerRef, getTouchDistance, getTouchCenter, updateZoomState, handleDoubleTap]);

  // Optimized touch move handler with smoother pinch zoom
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    // Always prevent default to stop native browser behaviors
    e.preventDefault();
    
    // Get current time for velocity calculations
    const currentTime = Date.now();
    const deltaTime = currentTime - lastTouchRef.current.time;
    
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
      
      // Calculate velocity (pixels per millisecond)
      if (deltaTime > 0) {
        velocityRef.current.x = 0.8 * velocityRef.current.x + 0.2 * (dx / deltaTime) * 16; // Convert to per-frame velocity
        velocityRef.current.y = 0.8 * velocityRef.current.y + 0.2 * (dy / deltaTime) * 16;
      }
      
      // Update last touch position
      lastTouchRef.current = { x: currentX, y: currentY, time: currentTime };
      
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
      // Handle pinch zoom with improved center tracking
      const currentDistance = getTouchDistance(e.touches);
      const center = getTouchCenter(e.touches);
      
      // Only proceed if we have a valid initial distance
      if (initialTouchDistanceRef.current > 0 && currentDistance > 0) {
        const pinchScale = currentDistance / initialTouchDistanceRef.current;
        
        // Calculate scale velocity
        if (deltaTime > 0) {
          const scaleDelta = pinchScale - 1;  // How much scale changed
          velocityRef.current.scale = 0.8 * velocityRef.current.scale + 0.2 * (scaleDelta / deltaTime) * 16;
        }
        
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
        lastTouchRef.current = { x: center.x, y: center.y, time: currentTime };
        
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
  }, [disableCarousel, isZoomed, transform, containerRef, containerDimensions, getTouchDistance, getTouchCenter, constrainTransform, updateZoomState]);

  // Handle touch end with improved snap behavior and momentum
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
      // If close to 1, snap back to unzoomed state with animation
      animateTransformTo({ scale: 1, translateX: 0, translateY: 0 });
      updateZoomState(false);
    } else if (transform.scale > 1) {
      // Apply momentum if we have significant velocity
      if (Math.abs(velocityRef.current.x) > 0.1 || Math.abs(velocityRef.current.y) > 0.1) {
        applyMomentum(velocityRef.current);
      } else {
        // Just apply constraints with animation
        const constrained = constrainTransform(transform);
        if (constrained.translateX !== transform.translateX || constrained.translateY !== transform.translateY) {
          animateTransformTo(constrained);
        }
      }
    }
    
    // Reset move count
    touchMoveCountRef.current = 0;
  }, [disableCarousel, isZoomed, transform, updateZoomState, constrainTransform, animateTransformTo, applyMomentum]);

  return {
    transform,
    isZoomed,
    isAnimating,
    updateDimensions,
    resetTransform,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleDoubleClick
  };
};
