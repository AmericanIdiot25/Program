
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
    "lovable-uploads/5f1ccfee-d73c-4050-a65a-b0edcd6cb382.png",
    "lovable-uploads/6a3c1f0a-2110-42e7-97f5-902b4a73813c.png",
    "lovable-uploads/b3c62701-398a-4a7a-a75f-72bb460b935d.png", 
    "lovable-uploads/4610f6b7-5215-45f9-8e97-045023d37703.png",
    "lovable-uploads/060d4703-3899-4bd8-98c7-2e740d1c4272.png",
    "lovable-uploads/f9596ee5-5d57-4343-9e04-c7969c6359d7.png",
    "lovable-uploads/2c3ad772-fb85-428a-982d-159c4ca02483.png",
    "lovable-uploads/5d9c563e-a00e-4fa3-8197-0ccb0a95d279.png",
    "lovable-uploads/88e7c434-744b-4f47-821f-6c28078afa43.png",
    "lovable-uploads/6bc05c99-4bff-46ba-8e65-58fe7080c6bd.png", 
    "lovable-uploads/2eafee80-3029-498c-abfe-a8a0bdffd383.png",
    "lovable-uploads/4896d2d4-f5aa-46ca-9611-65bd9d743fb0.png",
    "lovable-uploads/0d53d751-67e5-42d9-bd20-127b93149bb6.png",
    "lovable-uploads/a7c90533-f31c-41ea-8392-1f3112ea0dd2.png",
    "lovable-uploads/e6a0a4eb-b234-402c-ba9f-20d1c08bcfd9.png",
    "lovable-uploads/5cf2da3b-93e8-4c1d-8eed-ceb6e6c4afee.png",
    "lovable-uploads/60263d0f-cbe6-4484-b51e-1b25839bc841.png",
    "lovable-uploads/9dca80fd-b410-4477-9652-c61e557d59d7.png",
    "lovable-uploads/1a4bfb10-f215-4452-841f-fef12f05847f.png",
    "lovable-uploads/12cd3c74-4e3a-436a-aa15-e573d58c1873.png",
    "lovable-uploads/0763103e-64e8-4752-a87a-60d387bb3007.png",
    "lovable-uploads/6b878c47-c9db-4dde-9c5e-262e0f76663c.png",
    "lovable-uploads/6dc34541-c6d3-4253-b5af-f7c84227255f.png",
    "lovable-uploads/c01fc720-1eb9-4b5d-8753-dd67e3f9acd2.png"
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
