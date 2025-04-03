
import React from 'react';
import ImageGallery from '../components/ImageGallery';

const Index = () => {
  return (
    <div className="w-screen h-screen overflow-hidden bg-black text-white has-safe-area">
      {/* Adjust totalImages to match the number of uploaded images */}
      <ImageGallery totalImages={6} imagePrefix="lovable-uploads/" />
    </div>
  );
};

export default Index;
