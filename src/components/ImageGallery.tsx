
import React, { useState, useEffect } from 'react';
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
  const [loadedImages, setLoadedImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  
  useEffect(() => {
    const paths = Array.from({ length: totalImages }, (_, i) => {
      const index = i + 1;
      
      return [
        `/lovable-uploads/page${index}.png`,
        `${window.location.pathname}lovable-uploads/page${index}.png`,
        `${import.meta.env.BASE_URL || '/'}lovable-uploads/page${index}.png`,
        `/lovable-uploads/page${index}.png`,
        `lovable-uploads/page${index}.png`,
        `page${index}.png`
      ];
    });

    const allPaths = paths.flat();
    
    console.log('Trying image paths:', allPaths.slice(0, 10), '...');
    
    Promise.all(
      allPaths.map(path => 
        new Promise<string>((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(path);
          img.onerror = () => reject();
          img.src = path;
        }).catch(() => null)
      )
    ).then(validPaths => {
      const workingPaths = validPaths.filter(Boolean) as string[];
      console.log('Working image paths found:', workingPaths.length > 0 ? workingPaths.slice(0, 5) : 'None');
      
      if (workingPaths.length > 0) {
        const uniqueImages: string[] = [];
        
        for (let i = 1; i <= totalImages; i++) {
          const matchingPaths = workingPaths.filter(path => 
            path.includes(`page${i}.png`) || path.endsWith(`${i}.png`)
          );
          
          if (matchingPaths.length > 0) {
            uniqueImages.push(matchingPaths[0]);
          }
        }
        
        console.log('Final unique image paths:', uniqueImages.slice(0, 5), '...');
        setLoadedImages(uniqueImages);
        setLoadError(false);
      } else {
        console.error('No working image paths found');
        const fallbackImages = Array.from({ length: totalImages }, (_, i) => 
          `/lovable-uploads/page${i + 1}.png`
        );
        console.log('Using fallback image paths:', fallbackImages.slice(0, 5), '...');
        setLoadedImages(fallbackImages);
        setLoadError(false);
      }
      
      setIsLoading(false);
    });
  }, [totalImages, imagePrefix]);

  const handleIndicatorClick = (index: number) => {
    if (!isZoomed) {
      setCurrentIndex(index);
    }
  };

  const handleZoomChange = (zoomed: boolean) => {
    setIsZoomed(zoomed);
  };

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-black text-white">
        <p>Loading images...</p>
      </div>
    );
  }

  if (loadError || loadedImages.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-black text-white">
        <p className="mb-2">Failed to load images</p>
        <p className="text-sm text-gray-400">Check browser console for details</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-black flex flex-col relative">
      <Carousel 
        className="w-full h-full" 
        opts={{
          align: "center",
          loop: true,
          containScroll: "trimSnaps",
          dragFree: false,
          skipSnaps: false,
          inViewThreshold: 1,
          // Use the correct property to disable dragging when zoomed
          draggable: !isZoomed  // This value will be handled by the correct EmblaOptions type
        }}
        setApi={(api) => {
          if (api) {
            api.on("select", () => {
              if (!isZoomed) {
                setCurrentIndex(api.selectedScrollSnap());
              }
            });
          }
        }}
      >
        <CarouselContent className="h-full">
          {loadedImages.map((src, index) => (
            <CarouselItem key={index} className="basis-full h-full">
              <PhotoItem 
                src={src} 
                onZoomChange={handleZoomChange}
              />
            </CarouselItem>
          ))}
        </CarouselContent>
        
        <div className="absolute inset-x-0 bottom-4 flex justify-center items-center space-x-1 z-10">
          {loadedImages.map((_, index) => (
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
