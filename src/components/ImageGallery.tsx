import React, { useState, useEffect, useRef } from 'react';
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

type AlignType = "start" | "center" | "end";
type ScrollContainType = "trimSnaps" | "keepSnaps" | "";

const ImageGallery = ({ totalImages, imagePrefix = 'page' }: ImageGalleryProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loadedImages, setLoadedImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [carouselApi, setCarouselApi] = useState<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [carouselOptions, setCarouselOptions] = useState({
    align: "center" as AlignType,
    loop: true,
    containScroll: "trimSnaps" as ScrollContainType,
    dragFree: false,
    skipSnaps: false,
    inViewThreshold: 1,
    active: true // Always start with an active carousel
  });
  
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
  
  const toggleFullscreen = () => {
    if (isFullscreen) {
      exitFullscreen();
    } else {
      enterFullscreen();
    }
  };
  
  const enterFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;
    
    if (container.requestFullscreen) {
      container.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else if ((container as any).webkitRequestFullscreen) {
      (container as any).webkitRequestFullscreen();
    } else if ((container as any).mozRequestFullScreen) {
      (container as any).mozRequestFullScreen();
    }
  };
  
  const exitFullscreen = () => {
    if (document.exitFullscreen) {
      document.exitFullscreen().catch(err => {
        console.error(`Error attempting to exit fullscreen: ${err.message}`);
      });
    } else if ((document as any).webkitExitFullscreen) {
      (document as any).webkitExitFullscreen();
    } else if ((document as any).mozCancelFullScreen) {
      (document as any).mozCancelFullScreen();
    }
  };
  
  useEffect(() => {
    if (!carouselApi) return;
    
    if (isZoomed) {
      console.log('Disabling carousel (zoomed in)');
      
      setCarouselOptions(prev => ({
        ...prev,
        active: false,
        draggable: false
      }));
      
      carouselApi.off("select");
      carouselApi.off("scroll");
      carouselApi.off("settle");
      carouselApi.off("pointerDown");
      carouselApi.off("pointerUp");
      carouselApi.off("pointerMove");
      
      if (containerRef.current) {
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
      console.log('Enabling carousel (zoomed out)');
      
      setCarouselOptions(prev => ({
        ...prev,
        active: true,
        draggable: true
      }));
      
      if (carouselApi && carouselApi.reInit) {
        try {
          carouselApi.reInit();
        } catch (e) {
          console.error("Failed to reinitialize carousel:", e);
        }
      }
      
      if (carouselApi) {
        try {
          carouselApi.on("select", () => setCurrentIndex(carouselApi.selectedScrollSnap()));
          carouselApi.on("scroll");
          carouselApi.on("settle");
          carouselApi.on("pointerDown");
          carouselApi.on("pointerUp");
          carouselApi.on("pointerMove");
        } catch (e) {
          console.error("Failed to re-enable carousel events:", e);
        }
      }
      
      const overlay = document.getElementById('zoom-overlay');
      if (overlay && containerRef.current && containerRef.current.contains(overlay)) {
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
    console.log('Zoom state changed:', zoomed);
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
