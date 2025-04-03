
import React, { useState, useEffect, useRef } from 'react';
import PhotoItem from './PhotoItem';

interface ImageGalleryProps {
  totalImages: number;
  imagePrefix?: string;
}

const ImageGallery = ({ totalImages, imagePrefix = 'page' }: ImageGalleryProps) => {
  const galleryRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  
  const images = Array.from({ length: totalImages }, (_, i) => `${imagePrefix}${i + 1}.png`);
  
  // Handle touch start event
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
    setTouchEnd(e.touches[0].clientX);
  };
  
  // Handle touch move event
  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.touches[0].clientX);
  };
  
  // Handle touch end event - control the navigation
  const handleTouchEnd = () => {
    if (!galleryRef.current) return;
    
    const threshold = 50; // Minimum swipe distance to trigger navigation
    const diff = touchStart - touchEnd;
    
    // Determine direction and navigate only to the next/prev slide
    if (Math.abs(diff) > threshold) {
      if (diff > 0 && currentIndex < images.length - 1) {
        // Swipe left - go to next image
        scrollToItem(currentIndex + 1);
      } else if (diff < 0 && currentIndex > 0) {
        // Swipe right - go to previous image
        scrollToItem(currentIndex - 1);
      } else {
        // Snap back to current if we're at the edges
        scrollToItem(currentIndex);
      }
    } else {
      // If swipe distance is too small, snap back to current
      scrollToItem(currentIndex);
    }
  };
  
  // Set up detection of current index based on scroll position
  useEffect(() => {
    const gallery = galleryRef.current;
    if (!gallery) return;
    
    const handleScroll = () => {
      if (isScrolling) return;
      
      const scrollLeft = gallery.scrollLeft;
      const itemWidth = gallery.clientWidth;
      const newIndex = Math.round(scrollLeft / itemWidth);
      
      if (newIndex !== currentIndex) {
        setCurrentIndex(newIndex);
      }
    };
    
    gallery.addEventListener('scroll', handleScroll);
    return () => gallery.removeEventListener('scroll', handleScroll);
  }, [currentIndex, isScrolling]);

  // Programmatically scroll to an item
  const scrollToItem = (index: number) => {
    const gallery = galleryRef.current;
    if (!gallery) return;
    
    setIsScrolling(true);
    const targetScrollLeft = gallery.clientWidth * index;
    
    gallery.scrollTo({
      left: targetScrollLeft,
      behavior: 'smooth'
    });
    
    // Reset the isScrolling state after animation completes
    setTimeout(() => {
      setIsScrolling(false);
      setCurrentIndex(index);
    }, 300);
  };

  return (
    <div className="w-full h-full bg-gallery-background flex flex-col">
      <div 
        ref={galleryRef}
        className="snap-gallery flex flex-1 overflow-x-auto snap-x snap-mandatory"
        style={{ scrollSnapType: 'x mandatory', scrollBehavior: 'smooth' }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {images.map((src, index) => (
          <div 
            key={index} 
            className="flex-shrink-0 w-full h-full snap-center"
            style={{ scrollSnapAlign: 'center' }}
          >
            <PhotoItem src={src} />
          </div>
        ))}
      </div>
      
      {/* Optional: Add page indicators */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-1 z-10">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => scrollToItem(index)}
            className={`w-2 h-2 rounded-full ${
              index === currentIndex ? 'bg-white' : 'bg-white/40'
            }`}
            aria-label={`Go to image ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default ImageGallery;
