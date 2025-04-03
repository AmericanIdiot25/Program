
import React, { useState, useEffect, useRef } from 'react';
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

type AlignType = "start" | "center" | "end";
type ScrollContainType = "trimSnaps" | "keepSnaps" | "";

const ImageGallery = ({ totalImages, imagePrefix = 'page' }: ImageGalleryProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loadedImages, setLoadedImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [carouselApi, setCarouselApi] = useState<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [carouselOptions, setCarouselOptions] = useState({
    align: "center" as AlignType,
    loop: true,
    containScroll: "trimSnaps" as ScrollContainType,
    dragFree: false,
    skipSnaps: false,
    inViewThreshold: 1,
    active: !isZoomed
  });
  
  useEffect(() => {
    // Update carousel options when zoom state changes
    setCarouselOptions(prev => ({
      ...prev,
      active: !isZoomed,
      draggable: !isZoomed  // Disable dragging when zoomed
    }));
    
    if (!carouselApi) return;
    
    if (isZoomed) {
      // Disable all carousel interactions when zoomed in
      carouselApi.off("select");
      carouselApi.off("scroll");
      carouselApi.off("settle");
      carouselApi.off("pointerDown");
      carouselApi.off("pointerUp");
      carouselApi.off("pointerMove");
      
      // Prevent the carousel from responding to any input
      const disableCarouselInteraction = () => {
        if (carouselApi && carouselApi.clickAllowed) {
          carouselApi.clickAllowed = () => false;
        }
      };
      
      disableCarouselInteraction();
      
      if (containerRef.current) {
        // Create or find overlay to capture and stop gesture propagation
        const existingOverlay = document.getElementById('zoom-overlay');
        if (!existingOverlay) {
          const overlay = document.createElement('div');
          overlay.id = 'zoom-overlay';
          overlay.style.position = 'absolute';
          overlay.style.top = '0';
          overlay.style.left = '0';
          overlay.style.right = '0';
          overlay.style.bottom = '0';
          overlay.style.zIndex = '5';
          
          // Stop all events from propagating to carousel
          const stopPropagation = (e: Event) => {
            e.stopPropagation();
            e.preventDefault();
          };
          
          overlay.addEventListener('touchstart', stopPropagation, { passive: false });
          overlay.addEventListener('touchmove', stopPropagation, { passive: false });
          overlay.addEventListener('touchend', stopPropagation, { passive: false });
          overlay.addEventListener('wheel', stopPropagation, { passive: false });
          overlay.addEventListener('click', stopPropagation, { passive: false });
          overlay.addEventListener('mousedown', stopPropagation, { passive: false });
          overlay.addEventListener('mouseup', stopPropagation, { passive: false });
          overlay.addEventListener('mousemove', stopPropagation, { passive: false });
          
          containerRef.current.appendChild(overlay);
        }
      }
    } else {
      // Re-enable carousel interactions when zoomed out
      carouselApi.on("select");
      carouselApi.on("scroll");
      carouselApi.on("settle");
      carouselApi.on("pointerDown");
      carouselApi.on("pointerUp");
      carouselApi.on("pointerMove");
      
      // Reset clickAllowed to its default behavior
      if (carouselApi && carouselApi.clickAllowed) {
        carouselApi.clickAllowed = (pointerDown: any) => {
          return !carouselApi.dragHandler.pointerDown;
        };
      }
      
      // Remove the overlay
      const overlay = document.getElementById('zoom-overlay');
      if (overlay && containerRef.current) {
        containerRef.current.removeChild(overlay);
      }
    }
  }, [carouselApi, isZoomed]);
  
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
    <div 
      className={`w-full h-full bg-black flex flex-col relative ${isZoomed ? 'overflow-hidden' : ''}`} 
      ref={containerRef}
    >
      <Carousel 
        className="w-full h-full" 
        opts={carouselOptions}
        setApi={(api) => {
          if (api) {
            setCarouselApi(api);
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
            <CarouselItem 
              key={index} 
              className="basis-full h-full"
              style={{ pointerEvents: isZoomed ? 'none' : 'auto' }}
            >
              <PhotoItem 
                src={src} 
                onZoomChange={handleZoomChange}
                disableCarousel={isZoomed}
              />
            </CarouselItem>
          ))}
        </CarouselContent>
        
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
      </Carousel>
    </div>
  );
};

export default ImageGallery;
