
import React, { useState } from 'react';
import PhotoItem from './PhotoItem';
import { 
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";

interface ImageGalleryProps {
  totalImages: number;
  imagePrefix?: string;
}

const ImageGallery = ({ totalImages, imagePrefix = 'page' }: ImageGalleryProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Create array of image paths with base path consideration
  const images = Array.from({ length: totalImages }, (_, i) => {
    // Ensure path works in both development and production environments
    const basePath = import.meta.env.BASE_URL || '/';
    return `${basePath}${imagePrefix}${i + 1}.png`;
  });
  
  // Handle manual image change via click on indicator dots
  const handleIndicatorClick = (index: number) => {
    setCurrentIndex(index);
  };

  return (
    <div className="w-full h-full bg-black flex flex-col relative">
      <Carousel 
        className="w-full h-full" 
        opts={{
          align: "start",
          loop: true,
          skipSnaps: false,
          dragFree: true
        }}
        setApi={(api) => {
          if (api) {
            api.on("select", () => {
              setCurrentIndex(api.selectedScrollSnap());
            });
          }
        }}
      >
        <CarouselContent className="h-full">
          {images.map((src, index) => (
            <CarouselItem key={index} className="basis-full h-full">
              <PhotoItem src={src} />
            </CarouselItem>
          ))}
        </CarouselContent>
        
        {/* Navigation indicator dots */}
        <div className="absolute inset-x-0 bottom-4 flex justify-center items-center space-x-1 z-10">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => handleIndicatorClick(index)}
              className={`w-2 h-2 rounded-full ${
                index === currentIndex ? 'bg-white' : 'bg-white/40'
              } transition-colors duration-200`}
              aria-label={`Go to image ${index + 1}`}
            />
          ))}
        </div>
      </Carousel>
    </div>
  );
};

export default ImageGallery;
