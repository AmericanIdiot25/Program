
import React from 'react';
import ImageGallery from '../components/ImageGallery';

const Index = () => {
  return (
    <div className="w-screen h-screen overflow-hidden bg-black text-white has-safe-area">
      <ImageGallery totalImages={26} imagePrefix="lovable-uploads/page" />
    </div>
  );
};

export default Index;
