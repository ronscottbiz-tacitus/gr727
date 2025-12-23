import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getRoute, updateItemStatus, getList, getStore } from '../api';
import { Button } from '../components/ui';
import { Check, ArrowLeft, MapPin, ChevronUp, ChevronDown, ShoppingBag } from 'lucide-react';
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
  const [isSheetExpanded, setIsSheetExpanded] = useState(false);
  
  // Ref for bottom sheet swipe
  const sheetRef = useRef(null);

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

  const handleToggleItem = async (itemId, isDone) => {
    // Optimistic Update
    setItems(prev => prev.map(i => i.id === itemId ? { ...i, is_done: isDone } : i));
    
    // Auto-Move User
    if (isDone && storeData) {
        const item = items.find(i => i.id === itemId);
        if (item && item.aisle_id) {
            const aisle = storeData.aisles.find(a => a.id === item.aisle_id);
            if (aisle) {
                setUserLocation({
                    x: aisle.x + (aisle.width / 2),
                    y: aisle.y + (aisle.height / 2)
                });
            }
        }
    }

    try {
        await updateItemStatus(listId, itemId, isDone);
    } catch(e) { console.error(e); }
  };

  const handleSetEntrance = (loc) => {
      setUserLocation(loc);
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-900 text-white">Loading Map...</div>;

  const pendingItems = items.filter(i => !i.is_done);
  const doneItems = items.filter(i => i.is_done);

  return (
    <div className="h-screen w-full bg-slate-900 relative overflow-hidden flex flex-col">
      
      {/* FULL SCREEN MAP LAYER */}
      <div className="absolute inset-0 z-0">
          <StoreMap 
            store={storeData} 
            items={items} 
            userLocation={userLocation}
            onEntranceClick={handleSetEntrance}
          />
      </div>

      {/* Top Bar Overlay */}
      <div className="absolute top-0 left-0 right-0 p-4 z-10 flex justify-between items-start pointer-events-none">
          <div className="bg-white/90 backdrop-blur shadow-lg rounded-full px-4 py-2 flex items-center pointer-events-auto" onClick={() => navigate('/')}>
               <ArrowLeft className="h-5 w-5 mr-2 text-slate-700" />
               <span className="font-bold text-slate-800">{storeData?.name}</span>
          </div>
      </div>

      {/* Floating Bottom Sheet List */}
      <div 
        ref={sheetRef}
        className={`absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.2)] z-20 transition-all duration-500 ease-in-out flex flex-col
            ${isSheetExpanded ? 'h-[80vh]' : 'h-[25vh]'}`}
      >
          {/* Handle / Header */}
          <div 
             className="w-full p-4 flex flex-col items-center cursor-pointer flex-none border-b border-slate-100"
             onClick={() => setIsSheetExpanded(!isSheetExpanded)}
          >
              <div className="w-12 h-1.5 bg-slate-300 rounded-full mb-3" />
              <div className="w-full flex justify-between items-center px-2">
                  <div className="flex items-center">
                      <ShoppingBag className="text-blue-600 mr-2 h-5 w-5" />
                      <span className="font-bold text-lg text-slate-800">
                          {pendingItems.length} items left
                      </span>
                  </div>
                  {isSheetExpanded ? <ChevronDown className="text-slate-400" /> : <ChevronUp className="text-slate-400" />}
              </div>
          </div>

          {/* List Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
               {pendingItems.map((item) => {
                   const Icon = getCategoryIcon(item.category);
                   return (
                    <div 
                        key={item.id} 
                        onClick={() => handleToggleItem(item.id, true)}
                        className="flex items-center p-3 bg-white border border-slate-200 rounded-xl shadow-sm active:scale-[0.98] transition-transform"
                    >
                        <div className="h-10 w-10 rounded-full bg-red-50 text-red-500 flex items-center justify-center mr-3 border border-red-100">
                             <Icon size={20} />
                        </div>
                        <div className="flex-1">
                            <div className="font-semibold text-slate-900">{item.name}</div>
                            <div className="text-xs text-slate-500">{item.aisle_name}</div>
                        </div>
                        <div className="h-6 w-6 rounded-full border-2 border-slate-200" />
                    </div>
                   );
               })}

               {doneItems.length > 0 && (
                   <div className="pt-4 mt-4 border-t border-slate-200">
                       <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Done</h4>
                       {doneItems.map(item => (
                           <div key={item.id} className="flex items-center p-2 opacity-50" onClick={() => handleToggleItem(item.id, false)}>
                               <Check className="h-4 w-4 mr-2 text-green-600" />
                               <span className="text-slate-500 line-through">{item.name}</span>
                           </div>
                       ))}
                   </div>
               )}

               {pendingItems.length === 0 && (
                   <Button className="w-full mt-4 bg-green-600 h-12 text-lg" onClick={() => navigate(`/list/${listId}/complete`)}>
                       Finish Shopping
                   </Button>
               )}
          </div>
      </div>

    </div>
  );
};

export default Navigation;
