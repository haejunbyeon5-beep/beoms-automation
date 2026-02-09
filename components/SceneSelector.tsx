import React from 'react';
import { SceneDefinition } from '../types';
import { Play, CheckSquare, Square, Zap } from 'lucide-react';

interface Props {
  scenes: SceneDefinition[];
  selectedSceneIds: Set<number>;
  onToggleScene: (id: number) => void;
  onToggleAll: (selectAll: boolean) => void;
  onGenerateSpecific: (id: number) => void;
  disabled: boolean;
}

export const SceneSelector: React.FC<Props> = ({ 
  scenes, 
  selectedSceneIds, 
  onToggleScene, 
  onToggleAll, 
  onGenerateSpecific,
  disabled 
}) => {
  const allSelected = scenes.length > 0 && selectedSceneIds.size === scenes.length;

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="bg-gray-50 p-3 border-b border-gray-200 flex justify-between items-center">
        <div className="flex items-center gap-2">
           <button 
             onClick={() => onToggleAll(!allSelected)}
             disabled={disabled}
             className="text-gray-500 hover:text-gray-800 disabled:opacity-50"
           >
             {allSelected ? <CheckSquare size={18} className="text-orange-500" /> : <Square size={18} />}
           </button>
           <span className="text-xs font-bold text-gray-600 uppercase">
             {selectedSceneIds.size}개 씬 선택됨
           </span>
        </div>
        <span className="text-[10px] text-gray-400">
           원하는 씬을 체크하거나 개별 생성하세요
        </span>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
        {scenes.map((scene) => {
          const isSelected = selectedSceneIds.has(scene.id);
          return (
            <div 
              key={scene.id} 
              className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                isSelected ? 'bg-orange-50 border-orange-200' : 'bg-white border-gray-200 hover:bg-gray-50'
              }`}
            >
               <div className="flex items-center gap-3 flex-1 min-w-0">
                  <button 
                    onClick={() => onToggleScene(scene.id)}
                    disabled={disabled}
                    className="disabled:opacity-50"
                  >
                    {isSelected ? <CheckSquare size={18} className="text-orange-500" /> : <Square size={18} className="text-gray-400" />}
                  </button>
                  <div className="flex flex-col min-w-0">
                     <div className="flex items-center gap-2">
                       <span className="text-[10px] font-bold bg-gray-800 text-white px-1.5 py-0.5 rounded">
                         #{scene.id}
                       </span>
                       <span className="text-sm font-bold text-gray-800 truncate">{scene.title}</span>
                     </div>
                     <span className="text-xs text-gray-500 truncate">{scene.summary}</span>
                  </div>
               </div>

               <div className="flex items-center gap-4 ml-2">
                  <div className="text-right">
                    <span className="block text-xs font-bold text-gray-600">{scene.estimatedCuts}컷</span>
                  </div>
                  <button
                    onClick={() => onGenerateSpecific(scene.id)}
                    disabled={disabled}
                    className="p-2 bg-gray-100 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="이 씬만 즉시 생성"
                  >
                    <Play size={14} fill="currentColor" />
                  </button>
               </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};