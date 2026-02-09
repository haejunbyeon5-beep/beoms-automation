import React from 'react';
import { GenerationSettings } from '../types';
import { Settings, Sliders, Clock, Type, Lock } from 'lucide-react';

interface Props {
  settings: GenerationSettings;
  onChange: (s: GenerationSettings) => void;
  disabled: boolean;
  readOnly?: boolean; // New prop for Step 4
}

export const SettingsPanel: React.FC<Props> = ({ settings, onChange, disabled, readOnly = false }) => {
  const handleChange = (key: keyof GenerationSettings, value: string | number) => {
    onChange({ ...settings, [key]: value });
  };

  return (
    <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 h-full flex flex-col gap-4">
      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
        <Settings size={16} /> 구성 설정 {readOnly && <span className="text-orange-500 text-xs">(확정됨)</span>}
      </h3>

      <div className="grid grid-cols-2 gap-4">
        {/* Target Scenes */}
        <div className={readOnly ? "opacity-60" : ""}>
          <label className="block text-xs font-medium text-gray-400 mb-1 flex items-center gap-1">
            <Sliders size={12} /> 목표 씬 수 {readOnly && <Lock size={10} />}
          </label>
          <input
            type="number"
            min={1}
            max={50}
            value={settings.targetScenes}
            onChange={(e) => handleChange('targetScenes', parseInt(e.target.value))}
            disabled={disabled || readOnly}
            className={`w-full bg-gray-900 border border-gray-700 text-gray-200 text-sm rounded px-3 py-2 focus:ring-1 focus:ring-blue-500 outline-none ${readOnly ? 'cursor-not-allowed bg-gray-800' : ''}`}
          />
        </div>

        {/* Total Cuts */}
        <div className={readOnly ? "opacity-60" : ""}>
          <label className="block text-xs font-medium text-gray-400 mb-1 flex items-center gap-1">
            <Sliders size={12} /> 목표 컷 수 {readOnly && <Lock size={10} />}
          </label>
          <input
            type="number"
            min={1}
            max={100}
            value={settings.totalCuts}
            onChange={(e) => handleChange('totalCuts', parseInt(e.target.value))}
            disabled={disabled || readOnly}
            className={`w-full bg-gray-900 border border-gray-700 text-gray-200 text-sm rounded px-3 py-2 focus:ring-1 focus:ring-blue-500 outline-none ${readOnly ? 'cursor-not-allowed bg-gray-800' : ''}`}
          />
        </div>

        {/* Cut Interval */}
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1 flex items-center gap-1">
            <Clock size={12} /> 간격 (초)
          </label>
          <input
            type="number"
            step={0.5}
            min={1}
            value={settings.cutIntervalSec}
            onChange={(e) => handleChange('cutIntervalSec', parseFloat(e.target.value))}
            disabled={disabled}
            className="w-full bg-gray-900 border border-gray-700 text-gray-200 text-sm rounded px-3 py-2 focus:ring-1 focus:ring-blue-500 outline-none"
          />
        </div>

        {/* Narration Speed */}
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1 flex items-center gap-1">
            <Type size={12} /> 속도 (CPM)
          </label>
          <input
            type="number"
            min={100}
            max={600}
            value={settings.narrationSpeedCpm}
            onChange={(e) => handleChange('narrationSpeedCpm', parseInt(e.target.value))}
            disabled={disabled}
            className="w-full bg-gray-900 border border-gray-700 text-gray-200 text-sm rounded px-3 py-2 focus:ring-1 focus:ring-blue-500 outline-none"
          />
        </div>
      </div>
    </div>
  );
};