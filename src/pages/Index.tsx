
import React from 'react';
import ImageGallery from '../components/ImageGallery';

const Index = () => {
  return (
    <div className="w-screen h-screen overflow-hidden bg-black text-white has-safe-area">
      {/* Set totalImages to 24 to match all uploaded images */}
      <ImageGallery totalImages={24} imagePrefix="lovable-uploads/" />
    </div>
  );
};

export default Index;
