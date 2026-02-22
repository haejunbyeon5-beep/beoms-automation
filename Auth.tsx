
import React, { useState } from 'react';
import { Clapperboard, ArrowRight, Languages, Sun, Moon, ShieldCheck } from 'lucide-react';
import { User, Language, Theme } from '../types';

interface AuthProps {
  onLogin: (user: User) => void;
  lang: Language;
  onToggleLang: () => void;
  theme: Theme;
  onToggleTheme: () => void;
}

const AUTH_TRANSLATIONS = {
  en: {
    welcome: "DreamTube Studio",
    subtitle: "Professional AI Storyboard Engine",
    googleLogin: "Continue with Google",
    secureAuth: "Secure Authentication",
    agreement: "By continuing, you agree to our Terms and Privacy Policy."
  },
  ko: {
    welcome: "몽상튜브 스튜디오",
    subtitle: "프로페셔널 AI 스토리보드 엔진",
    googleLogin: "Google 계정으로 계속하기",
    secureAuth: "보안 인증",
    agreement: "계속 진행하면 서비스 약관 및 개인정보 처리방침에 동의하게 됩니다."
  }
};

const Auth: React.FC<AuthProps> = ({ onLogin, lang, onToggleLang, theme, onToggleTheme }) => {
  const [isLoading, setIsLoading] = useState(false);
  const t = AUTH_TRANSLATIONS[lang];

  const handleGoogleLogin = () => {
    setIsLoading(true);
    // Simulating a Google OAuth process
    setTimeout(() => {
      const googleUser: User = { 
        email: "google.user@gmail.com", 
        name: "Google User",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
      };
      localStorage.setItem('sb_user', JSON.stringify(googleUser));
      onLogin(googleUser);
      setIsLoading(false);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-[#F9FBFF] dark:bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden transition-colors duration-500">
      {/* Decorative Blur Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100 dark:bg-blue-900/20 rounded-full blur-[120px] opacity-50 transition-colors" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-100 dark:bg-indigo-900/20 rounded-full blur-[120px] opacity-50 transition-colors" />

      <div className="w-full max-w-md z-10">
        <div className="flex justify-center gap-4 mb-8">
          <button 
            onClick={onToggleTheme}
            className="flex items-center gap-2.5 px-5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full text-xs font-black text-slate-600 dark:text-slate-300 hover:shadow-sm transition-all uppercase"
          >
            {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
            {theme === 'light' ? 'Dark' : 'Light'}
          </button>
          <button 
            onClick={onToggleLang}
            className="flex items-center gap-2.5 px-5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full text-xs font-black text-slate-600 dark:text-slate-300 hover:shadow-sm transition-all uppercase"
          >
            <Languages size={16} />
            {lang === 'en' ? '한국어' : 'English'}
          </button>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl shadow-blue-900/5 dark:shadow-none p-10 transition-colors text-center">
          <div className="flex flex-col items-center mb-10">
            <div className="bg-slate-900 dark:bg-blue-600 text-white p-6 rounded-3xl shadow-2xl mb-8 transform hover:scale-105 transition-transform duration-300">
              <Clapperboard size={48} />
            </div>
            <h1 className="text-4xl font-black text-slate-900 dark:text-slate-100 mb-3 uppercase tracking-tight">
              {t.welcome}
            </h1>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-[0.25em]">{t.subtitle}</p>
          </div>

          <div className="space-y-6">
            <button 
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-4 py-5 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-3xl text-lg font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:border-blue-200 dark:hover:border-blue-800 transition-all disabled:opacity-50 active:scale-[0.98] shadow-sm"
            >
              {isLoading ? (
                <div className="w-6 h-6 border-3 border-slate-200 dark:border-slate-600 border-t-blue-600 rounded-full animate-spin" />
              ) : (
                <svg className="w-7 h-7" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M12 5.04c1.94 0 3.51.68 4.75 1.81l3.48-3.48C17.91 1.25 15.17 0 12 0 7.31 0 3.25 2.69 1.25 6.64l3.96 3.07C6.16 7.19 8.87 5.04 12 5.04z" />
                  <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58l3.8 2.95c2.23-2.06 3.62-5.08 3.62-8.77z" />
                  <path fill="#FBBC05" d="M5.21 14.73c-.23-.69-.36-1.42-.36-2.19s.13-1.51.36-2.19L1.25 6.64C.45 8.24 0 10.07 0 12s.45 3.76 1.25 5.36l3.96-3.07z" />
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.8-2.95c-1.08.75-2.45 1.19-4.13 1.19-3.13 0-5.84-2.15-6.79-5.04l-3.96 3.07C3.25 21.31 7.31 24 12 24z" />
                </svg>
              )}
              {t.googleLogin}
            </button>

            <div className="flex items-center justify-center gap-2 text-slate-400 dark:text-slate-600">
              <ShieldCheck size={16} />
              <span className="text-[10px] font-black uppercase tracking-widest">{t.secureAuth}</span>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-slate-50 dark:border-slate-800">
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium leading-relaxed px-4">
              {t.agreement}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
