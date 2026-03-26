import React, { useState, useRef, useMemo } from 'react';
import { PERIOD_DATA } from '../../models/mockData';

export const EnhancedLineChart = ({ color = "#22C55E", period = 'Month', heightPixels = 280 }) => {
  const [hoveredPoint, setHoveredPoint] = useState<{ index: number, x: number, y: number } | null>(null);
  const containerRef = useRef<SVGSVGElement>(null);

  const data = useMemo(() => PERIOD_DATA[period] || PERIOD_DATA['Month'], [period]);
  
  const width = 400;
  const height = 100;
  const padding = { top: 15, bottom: 10, left: 10, right: 10 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const maxVal = Math.max(...data.map(d => d.value)) || 1;
  const yAxisTicks = [maxVal, maxVal * 0.66, maxVal * 0.33, 0];

  const points = data.map((d, i) => {
    const x = padding.left + (i * (chartWidth / (data.length - 1)));
    const y = padding.top + (chartHeight - (d.value / maxVal) * chartHeight);
    return { x, y, ...d };
  });

  const bezierPathD = useMemo(() => {
    if (points.length < 2) return "";
    let d = `M ${points[0].x},${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
        const x_mid = (points[i].x + points[i+1].x) / 2;
        const y_mid = (points[i].y + points[i+1].y) / 2;
        d += ` Q ${points[i].x},${points[i].y} ${x_mid},${y_mid}`;
    }
    d += ` T ${points[points.length-1].x},${points[points.length-1].y}`;
    return d;
  }, [points]);

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * width;
    
    let closestIndex = 0;
    let minDistance = Infinity;
    points.forEach((p, i) => {
      const distance = Math.abs(p.x - mouseX);
      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = i;
      }
    });

    setHoveredPoint({ 
      index: closestIndex, 
      x: points[closestIndex].x, 
      y: points[closestIndex].y 
    });
  };

  const handleMouseLeave = () => setHoveredPoint(null);

  const uniqueLabels = useMemo(() => {
    const labels: { label: string, x: number, index: number }[] = [];
    let lastLabel = "";
    points.forEach((p, i) => {
       if (p.label !== lastLabel) {
         labels.push({ label: p.label, x: p.x, index: i });
         lastLabel = p.label;
       }
    });
    return labels;
  }, [points]);

  return (
    <div className="w-full flex flex-col gap-4">
      <div style={{ height: `${heightPixels}px` }} className="flex w-full">
        <div className="flex flex-col justify-between py-4 pr-3 text-[10px] font-bold text-gray-400 border-r border-gray-50 w-12 text-right">
          {yAxisTicks.map((tick, i) => (
            <span key={i}>€{(tick / 1000).toFixed(1)}k</span>
          ))}
        </div>

        <div className="flex-1 relative group ml-2">
          <div className="absolute inset-x-0 top-0 bottom-0 flex flex-col justify-between pointer-events-none opacity-10 py-4 px-0">
            <div className="w-full border-t border-gray-300"></div>
            <div className="w-full border-t border-gray-300"></div>
            <div className="w-full border-t border-gray-300"></div>
            <div className="w-full border-t border-gray-300"></div>
          </div>

          <svg 
            ref={containerRef}
            viewBox={`0 0 ${width} ${height}`} 
            className="w-full h-full overflow-visible" 
            preserveAspectRatio="none"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            <defs>
              <linearGradient id={`gradient-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} />
                <stop offset="100%" stopColor="transparent" />
              </linearGradient>
            </defs>
            
            <path 
              d={`${bezierPathD} L${points[points.length-1].x},${height} L${points[0].x},${height} Z`} 
              fill={`url(#gradient-${color.replace('#','')})`}
              opacity="0.1"
              className="transition-all duration-700 ease-in-out"
            />
            
            <path 
              d={bezierPathD} 
              fill="none" 
              stroke={color}  strokeWidth="3" 
              strokeLinecap="round"
              className="transition-all duration-700 ease-in-out"
            />

            {hoveredPoint && (
              <line 
                x1={hoveredPoint.x} 
                y1="0" 
                x2={hoveredPoint.x} 
                y2={height} 
                stroke={color} 
                strokeWidth="1" 
                strokeDasharray="4 4" 
                opacity="0.3"
              />
            )}
            
            <circle 
              cx={hoveredPoint ? hoveredPoint.x : points[points.length - 1].x} 
              cy={hoveredPoint ? hoveredPoint.y : points[points.length - 1].y} 
              r="4" 
              fill={color} 
              className="transition-all duration-300 ease-out shadow-lg"
            />
          </svg>

          {hoveredPoint && (
            <div 
              className="absolute bg-white p-3 rounded-2xl shadow-2xl border border-gray-100 pointer-events-none z-30 transition-all duration-150 ease-out"
              style={{ 
                left: `${(hoveredPoint.x / width) * 100}%`, 
                top: `${(hoveredPoint.y / height) * 100}%`,
                transform: 'translate(-50%, -130%)'
              }}
            >
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1.5">
                {points[hoveredPoint.index].label}
              </p>
              <p className="text-base font-black text-gray-900 leading-none">
                €{points[hoveredPoint.index].value.toLocaleString()}
              </p>
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white rotate-45 border-b border-r border-gray-100"></div>
            </div>
          )}
        </div>
      </div>
      
      <div className="relative h-6 ml-14 mr-2">
        {uniqueLabels.map((item, i) => (
          <span 
            key={i} 
            className={`absolute text-[10px] font-bold uppercase tracking-widest transition-colors -translate-x-1/2 ${(hoveredPoint && points[hoveredPoint.index].label === item.label) ? 'text-opex-teal' : 'text-gray-400'}`}
            style={{ left: `${(item.x / width) * 100}%` }}
          >
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
};

export const MiniPieChart = ({ type = 'income' }) => (
  <div className="w-20 h-20 relative group shrink-0">
    <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
      <circle cx="18" cy="18" r="16" fill="transparent" stroke="#F3F4F6" strokeWidth="4" />
      <circle 
        cx="18" cy="18" r="16" fill="transparent" 
        stroke={type === 'income' ? '#22C55E' : '#3B82F6'} 
        strokeWidth="4.5" 
        strokeDasharray="65 100" 
        strokeLinecap="round" 
        className="transition-all duration-1000"
      />
      <circle 
        cx="18" cy="18" r="16" fill="transparent" 
        stroke={type === 'income' ? '#3B82F6' : '#EF4444'} 
        strokeWidth="4.5" 
        strokeDasharray="25 100" 
        strokeDashoffset="-65" 
        strokeLinecap="round" 
        className="transition-all duration-1000"
      />
    </svg>
    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
       <span className="text-[9px] font-black text-gray-900 leading-none">82%</span>
       <span className="text-[6px] font-bold text-gray-400 uppercase tracking-tighter">TARGET</span>
    </div>
  </div>
);
