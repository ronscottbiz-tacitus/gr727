import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getRoute, updateItemStatus, getList, getStore } from '../api';
import { Button, Card, CardContent } from '../components/ui';
import { Check, ChevronRight, ArrowLeft } from 'lucide-react';
import StoreMap from '../components/StoreMap';

const Navigation = () => {
  const { listId } = useParams();
  const navigate = useNavigate();
  const [route, setRoute] = useState(null);
  const [storeData, setStoreData] = useState(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [checkedItems, setCheckedItems] = useState({});

  useEffect(() => {
    const init = async () => {
      try {
        // 1. Fetch Route
        const routeRes = await getRoute(listId);
        setRoute(routeRes.data);
        
        // 2. Fetch Store Map Data (need list -> store_id first)
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

  // Calculate progress
  const progress = ((currentStepIndex + 1) / route.route.length) * 100;

  return (
    <div className="flex flex-col h-screen max-h-screen">
      {/* Top Map Context */}
      <div className="bg-slate-900 text-white p-4 flex-none shadow-lg z-10">
        <div className="flex items-center justify-between mb-2">
           <h2 className="font-bold text-lg">In-Store Navigation</h2>
           <span className="text-sm bg-slate-800 px-2 py-1 rounded">
             Step {currentStep.step_number} / {route.route.length}
           </span>
        </div>
        
        {/* SMALL VISUAL MAP for Context */}
        <div className="h-40 w-full mb-2 bg-white/10 rounded-lg overflow-hidden border border-white/20">
             <StoreMap 
                store={storeData} 
                route={route.route} 
                currentStepIndex={currentStepIndex}
             />
        </div>

        <div className="text-center">
            <span className="text-xl font-bold text-blue-200">{currentStep.aisle_name}</span>
        </div>
      </div>

      {/* Checklist Area - Scrollable */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-100">
                <h3 className="font-semibold text-slate-900">Items to Pick</h3>
                <p className="text-sm text-slate-500">Check them off as you grab them</p>
            </div>
            
            <div className="divide-y divide-slate-100">
                {currentStep.items.map((item) => {
                    const isChecked = checkedItems[item.id] || item.is_done;
                    return (
                        <div 
                            key={item.id} 
                            onClick={() => handleToggleItem(item.id, !isChecked)}
                            className={`p-4 flex items-center space-x-4 cursor-pointer transition-colors ${isChecked ? 'bg-slate-50' : 'hover:bg-slate-50'}`}
                        >
                            <div className={`
                                h-6 w-6 rounded border flex items-center justify-center transition-colors
                                ${isChecked ? 'bg-green-500 border-green-500 text-white' : 'border-slate-300 bg-white'}
                            `}>
                                {isChecked && <Check className="h-4 w-4" />}
                            </div>
                            <span className={`flex-1 font-medium ${isChecked ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                                {item.name}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-4 bg-white border-t border-slate-200 flex-none flex space-x-3">
        {currentStepIndex > 0 && (
             <Button variant="outline" onClick={handlePrev} className="flex-none w-14">
                 <ArrowLeft className="h-5 w-5" />
             </Button>
        )}
        <Button onClick={handleNext} className="flex-1 text-lg h-12">
            {isLastStep ? "Finish Trip" : "Next Aisle"}
            {!isLastStep && <ChevronRight className="ml-2 h-5 w-5" />}
        </Button>
      </div>
    </div>
  );
};

export default Navigation;
