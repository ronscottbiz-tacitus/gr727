import React, { useMemo } from 'react';

const StoreMap = ({ store, items = [], userLocation, onEntranceClick }) => {
    // Default canvas size
    const WIDTH = 100;
    const HEIGHT = 100;

    // Group items by Aisle ID
    const aisleStatus = useMemo(() => {
        if (!store || !items) return {};
        const status = {}; // { aisleId: { count: 0, hasUnchecked: false, checkedCount: 0 } }

        items.forEach(item => {
            if (!item.aisle_id) return;
            if (!status[item.aisle_id]) {
                status[item.aisle_id] = { total: 0, unchecked: 0, checked: 0 };
            }
            status[item.aisle_id].total += 1;
            if (item.is_done) {
                status[item.aisle_id].checked += 1;
            } else {
                status[item.aisle_id].unchecked += 1;
            }
        });
        return status;
    }, [store, items]);

    if (!store) return null;

    // Define Entrance Zone (Bottom Left/Center usually)
    // Based on previous layout, Entrance was visually around (5, 90) or (50, 95)
    // Let's explicitly define a clickable entrance area
    const ENTRANCE_X = 50;
    const ENTRANCE_Y = 95;

    return (
        <div className="w-full h-full bg-slate-50 rounded-xl border border-slate-200 overflow-hidden relative shadow-inner touch-none">
            <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full h-full">
                {/* Background Grid */}
                <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                    <path d="M 10 0 L 0 0 0 10" fill="none" stroke="black" strokeOpacity="0.05"/>
                </pattern>
                <rect width="100" height="100" fill="url(#grid)" />

                {/* Aisles */}
                {store.aisles.map(aisle => {
                    const stat = aisleStatus[aisle.id];
                    const hasItems = stat && stat.total > 0;
                    const isAllDone = stat && stat.unchecked === 0 && stat.total > 0;
                    const hasPending = stat && stat.unchecked > 0;

                    let fillColor = '#e2e8f0'; // Default Gray
                    let strokeColor = '#cbd5e1';
                    
                    if (hasPending) {
                        fillColor = '#bfdbfe'; // Light Blue
                        strokeColor = '#3b82f6'; // Blue
                    } else if (isAllDone) {
                        fillColor = '#dcfce7'; // Light Green
                        strokeColor = '#22c55e'; // Green
                    }

                    return (
                        <g key={aisle.id} transform={`translate(${aisle.x}, ${aisle.y})`}>
                            {/* Aisle Shape */}
                            <rect 
                                width={aisle.width} 
                                height={aisle.height} 
                                rx="2"
                                fill={fillColor}
                                stroke={strokeColor}
                                strokeWidth="0.5"
                                className="transition-colors duration-300"
                            />
                            
                            {/* Aisle Name */}
                            {aisle.height > aisle.width ? (
                                <text 
                                    x={aisle.width/2} 
                                    y={aisle.height/2} 
                                    fontSize="2.5" 
                                    textAnchor="middle"
                                    dominantBaseline="middle"
                                    fill={hasPending ? '#1e3a8a' : '#64748b'}
                                    fontWeight={hasPending ? 'bold' : 'normal'}
                                    style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
                                >
                                    {aisle.name.replace("Aisle ", "").replace(" Section", "")}
                                </text>
                            ) : (
                                <text 
                                    x={aisle.width/2} 
                                    y={aisle.height/2} 
                                    fontSize="2.5" 
                                    textAnchor="middle"
                                    dominantBaseline="middle"
                                    fill={hasPending ? '#1e3a8a' : '#64748b'}
                                    fontWeight={hasPending ? 'bold' : 'normal'}
                                >
                                    {aisle.name.replace("Aisle ", "").replace(" Section", "")}
                                </text>
                            )}

                            {/* Item Count Badge (Pin) */}
                            {hasPending && (
                                <g transform={`translate(${aisle.width/2}, -2)`}>
                                    <circle r="3" fill="#ef4444" stroke="white" strokeWidth="0.5" className="animate-in zoom-in" />
                                    <text y="1" fontSize="3" textAnchor="middle" fill="white" fontWeight="bold">
                                        {stat.unchecked}
                                    </text>
                                </g>
                            )}
                        </g>
                    );
                })}

                {/* Entrance / Start Point */}
                <g 
                    transform={`translate(${ENTRANCE_X}, ${ENTRANCE_Y})`} 
                    onClick={() => onEntranceClick && onEntranceClick({x: ENTRANCE_X, y: ENTRANCE_Y})}
                    className="cursor-pointer"
                >
                    <rect x="-10" y="-3" width="20" height="6" rx="3" fill="#22c55e" fillOpacity="0.2" stroke="#22c55e" strokeWidth="0.5" />
                    <text y="1" fontSize="3" textAnchor="middle" fill="#15803d" fontWeight="bold">
                        {userLocation ? "ENTRANCE" : "TAP TO START HERE"}
                    </text>
                    {!userLocation && (
                        <circle r="2" cx="0" cy="0" fill="#22c55e" className="animate-ping opacity-75" />
                    )}
                </g>

                {/* User Location Marker */}
                {userLocation && (
                    <g transform={`translate(${userLocation.x}, ${userLocation.y})`} className="transition-all duration-500 ease-in-out">
                         {/* Pulse Ring */}
                         <circle r="4" fill="#3b82f6" fillOpacity="0.2" className="animate-ping" />
                         {/* Core Dot */}
                         <circle r="2.5" fill="#3b82f6" stroke="white" strokeWidth="0.5" />
                         {/* Label */}
                         <text y="-4" fontSize="3" textAnchor="middle" fill="#1e3a8a" fontWeight="bold" className="bg-white">YOU</text>
                    </g>
                )}

            </svg>
        </div>
    );
};

export default StoreMap;
