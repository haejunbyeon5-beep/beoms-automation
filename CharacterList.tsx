import React from 'react';
import { Character } from '../types';
import { User, Trash2, Fingerprint, Smile, Users, UserCircle2 } from 'lucide-react';

interface Props {
  characters: Character[];
  onUpdate: (chars: Character[]) => void;
}

export const CharacterList: React.FC<Props> = ({ characters, onUpdate }) => {
  const handleDelete = (index: number) => {
    if (confirm('이 캐릭터를 삭제하시겠습니까?')) {
      const updated = characters.filter((_, i) => i !== index);
      onUpdate(updated);
    }
  };

  const handleChange = (index: number, field: keyof Character, value: string) => {
    const updated = [...characters];
    updated[index] = { ...updated[index], [field]: value };
    onUpdate(updated);
  };

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-1">
      {characters.length === 0 && (
        <div className="flex flex-col items-center justify-center h-64 text-gray-400 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
           <User size={48} className="mb-4 opacity-20" />
           <p className="text-sm font-bold text-gray-500">추출된 캐릭터가 없습니다.</p>
           <p className="text-xs mt-1">1단계에서 대본을 분석하면 자동으로 목록이 생성됩니다.</p>
        </div>
      )}
      
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 pb-4">
        {characters.map((char, idx) => (
          <div 
            key={idx} 
            className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-col gap-4 hover:border-orange-300 hover:shadow-md transition-all group"
          >
            {/* Header Section: Name, Gender, Role */}
            <div className="flex justify-between items-start border-b border-gray-100 pb-3">
              <div className="flex items-center gap-4 flex-1">
                {/* Avatar / Gender Indicator */}
                <div 
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black shadow-inner 
                    ${char.gender?.toLowerCase() === 'male' || char.gender === '남' ? 'bg-blue-100 text-blue-600' : 
                      char.gender?.toLowerCase() === 'female' || char.gender === '여' ? 'bg-pink-100 text-pink-600' : 'bg-gray-100 text-gray-500'}`}
                >
                  {char.gender?.toLowerCase().startsWith('m') || char.gender === '남' ? 'M' : 
                   char.gender?.toLowerCase().startsWith('f') || char.gender === '여' ? 'F' : '?'}
                </div>

                <div className="flex-1 space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2">
                     <input 
                        value={char.name}
                        onChange={(e) => handleChange(idx, 'name', e.target.value)}
                        className="font-black text-lg text-gray-900 bg-transparent border-b-2 border-transparent focus:border-orange-400 outline-none w-full placeholder-gray-300"
                        placeholder="캐릭터 이름"
                      />
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                     <div className="flex items-center gap-1 flex-1 min-w-0 bg-gray-50 px-2 py-0.5 rounded">
                        <Users size={12} className="text-gray-400" />
                        <input 
                          value={char.role}
                          onChange={(e) => handleChange(idx, 'role', e.target.value)}
                          className="w-full bg-transparent text-gray-600 font-medium outline-none text-xs"
                          placeholder="역할 / 관계 / 신분"
                        />
                     </div>
                     <div className="flex items-center gap-1 w-20 bg-gray-50 px-2 py-0.5 rounded shrink-0">
                        <span className="text-[10px] text-gray-400 font-bold">AGE</span>
                        <input 
                          value={char.age}
                          onChange={(e) => handleChange(idx, 'age', e.target.value)}
                          className="w-full bg-transparent text-gray-600 font-medium outline-none text-xs text-center"
                          placeholder="나이"
                        />
                     </div>
                  </div>
                </div>
              </div>
              
              <button 
                onClick={() => handleDelete(idx)}
                className="text-gray-300 hover:text-red-500 p-2 transition-colors hover:bg-red-50 rounded-lg"
                title="캐릭터 삭제"
              >
                <Trash2 size={18} />
              </button>
            </div>

            {/* Body Section: ID & Appearance */}
            <div className="space-y-4">
               {/* System ID */}
               <div className="flex items-center gap-2 bg-gray-50/50 px-3 py-2 rounded-lg border border-gray-100">
                  <Fingerprint size={14} className="text-orange-400" />
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider w-16">System ID</span>
                  <input 
                    value={char.id}
                    onChange={(e) => handleChange(idx, 'id', e.target.value)}
                    className="flex-1 bg-transparent text-xs font-mono font-bold text-gray-600 outline-none focus:text-orange-600"
                    placeholder="영문 식별자 (프롬프트용)"
                  />
               </div>

               {/* Appearance / Personality / Outfit */}
               <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                     <label className="text-xs font-bold text-gray-600 flex items-center gap-1.5 uppercase tracking-tight">
                       <UserCircle2 size={14} className="text-blue-500" /> 
                       외형 · 성격 · 복장 상세 (Appearance DNA)
                     </label>
                     <span className="text-[10px] text-gray-400">AI 이미지 생성의 핵심 기준입니다</span>
                  </div>
                  <textarea 
                    value={char.appearance}
                    onChange={(e) => handleChange(idx, 'appearance', e.target.value)}
                    className="w-full h-32 bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-700 leading-relaxed resize-none focus:ring-2 focus:ring-orange-200 focus:border-orange-300 outline-none custom-scrollbar shadow-inner transition-all"
                    placeholder="예: 날카로운 눈매, 강직한 성격, 붉은 관복 착용, 갓을 쓰고 있음. (자세할수록 좋습니다)"
                  />
               </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};