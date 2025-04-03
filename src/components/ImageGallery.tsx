
import React, { useState, useEffect, Suspense } from 'react';
import PhotoItem from './PhotoItem';
import { 
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { ErrorBoundary } from '../components/ErrorBoundary';

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
  const [carouselApi, setCarouselApi] = useState<any>(null);

  useEffect(() => {
    if (!carouselApi) return;
    
    const onSelect = () => {
      setCurrentIndex(carouselApi.selectedScrollSnap());
    };
    
    carouselApi.on("select", onSelect);
    onSelect();
    
    return () => {
      carouselApi.off("select", onSelect);
    };
  }, [carouselApi]);
  
  const handleZoomChange = (zoomed: boolean) => {
    setIsZoomed(zoomed);
    
    if (!carouselApi) return;
    
    // Explicitly disable or enable carousel scrolling based on zoom
    if (zoomed) {
      // When zoomed, completely disable the carousel
      carouselApi.internalEngine().scrollTo = () => {}; // Override scrollTo
      carouselApi.internalEngine().scrollNext = () => {}; // Disable scroll next
      carouselApi.internalEngine().scrollPrev = () => {}; // Disable scroll prev
    } else {
      // Re-enable carousel when not zoomed
      carouselApi.reInit();
    }
  };

  // Load images with improved path handling
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
    
    // Use Promise.allSettled instead of Promise.all for more robust error handling
    Promise.allSettled(
      allPaths.map(path => 
        new Promise<string>((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(path);
          img.onerror = () => reject();
          img.src = path;
        })
      )
    ).then(results => {
      const validPaths = results
        .filter(result => result.status === 'fulfilled')
        .map(result => (result as PromiseFulfilledResult<string>).value);
      
      if (validPaths.length > 0) {
        const uniqueImages: string[] = [];
        
        for (let i = 1; i <= totalImages; i++) {
          const matchingPaths = validPaths.filter(path => 
            path.includes(`page${i}.png`) || path.endsWith(`${i}.png`)
          );
          
          if (matchingPaths.length > 0) {
            uniqueImages.push(matchingPaths[0]);
          }
        }
        
        setLoadedImages(uniqueImages);
        setLoadError(false);
      } else {
        console.error('No working image paths found');
        const fallbackImages = Array.from({ length: totalImages }, (_, i) => 
          `/lovable-uploads/page${i + 1}.png`
        );
        setLoadedImages(fallbackImages);
        setLoadError(false);
      }
      
      setIsLoading(false);
    });
  }, [totalImages, imagePrefix]);

  const handleIndicatorClick = (index: number) => {
    if (!isZoomed && carouselApi) {
      setCurrentIndex(index);
      carouselApi.scrollTo(index);
    }
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
    <div 
      className={`w-full h-full bg-black flex flex-col relative ${isZoomed ? 'overflow-hidden touch-none' : ''}`}
    >
      <ErrorBoundary fallback={<div className="w-full h-full flex items-center justify-center text-white">Something went wrong with the image viewer.</div>}>
        <Carousel 
          className={`w-full h-full ${isZoomed ? 'pointer-events-none' : ''}`}
          opts={{
            align: "center",
            loop: true,
            skipSnaps: false,
            containScroll: "keepSnaps",
            dragFree: false,
          }}
          setApi={setCarouselApi}
        >
          <CarouselContent className="h-full">
            {loadedImages.map((src, index) => (
              <CarouselItem 
                key={index} 
                className={`basis-full h-full ${isZoomed ? 'overflow-hidden' : ''}`}
              >
                <PhotoItem 
                  src={src} 
                  onZoomChange={handleZoomChange}
                  disableCarousel={isZoomed}
                />
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>

        {!isZoomed && (
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
        )}
      </ErrorBoundary>
    </div>
  );
};

export default ImageGallery;
