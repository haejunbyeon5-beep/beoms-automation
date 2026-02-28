
import React, { useState } from 'react';
import { Clapperboard, Key, Languages, Sun, Moon, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Language, Theme } from '../types';
import { validateApiKey, setStoredApiKey, getStoredApiKey } from '../services/geminiService';

interface AuthProps {
  onLogin: () => void;
  lang: Language;
  onToggleLang: () => void;
  theme: Theme;
  onToggleTheme: () => void;
}

const AUTH_TRANSLATIONS = {
  en: {
    welcome: "Goosebumps Studio",
    subtitle: "AI Storyboard Production Engine",
    apiKeyLabel: "Gemini API Key",
    apiKeyPlaceholder: "Paste your Gemini API key here...",
    connect: "Connect & Start",
    validating: "Validating key...",
    howToGet: "Get your API key from Google AI Studio",
    invalidKey: "Invalid API key. Please check and try again.",
    agreement: "Your API key is stored locally in your browser only. It is never sent to any server other than Google's API."
  },
  ko: {
    welcome: "구스범스 스튜디오",
    subtitle: "AI 스토리보드 제작 엔진",
    apiKeyLabel: "Gemini API 키",
    apiKeyPlaceholder: "Gemini API 키를 붙여넣으세요...",
    connect: "연결하고 시작하기",
    validating: "키 검증 중...",
    howToGet: "Google AI Studio에서 API 키 발급받기",
    invalidKey: "유효하지 않은 API 키입니다. 확인 후 다시 시도해주세요.",
    agreement: "API 키는 브라우저 로컬에만 저장됩니다. Google API 외 어떤 서버로도 전송되지 않습니다."
  }
};

const Auth: React.FC<AuthProps> = ({ onLogin, lang, onToggleLang, theme, onToggleTheme }) => {
  const [apiKey, setApiKey] = useState(getStoredApiKey() || '');
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState('');
  const t = AUTH_TRANSLATIONS[lang];

  const handleConnect = async () => {
    if (!apiKey.trim()) return;
    setIsValidating(true);
    setError('');
    
    try {
      const isValid = await validateApiKey(apiKey.trim());
      if (isValid) {
        setStoredApiKey(apiKey.trim());
        onLogin();
      } else {
        setError(t.invalidKey);
      }
    } catch (e) {
      setError(t.invalidKey);
    }
    
    setIsValidating(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleConnect();
  };

  return (
    <div className="min-h-screen bg-[#F9FBFF] dark:bg-[#0a0a0f] flex items-center justify-center p-6 relative overflow-hidden transition-colors duration-500">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-red-100 dark:bg-red-900/10 rounded-full blur-[120px] opacity-50 transition-colors" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-100 dark:bg-orange-900/10 rounded-full blur-[120px] opacity-50 transition-colors" />

      <div className="w-full max-w-md z-10">
        <div className="flex justify-center gap-4 mb-8">
          <button 
            onClick={onToggleTheme}
            className="flex items-center gap-2.5 px-5 py-2.5 bg-white dark:bg-[#1a1a2e] border border-slate-200 dark:border-slate-800 rounded-full text-xs font-black text-slate-600 dark:text-slate-300 hover:shadow-sm transition-all uppercase"
          >
            {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
            {theme === 'light' ? 'Dark' : 'Light'}
          </button>
          <button 
            onClick={onToggleLang}
            className="flex items-center gap-2.5 px-5 py-2.5 bg-white dark:bg-[#1a1a2e] border border-slate-200 dark:border-slate-800 rounded-full text-xs font-black text-slate-600 dark:text-slate-300 hover:shadow-sm transition-all uppercase"
          >
            <Languages size={16} />
            {lang === 'en' ? '한국어' : 'English'}
          </button>
        </div>

        <div className="bg-white dark:bg-[#1a1a2e] rounded-[2.5rem] border border-slate-200 dark:border-red-900/30 shadow-2xl shadow-red-900/5 dark:shadow-none p-10 transition-colors text-center">
          <div className="flex flex-col items-center mb-10">
            <div className="bg-red-600 dark:bg-red-600 text-white p-6 rounded-3xl shadow-2xl shadow-red-500/20 mb-8 transform hover:scale-105 transition-transform duration-300">
              <Clapperboard size={48} />
            </div>
            <h1 className="text-4xl font-black text-slate-900 dark:text-slate-100 mb-3 uppercase tracking-tight">
              {t.welcome}
            </h1>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-[0.25em]">{t.subtitle}</p>
          </div>

          <div className="space-y-5">
            <div className="text-left">
              <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 block">
                <Key size={12} className="inline mr-1.5" />{t.apiKeyLabel}
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => { setApiKey(e.target.value); setError(''); }}
                onKeyDown={handleKeyDown}
                placeholder={t.apiKeyPlaceholder}
                className="w-full px-5 py-4 bg-slate-50 dark:bg-[#0f0f1a] border-2 border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-medium text-slate-900 dark:text-slate-100 outline-none focus:border-red-500 dark:focus:border-red-500 transition-colors"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-500 text-xs font-bold p-3 bg-red-50 dark:bg-red-900/10 rounded-xl">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <button 
              onClick={handleConnect}
              disabled={isValidating || !apiKey.trim()}
              className="w-full flex items-center justify-center gap-3 py-5 bg-red-600 hover:bg-red-700 text-white rounded-2xl text-base font-black transition-all disabled:opacity-50 active:scale-[0.98] shadow-lg shadow-red-500/20 uppercase tracking-wider"
            >
              {isValidating ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  {t.validating}
                </>
              ) : (
                <>
                  <CheckCircle2 size={20} />
                  {t.connect}
                </>
              )}
            </button>

            <a 
              href="https://aistudio.google.com/apikey" 
              target="_blank" 
              rel="noopener noreferrer"
              className="block text-xs font-bold text-red-500 dark:text-red-400 hover:underline uppercase tracking-tight"
            >
              {t.howToGet} →
            </a>
          </div>

          <div className="mt-10 pt-8 border-t border-slate-100 dark:border-slate-800">
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium leading-relaxed px-4">
              🔒 {t.agreement}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
