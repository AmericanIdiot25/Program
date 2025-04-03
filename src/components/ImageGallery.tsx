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
  
  // Create array of image paths from the lovable-uploads folder
  const images = [
    // Images already loaded in the first batch
    "lovable-uploads/5f1ccfee-d73c-4050-a65a-b0edcd6cb382.png",
    "lovable-uploads/6a3c1f0a-2110-42e7-97f5-902b4a73813c.png",
    "lovable-uploads/b3c62701-398a-4a7a-a75f-72bb460b935d.png", 
    "lovable-uploads/4610f6b7-5215-45f9-8e97-045023d37703.png",
    "lovable-uploads/060d4703-3899-4bd8-98c7-2e740d1c4272.png",
    "lovable-uploads/f9596ee5-5d57-4343-9e04-c7969c6359d7.png",
    // Other images to make up the total (we'll use placeholders if needed)
    ...Array(Math.max(0, totalImages - 6)).fill(null).map((_, i) => 
      `${imagePrefix}${i + 7}.png`
    )
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
