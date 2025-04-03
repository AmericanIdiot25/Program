
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
  
  // Create array of image paths for all 24 uploaded images
  const images = [
    // Images from uploads
    "lovable-uploads/page1.png",
    "lovable-uploads/page2.png",
    "lovable-uploads/page3.png", 
    "lovable-uploads/page4.png",
    "lovable-uploads/page5.png",
    "lovable-uploads/page6.png",
    "lovable-uploads/page7.png",
    "lovable-uploads/page8.png",
    "lovable-uploads/page9.png",
    "lovable-uploads/page10.png", 
    "lovable-uploads/page11.png",
    "lovable-uploads/page12.png",
    "lovable-uploads/page13.png",
    "lovable-uploads/page14.png",
    "lovable-uploads/page15.png",
    "lovable-uploads/page16.png",
    "lovable-uploads/page17.png",
    "lovable-uploads/page18.png",
    "lovable-uploads/page19.png",
    "lovable-uploads/page20.png",
    "lovable-uploads/page21.png",
    "lovable-uploads/page22.png",
    "lovable-uploads/page23.png",
    "lovable-uploads/page24.png"
  ];
  
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
          loop: false,
          skipSnaps: false,
          dragFree: false
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
        
        {/* Navigation controls */}
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
