
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
  
  useEffect(() => {
    // Create array of image paths with multiple fallback approaches for Main branch/ROOT deployment
    const paths = Array.from({ length: totalImages }, (_, i) => {
      const index = i + 1;
      
      // Try various path formats that might work in different environments and deployment setups
      return [
        // Direct path to lovable-uploads - most likely to work in Main/ROOT deployment
        `/lovable-uploads/page${index}.png`,
        // GitHub Pages with or without repo name as base path
        `${window.location.pathname}lovable-uploads/page${index}.png`,
        // With BASE_URL from Vite (if available)
        `${import.meta.env.BASE_URL || '/'}lovable-uploads/page${index}.png`,
        // Absolute path from root
        `/lovable-uploads/page${index}.png`,
        // No leading slash
        `lovable-uploads/page${index}.png`,
        // Just the filename as a last resort
        `page${index}.png`
      ];
    });

    // Flatten the array of path arrays
    const allPaths = paths.flat();
    
    console.log('Trying image paths:', allPaths.slice(0, 10), '...');
    
    // Attempt to preload images to check which paths work
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
      // Filter out null values (failed loads)
      const workingPaths = validPaths.filter(Boolean) as string[];
      console.log('Working image paths found:', workingPaths.length > 0 ? workingPaths.slice(0, 5) : 'None');
      
      if (workingPaths.length > 0) {
        // Group the working paths by their image index
        const uniqueImages: string[] = [];
        
        // For each image index, take the first working path
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
        // Try a direct hardcoded approach as a last resort
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

  // Handle manual image change via click on indicator dots
  const handleIndicatorClick = (index: number) => {
    setCurrentIndex(index);
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
          {loadedImages.map((src, index) => (
            <CarouselItem key={index} className="basis-full h-full">
              <PhotoItem src={src} />
            </CarouselItem>
          ))}
        </CarouselContent>
        
        {/* Navigation indicator dots */}
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
