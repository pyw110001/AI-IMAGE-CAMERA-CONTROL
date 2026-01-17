import React, { useState, useCallback, useRef, useEffect } from 'react';
import { CameraParams, GenerationState } from './types';
import { DEFAULT_CAMERA_PARAMS } from './constants';
import { generateNewView } from './services/geminiService';
import CameraVisualizer from './components/CameraVisualizer';
import Slider from './components/Slider';

const App: React.FC = () => {
  const [inputImage, setInputImage] = useState<string | null>(null);
  const [cameraParams, setCameraParams] = useState<CameraParams>(DEFAULT_CAMERA_PARAMS);
  const [generationState, setGenerationState] = useState<GenerationState>({
    isLoading: false,
    resultImage: null,
    error: null,
  });
  const [hasApiKey, setHasApiKey] = useState<boolean>(false);

  // Check for API Key on mount
  useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio && window.aistudio.hasSelectedApiKey) {
        const selected = await window.aistudio.hasSelectedApiKey();
        setHasApiKey(selected);
      } else {
        // If not running in AI Studio environment, assume env var is set or handle gracefully
        setHasApiKey(true);
      }
    };
    checkKey();
  }, []);

  const handleSelectKey = async () => {
    if (window.aistudio) {
      try {
        await window.aistudio.openSelectKey();
        setHasApiKey(true);
      } catch (e) {
        console.error("Key selection failed", e);
      }
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setInputImage(reader.result as string);
        setGenerationState(prev => ({ ...prev, resultImage: null, error: null }));
      };
      reader.readAsDataURL(file);
    }
  };

  const updateCameraParam = (key: keyof CameraParams, value: number) => {
    setCameraParams(prev => ({ ...prev, [key]: value }));
  };

  const handleGenerate = async () => {
    if (!inputImage) return;

    setGenerationState({ isLoading: true, resultImage: null, error: null });

    try {
      const result = await generateNewView(inputImage, cameraParams);
      setGenerationState({ isLoading: false, resultImage: result, error: null });
    } catch (err: any) {
      // Handle 403 specifically to prompt for key re-selection
      const errorMessage = err.message || JSON.stringify(err);
      if (errorMessage.includes('403') || err.status === 403 || errorMessage.includes('permission')) {
         setHasApiKey(false); // Force UI back to selection screen
         setGenerationState({ 
            isLoading: false, 
            resultImage: null, 
            error: "权限验证失败。请重新选择 API 密钥。" 
         });
      } else {
         setGenerationState({ 
            isLoading: false, 
            resultImage: null, 
            error: "生成失败，请重试。" 
         });
      }
    }
  };

  // Drag and drop handlers
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
            setInputImage(reader.result as string);
            setGenerationState(prev => ({ ...prev, resultImage: null, error: null }));
        };
        reader.readAsDataURL(file);
    }
  }, []);

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  // If no API key is selected, show the selection screen
  if (!hasApiKey) {
    return (
      <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center p-4 text-white font-sans">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center shadow-2xl relative overflow-hidden">
            {/* Decorative background glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1 bg-gradient-to-r from-transparent via-pink-500 to-transparent opacity-75"></div>
            
            <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-pink-500/20">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11.536 17H10v2H7.542l-2-2H4v-2.086l2.414-2.414a6 6 0 016.743-6.743A2 2 0 0115 7z" />
                </svg>
            </div>
            
            <h2 className="text-2xl font-bold mb-3 tracking-tight">需要 API 访问权限</h2>
            <p className="text-slate-400 mb-8 text-sm leading-relaxed">
                使用 <strong>Gemini 3 Pro</strong> 高级成像模型需要您连接一个 API 密钥。请点击下方按钮选择您的密钥。
            </p>
            
            <button 
              onClick={handleSelectKey}
              className="w-full py-3.5 px-4 bg-white text-slate-900 font-bold rounded-lg hover:bg-gray-100 transition-all transform active:scale-95 flex items-center justify-center gap-2 group"
            >
                <span>连接 API 密钥</span>
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
            </button>
            
            <div className="mt-6 text-xs text-slate-600">
                <p>需要选择付费项目关联的密钥</p>
                <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="underline hover:text-slate-400 transition-colors mt-1 inline-block">
                    了解计费相关信息
                </a>
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0f19] text-gray-200 p-4 font-sans selection:bg-pink-500 selection:text-white">
      {/* Header */}
      <header className="max-w-7xl mx-auto mb-8 flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-purple-600 rounded flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white">
             Gemini 3D <span className="text-slate-500 font-normal">Camera Control</span>
            </h1>
        </div>
        <div className="flex items-center gap-3">
             <button 
                onClick={handleSelectKey}
                className="text-xs text-slate-400 hover:text-white transition-colors border border-slate-800 hover:border-slate-600 px-3 py-1 rounded-full flex items-center gap-1"
             >
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                Key Connected
             </button>
            <div className="text-xs text-slate-500 font-mono border border-slate-800 px-3 py-1 rounded-full hidden sm:block">
                Model: gemini-3-pro-image-preview
            </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Input & Controls (5 columns) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Input Image Area */}
          <div className="bg-slate-900/50 rounded-xl border border-slate-800 overflow-hidden">
            <div className="px-4 py-2 border-b border-slate-800 bg-slate-900/80 flex justify-between items-center">
                <span className="text-sm font-semibold text-blue-400">Input Image</span>
                {inputImage && (
                    <button 
                        onClick={() => setInputImage(null)}
                        className="text-xs text-slate-500 hover:text-white transition-colors"
                    >
                        Clear
                    </button>
                )}
            </div>
            
            <div 
                className={`relative aspect-square flex flex-col items-center justify-center transition-colors ${!inputImage ? 'bg-slate-800/30 hover:bg-slate-800/50 cursor-pointer' : 'bg-black'}`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => !inputImage && fileInputRef.current?.click()}
            >
                {inputImage ? (
                    <img src={inputImage} alt="Input" className="w-full h-full object-contain" />
                ) : (
                    <div className="text-center p-6">
                        <svg className="w-12 h-12 mx-auto text-slate-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-sm text-slate-400 font-medium">Click or drop image here</p>
                        <p className="text-xs text-slate-600 mt-1">Supports JPG, PNG</p>
                    </div>
                )}
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    className="hidden" 
                    accept="image/*"
                />
            </div>
          </div>

          {/* 3D Visualization Widget */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-2">
                <span className="text-pink-500">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                    </svg>
                </span>
                <h3 className="text-sm font-bold text-gray-200">3D Camera Control</h3>
                <span className="text-xs text-slate-500 italic">Drag to rotate, Scroll to zoom</span>
            </div>
            
            {/* Added inputImage prop here */}
            <CameraVisualizer params={cameraParams} onUpdate={setCameraParams} inputImage={inputImage} />
          </div>

          {/* Sliders */}
          <div className="bg-slate-900/50 p-5 rounded-xl border border-slate-800">
             <Slider 
                label="Azimuth (Rotation)" 
                value={cameraParams.azimuth} 
                min={0} 
                max={360} 
                onChange={(v) => updateCameraParam('azimuth', v)} 
                unit="°"
                colorClass="bg-emerald-400"
                description="0°=Front, 90°=Right, 180°=Back"
             />
             <Slider 
                label="Elevation (Angle)" 
                value={cameraParams.elevation} 
                min={-60} 
                max={60} 
                onChange={(v) => updateCameraParam('elevation', v)} 
                unit="°"
                colorClass="bg-pink-500"
                description="-60°=Low Angle, 60°=High Angle"
             />
             <Slider 
                label="Distance (Zoom)" 
                value={cameraParams.distance} 
                min={0.5} 
                max={2.0} 
                step={0.1}
                onChange={(v) => updateCameraParam('distance', v)} 
                unit="x"
                colorClass="bg-indigo-500"
                description="0.5=Close up, 2.0=Wide shot"
             />
          </div>

          <button
            onClick={handleGenerate}
            disabled={!inputImage || generationState.isLoading}
            className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-2 transition-all transform active:scale-95
                ${!inputImage || generationState.isLoading 
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:shadow-purple-500/25 text-white'
                }`}
          >
            {generationState.isLoading ? (
                <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing View...
                </>
            ) : (
                <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                    Generate New View
                </>
            )}
          </button>
        </div>

        {/* Right Column: Output (7 columns) */}
        <div className="lg:col-span-7">
           <div className="bg-slate-900/50 rounded-xl border border-slate-800 h-full min-h-[500px] flex flex-col overflow-hidden relative">
                <div className="px-4 py-2 border-b border-slate-800 bg-slate-900/80 flex justify-between items-center">
                    <span className="text-sm font-semibold text-purple-400">Output Image</span>
                    <div className="flex gap-2">
                        {generationState.resultImage && (
                             <a 
                                href={generationState.resultImage} 
                                download="gemini-3d-view.jpg"
                                className="text-xs flex items-center gap-1 text-slate-400 hover:text-white transition-colors bg-slate-800 px-2 py-1 rounded"
                             >
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                Save
                             </a>
                        )}
                    </div>
                </div>

                <div className="flex-1 bg-[#050505] relative flex items-center justify-center p-4">
                    {/* Background Grid Pattern */}
                    <div className="absolute inset-0 opacity-10 pointer-events-none" 
                        style={{backgroundImage: 'radial-gradient(#334155 1px, transparent 1px)', backgroundSize: '20px 20px'}}>
                    </div>

                    {generationState.resultImage ? (
                        <img 
                            src={generationState.resultImage} 
                            alt="Generated Output" 
                            className="max-w-full max-h-full object-contain rounded shadow-2xl ring-1 ring-slate-800"
                        />
                    ) : generationState.isLoading ? (
                        <div className="text-center space-y-4">
                             <div className="relative w-24 h-24 mx-auto">
                                <div className="absolute inset-0 border-t-4 border-pink-500 rounded-full animate-spin"></div>
                                <div className="absolute inset-2 border-t-4 border-purple-500 rounded-full animate-spin reverse" style={{animationDirection: 'reverse', animationDuration: '1.5s'}}></div>
                                <div className="absolute inset-4 border-t-4 border-blue-500 rounded-full animate-spin" style={{animationDuration: '2s'}}></div>
                             </div>
                             <p className="text-slate-400 font-mono text-sm animate-pulse">Computing light rays...</p>
                        </div>
                    ) : (
                        <div className="text-center opacity-30">
                            <svg className="w-24 h-24 mx-auto mb-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <p className="text-slate-500">Output will appear here</p>
                        </div>
                    )}

                    {/* Error Toast */}
                    {generationState.error && (
                         <div className="absolute bottom-4 left-4 right-4 bg-red-900/90 border border-red-700 text-white px-4 py-3 rounded shadow-lg text-sm flex items-center justify-between">
                            <div>
                                <strong className="block font-bold">Error</strong>
                                {generationState.error}
                            </div>
                            {generationState.error.includes("权限") && (
                                <button onClick={handleSelectKey} className="ml-4 px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-xs">
                                    重新连接 Key
                                </button>
                            )}
                        </div>
                    )}
                </div>
           </div>
        </div>
      </main>
    </div>
  );
};

export default App;