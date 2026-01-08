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
    <div className="relative h-screen w-full overflow-hidden bg-slate-900 flex flex-col items-center justify-between">
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
        style={{ opacity: opacity * 0.7 }}
      >
        <source 
          src="https://customer-assets.emergentagent.com/job_app-priority/artifacts/k1b03mb2_Claymation_Grocery_App_Video_Generation.mp4" 
          type="video/mp4" 
        />
      </video>

      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/40 z-10" />

      {/* Main Content (Centered) */}
      <div className="relative z-20 flex-1 flex flex-col items-center justify-center text-center space-y-8 p-6 max-w-md w-full animate-in fade-in zoom-in duration-1000">
        
        {/* APP LOGO */}
        <div className="flex flex-col items-center">
            <img 
                src="https://customer-assets.emergentagent.com/job_app-priority/artifacts/c8otiebj_GroceryGo-logo%203.svg" 
                alt="GroceryGo" 
                className="w-64 h-auto object-contain mb-4"
                style={{ 
                    filter: 'invert(1) brightness(200%) drop-shadow(0 4px 6px rgba(0,0,0,0.5))' 
                }}
            />
            <p className="text-blue-100 text-lg font-medium drop-shadow-md max-w-xs">
                Your magic compass for every store.
            </p>
        </div>

        {/* Action Button - Updated to Transparent Outline Style */}
        <div className="w-full pt-4">
          <Button 
            size="lg" 
            className="w-full text-lg h-14 bg-transparent border-2 border-white/90 text-white font-semibold shadow-xl rounded-xl transition-all duration-300 hover:bg-white hover:text-slate-900 hover:scale-105 active:scale-95 backdrop-blur-sm" 
            onClick={() => navigate('/stores')}
          >
            <MapPin className="mr-2 h-5 w-5" />
            Find a Store
          </Button>
        </div>
      </div>

      {/* Footer Branding */}
      <div className="relative z-20 pb-24 flex flex-col items-center opacity-90 transition-opacity">
          <span className="text-xs text-white/70 uppercase tracking-[0.2em] mb-3 font-bold shadow-sm">
              Powered By
          </span>
          <img 
            src="https://customer-assets.emergentagent.com/job_app-priority/artifacts/84q7ml2j_get2_logo%201.svg" 
            alt="Get2" 
            className="h-12 w-auto drop-shadow-lg"
            style={{ 
                filter: 'invert(1) brightness(200%) contrast(200%)',
                mixBlendMode: 'screen'
            }}
          />
      </div>
    </div>
  );
};

export default Home;
