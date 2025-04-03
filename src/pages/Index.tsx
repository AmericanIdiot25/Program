
import React from 'react';
import ImageGallery from '../components/ImageGallery';

const Index = () => {
  return (
    <div className="w-screen h-screen overflow-hidden bg-gallery-background text-white has-safe-area">
      <ImageGallery totalImages={24} imagePrefix="page" />
    </div>
  );
};

export default Index;
