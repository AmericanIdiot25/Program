
import React from 'react';

interface PhotoItemProps {
  src: string;
  alt?: string;
}

const PhotoItem = ({ src, alt = "Gallery item" }: PhotoItemProps) => {
  return (
    <div className="photo-container relative w-full bg-black overflow-hidden">
      <div className="w-full flex items-center justify-center">
        <img
          src={src}
          alt={alt}
          className="w-full h-auto max-h-none object-contain select-none"
          draggable={false}
          loading="lazy"
          onDragStart={(e) => e.preventDefault()}
        />
      </div>
    </div>
  );
};

export default PhotoItem;
