
import React, { useState, useEffect } from 'react';
import { Scene } from '../types';
import { RefreshCw, Maximize2, CheckCircle2, AlertCircle, Loader2, Code, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, History } from 'lucide-react';

interface SceneCardProps {
  scene: Scene;
  onRegenerate: (id: string) => void;
  onZoom: (url: string) => void;
  isProcessing: boolean;
}

const SceneCard: React.FC<SceneCardProps> = ({ scene, onRegenerate, onZoom, isProcessing }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (scene.variants.length > 0) {
      setCurrentIndex(scene.variants.length - 1);
    }
  }, [scene.variants.length]);

  const isSelfProcessing = scene.status === 'generating';
  const hasVariants = scene.variants.length > 0;
  const currentVariant = hasVariants ? scene.variants[currentIndex] : null;

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(prev => Math.max(0, prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(prev => Math.min(scene.variants.length - 1, prev + 1));
  };

  return (
    <div className="bg-[#0a0a0b] rounded-2xl border border-slate-800/50 shadow-sm overflow-hidden flex flex-col group hover:shadow-md transition-all">
      {/* Visual Header */}
      <div 
        className={`relative aspect-video bg-[#12141a] flex items-center justify-center overflow-hidden transition-colors ${currentVariant ? 'cursor-zoom-in' : ''}`}
        onClick={() => currentVariant && onZoom(currentVariant.imageUrl)}
      >
        {isSelfProcessing && !currentVariant ? (
          <div className="flex flex-col items-center gap-3 text-red-500">
            <Loader2 className="animate-spin" size={36} />
            <span className="text-xs font-bold uppercase tracking-widest">Rendering</span>
          </div>
        ) : currentVariant ? (
          <>
            <img 
              src={currentVariant.imageUrl} 
              alt={scene.filename} 
              className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${isSelfProcessing ? 'opacity-50 grayscale' : ''}`} 
            />
            {isSelfProcessing && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
                <Loader2 className="animate-spin text-red-500" size={36} />
              </div>
            )}
          </>
        ) : scene.status === 'error' ? (
          <div className="flex flex-col items-center gap-2.5 text-red-500 p-5 text-center">
            <AlertCircle size={30} />
            <span className="text-xs font-bold uppercase tracking-widest">Generation Failed</span>
          </div>
        ) : (
          <div className="text-slate-700 text-xs font-bold uppercase tracking-widest">Pending</div>
        )}

        <div className="absolute top-4 left-4 flex gap-2.5">
          <div className="bg-black/70 backdrop-blur-md text-slate-300 text-xs font-black px-3 py-1.5 rounded-md border border-white/10">
            SCENE {scene.number}
          </div>
          {scene.status === 'completed' && (
            <div className="bg-slate-800 text-slate-300 p-1.5 rounded-md shadow-lg border border-slate-700">
              <CheckCircle2 size={14} />
            </div>
          )}
        </div>

        {scene.variants.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-black/80 backdrop-blur-md px-4 py-2 rounded-full text-slate-300 border border-white/10">
            <button 
              onClick={handlePrev} 
              disabled={currentIndex === 0}
              className="hover:text-white disabled:opacity-30 transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-xs font-black min-w-[35px] text-center">
              {currentIndex + 1} / {scene.variants.length}
            </span>
            <button 
              onClick={handleNext} 
              disabled={currentIndex === scene.variants.length - 1}
              className="hover:text-white disabled:opacity-30 transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}

        {currentVariant && (
          <button className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md text-slate-300 p-2.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-sm border border-white/10 hover:bg-black/80">
            <Maximize2 size={18} />
          </button>
        )}
      </div>

      {/* Content Area */}
      <div className="p-5 flex-1 flex flex-col gap-4 bg-[#0a0a0b]">
        <div className="flex items-start justify-between gap-4">
          <h4 className="text-base font-bold text-slate-300 line-clamp-1">{scene.filename}</h4>
          <div className="flex items-center gap-1.5">
            {scene.variants.length > 0 && (
              <div className="text-xs font-bold text-slate-500 flex items-center gap-1.5 mr-2 bg-[#12141a] px-2.5 py-1.5 rounded-md transition-colors border border-slate-800">
                <History size={12} /> v{scene.variants.length}
              </div>
            )}
            <button 
              disabled={isSelfProcessing}
              onClick={(e) => { e.stopPropagation(); onRegenerate(scene.id); }}
              className="text-slate-500 hover:text-slate-300 hover:bg-slate-800 p-2 rounded-lg disabled:opacity-30 transition-colors"
              title="Regenerate this scene"
            >
              <RefreshCw size={18} className={isSelfProcessing ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        <p className="text-sm text-slate-500 line-clamp-3 italic leading-relaxed">
          "{scene.description}"
        </p>

        {(currentVariant?.prompt || scene.prompt) && (
          <div className="mt-auto pt-4 border-t border-slate-800/50 transition-colors">
            <button 
              onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
              className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-red-400 transition-colors uppercase tracking-widest"
            >
              <Code size={14} />
              AI PROMPT (V{currentIndex + 1})
              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            {isExpanded && (
              <div className="mt-3 p-4 bg-[#12141a] rounded-lg text-xs text-slate-400 font-mono leading-relaxed border border-slate-800 whitespace-pre-wrap transition-colors shadow-inner">
                {currentVariant?.prompt || scene.prompt}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SceneCard;
