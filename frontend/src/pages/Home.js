import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui';
import { MapPin } from 'lucide-react';

const Home = () => {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const [opacity, setOpacity] = useState(0); 

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.currentTime < 0.5) setOpacity(1); 
    if (video.duration && video.currentTime > video.duration - 0.5) setOpacity(0);
  };

  const handleLoadedData = () => {
      setOpacity(1);
  };

  return (
    <div className="relative h-screen w-full overflow-hidden bg-slate-900 flex flex-col items-center justify-center">
      {/* Background Video */}
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        onTimeUpdate={handleTimeUpdate}
        onLoadedData={handleLoadedData}
        className="absolute top-0 left-0 min-w-full min-h-full object-cover z-0 transition-opacity duration-500 ease-in-out"
        style={{ opacity: opacity * 0.7 }} // Lower opacity slightly for logo contrast
      >
        <source 
          src="https://customer-assets.emergentagent.com/job_app-priority/artifacts/k1b03mb2_Claymation_Grocery_App_Video_Generation.mp4" 
          type="video/mp4" 
        />
      </video>

      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/40 z-10" />

      {/* Content */}
      <div className="relative z-20 flex flex-col items-center text-center space-y-8 p-6 max-w-md animate-in fade-in zoom-in duration-1000">
        
        {/* Brand Logo */}
        <div className="flex flex-col items-center">
            <img 
                src="https://customer-assets.emergentagent.com/job_app-priority/artifacts/kkrjknkt_get2_logo.png" 
                alt="GroceryGo Logo" 
                className="w-48 h-auto drop-shadow-2xl mb-4"
            />
            {/* Keeping the subtitle but removing the H1 since Logo replaces it */}
            <p className="text-blue-100 text-lg font-medium drop-shadow-md max-w-xs">
                Your magic compass for every store.
            </p>
        </div>

        {/* Action Button */}
        <div className="w-full pt-4">
          <Button 
            size="lg" 
            className="w-full text-lg h-14 bg-blue-600 hover:bg-blue-700 text-white shadow-xl border border-blue-400/30 rounded-xl transition-transform hover:scale-105" 
            onClick={() => navigate('/stores')}
          >
            <MapPin className="mr-2 h-5 w-5" />
            Find a Store
          </Button>
        </div>
        
        {/* Footer Text */}
        <p className="text-white/60 text-xs mt-8">
          Optimized for Safeway, Target, and Home Depot
        </p>
      </div>
    </div>
  );
};

export default Home;
