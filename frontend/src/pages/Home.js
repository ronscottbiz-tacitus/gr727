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
        
        {/* APP LOGO - Refined Transparency */}
        <div className="flex flex-col items-center">
            {/* 
               Updated Filter:
               contrast(500%) -> Pushes grey artifacts to pure black or pure white.
               grayscale(1) -> Removes color noise.
               invert(1) -> Flips Black Text to White, White BG to Black.
               mix-blend-screen -> Hides the Black BG.
            */}
            <img 
                src="https://customer-assets.emergentagent.com/job_app-priority/artifacts/h01enox1_GroceryGo-logo.jpg" 
                alt="GroceryGo" 
                className="w-64 h-auto object-contain mb-4"
                style={{ 
                    filter: 'grayscale(100%) contrast(500%) invert(100%)',
                    mixBlendMode: 'screen' 
                }}
            />
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
      </div>

      {/* Footer Branding (Get2) */}
      <div className="relative z-20 pb-8 flex flex-col items-center opacity-80 hover:opacity-100 transition-opacity">
          <span className="text-[10px] text-white/60 uppercase tracking-widest mb-2 font-semibold">Powered By</span>
          <img 
            src="https://customer-assets.emergentagent.com/job_app-priority/artifacts/kkrjknkt_get2_logo.png" 
            alt="Get2" 
            className="h-8 w-auto drop-shadow-lg"
          />
      </div>
    </div>
  );
};

export default Home;
