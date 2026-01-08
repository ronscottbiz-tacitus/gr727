import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui';
import { CheckCircle, Home, MapPin } from 'lucide-react';

const TripComplete = () => {
  const navigate = useNavigate();
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
      // Small delay for entrance animation
      setTimeout(() => setShowContent(true), 100);
  }, []);

  return (
    <div className="relative h-screen w-full overflow-hidden bg-slate-900 flex flex-col items-center justify-center">
      
      {/* Reused Video Background - Blurred for "End State" Vibe */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute top-0 left-0 min-w-full min-h-full object-cover z-0 opacity-60 blur-sm scale-105" // Added blur and scale to avoid edge artifacts
      >
        <source 
          src="https://customer-assets.emergentagent.com/job_app-priority/artifacts/k1b03mb2_Claymation_Grocery_App_Video_Generation.mp4" 
          type="video/mp4" 
        />
      </video>

      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/50 z-10" />

      {/* Main Card */}
      <div className={`relative z-20 flex flex-col items-center text-center space-y-8 p-8 max-w-md w-full transition-all duration-1000 ease-out transform ${showContent ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
        
        {/* Animated Checkmark Icon */}
        <div className="relative">
            <div className="absolute inset-0 bg-green-500 blur-2xl opacity-30 animate-pulse rounded-full" />
            <div className="bg-white p-6 rounded-full shadow-2xl relative z-10 animate-in zoom-in duration-500 delay-200">
                <CheckCircle className="w-20 h-20 text-green-600 drop-shadow-sm" />
            </div>
        </div>
        
        <div className="space-y-4 text-white">
          <h1 className="text-4xl font-extrabold tracking-tight drop-shadow-xl">
            Trip Complete!
          </h1>
          <p className="text-blue-100 text-lg font-medium drop-shadow-md">
            You grabbed everything. <br/>Great job!
          </p>
        </div>

        <div className="w-full space-y-4 pt-8">
          <Button 
            size="lg" 
            className="w-full text-lg h-14 bg-green-600 hover:bg-green-700 text-white shadow-xl rounded-xl transition-transform hover:scale-105" 
            onClick={() => navigate('/')}
          >
            <Home className="mr-2 h-5 w-5" />
            Back to Home
          </Button>
          
          <Button 
            variant="outline"
            className="w-full text-lg h-14 bg-transparent border-2 border-white/20 text-white hover:bg-white/10" 
            onClick={() => navigate('/stores')}
          >
            <MapPin className="mr-2 h-5 w-5" />
            Start New Trip
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TripComplete;
