import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getRoute } from '../api';
import { Button, Card, CardContent, Badge } from '../components/ui';
import { Map, Navigation, ArrowRight } from 'lucide-react';

const RouteOverview = () => {
  const { listId } = useParams();
  const navigate = useNavigate();
  const [routeData, setRouteData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRoute = async () => {
      try {
        const res = await getRoute(listId);
        setRouteData(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchRoute();
  }, [listId]);

  if (loading) return <div className="p-8 text-center">Calculating route...</div>;

  return (
    <div className="space-y-6 p-4 pb-24 relative min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Your Route</h2>
          <p className="text-slate-500 text-sm">{routeData.store_name}</p>
        </div>
        <div className="bg-blue-100 p-2 rounded-full">
          <Map className="h-6 w-6 text-blue-600" />
        </div>
      </div>

      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
        <h3 className="font-semibold text-slate-700 flex items-center">
          <span className="bg-slate-200 text-slate-600 text-xs px-2 py-1 rounded mr-2">MAP</span>
          Store Overview
        </h3>
        
        {/* Simple visual map representation */}
        <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 bg-green-100 border border-green-300 p-2 text-center text-xs font-bold text-green-800 rounded">
                ENTRANCE
            </div>
            {routeData.route.map((step) => (
                 <div key={step.aisle_id} className={`p-3 rounded border text-center text-sm font-medium ${
                     step.aisle_id === 'unmapped' 
                     ? 'bg-orange-50 border-orange-200 text-orange-800 col-span-2' 
                     : 'bg-white border-slate-200 text-slate-800'
                 }`}>
                     <div className="text-xs text-slate-400 mb-1">Step {step.step_number}</div>
                     {step.aisle_name}
                     <Badge variant="secondary" className="ml-1 text-[10px] h-5">{step.items.length}</Badge>
                 </div>
            ))}
            <div className="col-span-2 bg-slate-800 border border-slate-900 p-2 text-center text-xs font-bold text-white rounded">
                CHECKOUT
            </div>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="font-semibold text-lg">Route Steps</h3>
        {routeData.route.map((step, idx) => (
          <div key={idx} className="flex items-start space-x-3 p-3 bg-white border border-slate-100 rounded-lg shadow-sm">
            <div className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
              {step.step_number}
            </div>
            <div>
              <p className="font-medium text-slate-900">{step.aisle_name}</p>
              <p className="text-sm text-slate-500">
                {step.items.length} item{step.items.length !== 1 && 's'}: {step.items.map(i => i.name).slice(0, 3).join(', ')}
                {step.items.length > 3 && '...'}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 max-w-md mx-auto">
        <Button 
          className="w-full h-12 text-lg shadow-lg" 
          onClick={() => navigate(`/list/${listId}/navigate`)}
        >
          Start Navigation
          <Navigation className="ml-2 h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};

export default RouteOverview;
