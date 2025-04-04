
import React, { useState, useEffect } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { ErrorBoundary } from '../components/ErrorBoundary';
import { AspectRatio } from "@/components/ui/aspect-ratio";

interface ImageGalleryProps {
  totalImages: number;
  imagePrefix?: string;
}

const ImageGallery = ({ totalImages, imagePrefix = 'page' }: ImageGalleryProps) => {
  const [loadedImages, setLoadedImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    // Create an array to store image paths for each index (1 to totalImages)
    const imagePathsArray = Array.from({ length: totalImages }, (_, i) => {
      const index = i + 1;
      
      // For each index, try different path patterns that might work
      return [
        `/lovable-uploads/page${index}.png`,
        `${window.location.pathname}lovable-uploads/page${index}.png`,
        `${import.meta.env.BASE_URL || '/'}lovable-uploads/page${index}.png`,
        `/lovable-uploads/page${index}.png`,
        `lovable-uploads/page${index}.png`,
        `page${index}.png`
      ];
    });

    const allPaths = imagePathsArray.flat();
    
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
        // Find a working path for each image index
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
    <div className="w-full h-full bg-black">
      <ErrorBoundary fallback={<div className="w-full h-full flex items-center justify-center text-white">Something went wrong with the image viewer.</div>}>
        <ScrollArea className="h-full w-full">
          <div className="flex flex-col items-center pb-20">
            {loadedImages.map((src, index) => (
              <div key={index} className="w-full max-w-4xl mx-auto my-2">
                <img 
                  src={src}
                  alt={`Page ${index + 1}`}
                  className="w-full h-auto object-contain rounded-md"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </ScrollArea>
      </ErrorBoundary>
    </div>
  );
};

export default ImageGallery;
