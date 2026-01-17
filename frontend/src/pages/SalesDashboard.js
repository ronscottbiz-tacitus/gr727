import React from 'react';
import { useNavigate } from 'react-router-dom';
import { themes } from '../utils/themes';
import { Button } from '../components/ui';
import { ArrowRight } from 'lucide-react';

const SalesDashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 space-y-8">
        <div className="text-center space-y-4">
            <h1 className="text-4xl font-extrabold tracking-tight">GroceryGo</h1>
            <p className="text-slate-400 max-w-md mx-auto text-lg">
                The In-Store Navigation Platform. <br/>
                <span className="text-white font-medium">Select a partner to view the integration demo.</span>
            </p>
        </div>

        <div className="grid gap-4 w-full max-w-sm">
            {Object.entries(themes).map(([key, theme]) => (
                <div 
                    key={key}
                    onClick={() => navigate(`/demo/${key}`)}
                    className="group bg-white hover:bg-slate-50 cursor-pointer rounded-xl p-4 flex items-center justify-between transition-all duration-200 transform hover:scale-105 active:scale-95"
                >
                    <div className="flex items-center space-x-4">
                        <div className={`h-12 w-12 rounded-full ${theme.color} flex items-center justify-center text-white font-bold text-xl`}>
                            {theme.name[0]}
                        </div>
                        <div className="text-left">
                            <h3 className="font-bold text-slate-900 text-lg">{theme.name}</h3>
                            <p className="text-slate-500 text-xs">View Integration</p>
                        </div>
                    </div>
                    <ArrowRight className="text-slate-300 group-hover:text-slate-900 transition-colors" />
                </div>
            ))}
        </div>
        
        <p className="text-xs text-slate-600 fixed bottom-6">
            Internal Sales Demo v2.0
        </p>
    </div>
  );
};

export default SalesDashboard;
