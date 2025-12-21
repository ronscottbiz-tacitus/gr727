import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getRoute, getStore } from '../api';
import { Button, Card, CardContent, Badge } from '../components/ui';
import { Map, Navigation, ArrowRight } from 'lucide-react';
import StoreMap from '../components/StoreMap';

const RouteOverview = () => {
  const { listId } = useParams();
  const navigate = useNavigate();
  const [routeData, setRouteData] = useState(null);
  const [storeData, setStoreData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRoute = async () => {
      try {
        const res = await getRoute(listId);
        setRouteData(res.data);
        
        // Fetch full store data for the map layout
        // Assuming routeData includes store_id or we have to fetch list to get store_id
        // Wait, routeData response currently doesn't have store_id directly but has store_name
        // Ideally we should modify getRoute to return store_id or fetch list first.
        // Let's quick fetch list to get store_id safely
        // Actually, let's just cheat for MVP -> We know the store from the list context usually
        // But better code:
      } catch (err) {
        console.error(err);
      }
    };
    fetchRoute();
  }, [listId]);

  useEffect(() => {
      // Once we have routeData, we need to fetch the store layout
      // But we lack store_id in route response.
      // Let's fetch the list first to get store_id
      const loadStore = async () => {
        if(!routeData) return;
        
        // Note: In a real app, I'd include store_id in the route response.
        // For now, I'll fetch the list again or search stores. 
        // Actually, let's just add store_id to the backend response for /route would be best practice
        // but since I can't easily change backend right this second without another file edit, 
        // I'll fetch the list details which has store_id
        try {
             const { getList } = require('../api');
             const listRes = await getList(listId);
             const storeRes = await getStore(listRes.data.store_id);
             setStoreData(storeRes.data);
        } catch(e) {
            console.error("Failed to load store map data", e);
        } finally {
            setLoading(false);
        }
      }
      loadStore();
  }, [routeData, listId]);

  if (loading) return <div className="p-8 text-center">Calculating route...</div>;

  return (
    <div className="space-y-6 p-4 pb-24 relative min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Your Route</h2>
          <p className="text-slate-500 text-sm">{routeData?.store_name}</p>
        </div>
        <div className="bg-blue-100 p-2 rounded-full">
          <Map className="h-6 w-6 text-blue-600" />
        </div>
      </div>

      <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="font-semibold text-slate-700 text-sm mb-2 px-2 flex items-center">
            <span className="w-2 h-2 rounded-full bg-blue-500 mr-2"></span>
            Overview Map
        </h3>
        
        {/* NEW VISUAL MAP */}
        <StoreMap 
            store={storeData} 
            route={routeData?.route} 
        />
      </div>

      <div className="space-y-3">
        <h3 className="font-semibold text-lg">Route Steps</h3>
        {routeData?.route.map((step, idx) => (
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
