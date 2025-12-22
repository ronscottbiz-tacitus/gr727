import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getRoute, updateItemStatus, getList, getStore } from '../api';
import { Button } from '../components/ui';
import { Check, ArrowLeft, MapPin } from 'lucide-react';
import StoreMap from '../components/StoreMap';

const Navigation = () => {
  const { listId } = useParams();
  const navigate = useNavigate();
  const [route, setRoute] = useState(null);
  const [storeData, setStoreData] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null); // {x, y}

  useEffect(() => {
    const init = async () => {
      try {
        const routeRes = await getRoute(listId);
        setRoute(routeRes.data);
        
        // Flatten items from route steps for easier list rendering
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

  const handleToggleItem = async (itemId, isDone) => {
    // Optimistic Update
    setItems(prev => prev.map(i => i.id === itemId ? { ...i, is_done: isDone } : i));
    
    // If marking as done, update User Location to this item's aisle location
    if (isDone && storeData) {
        const item = items.find(i => i.id === itemId);
        if (item && item.aisle_id) {
            const aisle = storeData.aisles.find(a => a.id === item.aisle_id);
            if (aisle) {
                // Set location to center of aisle
                setUserLocation({
                    x: aisle.x + (aisle.width / 2),
                    y: aisle.y + (aisle.height / 2)
                });
            }
        }
    }

    try {
        await updateItemStatus(listId, itemId, isDone);
    } catch(e) {
        console.error("Failed to sync status", e);
    }
  };

  const handleSetEntrance = (loc) => {
      setUserLocation(loc);
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  // Split items into Pending and Done
  const pendingItems = items.filter(i => !i.is_done);
  const doneItems = items.filter(i => i.is_done);

  return (
    <div className="flex flex-col h-screen max-h-screen bg-slate-50">
      {/* Top Map Area - Fixed Size (Large) */}
      <div className="bg-slate-900 text-white flex-none shadow-lg z-20 h-[55vh] relative flex flex-col">
        <div className="flex items-center justify-between p-4 pb-2 z-10">
           <h2 className="font-bold text-lg flex items-center">
               <MapPin className="mr-2 h-5 w-5 text-blue-400" />
               Store Locator
           </h2>
           <Button variant="ghost" size="sm" className="text-slate-300" onClick={() => navigate('/')}>
               Exit
           </Button>
        </div>
        
        <div className="flex-1 w-full px-4 pb-4 overflow-hidden relative">
             <div className="h-full w-full bg-white/5 rounded-xl border border-white/10 shadow-inner">
                 <StoreMap 
                    store={storeData} 
                    items={items} 
                    userLocation={userLocation}
                    onEntranceClick={handleSetEntrance}
                 />
                 
                 {/* Instruction Overlay */}
                 {!userLocation && (
                     <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/80 backdrop-blur px-4 py-2 rounded-full text-sm font-bold animate-pulse pointer-events-none">
                         Tap Entrance to Start
                     </div>
                 )}
             </div>
        </div>
      </div>

      {/* Checklist Area - Scrollable */}
      <div className="flex-1 overflow-y-auto bg-white rounded-t-2xl -mt-4 z-30 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] relative">
        <div className="p-4 space-y-6 min-h-full">
            
            {/* Pending Items */}
            <div className="space-y-3">
                <h3 className="font-bold text-slate-800 flex items-center">
                    To Pick
                    <span className="ml-2 bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">
                        {pendingItems.length}
                    </span>
                </h3>
                
                {pendingItems.length === 0 && (
                    <div className="text-center py-8 text-slate-400">
                        All items picked! 🎉
                    </div>
                )}

                {pendingItems.map((item) => (
                    <div 
                        key={item.id} 
                        onClick={() => handleToggleItem(item.id, true)}
                        className="flex items-center p-3 bg-white border border-slate-100 rounded-xl shadow-sm hover:border-blue-200 active:bg-blue-50 transition-all cursor-pointer"
                    >
                        <div className="h-10 w-10 rounded-full border-2 border-slate-200 flex items-center justify-center mr-3 bg-slate-50">
                             <div className="h-3 w-3 rounded-full bg-slate-200"></div>
                        </div>
                        <div className="flex-1">
                            <div className="font-semibold text-slate-900">{item.name}</div>
                            <div className="text-xs text-slate-500 font-medium flex items-center">
                                <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                                    {item.aisle_name || "Unmapped"}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Done Items */}
            {doneItems.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-slate-100">
                    <h3 className="font-bold text-slate-400 text-sm uppercase tracking-wider">Completed</h3>
                    {doneItems.map((item) => (
                        <div 
                            key={item.id} 
                            onClick={() => handleToggleItem(item.id, false)}
                            className="flex items-center p-2 opacity-50 hover:opacity-100 transition-opacity cursor-pointer"
                        >
                            <div className="h-6 w-6 rounded-full bg-green-500 flex items-center justify-center mr-3">
                                <Check className="h-3 w-3 text-white" />
                            </div>
                            <span className="text-slate-500 line-through">{item.name}</span>
                        </div>
                    ))}
                </div>
            )}
            
            {pendingItems.length === 0 && doneItems.length > 0 && (
                 <Button className="w-full mt-4 bg-green-600 hover:bg-green-700 h-12 text-lg" onClick={() => navigate(`/list/${listId}/complete`)}>
                     Finish Trip
                 </Button>
            )}

        </div>
      </div>
    </div>
  );
};

export default Navigation;
