import React from 'react';

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (val: number) => void;
  unit?: string;
  colorClass?: string;
  description?: string;
}

const Slider: React.FC<SliderProps> = ({ 
  label, 
  value, 
  min, 
  max, 
  step = 1, 
  onChange, 
  unit = '', 
  colorClass = 'bg-blue-500',
  description
}) => {
  // Calculate percentage for background gradient
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-1">
        <label className={`font-bold text-sm ${colorClass.replace('bg-', 'text-')}`}>
          {label}
        </label>
        <span className="font-mono text-xs bg-slate-800 px-2 py-1 rounded border border-slate-700">
          {value}{unit}
        </span>
      </div>
      {description && <p className="text-xs text-slate-500 mb-2">{description}</p>}
      
      <div className="relative w-full h-2 rounded-lg bg-slate-800">
        <div 
          className={`absolute h-full rounded-lg ${colorClass}`} 
          style={{ width: `${percentage}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="absolute w-full h-full opacity-0 cursor-pointer z-10"
        />
        
        {/* Thumb visual representation (optional, purely css handles interactions usually) */}
        <div 
            className="absolute h-5 w-5 bg-white rounded-full shadow-lg border-2 border-slate-200 top-1/2 transform -translate-y-1/2 -translate-x-1/2 pointer-events-none"
            style={{ left: `${percentage}%` }}
        />
      </div>
      
      <div className="flex justify-between mt-1 text-[10px] text-slate-600 font-mono">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
};

export default Slider;
