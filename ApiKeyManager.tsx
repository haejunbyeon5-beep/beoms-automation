import React, { useState, useEffect } from 'react';
import { ApiKey } from '../types';
import { Key, Trash2, CheckCircle, Plus, Eye, EyeOff, Save, Wifi } from 'lucide-react';
import { GeminiService } from '../services/geminiService';

interface Props {
  apiKeys: ApiKey[];
  onKeysChange: (keys: ApiKey[]) => void;
  currentModel: string;
}

export const ApiKeyManager: React.FC<Props> = ({ apiKeys, onKeysChange, currentModel }) => {
  const [newKey, setNewKey] = useState('');
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'fail' | null>(null);

  // Load from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('beoms_api_keys');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          onKeysChange(parsed);
        }
      } catch (e) {
        console.error("Failed to load keys", e);
      }
    }
  }, []);

  // Save to local storage whenever keys change
  useEffect(() => {
    localStorage.setItem('beoms_api_keys', JSON.stringify(apiKeys));
  }, [apiKeys]);

  const addKey = () => {
    if (!newKey.trim()) return;
    const keyEntry: ApiKey = {
      key: newKey.trim(),
      label: `Key ${apiKeys.length + 1}`,
      isActive: apiKeys.length === 0,
    };
    onKeysChange([...apiKeys, keyEntry]);
    setNewKey('');
  };

  const removeKey = (index: number) => {
    const updated = apiKeys.filter((_, i) => i !== index);
    if (apiKeys[index].isActive && updated.length > 0) {
      updated[0].isActive = true;
    }
    onKeysChange(updated);
  };

  const activateKey = (index: number) => {
    const updated = apiKeys.map((k, i) => ({
      ...k,
      isActive: i === index,
    }));
    onKeysChange(updated);
  };

  const testConnection = async () => {
    const active = apiKeys.find(k => k.isActive);
    if (!active) return;
    
    setTesting(true);
    setTestResult(null);
    
    // We create a temporary service just for testing
    const service = new GeminiService([active]);
    const success = await service.testConnection(active.key, currentModel);
    
    setTesting(false);
    setTestResult(success ? 'success' : 'fail');
    
    setTimeout(() => setTestResult(null), 3000);
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 space-y-4">
      <div className="flex justify-between items-center border-b border-gray-100 pb-2">
         <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide flex items-center gap-2">
           <Key size={16} className="text-orange-500" /> API 키 관리자
         </h3>
         {testResult && (
           <span className={`text-xs font-bold px-2 py-0.5 rounded ${testResult === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
             {testResult === 'success' ? '연결됨' : '실패'}
           </span>
         )}
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type={showKeyInput ? 'text' : 'password'}
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            placeholder="여기에 Gemini API 키를 붙여넣으세요..."
            className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-sm rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
          />
          <button
            onClick={() => setShowKeyInput(!showKeyInput)}
            className="absolute right-2 top-2.5 text-gray-400 hover:text-gray-600"
          >
            {showKeyInput ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        <button
          onClick={addKey}
          disabled={!newKey}
          className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white px-4 py-2 rounded-lg flex items-center gap-1 text-sm font-bold shadow-sm transition-colors whitespace-nowrap"
        >
          <Save size={16} /> 저장
        </button>
      </div>

      <div className="space-y-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
        {apiKeys.length === 0 && (
          <div className="text-center py-4 bg-gray-50 rounded border border-dashed border-gray-300">
             <p className="text-xs text-gray-500">저장된 API 키가 없습니다.</p>
          </div>
        )}
        {apiKeys.map((k, idx) => (
          <div
            key={idx}
            className={`flex items-center justify-between p-2.5 rounded-lg border transition-all ${
              k.isActive ? 'bg-orange-50 border-orange-200 shadow-sm' : 'bg-white border-gray-100 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-3 overflow-hidden cursor-pointer flex-1" onClick={() => activateKey(idx)}>
              <div className={`flex-shrink-0 ${k.isActive ? 'text-orange-500' : 'text-gray-300'}`}>
                <CheckCircle size={18} fill={k.isActive ? 'currentColor' : 'none'} className={!k.isActive ? "stroke-gray-300" : "stroke-white"} />
              </div>
              <div className="flex flex-col min-w-0">
                <span className={`text-xs font-bold ${k.isActive ? 'text-gray-800' : 'text-gray-500'} truncate`}>
                  {k.label} {k.isActive && '(사용 중)'}
                </span>
                <span className="text-[10px] text-gray-400 font-mono truncate">
                  ••••••••••••••••{k.key.substring(k.key.length - 4)}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1">
               {k.isActive && (
                 <button
                   onClick={(e) => { e.stopPropagation(); testConnection(); }}
                   disabled={testing}
                   className={`p-1.5 rounded hover:bg-orange-100 text-gray-500 hover:text-orange-600 ${testing ? 'animate-pulse' : ''}`}
                   title="연결 테스트"
                 >
                   <Wifi size={14} />
                 </button>
               )}
               <button
                 onClick={(e) => { e.stopPropagation(); removeKey(idx); }}
                 className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                 title="삭제"
               >
                 <Trash2 size={14} />
               </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};