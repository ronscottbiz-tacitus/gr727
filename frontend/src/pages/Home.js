import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui';
import { MapPin } from 'lucide-react';

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="relative h-screen w-full overflow-hidden bg-slate-900 flex flex-col items-center justify-center">
      {/* Background Video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute top-0 left-0 min-w-full min-h-full object-cover z-0 opacity-80"
      >
        <source 
          src="https://customer-assets.emergentagent.com/job_app-priority/artifacts/k1b03mb2_Claymation_Grocery_App_Video_Generation.mp4" 
          type="video/mp4" 
        />
        Your browser does not support the video tag.
      </video>

      {/* Dark Overlay for Text Readability */}
      <div className="absolute inset-0 bg-black/40 z-10" />

      {/* Content */}
      <div className="relative z-20 flex flex-col items-center text-center space-y-8 p-6 max-w-md animate-in fade-in zoom-in duration-1000">
        
        {/* Logo / Title Area */}
        <div className="space-y-2">
          <h1 className="text-5xl font-extrabold tracking-tight text-white drop-shadow-xl">
            GroceryGo
          </h1>
          <p className="text-blue-100 text-lg font-medium drop-shadow-md">
            Your magic compass for every store.
          </p>
        </div>

        {/* Action Button */}
        <div className="w-full pt-8">
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
