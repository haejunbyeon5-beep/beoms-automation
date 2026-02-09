import React from 'react';
import { AnalysisMetrics, GeminiModel } from '../types';
import { Activity, Clock, Scissors, Type, Cpu } from 'lucide-react';

interface Props {
  metrics: AnalysisMetrics;
  apiStatus: string;
  currentModel: string;
  onModelChange: (model: string) => void;
}

export const RealTimeAnalysis: React.FC<Props> = ({ metrics, apiStatus, currentModel, onModelChange }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'text-blue-600';
      case 'completed': return 'text-green-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-400';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'running': return 'bg-blue-50';
      case 'completed': return 'bg-green-50';
      case 'error': return 'bg-red-50';
      default: return 'bg-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'running': return '실행 중';
      case 'completed': return '완료';
      case 'error': return '오류';
      case 'idle': return '대기 중';
      default: return '대기 중';
    }
  };

  const models = [
    { value: GeminiModel.GEMINI_3_PRO, label: 'Gemini 3 Pro Preview' },
    { value: GeminiModel.GEMINI_3_FLASH, label: 'Gemini 3 Flash Preview' },
    { value: GeminiModel.GEMINI_2_5_PRO, label: 'Gemini 2.5 Pro' },
    { value: GeminiModel.GEMINI_2_5_FLASH, label: 'Gemini 2.5 Flash' },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="bg-gray-50 border-b border-gray-100 p-3 flex items-center justify-between">
         <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
           <Activity size={16} className="text-orange-500" /> 실시간 제작 분석
         </h3>
         <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${getStatusBg(apiStatus)} ${getStatusColor(apiStatus)}`}>
           상태: {getStatusText(apiStatus)}
         </div>
      </div>
      
      <div className="p-4 grid grid-cols-2 gap-4">
        <div className="flex flex-col">
          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1">
             <Clock size={10} /> 예상 소요 시간
          </span>
          <span className="text-xl font-bold text-gray-800 font-mono">{metrics.duration}</span>
        </div>

        <div className="flex flex-col">
          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1">
             <Scissors size={10} /> 자동 컷 수
          </span>
          <span className="text-xl font-bold text-orange-500 font-mono">{metrics.cutCount}</span>
        </div>

        <div className="flex flex-col border-t border-gray-100 pt-3">
          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1">
             <Type size={10} /> 글자 수
          </span>
          <span className="text-sm font-medium text-gray-600 font-mono">{metrics.charCount.toLocaleString()} 자</span>
        </div>

         <div className="flex flex-col border-t border-gray-100 pt-3">
          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1">
             <Cpu size={10} /> 엔진 모델 선택
          </span>
          <select 
            value={currentModel}
            onChange={(e) => onModelChange(e.target.value)}
            className="mt-1 w-full bg-gray-50 border border-gray-200 text-gray-800 text-xs rounded px-2 py-1.5 focus:ring-1 focus:ring-orange-500 outline-none"
          >
            {models.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};