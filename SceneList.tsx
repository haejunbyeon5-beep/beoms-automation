import React, { useEffect } from 'react';
import { SceneDefinition } from '../types';
import { RefreshCw, Play, CheckSquare, Square, Zap, Layers, List } from 'lucide-react';

interface Props {
  scenes: SceneDefinition[];
  targetTotalCuts: number;
  onUpdateScenes: (scenes: SceneDefinition[]) => void;
  onUpdateTotalCuts: (total: number) => void;
  
  // New props for selection/generation
  selectedSceneIds: Set<number>;
  onToggleScene: (id: number) => void;
  onToggleAll: (selectAll: boolean) => void;
  onGenerateSpecific: (id: number) => void;
  onGenerateSelected: () => void;
  generationMode: 'full' | 'selective';
  setGenerationMode: (mode: 'full' | 'selective') => void;
  disabled?: boolean;
}

export const SceneList: React.FC<Props> = ({ 
  scenes, 
  targetTotalCuts, 
  onUpdateScenes, 
  onUpdateTotalCuts,
  selectedSceneIds,
  onToggleScene,
  onToggleAll,
  onGenerateSpecific,
  onGenerateSelected,
  generationMode,
  setGenerationMode,
  disabled = false
}) => {
  
  // Auto Distribute Logic
  const autoDistributeCuts = () => {
    if (scenes.length === 0) return;

    // 1. Calculate weights
    // Sort by char count to find percentiles
    const sortedByLen = [...scenes].sort((a, b) => a.characterCount - b.characterCount);
    const thresholdLow = sortedByLen[Math.floor(scenes.length * 0.2)]?.characterCount || 0;
    const thresholdHigh = sortedByLen[Math.floor(scenes.length * 0.8)]?.characterCount || Infinity;

    let totalWeight = 0;
    const weights = scenes.map(s => {
      let w = 1.0;
      if (s.characterCount <= thresholdLow) w = 0.7; // Bottom 20% -> -30%
      else if (s.characterCount >= thresholdHigh) w = 1.4; // Top 20% -> +40%
      totalWeight += w;
      return w;
    });

    // 2. Distribute
    let distributed = scenes.map((s, idx) => {
      const rawCut = (weights[idx] / totalWeight) * targetTotalCuts;
      return Math.max(1, Math.round(rawCut));
    });

    // 3. Adjust rounding errors to match exactly targetTotalCuts
    const currentSum = distributed.reduce((a, b) => a + b, 0);
    let diff = targetTotalCuts - currentSum;

    // Add/remove diff to the longest scenes first (if pos) or shortest (if neg) to minimize impact
    if (diff !== 0) {
      const indices = distributed.map((_, i) => i);
      // Sort indices by weight (descending)
      indices.sort((a, b) => weights[b] - weights[a]);
      
      let i = 0;
      while (diff !== 0) {
        if (diff > 0) {
            distributed[indices[i % scenes.length]]++;
            diff--;
        } else {
            if (distributed[indices[i % scenes.length]] > 1) {
                distributed[indices[i % scenes.length]]--;
                diff++;
            }
        }
        i++;
      }
    }

    // Update scenes
    const updated = scenes.map((s, i) => ({
      ...s,
      estimatedCuts: distributed[i]
    }));
    onUpdateScenes(updated);
  };

  // Run auto-distribute on mount if estimatedCuts are all 0
  useEffect(() => {
    const totalAssigned = scenes.reduce((sum, s) => sum + s.estimatedCuts, 0);
    if (totalAssigned === 0 && scenes.length > 0) {
      autoDistributeCuts();
    }
  }, [scenes.length, targetTotalCuts]);

  const handleCutChange = (id: number, val: string) => {
    const num = parseInt(val) || 0;
    const updated = scenes.map(s => s.id === id ? { ...s, estimatedCuts: num } : s);
    onUpdateScenes(updated);
  };

  const totalAssigned = scenes.reduce((acc, s) => acc + s.estimatedCuts, 0);
  const allSelected = scenes.length > 0 && selectedSceneIds.size === scenes.length;

  return (
    <div className="space-y-4">
      {/* Top Controls: Cut Settings */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-4">
           <div>
             <label className="block text-xs font-bold text-gray-500 uppercase">전체 목표 컷 수</label>
             <input 
               type="number" 
               value={targetTotalCuts}
               onChange={(e) => onUpdateTotalCuts(parseInt(e.target.value) || 0)}
               disabled={disabled}
               className="text-2xl font-black text-gray-800 w-24 bg-transparent border-b border-gray-300 focus:border-orange-500 outline-none disabled:opacity-50"
             />
           </div>
           <div className="h-8 w-px bg-gray-200"></div>
           <div>
             <span className="block text-xs font-bold text-gray-500 uppercase">현재 배정된 컷</span>
             <span className={`text-xl font-bold ${totalAssigned === targetTotalCuts ? 'text-green-600' : 'text-orange-500'}`}>
               {totalAssigned}
             </span>
           </div>
        </div>
        <button 
          onClick={autoDistributeCuts}
          disabled={disabled}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
        >
          <RefreshCw size={14} /> 분량 기반 자동 재배분
        </button>
      </div>

      {/* Generation Mode Control */}
      <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 flex items-center justify-between">
          <div className="flex items-center gap-4">
             <span className="text-xs font-bold text-blue-800 uppercase flex items-center gap-1">
               <Zap size={12} /> 생성 모드 설정
             </span>
             <div className="flex bg-white rounded-md p-1 border border-blue-200">
                <button
                  onClick={() => setGenerationMode('full')}
                  disabled={disabled}
                  className={`px-3 py-1 rounded text-xs font-bold transition-all disabled:opacity-50 ${generationMode === 'full' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
                >
                  <Layers size={12} className="inline mr-1" /> 전체 생성
                </button>
                <button
                  onClick={() => setGenerationMode('selective')}
                  disabled={disabled}
                  className={`px-3 py-1 rounded text-xs font-bold transition-all disabled:opacity-50 ${generationMode === 'selective' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
                >
                  <List size={12} className="inline mr-1" /> 선택 생성
                </button>
             </div>
          </div>
          
          {generationMode === 'selective' && (
             <button 
               onClick={() => onToggleAll(!allSelected)}
               disabled={disabled}
               className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 disabled:opacity-50"
             >
               {allSelected ? <CheckSquare size={14} /> : <Square size={14} />} 전체 선택/해제
             </button>
          )}
      </div>

      {/* Scene List */}
      <div className="space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
        {scenes.map((scene) => {
          const isSelected = selectedSceneIds.has(scene.id);
          const isSelectiveMode = generationMode === 'selective';

          return (
            <div key={scene.id} className={`p-4 rounded-lg border transition-all ${
              isSelected && isSelectiveMode ? 'bg-blue-50 border-blue-300 shadow-sm' : 'bg-white border-gray-200 hover:border-orange-200'
            }`}>
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-3 flex-1">
                  
                  {/* Checkbox for Selective Mode */}
                  {isSelectiveMode && (
                    <button 
                      onClick={() => onToggleScene(scene.id)}
                      disabled={disabled}
                      className="text-gray-400 hover:text-blue-600 transition-colors disabled:opacity-50"
                    >
                      {isSelected ? <CheckSquare size={20} className="text-blue-600" /> : <Square size={20} />}
                    </button>
                  )}

                  <span className="bg-gray-800 text-white text-[10px] font-bold px-2 py-0.5 rounded">Scene {scene.id}</span>
                  <h4 className="text-sm font-bold text-gray-800">{scene.title}</h4>
                  <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                    {scene.characterCount}자
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <label className="text-[10px] text-gray-400 uppercase font-bold">배정 컷</label>
                    <input 
                      type="number" 
                      value={scene.estimatedCuts}
                      onChange={(e) => handleCutChange(scene.id, e.target.value)}
                      disabled={disabled}
                      className="w-16 bg-gray-50 border border-gray-300 rounded px-2 py-1 text-sm font-bold text-center focus:ring-2 focus:ring-orange-500 outline-none disabled:opacity-50"
                    />
                  </div>
                  
                  {/* Generate Specific Scene Button */}
                  <button
                    onClick={() => onGenerateSpecific(scene.id)}
                    disabled={disabled}
                    className="flex items-center gap-1 px-3 py-1 bg-orange-100 hover:bg-orange-200 text-orange-700 rounded text-xs font-bold transition-colors border border-orange-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="이 씬만 즉시 생성"
                  >
                    <Play size={10} fill="currentColor" /> 이 씬만 생성
                  </button>
                </div>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed bg-gray-50 p-2 rounded ml-8">
                {scene.summary}
              </p>
            </div>
          );
        })}
      </div>

      {/* Footer Action for Selective Mode */}
      {generationMode === 'selective' && selectedSceneIds.size > 0 && (
         <div className="flex justify-end pt-2">
            <button
              onClick={onGenerateSelected}
              disabled={disabled}
              className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-bold text-sm shadow-md flex items-center gap-2 animate-fadeIn disabled:opacity-50 disabled:cursor-not-allowed"
            >
               <Zap size={16} fill="currentColor" /> 선택한 {selectedSceneIds.size}개 씬 일괄 생성하기
            </button>
         </div>
      )}
    </div>
  );
};