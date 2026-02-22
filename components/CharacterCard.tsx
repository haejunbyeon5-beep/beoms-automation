
import React from 'react';
import { Character } from '../types';
import { User, Upload, X, Shirt, Loader2, Sparkles, RefreshCw } from 'lucide-react';
import { fileToBase64 } from '../utils/fileUtils';

interface CharacterCardProps {
  character: Character;
  onUpdate: (id: string, updates: Partial<Character>) => void;
  onRemove: (id: string) => void;
  onRegenerate: () => void;
}

const CharacterCard: React.FC<CharacterCardProps> = ({ character, onUpdate, onRemove, onRegenerate }) => {
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const { data, mimeType } = await fileToBase64(file);
      const fileName = file.name.replace(/\.[^/.]+$/, "");
      
      onUpdate(character.id, { 
        image: data, 
        mimeType,
        name: character.name.trim() === '' ? fileName : character.name
      });
    }
  };

  return (
    <div className="bg-[#0a0a0b] border border-slate-800/50 rounded-xl p-4 shadow-sm hover:shadow-md transition-all group relative flex flex-col gap-3">
      <div className="absolute -top-2 -right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        {character.name && !character.isGenerating && (
          <button 
            onClick={onRegenerate}
            className="bg-slate-800 text-slate-300 rounded-full p-2 shadow-sm hover:bg-slate-700 border border-slate-700"
            title="Regenerate Profile"
          >
            <RefreshCw size={14} />
          </button>
        )}
        <button 
          onClick={() => onRemove(character.id)}
          className="bg-red-900/80 text-red-200 rounded-full p-2 shadow-sm hover:bg-red-900 border border-red-800"
          title="Remove"
        >
          <X size={14} />
        </button>
      </div>
      
      <div className="relative aspect-square w-full bg-[#12141a] rounded-lg overflow-hidden border border-dashed border-slate-800 flex items-center justify-center cursor-pointer hover:border-red-900/50 transition-colors">
        {character.isGenerating ? (
          <div className="flex flex-col items-center gap-1.5 text-red-500">
            <Loader2 className="animate-spin" size={28} />
            <span className="text-xs font-black uppercase tracking-widest">AI Painting</span>
          </div>
        ) : character.image ? (
          <img src={character.image} alt={character.name} className="w-full h-full object-cover" />
        ) : (
          <label className="flex flex-col items-center justify-center gap-1.5 text-slate-600 cursor-pointer w-full h-full hover:text-slate-400 transition-colors">
            <Upload size={24} />
            <span className="text-xs font-black uppercase tracking-tighter">Reference</span>
            <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
          </label>
        )}
        
        {character.image && !character.isGenerating && (
          <div className="absolute top-2 right-2 bg-black/60 p-1.5 rounded-md backdrop-blur-sm border border-white/10">
            <Sparkles size={12} className="text-red-400" />
          </div>
        )}
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center gap-2.5 bg-[#12141a] rounded-md px-3 py-2 border border-slate-800 transition-colors focus-within:border-red-900/30">
          <User size={14} className="text-slate-500" />
          <input
            type="text"
            placeholder="Name..."
            className="bg-transparent text-xs font-bold focus:outline-none w-full text-slate-300 placeholder-slate-600"
            value={character.name}
            onChange={(e) => onUpdate(character.id, { name: e.target.value })}
          />
        </div>
        
        <div className="flex items-start gap-2.5 bg-[#12141a] rounded-md px-3 py-2 border border-slate-800 min-h-[50px] transition-colors focus-within:border-red-900/30">
          <Shirt size={14} className="text-slate-600 mt-1 shrink-0" />
          <textarea
            placeholder="Appearance (e.g. blue suit, glasses)"
            className="bg-transparent text-xs font-medium focus:outline-none w-full resize-none leading-snug text-slate-400 placeholder-slate-600 py-0.5"
            rows={2}
            value={character.description || ''}
            onChange={(e) => onUpdate(character.id, { description: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
};

export default CharacterCard;
