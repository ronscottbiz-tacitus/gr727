import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../components/ui';
import { themes } from '../utils/themes';
import RetailerShell from '../components/RetailerShell';
import { Map, ArrowRight } from 'lucide-react';
import { getStores, createList } from '../api';

const RetailerHome = () => {
  const { retailerId } = useParams();
  const navigate = useNavigate();
  const theme = themes[retailerId] || themes.safeway; // Fallback to Safeway

  // Logic to start the GroceryGo flow
  const handleStartInStoreMode = async () => {
      try {
          // 1. Find the store ID for this retailer
          const storesRes = await getStores();
          const store = storesRes.data.find(s => s.name.includes(theme.name));
          
          if (store) {
              const listRes = await createList(store.id);
              navigate(`/demo/${retailerId}/list/${listRes.data.id}`);
          } else {
              // Fallback if store not found in DB (e.g. newly deployed)
              // Just use first store or alert
              if (storesRes.data.length > 0) {
                  const firstStore = storesRes.data[0];
                  const listRes = await createList(firstStore.id);
                  navigate(`/demo/${retailerId}/list/${listRes.data.id}`);
              } else {
                  alert("No stores found in database. Please allow time for seed or redeploy.");
              }
          }
      } catch(e) {
          console.error(e);
      }
  };

  return (
    <RetailerShell retailerId={retailerId}>
        <div className="h-full overflow-y-auto bg-slate-100">
            {/* Fake Hero Banner */}
            <div className="relative h-64 bg-slate-900">
                <img src={theme.heroImage} className="w-full h-full object-cover opacity-80" alt="Store" />
                <div className="absolute bottom-6 left-6 text-white">
                    <h2 className="text-3xl font-bold mb-1">{theme.welcome}</h2>
                    <p className="text-sm opacity-90">Weekly Ad • Coupons • Rewards</p>
                </div>
            </div>

            {/* The Integration Point */}
            <div className="p-4 -mt-6 relative z-10">
                <div className="bg-white rounded-xl shadow-lg p-6 flex flex-col items-center text-center space-y-4 border border-slate-100">
                    <div className={`p-3 rounded-full bg-opacity-10`} style={{ backgroundColor: theme.accent }}>
                        <Map className={`h-8 w-8`} style={{ color: theme.accent }} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-slate-900">Shopping In-Store?</h3>
                        <p className="text-slate-500 text-sm mt-1">Use our new visual navigator to find items instantly.</p>
                    </div>
                    <Button 
                        className={`w-full h-12 text-lg text-white shadow-md ${theme.color} ${theme.hover}`}
                        onClick={handleStartInStoreMode}
                    >
                        Start In-Store Mode
                        <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                </div>
            </div>

            {/* Fake Feed Content */}
            <div className="p-4 space-y-4">
                <div className="h-32 bg-white rounded-lg shadow-sm border border-slate-200 p-4">
                    <div className="h-4 w-1/3 bg-slate-200 rounded mb-2" />
                    <div className="h-16 bg-slate-100 rounded" />
                </div>
                <div className="h-32 bg-white rounded-lg shadow-sm border border-slate-200 p-4">
                    <div className="h-4 w-1/3 bg-slate-200 rounded mb-2" />
                    <div className="h-16 bg-slate-100 rounded" />
                </div>
            </div>
        </div>
    </RetailerShell>
  );
};

export default RetailerHome;
