import React, { useRef, useState, useEffect } from 'react';
import { CameraParams } from '../types';

interface CameraVisualizerProps {
  params: CameraParams;
  onUpdate?: (newParams: CameraParams) => void;
  inputImage?: string | null;
}

const CameraVisualizer: React.FC<CameraVisualizerProps> = ({ params, onUpdate, inputImage }) => {
  const { azimuth, elevation, distance } = params;
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Interaction State
  const [dragTarget, setDragTarget] = useState<'azimuth' | 'elevation' | 'zoom' | 'orbit' | null>(null);
  const lastMousePos = useRef({ x: 0, y: 0 });

  // Visual Feedback Helpers
  const isDraggingAzimuth = dragTarget === 'azimuth';
  const isDraggingElevation = dragTarget === 'elevation';
  const isOrbiting = dragTarget === 'orbit';

  const activeAzimuth = isDraggingAzimuth || isOrbiting;
  const activeElevation = isDraggingElevation || isOrbiting;

  // --- 3D Projection Configuration ---
  const width = 600;
  const height = 400;
  const cx = width / 2;
  const cy = height / 2;

  // Camera View Configuration (The "Editor" Camera)
  const viewPitch = 20 * Math.PI / 180; // Slightly looking down
  const viewYaw = 45 * Math.PI / 180;   // Isometric-ish
  const scaleFactor = 130; // Scale for the widget

  // 3D Point -> 2D Screen Projection
  const project = (x: number, y: number, z: number) => {
    // 1. Rotate Yaw (around Y)
    const x1 = x * Math.cos(viewYaw) - z * Math.sin(viewYaw);
    const z1 = x * Math.sin(viewYaw) + z * Math.cos(viewYaw);
    
    // 2. Rotate Pitch (around X)
    const y2 = y * Math.cos(viewPitch) - z1 * Math.sin(viewPitch);
    const z2 = y * Math.sin(viewPitch) + z1 * Math.cos(viewPitch);
    const x2 = x1;

    // 3. Simple Perspective
    const depth = 800;
    const s = depth / (depth + z2 * -1); // Perspective scale
    
    // SVG Y is down, 3D Y is up.
    return {
      x: cx + x2 * scaleFactor / 50 * s, 
      y: cy - y2 * scaleFactor / 50 * s,
      scale: s,
      z: z2 // Depth for sorting
    };
  };

  // --- Interaction Logic ---
  const handleMouseDown = (e: React.MouseEvent, target: 'azimuth' | 'elevation' | 'zoom' | 'orbit') => {
    if (!onUpdate) return;
    e.stopPropagation();
    e.preventDefault();
    setDragTarget(target);
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragTarget || !onUpdate) return;
    e.preventDefault();
    
    const deltaX = e.clientX - lastMousePos.current.x;
    const deltaY = e.clientY - lastMousePos.current.y;
    lastMousePos.current = { x: e.clientX, y: e.clientY };

    // Sensitivities
    const rotSens = 0.8;
    
    if (dragTarget === 'azimuth') {
      let newAz = azimuth + deltaX * rotSens;
      if (newAz >= 360) newAz -= 360;
      if (newAz < 0) newAz += 360;
      onUpdate({ ...params, azimuth: Math.round(newAz) });
    } 
    else if (dragTarget === 'elevation') {
      let newEl = elevation - deltaY * rotSens;
      newEl = Math.max(-85, Math.min(85, newEl));
      onUpdate({ ...params, elevation: Math.round(newEl) });
    }
    else if (dragTarget === 'zoom') {
      let newDist = distance + deltaY * 0.005;
      newDist = Math.max(0.5, Math.min(2.0, newDist));
      onUpdate({ ...params, distance: Math.round(newDist * 100) / 100 });
    }
    else if (dragTarget === 'orbit') {
      let newAz = azimuth + deltaX * rotSens;
      if (newAz >= 360) newAz -= 360;
      if (newAz < 0) newAz += 360;

      let newEl = elevation - deltaY * rotSens;
      newEl = Math.max(-85, Math.min(85, newEl));
      
      onUpdate({ 
        ...params, 
        azimuth: Math.round(newAz), 
        elevation: Math.round(newEl) 
      });
    }
  };

  const handleMouseUp = () => setDragTarget(null);
  const handleWheel = (e: React.WheelEvent) => {
    e.stopPropagation();
    let newDist = distance + e.deltaY * 0.001;
    newDist = Math.max(0.5, Math.min(2.0, newDist));
    onUpdate && onUpdate({ ...params, distance: Math.round(newDist * 100) / 100 });
  };

  // --- Scene Construction ---
  
  const rad = (deg: number) => deg * Math.PI / 180;
  
  // Subject Configuration
  const subjWidth = 30;
  const subjHeight = 40;
  const floorY = -subjHeight / 2; // -20, The floor is below the origin

  // Visual Radius of control rings
  const ringRadius = 50 + (distance * 25); 

  // Calculate Camera Position in 3D (Orbiting Origin 0,0,0)
  const camX = ringRadius * Math.sin(rad(azimuth)) * Math.cos(rad(elevation));
  const camY = ringRadius * Math.sin(rad(elevation));
  const camZ = ringRadius * Math.cos(rad(azimuth)) * Math.cos(rad(elevation));
  
  // Handle Positions
  const azHandleX = ringRadius * Math.sin(rad(azimuth));
  const azHandleY = 0;
  const azHandleZ = ringRadius * Math.cos(rad(azimuth));

  const elHandleX = camX;
  const elHandleY = camY;
  const elHandleZ = camZ;

  // Project Points
  const pCam = project(camX, camY, camZ);
  const pCenter = project(0, 0, 0); // Origin (Center of Subject)
  const pAzHandle = project(azHandleX, azHandleY, azHandleZ);
  const pElHandle = project(elHandleX, elHandleY, elHandleZ);

  // Generate Path for Azimuth Ring (Full Circle on XZ Plane at Y=0)
  const renderAzimuthRing = () => {
    const segments = 64;
    let d = "";
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      const rx = ringRadius * Math.sin(theta);
      const rz = ringRadius * Math.cos(theta);
      const p = project(rx, 0, rz);
      d += (i === 0 ? "M" : "L") + `${p.x.toFixed(1)},${p.y.toFixed(1)} `;
    }
    
    // Style logic: Brighten when dragging azimuth or orbit, dim when only dragging elevation
    const strokeWidth = activeAzimuth ? "3" : "2";
    const opacity = activeAzimuth ? "1" : (activeElevation ? "0.3" : "0.6");

    return (
        <path 
            d={d} 
            fill="none" 
            stroke="#00f0ff" 
            strokeWidth={strokeWidth} 
            opacity={opacity} 
            className="transition-all duration-300 ease-out"
        />
    ); 
  };

  // Generate Path for Elevation Arc (Meridian Line)
  const renderElevationArc = () => {
    const segments = 32;
    let d = "";
    for (let i = 0; i <= segments; i++) {
      const t = -85 + (i / segments) * 170; // -85 to 85 deg
      const tr = rad(t);
      const ax = ringRadius * Math.sin(rad(azimuth)) * Math.cos(tr);
      const ay = ringRadius * Math.sin(tr);
      const az = ringRadius * Math.cos(rad(azimuth)) * Math.cos(tr);
      const p = project(ax, ay, az);
      d += (i === 0 ? "M" : "L") + `${p.x.toFixed(1)},${p.y.toFixed(1)} `;
    }

    // Style logic: Brighten when dragging elevation or orbit, dim when only dragging azimuth
    const strokeWidth = activeElevation ? "3" : "2";
    const opacity = activeElevation ? "1" : (activeAzimuth ? "0.3" : "0.6");

    return (
        <path 
            d={d} 
            fill="none" 
            stroke="#ff00aa" 
            strokeWidth={strokeWidth} 
            strokeLinecap="round" 
            opacity={opacity}
            className="transition-all duration-300 ease-out"
        />
    );
  };

  const renderGrid = () => {
      let grid = [];
      const range = 100;
      const step = 25;
      
      // Draw Grid on Floor Plane (y = floorY)
      for(let i = -range; i <= range; i += step) {
         const v1 = project(i, floorY, -range);
         const v2 = project(i, floorY, range);
         const h1 = project(-range, floorY, i);
         const h2 = project(range, floorY, i);
         
         const opacity = i === 0 ? 0.3 : 0.1;
         
         grid.push(<line key={`v${i}`} x1={v1.x} y1={v1.y} x2={v2.x} y2={v2.y} stroke="#fff" strokeWidth="1" opacity={opacity} />);
         grid.push(<line key={`h${i}`} x1={h1.x} y1={h1.y} x2={h2.x} y2={h2.y} stroke="#fff" strokeWidth="1" opacity={opacity} />);
      }
      return <g>{grid}</g>;
  };

  const renderSubject = () => {
    const p = project(0, 0, 0); 
    const sw = subjWidth * p.scale;
    const sh = subjHeight * p.scale;
    const pShadow = project(0, floorY, 0);
    
    return (
      <g>
        <ellipse cx={pShadow.x} cy={pShadow.y} rx={sw/1.5} ry={sw/4} fill="black" opacity="0.5" filter="blur(4px)" />
        <foreignObject x={p.x - sw/2} y={p.y - sh/2} width={sw} height={sh} className="pointer-events-none">
            <div className="w-full h-full bg-slate-800 border-2 border-cyan-500/50 rounded overflow-hidden flex items-center justify-center relative shadow-lg">
            {inputImage ? (
                <img src={inputImage} className="w-full h-full object-cover" alt="subj" />
            ) : (
                <span className="text-[8px] text-slate-500">Subj</span>
            )}
            <div className="absolute top-1 right-1 w-2 h-2 bg-yellow-400 rounded-full shadow-lg border border-black/20"></div>
            </div>
        </foreignObject>
      </g>
    );
  };

  return (
    <div 
        ref={containerRef}
        className="w-full relative bg-[#111] rounded-xl border border-slate-800 overflow-hidden select-none group shadow-2xl"
        style={{ height: '420px', cursor: dragTarget ? 'grabbing' : 'default' }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
    >
        {/* Interaction Layer: Background Orbit */}
        <div 
            className="absolute inset-0 z-0 cursor-grab active:cursor-grabbing" 
            onMouseDown={(e) => handleMouseDown(e, 'orbit')} 
            onWheel={handleWheel} 
        />

        {/* Legend */}
        <div className="absolute top-4 left-4 z-20 pointer-events-none space-y-2">
             <div className={`flex items-center gap-2 px-2 py-1 rounded backdrop-blur border transition-all duration-300 ${activeAzimuth ? 'bg-cyan-900/40 border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.3)]' : 'bg-black/60 border-cyan-900/50'}`}>
                <span className={`w-2 h-2 rounded-full bg-[#00f0ff] transition-shadow duration-300 ${activeAzimuth ? 'shadow-[0_0_12px_#00f0ff]' : 'shadow-[0_0_8px_#00f0ff]'}`}></span>
                <span className={`text-[10px] font-mono tracking-wide transition-colors duration-300 ${activeAzimuth ? 'text-white font-bold' : 'text-cyan-100'}`}>AZIMUTH</span>
             </div>
             <div className={`flex items-center gap-2 px-2 py-1 rounded backdrop-blur border transition-all duration-300 ${activeElevation ? 'bg-pink-900/40 border-pink-500 shadow-[0_0_15px_rgba(236,72,153,0.3)]' : 'bg-black/60 border-pink-900/50'}`}>
                <span className={`w-2 h-2 rounded-full bg-[#ff00aa] transition-shadow duration-300 ${activeElevation ? 'shadow-[0_0_12px_#ff00aa]' : 'shadow-[0_0_8px_#ff00aa]'}`}></span>
                <span className={`text-[10px] font-mono tracking-wide transition-colors duration-300 ${activeElevation ? 'text-white font-bold' : 'text-pink-100'}`}>ELEVATION</span>
             </div>
        </div>

        {/* Prompt Stats */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
             <div className="font-mono text-xs text-cyan-300 bg-black/80 px-4 py-1.5 rounded-full border border-slate-700 shadow-[0_0_15px_rgba(0,240,255,0.15)] flex gap-3">
                 <span className={activeAzimuth ? "text-white font-bold" : ""}>azi: {Math.round(azimuth)}°</span>
                 <span className={activeElevation ? "text-white font-bold" : "text-pink-300"}>ele: {Math.round(elevation)}°</span>
                 <span className="text-yellow-300">dist: {distance.toFixed(1)}x</span>
             </div>
        </div>

        <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} className="pointer-events-none relative z-10">
            {renderGrid()}
            {renderAzimuthRing()}
            {renderElevationArc()}
            {renderSubject()}

            {/* Look-at Line */}
            <line 
                x1={pCenter.x} y1={pCenter.y} 
                x2={pCam.x} y2={pCam.y} 
                stroke="#fbbf24" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.8"
            />

            {/* Azimuth Handle */}
            <g 
                className={`pointer-events-auto cursor-grab active:cursor-grabbing transition-transform duration-200 ${isDraggingAzimuth ? 'scale-125' : 'hover:scale-110'}`}
                onMouseDown={(e) => handleMouseDown(e, 'azimuth')}
            >
                {/* Hit area */}
                <circle cx={pAzHandle.x} cy={pAzHandle.y} r={20} fill="transparent" /> 
                {/* Visual */}
                <circle 
                    cx={pAzHandle.x} cy={pAzHandle.y} r={activeAzimuth ? 8 : 6} 
                    fill="#00f0ff" stroke="white" strokeWidth="2"
                    style={{ filter: `drop-shadow(0 0 ${activeAzimuth ? '15px' : '6px'} #00f0ff)` }}
                    className="transition-all duration-300"
                />
            </g>

            {/* Elevation Handle */}
             <g 
                className={`pointer-events-auto cursor-grab active:cursor-grabbing transition-transform duration-200 ${isDraggingElevation ? 'scale-125' : 'hover:scale-110'}`}
                onMouseDown={(e) => handleMouseDown(e, 'elevation')}
            >
                {/* Hit area */}
                <circle cx={pElHandle.x} cy={pElHandle.y} r={20} fill="transparent" />
                {/* Visual */}
                <circle 
                    cx={pElHandle.x} cy={pElHandle.y} r={activeElevation ? 8 : 6} 
                    fill="#ff00aa" stroke="white" strokeWidth="2"
                    style={{ filter: `drop-shadow(0 0 ${activeElevation ? '15px' : '6px'} #ff00aa)` }}
                    className="transition-all duration-300"
                />
            </g>

            {/* Camera Body */}
            <g transform={`translate(${pCam.x}, ${pCam.y})`} className="pointer-events-auto cursor-grab" onMouseDown={(e) => handleMouseDown(e, 'elevation')}>
                <g transform={`scale(${pCam.scale})`}>
                     <g transform={`rotate(${ Math.atan2(pCenter.y - pCam.y, pCenter.x - pCam.x) * 180 / Math.PI })`}>
                        <rect x="-12" y="-9" width="24" height="18" rx="3" fill="#3b82f6" stroke="white" strokeWidth="1.5" />
                        <circle cx="0" cy="0" r="5" fill="#1d4ed8" stroke="#93c5fd" strokeWidth="1" />
                        <rect x="8" y="-4" width="6" height="8" rx="1" fill="#2563eb" />
                     </g>
                </g>
            </g>

        </svg>
    </div>
  );
};

export default CameraVisualizer;