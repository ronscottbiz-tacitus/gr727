import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getRoute, updateItemStatus, getList, getStore } from '../api';
import { Button, Card, CardContent } from '../components/ui';
import { Check, ChevronRight, ArrowLeft, Maximize2, Minimize2 } from 'lucide-react';
import StoreMap from '../components/StoreMap';

const Navigation = () => {
  const { listId } = useParams();
  const navigate = useNavigate();
  const [route, setRoute] = useState(null);
  const [storeData, setStoreData] = useState(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [checkedItems, setCheckedItems] = useState({});
  const [isMapExpanded, setIsMapExpanded] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const routeRes = await getRoute(listId);
        setRoute(routeRes.data);
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
    setCheckedItems(prev => ({ ...prev, [itemId]: isDone }));
    try {
        await updateItemStatus(listId, itemId, isDone);
    } catch(e) {
        console.error("Failed to sync status", e);
    }
  };

  const handleNext = () => {
    if (currentStepIndex < route.route.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
      window.scrollTo(0, 0);
    } else {
      navigate(`/list/${listId}/complete`);
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading navigation...</div>;

  const currentStep = route.route[currentStepIndex];
  const isLastStep = currentStepIndex === route.route.length - 1;

  return (
    <div className="flex flex-col h-screen max-h-screen bg-slate-50">
      {/* Top Map Context - Made Collapsible/Expandable */}
      <div className={`bg-slate-900 text-white flex-none shadow-lg z-20 transition-all duration-300 ease-in-out relative ${isMapExpanded ? 'h-[60vh]' : 'h-48'}`}>
        
        {/* Header Row */}
        <div className="flex items-center justify-between p-4 pb-2">
           <div className="flex flex-col">
               <h2 className="font-bold text-lg leading-tight">Navigation</h2>
               <span className="text-xs text-slate-400">Step {currentStep.step_number} of {route.route.length}</span>
           </div>
           
           <button 
             onClick={() => setIsMapExpanded(!isMapExpanded)}
             className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
           >
             {isMapExpanded ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
           </button>
        </div>
        
        {/* Map Container */}
        <div className={`w-full px-4 transition-all duration-300 ${isMapExpanded ? 'h-[calc(100%-4rem)]' : 'h-28'}`}>
             <div className="h-full w-full bg-white/5 rounded-lg overflow-hidden border border-white/10 relative">
                 <StoreMap 
                    store={storeData} 
                    route={route.route} 
                    currentStepIndex={currentStepIndex}
                 />
                 {/* Current Target Label Overlay */}
                 <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-md px-3 py-1 rounded text-sm font-bold border border-white/20 shadow-lg">
                    {currentStep.aisle_name}
                 </div>
             </div>
        </div>
      </div>

      {/* Checklist Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 bg-white border-b border-slate-100 sticky top-0 z-10">
                <h3 className="font-semibold text-slate-900 flex items-center justify-between">
                    <span>Items to Pick</span>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                        {currentStep.items.length}
                    </span>
                </h3>
            </div>
            
            <div className="divide-y divide-slate-100">
                {currentStep.items.map((item) => {
                    const isChecked = checkedItems[item.id] || item.is_done;
                    return (
                        <div 
                            key={item.id} 
                            onClick={() => handleToggleItem(item.id, !isChecked)}
                            className={`p-4 flex items-center space-x-4 cursor-pointer transition-colors active:bg-slate-100 ${isChecked ? 'bg-slate-50/50' : 'hover:bg-slate-50'}`}
                        >
                            <div className={`
                                h-8 w-8 rounded-full border-2 flex items-center justify-center transition-all duration-200 shrink-0
                                ${isChecked ? 'bg-green-500 border-green-500 text-white scale-110' : 'border-slate-300 bg-white'}
                            `}>
                                {isChecked && <Check className="h-5 w-5" />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <span className={`block font-medium text-lg truncate ${isChecked ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                                    {item.name}
                                </span>
                                {item.category && !isChecked && (
                                    <span className="text-xs text-slate-500">{item.category}</span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-4 bg-white border-t border-slate-200 flex-none flex space-x-3 safe-area-bottom">
        {currentStepIndex > 0 && (
             <Button variant="outline" onClick={handlePrev} className="flex-none w-14 h-14 rounded-xl border-slate-300">
                 <ArrowLeft className="h-6 w-6" />
             </Button>
        )}
        <Button onClick={handleNext} className={`flex-1 text-lg h-14 rounded-xl shadow-lg shadow-blue-500/20 ${isLastStep ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
            {isLastStep ? "Finish Trip" : "Next Aisle"}
            {!isLastStep && <ChevronRight className="ml-2 h-6 w-6" />}
        </Button>
      </div>
    </div>
  );
};

export default Navigation;
