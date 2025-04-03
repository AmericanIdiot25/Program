
import React from 'react';
import ImageGallery from '../components/ImageGallery';

const Index = () => {
  return (
    <div className="w-screen h-screen overflow-hidden bg-black text-white has-safe-area">
      <ImageGallery totalImages={24} imagePrefix="lovable-uploads/page" />
      
      <style jsx global>{`
        /* Styles to improve fullscreen experience */
        :fullscreen {
          background-color: black;
          width: 100vw !important;
          height: 100vh !important;
        }
        
        :-webkit-full-screen {
          background-color: black;
          width: 100vw !important;
          height: 100vh !important;
        }
        
        :-moz-full-screen {
          background-color: black;
          width: 100vw !important;
          height: 100vh !important;
        }
      `}</style>
    </div>
  );
};

export default Index;
