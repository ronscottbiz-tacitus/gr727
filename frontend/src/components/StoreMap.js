import React, { useMemo } from 'react';

const StoreMap = ({ store, route, currentStepIndex }) => {
    // Default canvas size
    const WIDTH = 100;
    const HEIGHT = 100;

    // Helper to check if an aisle is in the route
    const isAisleActive = (aisleId) => {
        return route?.some(step => step.aisle_id === aisleId);
    };

    // Helper to check if it's the CURRENT target
    const isCurrentTarget = (aisleId) => {
        if (!route || currentStepIndex === undefined) return false;
        const currentStep = route[currentStepIndex];
        return currentStep && currentStep.aisle_id === aisleId;
    };

    // Calculate path points
    const pathPoints = useMemo(() => {
        if (!route || !store) return "";
        
        // Start at Entrance (Bottom Left)
        let points = [[10, 95]]; 
        
        // Add centers of each active aisle
        store.aisles.forEach(aisle => {
             // Find if this aisle is in the route and at what step order
             const stepIndex = route.findIndex(r => r.aisle_id === aisle.id);
             if (stepIndex !== -1) {
                 // Calculate center
                 const cx = aisle.x + (aisle.width / 2);
                 const cy = aisle.y + (aisle.height / 2);
                 points.push({ x: cx, y: cy, order: stepIndex });
             }
        });

        // Sort points by route step order
        const sortedRoutePoints = points.slice(1).sort((a, b) => a.order - b.order);
        
        // Re-assemble
        const finalPoints = [
            [10, 95], // Entrance
            ...sortedRoutePoints.map(p => [p.x, p.y]),
            [90, 95]  // Checkout
        ];

        return finalPoints.map(p => p.join(',')).join(' ');
    }, [store, route]);

    if (!store) return null;

    return (
        <div className="w-full aspect-square bg-slate-50 rounded-xl border border-slate-200 overflow-hidden relative shadow-inner">
            <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full h-full">
                {/* Background Grid Lines (Optional) */}
                <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                    <path d="M 10 0 L 0 0 0 10" fill="none" stroke="black" strokeOpacity="0.05"/>
                </pattern>
                <rect width="100" height="100" fill="url(#grid)" />

                {/* Fixed Elements: Entrance & Checkout */}
                <g transform="translate(5, 90)">
                    <rect width="10" height="5" fill="#22c55e" rx="1" />
                    <text x="5" y="8" fontSize="3" textAnchor="middle" fill="#15803d" fontWeight="bold">ENTER</text>
                </g>
                <g transform="translate(85, 90)">
                    <rect width="10" height="5" fill="#3b82f6" rx="1" />
                    <text x="5" y="8" fontSize="3" textAnchor="middle" fill="#1d4ed8" fontWeight="bold">EXIT</text>
                </g>

                {/* Path Line */}
                {pathPoints && (
                    <polyline 
                        points={pathPoints} 
                        fill="none" 
                        stroke="#3b82f6" 
                        strokeWidth="1.5" 
                        strokeDasharray="4" 
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="animate-pulse"
                    />
                )}

                {/* Aisles */}
                {store.aisles.map(aisle => {
                    const isActive = isAisleActive(aisle.id);
                    const isCurrent = isCurrentTarget(aisle.id);
                    
                    return (
                        <g key={aisle.id} transform={`translate(${aisle.x}, ${aisle.y})`}>
                            {/* Aisle Shape */}
                            <rect 
                                width={aisle.width} 
                                height={aisle.height} 
                                rx="2"
                                fill={isCurrent ? '#3b82f6' : (isActive ? '#bfdbfe' : '#e2e8f0')}
                                stroke={isCurrent ? '#1d4ed8' : (isActive ? '#60a5fa' : '#cbd5e1')}
                                strokeWidth="0.5"
                                className="transition-colors duration-300"
                            />
                            
                            {/* Aisle Label (Vertical text if tall) */}
                            {aisle.height > aisle.width ? (
                                <text 
                                    x={aisle.width/2} 
                                    y={aisle.height/2} 
                                    fontSize="3" 
                                    textAnchor="middle"
                                    dominantBaseline="middle"
                                    fill={isActive ? '#1e3a8a' : '#64748b'}
                                    fontWeight={isActive ? 'bold' : 'normal'}
                                    style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
                                >
                                    {aisle.name.replace("Aisle ", "")}
                                </text>
                            ) : (
                                <text 
                                    x={aisle.width/2} 
                                    y={aisle.height/2} 
                                    fontSize="3" 
                                    textAnchor="middle"
                                    dominantBaseline="middle"
                                    fill={isActive ? '#1e3a8a' : '#64748b'}
                                    fontWeight={isActive ? 'bold' : 'normal'}
                                >
                                    {aisle.name}
                                </text>
                            )}
                            
                            {/* Badge for Item Count if active */}
                            {isActive && (
                                <circle 
                                    cx={aisle.width} 
                                    cy="0" 
                                    r="3" 
                                    fill="#ef4444" 
                                    stroke="white"
                                    strokeWidth="0.5"
                                />
                            )}
                        </g>
                    );
                })}
            </svg>
        </div>
    );
};

export default StoreMap;
