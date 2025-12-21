import React from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import StoreSelect from "./pages/StoreSelect";
import ListBuilder from "./pages/ListBuilder";
import RouteOverview from "./pages/RouteOverview";
import Navigation from "./pages/Navigation";
import TripComplete from "./pages/TripComplete";

// Main App component with Routing
function App() {
  return (
    <div className="bg-slate-50 min-h-screen text-slate-900 font-sans">
      <BrowserRouter>
        <div className="max-w-md mx-auto bg-white min-h-screen shadow-xl overflow-hidden relative">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/stores" element={<StoreSelect />} />
            <Route path="/list/:listId" element={<ListBuilder />} />
            <Route path="/list/:listId/route" element={<RouteOverview />} />
            <Route path="/list/:listId/navigate" element={<Navigation />} />
            <Route path="/list/:listId/complete" element={<TripComplete />} />
          </Routes>
        </div>
      </BrowserRouter>
    </div>
  );
}

export default App;
