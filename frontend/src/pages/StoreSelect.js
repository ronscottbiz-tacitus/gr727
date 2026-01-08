import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStores, createList } from '../api';
import { Card, CardHeader, CardTitle, CardContent, Button } from '../components/ui';
import { MapPin, ChevronRight, Store as StoreIcon } from 'lucide-react';

const StoreSelect = () => {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStores = async () => {
      try {
        const res = await getStores();
        setStores(res.data);
      } catch (err) {
        console.error("Failed to load stores", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStores();
  }, []);

  const handleSelectStore = async (storeId) => {
    try {
      const res = await createList(storeId);
      navigate(`/list/${res.data.id}`);
    } catch (err) {
      console.error("Failed to create list", err);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading stores...</div>;

      // Save session
      localStorage.setItem('activeListId', res.data.id);
  return (
    <div className="space-y-6 p-4">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">Choose a Store</h2>
        <p className="text-slate-500">Select where you're shopping today.</p>
      </div>

      <div className="grid gap-4">
        {stores.map((store) => (
          <Card 
            key={store.id} 
            className="cursor-pointer hover:border-blue-500 transition-colors"
            onClick={() => handleSelectStore(store.id)}
          >
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="bg-slate-100 p-3 rounded-full">
                  <StoreIcon className="h-6 w-6 text-slate-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{store.name}</h3>
                  <p className="text-sm text-slate-500">{store.address}</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-slate-400" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default StoreSelect;
