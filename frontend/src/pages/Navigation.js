import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getRoute, updateItemStatus, getList, getStore } from '../api';
import { Button } from '../components/ui';
import { Check, ArrowLeft, ChevronUp, ChevronDown, ShoppingBag } from 'lucide-react';
import StoreMap from '../components/StoreMap';
import { getCategoryIcon } from '../utils/categoryIcons';
import { themes } from '../utils/themes';

const Navigation = () => {
  const { listId, retailerId } = useParams();
  const navigate = useNavigate();
  const [route, setRoute] = useState(null);
  const [storeData, setStoreData] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null); 
  const [isSheetExpanded, setIsSheetExpanded] = useState(false);
  
  const sheetRef = useRef(null);
  const theme = retailerId ? themes[retailerId] : { color: 'bg-blue-600', hover: 'hover:bg-blue-700', accent: '#3b82f6' };

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
    const isDone = !item.is_done;
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_done: isDone } : i));
    
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

  const pendingItems = items.filter(i => !i.is_done);
  const doneItems = items.filter(i => i.is_done);

  return (
    <div className="h-screen w-full bg-slate-50 relative overflow-hidden flex flex-col">
      
      {/* FULL SCREEN MAP LAYER */}
      <div className="absolute inset-0 z-0">
          <StoreMap 
            store={storeData} 
            items={items} 
            userLocation={userLocation}
            onEntranceClick={handleSetEntrance}
            onItemClick={handleToggleItem}
            accentColor={theme.accent}
          />
      </div>

      {/* Top Bar Overlay */}
      <div className="absolute top-0 left-0 right-0 p-4 z-10 flex justify-between items-start pointer-events-none">
          <div className="bg-white/90 backdrop-blur shadow-lg rounded-full px-4 py-2 flex items-center pointer-events-auto cursor-pointer border border-white/20" onClick={() => navigate(retailerId ? `/demo/${retailerId}` : '/')}>
               <ArrowLeft className="h-5 w-5 mr-2 text-slate-700" />
               <span className="font-bold text-slate-800">{storeData?.name}</span>
          </div>
      </div>

      {/* Floating Action Button for Finish (Only if done) - Theme Colored */}
      {pendingItems.length === 0 && items.length > 0 && !isSheetExpanded && (
          <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2 z-20 w-auto animate-in slide-in-from-bottom-5 fade-in duration-300">
              <Button 
                className={`${theme.color} ${theme.hover} h-14 px-8 rounded-full shadow-2xl font-bold text-lg border-2 border-white/20`} 
                onClick={() => navigate(`/list/${listId}/complete`)}
              >
                  Finish Trip
              </Button>
          </div>
      )}

      {/* Minimized Bottom Sheet */}
      <div 
        ref={sheetRef}
        className={`absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-[0_-5px_20px_rgba(0,0,0,0.1)] z-20 transition-all duration-300 ease-in-out flex flex-col border-t border-slate-100
            ${isSheetExpanded ? 'h-[70vh]' : 'h-16'}`}
      >
          {/* Handle / Minimal Header */}
          <div 
             className="w-full h-16 flex items-center justify-between px-6 cursor-pointer flex-none bg-white rounded-t-2xl"
             onClick={() => setIsSheetExpanded(!isSheetExpanded)}
          >
              <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-full bg-opacity-10`} style={{ backgroundColor: theme.accent, opacity: 0.2 }}>
                      <ShoppingBag className="h-4 w-4" style={{ color: theme.accent }} />
                  </div>
                  {/* Re-rendering ShoppingBag for color since bg opacity affects parent */}
                  <div className="absolute left-8 pointer-events-none">
                       <ShoppingBag className="h-4 w-4" style={{ color: theme.accent }} />
                  </div>

                  <div className="ml-4">
                      <span className="font-bold text-slate-800 text-sm block">
                          {pendingItems.length} items remaining
                      </span>
                      {pendingItems.length > 0 && (
                          <span className="text-xs text-slate-500 block">
                              Next: {pendingItems[0].name}
                          </span>
                      )}
                  </div>
              </div>
              {isSheetExpanded ? <ChevronDown className="text-slate-400" /> : <ChevronUp className="text-slate-400" />}
          </div>

          {/* List Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50 pb-20"> 
               {pendingItems.map((item) => {
                   const Icon = getCategoryIcon(item.category);
                   return (
                    <div 
                        key={item.id} 
                        onClick={() => handleToggleItem(item)}
                        className="flex items-center p-3 bg-white border border-slate-200 rounded-xl shadow-sm active:scale-[0.98] transition-transform"
                    >
                        <div 
                            className="h-10 w-10 rounded-full flex items-center justify-center mr-3 border border-opacity-20"
                            style={{ backgroundColor: `${theme.accent}20`, borderColor: theme.accent, color: theme.accent }}
                        >
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
                           <div key={item.id} className="flex items-center p-2 opacity-50" onClick={() => handleToggleItem(item)}>
                               <Check className="h-4 w-4 mr-2 text-green-600" />
                               <span className="text-slate-500 line-through">{item.name}</span>
                           </div>
                       ))}
                   </div>
               )}
          </div>
      </div>

    </div>
  );
};

export default Navigation;
