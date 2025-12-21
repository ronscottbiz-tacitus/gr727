import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui';
import { CheckCircle, Home } from 'lucide-react';

const TripComplete = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center space-y-8 bg-gradient-to-b from-blue-50 to-white">
      <div className="bg-green-100 p-8 rounded-full animate-in zoom-in duration-500">
        <CheckCircle className="w-20 h-20 text-green-600" />
      </div>
      
      <div className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Trip Complete!</h1>
        <p className="text-slate-600 text-lg">
          You've grabbed everything on your list. Great job!
        </p>
      </div>

      <div className="w-full max-w-xs space-y-4 pt-8">
        <Button 
          size="lg" 
          className="w-full text-lg h-14" 
          onClick={() => navigate('/')}
        >
          <Home className="mr-2 h-5 w-5" />
          Back to Home
        </Button>
      </div>
    </div>
  );
};

export default TripComplete;
