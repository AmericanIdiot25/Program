
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
  
  const images = Array.from({ length: totalImages }, (_, i) => `${imagePrefix}${i + 1}.png`);
  
  // Set up snap scrolling functionality
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
      >
        {images.map((src, index) => (
          <div key={index} className="flex-shrink-0 w-full h-full snap-center">
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
