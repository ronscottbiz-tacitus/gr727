import React from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import SalesDashboard from "./pages/SalesDashboard";
import RetailerHome from "./pages/RetailerHome";
import ListBuilder from "./pages/ListBuilder";
import Navigation from "./pages/Navigation";
import TripComplete from "./pages/TripComplete";

// Main App component with Routing
function App() {
  return (
    <div className="bg-slate-50 min-h-screen text-slate-900 font-sans">
      <BrowserRouter>
        <div className="max-w-md mx-auto bg-white min-h-screen shadow-xl overflow-hidden relative">
          <Routes>
            {/* New Sales Flow */}
            <Route path="/" element={<SalesDashboard />} />
            <Route path="/demo/:retailerId" element={<RetailerHome />} />
            
            {/* Reused Components (Will need Logic update to handle retailerId prop/param) */}
            <Route path="/demo/:retailerId/list/:listId" element={<ListBuilder />} />
            <Route path="/list/:listId/navigate" element={<Navigation />} /> {/* Legacy or Direct */}
            <Route path="/demo/:retailerId/list/:listId/navigate" element={<Navigation />} />
            <Route path="/list/:listId/complete" element={<TripComplete />} />
          </Routes>
        </div>
      </BrowserRouter>
    </div>
  );
}

export default App;
