import React, { useMemo } from 'react';
import { getCategoryIcon } from '../utils/categoryIcons';

const StoreMap = ({ store, items = [], userLocation, onEntranceClick, onItemClick, accentColor = '#3b82f6' }) => {
    const WIDTH = 100;
    const HEIGHT = 100;
    const ENTRANCE_X = 50;
    const ENTRANCE_Y = 95;

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

    const getHash = (str) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = (hash << 5) - hash + str.charCodeAt(i);
            hash |= 0;
        }
        return Math.abs(hash);
    };

    return (
        <div className="w-full h-full bg-slate-50 relative overflow-hidden touch-none select-none">
            <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full h-full">
                <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                    <path d="M 10 0 L 0 0 0 10" fill="none" stroke="black" strokeOpacity="0.03"/>
                </pattern>
                <rect width="100" height="100" fill="url(#grid)" />

                {store.aisles.map(aisle => {
                    const isVertical = aisle.height > aisle.width;
                    const SHELF_DEPTH = 1.5;

                    return (
                        <g key={aisle.id}>
                            <rect 
                                x={aisle.x} y={aisle.y} 
                                width={aisle.width} height={aisle.height} 
                                fill="#e2e8f0" 
                                rx="1"
                            />
                            {isVertical ? (
                                <>
                                    <rect x={aisle.x} y={aisle.y} width={SHELF_DEPTH} height={aisle.height} fill="#94a3b8" rx="0.5" />
                                    <rect x={aisle.x + aisle.width - SHELF_DEPTH} y={aisle.y} width={SHELF_DEPTH} height={aisle.height} fill="#94a3b8" rx="0.5" />
                                </>
                            ) : (
                                <>
                                    <rect x={aisle.x} y={aisle.y} width={aisle.width} height={SHELF_DEPTH} fill="#94a3b8" rx="0.5" />
                                    <rect x={aisle.x} y={aisle.y + aisle.height - SHELF_DEPTH} width={aisle.width} height={SHELF_DEPTH} fill="#94a3b8" rx="0.5" />
                                </>
                            )}
                            
                            {aisle.width > 8 && aisle.height > 8 && (
                                <text 
                                    x={aisle.x + aisle.width/2} 
                                    y={aisle.y + aisle.height/2} 
                                    fontSize="2" 
                                    textAnchor="middle"
                                    dominantBaseline="middle"
                                    fill="#64748b"
                                    opacity="0.6"
                                    fontWeight="bold"
                                    style={isVertical ? { writingMode: 'vertical-rl', textOrientation: 'mixed' } : {}}
                                >
                                    {aisle.name.replace("Aisle ", "").replace(" Section", "")}
                                </text>
                            )}
                        </g>
                    );
                })}

                {items.filter(i => !i.is_done && i.aisle_id).map((item, idx) => {
                    const aisle = store.aisles.find(a => a.id === item.aisle_id);
                    if (!aisle) return null;

                    const isVertical = aisle.height > aisle.width;
                    const hash = getHash(item.id + item.name); 
                    const lengthPos = 0.1 + ((hash % 80) / 100); 
                    const isSideA = hash % 2 === 0;

                    let itemX, itemY;
                    const OFFSET = 0; 

                    if (isVertical) {
                        itemY = aisle.y + (aisle.height * lengthPos);
                        itemX = isSideA ? (aisle.x + OFFSET) : (aisle.x + aisle.width - OFFSET);
                    } else {
                        itemX = aisle.x + (aisle.width * lengthPos);
                        itemY = isSideA ? (aisle.y + OFFSET) : (aisle.y + aisle.height - OFFSET);
                    }

                    const IconComponent = getCategoryIcon(item.category);
                    const labelY = itemY + 4.5; 

                    return (
                        <g 
                            key={item.id} 
                            onClick={() => onItemClick && onItemClick(item)}
                            className="cursor-pointer"
                        >
                            <circle cx={itemX} cy={itemY} r="5" fill="transparent" />
                            {/* Theme Color Pulse */}
                            <circle cx={itemX} cy={itemY} r="3" fill={accentColor} fillOpacity="0.2" className="animate-ping" />
                            <circle cx={itemX} cy={itemY} r="2.2" fill={accentColor} stroke="white" strokeWidth="0.2" />
                            
                            <foreignObject x={itemX - 1.5} y={itemY - 1.5} width="3" height="3">
                                <div className="flex items-center justify-center w-full h-full text-white pointer-events-none">
                                    <IconComponent size={2.5} strokeWidth={2.5} />
                                </div>
                            </foreignObject>

                            <text 
                                x={itemX} 
                                y={labelY} 
                                fontSize="2" 
                                textAnchor="middle" 
                                fill="#1e293b" 
                                fontWeight="bold"
                                className="pointer-events-none bg-white/80"
                                style={{ textShadow: "0px 0px 2px white" }}
                            >
                                {item.name}
                            </text>
                        </g>
                    )
                })}

                {userLocation && (
                    <g transform={`translate(${userLocation.x}, ${userLocation.y})`} className="transition-all duration-700 ease-out pointer-events-none">
                         <circle r="5" fill="#3b82f6" fillOpacity="0.3" className="animate-ping" />
                         <circle r="2.5" fill="#3b82f6" stroke="white" strokeWidth="0.5" className="shadow-lg" />
                    </g>
                )}

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
