import React from 'react';
import { useNavigate } from 'react-router-dom';
import { themes } from '../utils/themes';
import { MapPin, ShoppingCart, User, Menu } from 'lucide-react';

const RetailerShell = ({ retailerId, children }) => {
  const navigate = useNavigate();
  const theme = themes[retailerId] || themes.safeway;

  return (
    <div className="h-screen w-full bg-slate-50 flex flex-col relative overflow-hidden font-sans">
      
      {/* Retailer Header (Fake App Chrome) */}
      <header className={`flex-none ${theme.color} text-white p-4 shadow-md z-50 flex items-center justify-between`}>
          <div className="flex items-center space-x-2">
              <Menu className="h-6 w-6" />
              <span className="font-bold text-lg tracking-tight">{theme.name}</span>
          </div>
          <div className="flex items-center space-x-4">
              <ShoppingCart className="h-6 w-6" />
          </div>
      </header>

      {/* Main Content Area - Where GroceryGo lives or the Mock Home lives */}
      <main className="flex-1 relative overflow-hidden">
          {children}
      </main>

      {/* Retailer Tab Bar (Fake) */}
      <footer className="flex-none bg-white border-t border-slate-200 h-16 flex items-center justify-around text-xs text-slate-400 z-50 safe-area-bottom">
          <div className="flex flex-col items-center space-y-1">
              <div className="font-bold text-slate-900">Home</div>
              <div className={`h-1 w-1 rounded-full ${theme.color}`} />
          </div>
          <div className="flex flex-col items-center space-y-1">
              <div>Deals</div>
          </div>
          <div className="flex flex-col items-center space-y-1">
              <div>Cart</div>
          </div>
          <div className="flex flex-col items-center space-y-1">
              <User className="h-5 w-5" />
              <div>Account</div>
          </div>
      </footer>
    </div>
  );
};

export default RetailerShell;
