export const MiniPieChart = ({ type = 'income' }) => (
  <div className="w-20 h-20 relative group shrink-0">
    <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
      <circle cx="18" cy="18" r="16" fill="transparent" stroke="var(--app-border)" strokeWidth="4" />
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
       <span className="text-[9px] font-black leading-none text-app-primary">82%</span>
       <span className="text-[6px] font-bold uppercase tracking-tighter text-app-tertiary">TARGET</span>
    </div>
  </div>
);


// Catmull-Rom → cubic bezier smooth path (viewBox-coordinate points)

