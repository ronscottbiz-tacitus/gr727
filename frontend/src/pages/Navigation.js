import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getRoute, updateItemStatus, getList, getStore } from '../api';
import { Button } from '../components/ui';
import { ArrowLeft, CheckCircle, List } from 'lucide-react';
import StoreMap from '../components/StoreMap';
import { getCategoryIcon } from '../utils/categoryIcons';

const Navigation = () => {
  const { listId } = useParams();
  const navigate = useNavigate();
  const [route, setRoute] = useState(null);
  const [storeData, setStoreData] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null); 
  const [showListModal, setShowListModal] = useState(false); // Only show if user asks

  useEffect(() => {
    const init = async () => {
      try {
        const routeRes = await getRoute(listId);
        setRoute(routeRes.data);
        
        const allItems = [];
        routeRes.data.route.forEach(step => {
            step.items.forEach(item => {
                allItems.push({ ...item, aisle_id: step.aisle_id, aisle_name: step.aisle_name });
            });
        });
        setItems(allItems);

        const listRes = await getList(listId);
        const storeRes = await getStore(listRes.data.store_id);
        setStoreData(storeRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [listId]);

  const handleToggleItem = async (item) => {
      // If item is already done, maybe uncheck it? Or just ignore for map taps?
      // Let's toggle.
      const isDone = !item.is_done;
      
      // Optimistic
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_done: isDone } : i));

      // Move User
      if (isDone && storeData && item.aisle_id) {
          const aisle = storeData.aisles.find(a => a.id === item.aisle_id);
          if (aisle) {
              setUserLocation({
                  x: aisle.x + (aisle.width / 2),
                  y: aisle.y + (aisle.height / 2)
              });
          }
      }

      try {
          await updateItemStatus(listId, item.id, isDone);
      } catch(e) { console.error(e); }
  };

  const handleSetEntrance = (loc) => {
      setUserLocation(loc);
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-900 text-white">Loading Map...</div>;

  const pendingCount = items.filter(i => !i.is_done).length;

  return (
    <div className="h-screen w-full bg-slate-50 relative overflow-hidden flex flex-col">
      
      {/* FULL SCREEN MAP */}
      <div className="absolute inset-0 z-0">
          <StoreMap 
            store={storeData} 
            items={items} 
            userLocation={userLocation}
            onEntranceClick={handleSetEntrance}
            onItemClick={handleToggleItem}
          />
      </div>

      {/* Top Header */}
      <div className="absolute top-0 left-0 right-0 p-4 z-10 flex justify-between items-start pointer-events-none">
          <div className="bg-white/90 backdrop-blur shadow-lg rounded-full px-4 py-2 flex items-center pointer-events-auto cursor-pointer" onClick={() => navigate('/')}>
               <ArrowLeft className="h-5 w-5 mr-2 text-slate-700" />
               <span className="font-bold text-slate-800">{storeData?.name}</span>
          </div>

          <div className="bg-white/90 backdrop-blur shadow-lg rounded-full px-4 py-2 flex items-center pointer-events-auto cursor-pointer" onClick={() => setShowListModal(true)}>
               <List className="h-5 w-5 mr-2 text-blue-600" />
               <span className="font-bold text-slate-800">{pendingCount} left</span>
          </div>
      </div>

      {/* Completion Overlay (if all done) */}
      {pendingCount === 0 && items.length > 0 && (
          <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 z-20 w-3/4 animate-in slide-in-from-bottom-10 fade-in duration-500">
              <Button className="w-full bg-green-600 hover:bg-green-700 h-14 text-lg shadow-xl rounded-full" onClick={() => navigate(`/list/${listId}/complete`)}>
                  <CheckCircle className="mr-2 h-6 w-6" />
                  Finish Trip
              </Button>
          </div>
      )}

      {/* Optional List Modal (Hidden by default as requested) */}
      {showListModal && (
          <div className="absolute inset-0 bg-black/50 z-30 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-sm" onClick={() => setShowListModal(false)}>
              <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl h-[70vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                  <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                      <h3 className="font-bold text-lg">Shopping List</h3>
                      <Button variant="ghost" size="sm" onClick={() => setShowListModal(false)}>Close</Button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-2">
                       {items.map(item => {
                           const Icon = getCategoryIcon(item.category);
                           return (
                               <div key={item.id} className="flex items-center p-3 border border-slate-100 rounded-lg" onClick={() => handleToggleItem(item)}>
                                   <div className={`h-8 w-8 rounded-full flex items-center justify-center mr-3 ${item.is_done ? 'bg-green-100 text-green-600' : 'bg-red-50 text-red-500'}`}>
                                       <Icon size={16} />
                                   </div>
                                   <span className={`flex-1 font-medium ${item.is_done ? 'line-through text-slate-400' : 'text-slate-900'}`}>{item.name}</span>
                                   {item.is_done && <CheckCircle className="h-5 w-5 text-green-500" />}
                               </div>
                           )
                       })}
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};

export default Navigation;
