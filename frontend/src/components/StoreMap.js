import React, { useMemo } from 'react';
import { getCategoryIcon } from '../utils/categoryIcons';

const StoreMap = ({ store, items = [], userLocation, onEntranceClick }) => {
    // Default canvas size
    const WIDTH = 100;
    const HEIGHT = 100;

    // Entrance coordinates based on Store Type?
    // Let's assume bottom center for all for now, or use store metadata if we had it.
    // For Safety/Target/HomeDepot seed, 50,95 is a safe "Entry Zone".
    const ENTRANCE_X = 50;
    const ENTRANCE_Y = 95;

    // Group items by Aisle for heatmapping, but we also want to draw specific item icons.
    const aisleStatus = useMemo(() => {
        if (!store || !items) return {};
        const status = {}; 
        items.forEach(item => {
            if (!item.aisle_id) return;
            if (!status[item.aisle_id]) status[item.aisle_id] = { total: 0, unchecked: 0, items: [] };
            status[item.aisle_id].total += 1;
            if (!item.is_done) {
                status[item.aisle_id].unchecked += 1;
                status[item.aisle_id].items.push(item);
            }
        });
        return status;
    }, [store, items]);

    if (!store) return null;

    return (
        <div className="w-full h-full bg-slate-50 relative overflow-hidden touch-none select-none">
            <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full h-full">
                {/* Background Grid */}
                <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                    <path d="M 10 0 L 0 0 0 10" fill="none" stroke="black" strokeOpacity="0.03"/>
                </pattern>
                <rect width="100" height="100" fill="url(#grid)" />

                {/* Aisles */}
                {store.aisles.map(aisle => {
                    const stat = aisleStatus[aisle.id];
                    const hasItems = stat && stat.unchecked > 0;
                    
                    let fillColor = '#e2e8f0'; 
                    let strokeColor = '#cbd5e1';
                    
                    if (hasItems) {
                        fillColor = '#dbeafe'; // Very light blue
                        strokeColor = '#60a5fa'; 
                    }

                    return (
                        <g key={aisle.id} transform={`translate(${aisle.x}, ${aisle.y})`}>
                            <rect 
                                width={aisle.width} 
                                height={aisle.height} 
                                rx="1"
                                fill={fillColor}
                                stroke={strokeColor}
                                strokeWidth="0.5"
                            />
                            
                            {/* Aisle Name (Small) */}
                            {aisle.width > 8 && aisle.height > 8 && (
                                <text 
                                    x={aisle.width/2} 
                                    y={aisle.height/2} 
                                    fontSize="2" 
                                    textAnchor="middle"
                                    dominantBaseline="middle"
                                    fill="#94a3b8"
                                    opacity="0.8"
                                    style={aisle.height > aisle.width ? { writingMode: 'vertical-rl', textOrientation: 'mixed' } : {}}
                                >
                                    {aisle.name.replace("Aisle ", "").replace(" Section", "")}
                                </text>
                            )}
                        </g>
                    );
                })}

                {/* ITEM ICONS (The "Pulsing" Representations) */}
                {items.filter(i => !i.is_done && i.aisle_id).map((item, idx) => {
                    const aisle = store.aisles.find(a => a.id === item.aisle_id);
                    if (!aisle) return null;

                    // Randomize position slightly within the aisle so icons don't stack perfectly
                    // Use item ID hash or index for deterministic jitter
                    const pseudoRandom = (idx * 7) % 10 / 10; 
                    const itemX = aisle.x + (aisle.width * 0.2) + (aisle.width * 0.6 * pseudoRandom);
                    const itemY = aisle.y + (aisle.height * 0.2) + (aisle.height * 0.6 * ((idx * 3)%10/10));

                    const IconComponent = getCategoryIcon(item.category);

                    return (
                        <g key={item.id} transform={`translate(${itemX}, ${itemY})`}>
                            {/* Pulsing Ring */}
                            <circle r="3" fill="#ef4444" fillOpacity="0.2" className="animate-ping" />
                            {/* Icon Background */}
                            <circle r="2" fill="#ef4444" stroke="white" strokeWidth="0.2" />
                            {/* ForeignObject to render React Icon */}
                            <foreignObject x="-1.5" y="-1.5" width="3" height="3">
                                <div className="flex items-center justify-center w-full h-full text-white">
                                    <IconComponent size={2.5} strokeWidth={2.5} />
                                </div>
                            </foreignObject>
                        </g>
                    )
                })}

                {/* User Location */}
                {userLocation && (
                    <g transform={`translate(${userLocation.x}, ${userLocation.y})`} className="transition-all duration-700 ease-out">
                         <circle r="5" fill="#3b82f6" fillOpacity="0.3" className="animate-ping" />
                         <circle r="2.5" fill="#3b82f6" stroke="white" strokeWidth="0.5" className="shadow-lg" />
                         {/* Direction Cone (Optional aesthetic) */}
                         <path d="M 0 0 L -2 -4 L 2 -4 Z" fill="#3b82f6" opacity="0.5" transform="rotate(45)" />
                    </g>
                )}

                {/* Entrance Trigger */}
                <g 
                    transform={`translate(${ENTRANCE_X}, ${ENTRANCE_Y})`} 
                    onClick={() => onEntranceClick && onEntranceClick({x: ENTRANCE_X, y: ENTRANCE_Y})}
                    className="cursor-pointer"
                >
                     {!userLocation && (
                        <>
                            <circle r="4" fill="#22c55e" className="animate-ping opacity-50" />
                            <circle r="2.5" fill="#22c55e" stroke="white" strokeWidth="0.5" />
                            <text y="5" fontSize="3" textAnchor="middle" fill="#166534" fontWeight="bold">START</text>
                        </>
                     )}
                </g>

            </svg>
        </div>
    );
};

export default StoreMap;
