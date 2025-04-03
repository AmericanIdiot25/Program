import React, { useState, useEffect, useRef, useCallback } from 'react';
import PhotoItem from './PhotoItem';
import { 
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { Maximize, Minimize } from 'lucide-react';

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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [carouselApi, setCarouselApi] = useState<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(
        Boolean(document.fullscreenElement || 
        (document as any).webkitFullscreenElement || 
        (document as any).mozFullScreenElement)
      );
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
    };
  }, []);
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        exitFullscreen();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFullscreen]);
  
  const toggleFullscreen = useCallback(() => {
    if (isFullscreen) {
      exitFullscreen();
    } else {
      enterFullscreen();
    }
  }, [isFullscreen]);
  
  const enterFullscreen = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    
    try {
      if (container.requestFullscreen) {
        container.requestFullscreen();
      } else if ((container as any).webkitRequestFullscreen) {
        (container as any).webkitRequestFullscreen();
      } else if ((container as any).mozRequestFullScreen) {
        (container as any).mozRequestFullScreen();
      }
    } catch (err) {
      console.error(`Error attempting to enable fullscreen: ${err}`);
    }
  }, []);
  
  const exitFullscreen = useCallback(() => {
    try {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      } else if ((document as any).mozCancelFullScreen) {
        (document as any).mozCancelFullScreen();
      }
    } catch (err) {
      console.error(`Error attempting to exit fullscreen: ${err}`);
    }
  }, []);
  
  const handleZoomChange = useCallback((zoomed: boolean) => {
    setIsZoomed(zoomed);
  }, []);

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
      className={`w-full h-full bg-black flex flex-col relative ${isZoomed ? 'overflow-hidden' : ''}`} 
      ref={containerRef}
    >
      <button
        onClick={toggleFullscreen}
        className="absolute top-4 right-4 bg-black/40 hover:bg-black/60 text-white rounded-full p-2 z-10"
        style={{ backdropFilter: 'blur(8px)' }}
        aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
      >
        {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
      </button>

      <Carousel 
        className="w-full h-full"
        opts={{
          align: "center",
          loop: true,
          skipSnaps: false,
          containScroll: "keepSnaps",
          dragFree: false
        }}
        setApi={setCarouselApi}
      >
        <CarouselContent className="h-full">
          {loadedImages.map((src, index) => (
            <CarouselItem 
              key={index} 
              className="basis-full h-full"
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
    </div>
  );
};

export default ImageGallery;
