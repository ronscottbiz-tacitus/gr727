import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui';
import { MapPin, RotateCcw } from 'lucide-react';

const Home = () => {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const [opacity, setOpacity] = useState(0); 
  const [activeTrip, setActiveTrip] = useState(null);

  useEffect(() => {
      // Check for active trip
      const lastList = localStorage.getItem('activeListId');
      if (lastList) {
          setActiveTrip(lastList);
      }
  }, []);

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
          src={process.env.PUBLIC_URL + "/assets/video.mp4"} 
          type="video/mp4" 
        />
      </video>

      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/40 z-10" />

      {/* Main Content (Centered) */}
      <div className="relative z-20 flex-1 flex flex-col items-center justify-center text-center space-y-8 p-6 max-w-md w-full animate-in fade-in zoom-in duration-1000">
        
        {/* APP LOGO - SVG */}
        <div className="flex flex-col items-center">
            <img 
                src={process.env.PUBLIC_URL + "/assets/logo.svg"} 
                alt="GroceryGo" 
                className="w-64 h-auto object-contain mb-4"
                style={{ 
                    filter: 'invert(1) brightness(200%) drop-shadow(0 4px 6px rgba(0,0,0,0.5))' 
                }}
            />
            <p className="text-white text-lg font-medium drop-shadow-md max-w-xs">
                Right where you need to go
            </p>
        </div>

        {/* Action Buttons */}
        <div className="w-full pt-4 space-y-3">
          <Button 
            size="lg" 
            className="w-full text-lg h-14 bg-transparent border-2 border-white/90 text-white font-semibold shadow-xl rounded-xl transition-all duration-300 hover:bg-white hover:text-slate-900 hover:scale-105 active:scale-95 backdrop-blur-sm" 
            onClick={() => navigate('/stores')}
          >
            <MapPin className="mr-2 h-5 w-5" />
            Find a Store
          </Button>

          {/* Resume Button (Conditional) */}
          {activeTrip && (
              <Button 
                variant="ghost"
                className="w-full text-white/80 hover:text-white hover:bg-white/10"
                onClick={() => navigate(`/list/${activeTrip}/navigate`)}
              >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Resume Last Trip
              </Button>
          )}
        </div>
      </div>

      {/* Footer Branding (Get2) - Updated Clean SVG */}
      <div className="relative z-20 pb-24 flex flex-col items-center opacity-90 transition-opacity">
          <span className="text-xs text-white/70 uppercase tracking-[0.2em] mb-3 font-bold shadow-sm">
              Powered By
          </span>
          <img 
            src={process.env.PUBLIC_URL + "/assets/brand.svg"} 
            alt="Get2" 
            className="h-12 w-auto drop-shadow-lg"
            style={{ 
                // Clean SVG (Black on Transparent) -> Invert to White
                filter: 'invert(1) brightness(200%) drop-shadow(0 2px 4px rgba(0,0,0,0.5))'
            }}
          />
      </div>
    </div>
  );
};

export default Home;
