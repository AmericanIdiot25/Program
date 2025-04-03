
import React from 'react';
import ImageGallery from '../components/ImageGallery';

const Index = () => {
  // Set document background color to black for notch area
  React.useEffect(() => {
    document.documentElement.style.backgroundColor = '#000000';
    document.body.style.backgroundColor = '#000000';
    
    return () => {
      document.documentElement.style.backgroundColor = '';
      document.body.style.backgroundColor = '';
    };
  }, []);

  return (
    <div className="w-screen h-screen overflow-hidden bg-black text-white has-safe-area">
      <ImageGallery totalImages={26} imagePrefix="lovable-uploads/page" />
    </div>
  );
};

export default Index;
