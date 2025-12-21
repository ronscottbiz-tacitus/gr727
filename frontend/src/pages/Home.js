import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, CardContent, CardHeader, CardTitle } from '../components/ui';
import { ShoppingCart, MapPin } from 'lucide-react';

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center space-y-8 p-4">
      <div className="bg-blue-100 p-6 rounded-full">
        <ShoppingCart className="w-16 h-16 text-blue-600" />
      </div>
      
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight text-slate-900">GroceryGo</h1>
        <p className="text-slate-600 text-lg max-w-xs mx-auto">
          Your personal navigator for grocery shopping. Find everything faster.
        </p>
      </div>

      <div className="w-full max-w-xs space-y-4">
        <Button 
          size="lg" 
          className="w-full text-lg h-14" 
          onClick={() => navigate('/stores')}
        >
          <MapPin className="mr-2 h-5 w-5" />
          Find a Store
        </Button>
      </div>
    </div>
  );
};

export default Home;
