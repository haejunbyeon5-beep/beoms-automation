
import React, { useState, useRef, useEffect } from 'react';
import { 
  Clapperboard, 
  Sparkles, 
  Play, 
  Download, 
  Plus, 
  Minus,
  Layout, 
  Layers,
  Settings2,
  Languages,
  Maximize,
  X,
  Image as ImageIcon,
  Square,
  Key,
  Zap,
  Scissors,
  RefreshCcw,
  Info,
  AlertTriangle,
  Sun,
  Moon,
  Cpu,
  Trophy,
  Trash2,
  Save,
  CheckCircle2
} from 'lucide-react';
import { Character, Scene, StylePreset, STYLE_PRESETS, AspectRatio, Language, SceneVariant, Theme, ImageQuality } from './types';
import CharacterCard from './components/CharacterCard';
import StatusMonitor from './components/StatusMonitor';
import SceneGallery from './components/SceneGallery';
import Auth from './components/Auth';
import { parseScript, downloadAsZip, fileToBase64 } from './utils/fileUtils';
import { 
  optimizePrompt, 
  generateSceneImage, 
  autoSegmentScript, 
  generateCharacterProfileImage,
  getStoredApiKey,
  setStoredApiKey,
  removeStoredApiKey
} from './services/geminiService';

const PERSISTENCE_KEY = 'gb_workspace_data_v1';

const TRANSLATIONS = {
  en: {
    title: "Goosebumps Studio",
    subtitle: "AI Storyboard Engine",
    exportZip: "EXPORT ZIP",
    startProduction: "START PRODUCTION",
    stopProduction: "STOP",
    running: "RUNNING...",
    masterScript: "Master Script",
    scriptBadge: "KOREAN / ENGLISH OK",
    scriptPlaceholder: "Paste your raw script here...",
    visualDirection: "Visual Direction",
    artStyle: "Artistic Style",
    aspectRatio: "Aspect Ratio",
    atmosphere: "Atmosphere & Lighting",
    atmospherePlaceholder: "e.g. Neon-noir, sunrise, cinematic bokeh",
    styleRefLabel: "Style Reference Image",
    styleRefDesc: "Optional reference for lighting/mood",
    charEnsemble: "Character Ensemble (Consistency Lock)",
    newSlot: "NEW SLOT",
    storyboardOutput: "Storyboard Output",
    framesGenerated: "FRAMES GENERATED",
    workspaceEmpty: "Workspace is empty",
    workspaceEmptyDesc: "Your storyboard frames will appear here once production starts.",
    stoppedLog: "⚠️ Production stopped by user.",
    autoSegment: "AI Auto-Segment",
    targetScenes: "Target Frame Count",
    segmenting: "AI is analyzing script...",
    manualInfo: "Manual Mode: Split by numbers (1.) or empty lines between paragraphs.",
    retryFailed: "Retry All Failed",
    quotaErrorTitle: "Quota Exceeded",
    quotaErrorDesc: "You have reached your API limit. If you are using a free key, wait a few minutes. For higher limits, use a paid project key.",
    qualityLabel: "Production Quality",
    resetWorkspace: "Reset Workspace",
    confirmReset: "Are you sure? This will delete all generated images and text.",
    saved: "Saved",
    apiKeyConnected: "API Connected",
    apiKeyDisconnected: "No API Key",
    apiKeyPlaceholder: "Enter Gemini API key...",
    apiKeySave: "Save",
    apiKeyDelete: "Delete",
    apiKeyLabel: "API KEY"
  },
  ko: {
    title: "구스범스 스튜디오",
    subtitle: "AI 스토리보드 엔진",
    exportZip: "ZIP 내보내기",
    startProduction: "제작 시작",
    stopProduction: "중지",
    running: "제작 중...",
    masterScript: "마스터 스크립트",
    scriptBadge: "한글 / 영어 가능",
    scriptPlaceholder: "전체 대본 또는 줄거리를 입력하세요...",
    visualDirection: "시각 연출 설정",
    artStyle: "예술적 스타일",
    aspectRatio: "화면 비율",
    atmosphere: "분위기 & 조명",
    atmospherePlaceholder: "예: 네온 누아르, 일출, 시네마틱 보케",
    styleRefLabel: "스타일 레퍼런스 이미지",
    styleRefDesc: "조명이나 분위기를 위한 선택적 참고 이미지",
    charEnsemble: "등장인물 설정 (일관성 유지)",
    newSlot: "새 슬롯",
    storyboardOutput: "스토리보드 결과물",
    framesGenerated: "프레임 생성됨",
    workspaceEmpty: "작업 공간이 비어 있습니다",
    workspaceEmptyDesc: "제작을 시작하면 스토리보드 프레임이 여기에 나타납니다.",
    stoppedLog: "⚠️ 사용자에 의해 제작이 중지되었습니다.",
    autoSegment: "AI 자동 장면 분할",
    targetScenes: "목표 프레임(이미지) 갯수",
    segmenting: "AI가 대본을 분석하여 장면을 나누는 중...",
    manualInfo: "수동 모드: 숫자(1.) 또는 문단 사이 빈 줄로 구분됩니다.",
    retryFailed: "실패 항목 전체 재시도",
    quotaErrorTitle: "API 할당량 초과",
    quotaErrorDesc: "API 호출 횟수를 모두 소모했습니다. 무료 키의 경우 몇 분 뒤에 다시 시도해주세요. 더 많은 양을 원하시면 유료 프로젝트 키를 사용하세요.",
    qualityLabel: "제작 품질 설정",
    resetWorkspace: "워크스페이스 초기화",
    confirmReset: "정말 초기화하시겠습니까? 생성된 모든 이미지와 텍스트가 삭제됩니다.",
    saved: "저장됨",
    apiKeyConnected: "API 연결됨",
    apiKeyDisconnected: "API 미연결",
    apiKeyPlaceholder: "Gemini API 키 입력...",
    apiKeySave: "저장",
    apiKeyDelete: "삭제",
    apiKeyLabel: "API KEY"
  }
};

const ASPECT_RATIOS: AspectRatio[] = ['16:9', '4:3', '1:1', '9:16'];

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [lang, setLang] = useState<Language>('ko');
  const [theme, setTheme] = useState<Theme>(() => 
    (localStorage.getItem('gb_theme') as Theme) || 
    (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
  );
  
  // Persistence States
  const [quality, setQuality] = useState<ImageQuality>('standard');
  const [script, setScript] = useState('');
  const [targetSceneCount, setTargetSceneCount] = useState(5);
  const [isAutoSegment, setIsAutoSegment] = useState(true);
  const [stylePreset, setStylePreset] = useState<StylePreset>('Photorealistic');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [customStyle, setCustomStyle] = useState('');
  const [styleRef, setStyleRef] = useState<{ data: string, mimeType: string } | null>(null);
  const [characters, setCharacters] = useState<Character[]>([{ id: '1', name: '' }]);
  const [scenes, setScenes] = useState<Scene[]>([]);
  
  // UI States
  const [isProcessing, setIsProcessing] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [zoomUrl, setZoomUrl] = useState<string | null>(null);
  const [quotaError, setQuotaError] = useState(false);
  const [lastSaved, setLastSaved] = useState<number | null>(null);
  
  // API Key States
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [hasApiKey, setHasApiKey] = useState(false);
  
  const stopRequestedRef = useRef(false);
  const isInitialMount = useRef(true);

  // Check auth on mount
  useEffect(() => {
    const key = getStoredApiKey();
    if (key) {
      setIsAuthenticated(true);
      setHasApiKey(true);
    }

    const savedData = localStorage.getItem(PERSISTENCE_KEY);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setQuality(parsed.quality || 'standard');
        setScript(parsed.script || '');
        setTargetSceneCount(parsed.targetSceneCount || 5);
        setIsAutoSegment(parsed.isAutoSegment ?? true);
        setStylePreset(parsed.stylePreset || 'Photorealistic');
        setAspectRatio(parsed.aspectRatio || '16:9');
        setCustomStyle(parsed.customStyle || '');
        setStyleRef(parsed.styleRef || null);
        setCharacters(parsed.characters || [{ id: '1', name: '' }]);
        setScenes(parsed.scenes || []);
      } catch (e) {
        console.error("Failed to restore data", e);
      }
    }
    isInitialMount.current = false;
  }, []);

  // Save Data on Change
  useEffect(() => {
    if (isInitialMount.current) return;
    
    const timer = setTimeout(() => {
      try {
        const dataToSave = {
          quality, script, targetSceneCount, isAutoSegment,
          stylePreset, aspectRatio, customStyle, styleRef, characters, scenes
        };
        localStorage.setItem(PERSISTENCE_KEY, JSON.stringify(dataToSave));
        setLastSaved(Date.now());
      } catch (e: any) {
        if (e.name === 'QuotaExceededError') {
          console.warn("Storage quota exceeded.");
          addLog("⚠️ " + (lang === 'ko' ? "저장 공간이 부족합니다." : "Storage quota exceeded."));
        }
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [quality, script, targetSceneCount, isAutoSegment, stylePreset, aspectRatio, customStyle, styleRef, characters, scenes]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('gb_theme', theme);
  }, [theme]);

  const handleSaveApiKey = () => {
    if (apiKeyInput.trim()) {
      setStoredApiKey(apiKeyInput.trim());
      setHasApiKey(true);
      setShowApiKeyInput(false);
      setApiKeyInput('');
      addLog(lang === 'ko' ? "🔑 API 키가 저장되었습니다." : "🔑 API key saved.");
    }
  };

  const handleDeleteApiKey = () => {
    removeStoredApiKey();
    setHasApiKey(false);
    setShowApiKeyInput(false);
    addLog(lang === 'ko' ? "🗑️ API 키가 삭제되었습니다." : "🗑️ API key removed.");
  };

  const handleLogout = () => {
    removeStoredApiKey();
    setIsAuthenticated(false);
    setHasApiKey(false);
  };

  const handleResetWorkspace = () => {
    if (window.confirm(t.confirmReset)) {
      setScript('');
      setScenes([]);
      setCharacters([{ id: '1', name: '' }]);
      setCustomStyle('');
      setStyleRef(null);
      setLogs([]);
      localStorage.removeItem(PERSISTENCE_KEY);
      addLog(lang === 'ko' ? "🧹 워크스페이스가 초기화되었습니다." : "🧹 Workspace cleared.");
    }
  };

  const changeQuality = (newQuality: ImageQuality) => {
    setQuality(newQuality);
  };

  const t = TRANSLATIONS[lang];
  const addLog = (msg: string) => setLogs(prev => [...prev, msg]);
  const toggleLanguage = () => setLang(prev => prev === 'en' ? 'ko' : 'en');
  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  const isQuotaExceeded = (error: any): boolean => {
    const msg = error?.message || "";
    return msg.includes("429") || msg.toLowerCase().includes("quota") || msg.toLowerCase().includes("exhausted");
  };

  const handleApiError = (error: any, sceneNumber?: string) => {
    console.error(error);
    const scenePrefix = sceneNumber ? `[Scene ${sceneNumber}] ` : "";
    
    if (isQuotaExceeded(error)) {
      setQuotaError(true);
      addLog(`🚨 ${scenePrefix}${lang === 'ko' ? 'API 할당량 초과! 잠시 후 시도하거나 유료 키를 사용하세요.' : 'Quota Exceeded! Wait a bit or use a paid key.'}`);
    } else if (error.message?.includes("Requested entity was not found")) {
      addLog(`🚨 ${scenePrefix}${lang === 'ko' ? '현재 모델은 무료 키로 사용할 수 없습니다. "표준" 품질로 낮춰보세요.' : 'Selected model is not available for free keys. Try "Standard" quality.'}`);
    } else {
      addLog(`❌ ${scenePrefix}FAILED: ${error.message || 'Unknown error'}`);
    }
  };

  const generateSingleCharacterProfile = async (targetChar: Character) => {
    if (!targetChar.name) return;
    setCharacters(prev => prev.map(c => c.id === targetChar.id ? { ...c, isGenerating: true } : c));
    
    try {
      const imageUrl = await generateCharacterProfileImage(
        targetChar.name, targetChar.description || "", stylePreset, customStyle, quality
      );
      setCharacters(prev => prev.map(c => 
        c.id === targetChar.id 
          ? { ...c, image: imageUrl || c.image, mimeType: imageUrl ? 'image/png' : c.mimeType, isGenerating: false } 
          : c
      ));
    } catch (e: any) {
      handleApiError(e);
      setCharacters(prev => prev.map(c => c.id === targetChar.id ? { ...c, isGenerating: false } : c));
    }
  };

  const handleStyleRefUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const { data, mimeType } = await fileToBase64(file);
      setStyleRef({ data, mimeType });
    }
  };

  const handleAddCharacter = () => {
    if (characters.length < 12) {
      setCharacters([...characters, { id: Math.random().toString(36).substr(2, 9), name: '' }]);
    }
  };

  const handleRemoveCharacter = (id: string) => setCharacters(characters.filter(c => c.id !== id));
  const handleUpdateCharacter = (id: string, updates: Partial<Character>) => {
    setCharacters(characters.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const generateSingleScene = async (scene: Scene) => {
    if (stopRequestedRef.current) return;
    setScenes(prev => prev.map(s => s.id === scene.id ? { ...s, status: 'generating' } : s));
    try {
      addLog(`[Scene ${scene.number}] ${lang === 'ko' ? '프롬프트 최적화 중...' : 'Optimization started...'}`);
      const optimizedPrompt = await optimizePrompt(scene.description, stylePreset, customStyle, characters);
      if (stopRequestedRef.current) return;
      addLog(`[Scene ${scene.number}] ${lang === 'ko' ? '이미지 렌더링 중...' : 'Rendering image...'}`);
      const imageUrl = await generateSceneImage(optimizedPrompt, characters, aspectRatio, styleRef || undefined, quality);

      if (imageUrl) {
        setScenes(prev => prev.map(s => {
          if (s.id === scene.id) {
            const newVariant: SceneVariant = { imageUrl, prompt: optimizedPrompt, timestamp: Date.now() };
            return { ...s, status: 'completed', imageUrl, prompt: optimizedPrompt, variants: [...s.variants, newVariant] };
          }
          return s;
        }));
        addLog(`[Scene ${scene.number}] ${lang === 'ko' ? '성공' : 'Success'}.`);
      } else {
        throw new Error('No image returned');
      }
    } catch (error: any) {
      handleApiError(error, scene.number);
      setScenes(prev => prev.map(s => s.id === scene.id ? { ...s, status: 'error' } : s));
    }
  };

  const handleRegenerateScene = (id: string) => {
    const targetScene = scenes.find(s => s.id === id);
    if (targetScene) generateSingleScene(targetScene);
  };

  const handleRetryFailed = async () => {
    const failedScenes = scenes.filter(s => s.status === 'error');
    if (failedScenes.length === 0) return;
    setIsProcessing(true);
    addLog(`🔄 ${lang === 'ko' ? '실패 항목 재시도' : 'Retrying failed scenes'}: ${failedScenes.length} scenes.`);
    for (const scene of failedScenes) {
      if (stopRequestedRef.current) break;
      await generateSingleScene(scene);
    }
    setIsProcessing(false);
  };

  const stopProduction = () => {
    stopRequestedRef.current = true;
    addLog(t.stoppedLog);
    setIsProcessing(false);
  };

  const startProduction = async () => {
    if (!script.trim()) return alert(lang === 'ko' ? '스크립트를 입력해주세요.' : 'Script is empty.');
    if (!hasApiKey) return alert(lang === 'ko' ? 'API 키를 먼저 입력해주세요.' : 'Please enter your API key first.');
    
    setIsProcessing(true);
    stopRequestedRef.current = false;
    setLogs([]);
    
    let parsed: Scene[] = [];
    if (isAutoSegment) {
      addLog(`🧠 ${t.segmenting}`);
      try {
        const segments = await autoSegmentScript(script, targetSceneCount);
        parsed = segments.map(seg => {
          const firstSentence = seg.description.split(/[.!?\n]/).find(s => s.trim().length > 0) || 'scene';
          const cleanTitle = firstSentence.replace(/[\\/:*?"<>|]/g, '').trim().slice(0, 60);
          return {
            id: Math.random().toString(36).substr(2, 9), number: seg.number,
            description: seg.description, filename: `${seg.number}_${cleanTitle}.png`,
            status: 'idle', variants: []
          };
        });
      } catch (e: any) {
        handleApiError(e);
        setIsProcessing(false);
        return;
      }
    } else {
      parsed = parseScript(script).map(s => ({ ...s, variants: [] }));
    }

    if (parsed.length === 0) {
      setIsProcessing(false);
      return alert(lang === 'ko' ? '장면을 찾을 수 없습니다.' : 'No scenes found.');
    }

    setScenes(parsed);
    addLog(`🎬 ${lang === 'ko' ? '순차 제작 시작' : 'Sequential production started'}: ${parsed.length} scenes.`);
    
    for (const scene of parsed) {
      if (stopRequestedRef.current) break;
      await generateSingleScene(scene);
    }
    
    setIsProcessing(false);
    addLog(`✅ ${lang === 'ko' ? '모든 프로세스 종료' : 'All processes ended'}.`);
  };

  if (!isAuthenticated) return <Auth onLogin={() => setIsAuthenticated(true)} lang={lang} onToggleLang={toggleLanguage} theme={theme} onToggleTheme={toggleTheme} />;

  if (quotaError) {
    return (
      <div className="min-h-screen bg-[#F9FBFF] dark:bg-[#0a0a0f] flex items-center justify-center p-6 transition-colors">
        <div className="max-w-md w-full bg-white dark:bg-[#1a1a2e] rounded-[2.5rem] border border-slate-200 dark:border-red-900/30 shadow-2xl p-10 text-center">
          <div className="bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-8">
            <AlertTriangle size={40} />
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 mb-4 uppercase tracking-tight">{t.quotaErrorTitle}</h1>
          <p className="text-base text-slate-500 dark:text-slate-400 mb-8 leading-relaxed font-medium">{t.quotaErrorDesc}</p>
          <div className="flex flex-col gap-3">
            <button 
              onClick={() => { setQuotaError(false); setQuality('standard'); }}
              className="w-full bg-slate-900 dark:bg-slate-700 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            >
              {lang === 'ko' ? '표준 모드로 계속하기' : 'Continue in Standard Mode'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F9FBFF] dark:bg-[#0a0a0f] transition-colors">
      {zoomUrl && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 cursor-zoom-out" onClick={() => setZoomUrl(null)}>
          <button className="absolute top-6 right-6 text-white hover:text-red-400"><X size={32} /></button>
          <img src={zoomUrl} alt="Zoomed" className="max-w-full max-h-full rounded-lg shadow-2xl object-contain" />
        </div>
      )}

      {/* API Key Modal */}
      {showApiKeyInput && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setShowApiKeyInput(false)}>
          <div className="bg-white dark:bg-[#1a1a2e] rounded-2xl border border-slate-200 dark:border-slate-700 p-8 max-w-md w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 mb-4 uppercase">{t.apiKeyLabel}</h3>
            <input
              type="password"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder={t.apiKeyPlaceholder}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-[#0f0f1a] border-2 border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-slate-100 outline-none focus:border-red-500 mb-4"
            />
            <div className="flex gap-3">
              <button onClick={handleSaveApiKey} className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black text-sm uppercase transition-all">{t.apiKeySave}</button>
              <button onClick={handleDeleteApiKey} className="px-5 py-3 bg-slate-100 dark:bg-slate-800 text-red-500 rounded-xl font-black text-sm uppercase transition-all">{t.apiKeyDelete}</button>
              <button onClick={() => setShowApiKeyInput(false)} className="px-5 py-3 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-xl font-black text-sm uppercase transition-all">✕</button>
            </div>
          </div>
        </div>
      )}

      <nav className="bg-white dark:bg-[#12121e] border-b border-slate-200 dark:border-red-900/20 sticky top-0 z-40 px-8 py-5 flex items-center justify-between shadow-sm transition-colors">
        <div className="flex items-center gap-4">
          <div className="bg-red-600 text-white p-3 rounded-xl shadow-xl shadow-red-500/20"><Clapperboard size={24} /></div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white uppercase">{t.title}</h1>
              {lastSaved && (
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase transition-all">
                  <Save size={10} /> {t.saved}
                </div>
              )}
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">{t.subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={toggleTheme}
            className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
          >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>
          
          <button 
            onClick={toggleLanguage} 
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-black text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all uppercase"
          >
            <Languages size={16} />{lang === 'en' ? 'KO' : 'EN'}
          </button>

          <button 
            onClick={() => changeQuality(quality === 'standard' ? 'pro' : 'standard')}
            className={`flex items-center gap-2 px-4 py-2 border rounded-full text-xs font-black transition-all uppercase tracking-tight ${quality === 'pro' ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'}`}
          >
            {quality === 'pro' ? <Trophy size={16} /> : <Cpu size={16} />}
            {quality === 'pro' ? 'Ultra (Paid)' : 'Standard (Free)'}
          </button>

          {/* API Key Button */}
          <button 
            onClick={() => setShowApiKeyInput(true)}
            className={`flex items-center gap-2 px-4 py-2 border rounded-full text-xs font-black transition-all uppercase tracking-tight ${hasApiKey ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400' : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400'}`}
          >
            {hasApiKey ? <CheckCircle2 size={16} /> : <Key size={16} />}
            {hasApiKey ? t.apiKeyConnected : t.apiKeyDisconnected}
          </button>

          <button onClick={() => downloadAsZip(scenes)} disabled={isProcessing || !scenes.some(s => s.variants.length > 0)} className="flex items-center gap-2 px-6 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-30 transition-all uppercase"><Download size={18} />{t.exportZip}</button>
          
          <div className="flex items-center gap-2">
            {!isProcessing ? (
              <button onClick={startProduction} className="flex items-center gap-2 px-10 py-3 rounded-xl bg-red-600 text-white text-sm font-black hover:bg-red-700 shadow-lg shadow-red-500/20 transition-all hover:-translate-y-0.5 uppercase"><Play size={18} />{t.startProduction}</button>
            ) : (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-8 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-sm font-black uppercase"><Sparkles className="animate-spin" size={18} />{t.running}</div>
                <button onClick={stopProduction} className="flex items-center gap-2 px-5 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-black hover:bg-red-100 dark:hover:bg-red-900/30 border border-red-100 dark:border-red-800"><Square size={16} fill="currentColor" />{t.stopProduction}</button>
              </div>
            )}
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-[1700px] mx-auto w-full p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 flex flex-col gap-6">
          <section className="bg-white dark:bg-[#1a1a2e] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-8 flex flex-col gap-6 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-slate-900 dark:text-white"><Layout size={24} className="text-red-500" /><h2 className="text-base font-black uppercase tracking-widest">{t.masterScript}</h2></div>
              <div className="flex items-center gap-2">
                <button onClick={handleResetWorkspace} className="p-2 text-slate-400 hover:text-red-500 transition-colors" title={t.resetWorkspace}><Trash2 size={18} /></button>
                <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-bold px-2.5 py-1 rounded-md">{t.scriptBadge}</div>
              </div>
            </div>
            <div className="flex items-center justify-between p-5 bg-slate-50 dark:bg-[#12121e] rounded-2xl border border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-4">
                <div className={`p-2.5 rounded-lg ${isAutoSegment ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}><Scissors size={20} /></div>
                <div><h3 className="text-sm font-black text-slate-700 dark:text-slate-200 uppercase tracking-tight">{t.autoSegment}</h3><p className="text-xs text-slate-400 dark:text-slate-500 font-medium">Gemini Intelligence</p></div>
              </div>
              <button onClick={() => setIsAutoSegment(!isAutoSegment)} className={`w-14 h-7 rounded-full transition-colors relative ${isAutoSegment ? 'bg-red-500' : 'bg-slate-300 dark:bg-slate-700'}`}><div className={`absolute top-1 bg-white w-5 h-5 rounded-full transition-all ${isAutoSegment ? 'left-8' : 'left-1'}`} /></button>
            </div>
            <div className="relative group">
              <textarea
                className="w-full h-[350px] p-6 bg-white dark:bg-[#0f0f1a] text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none text-base font-medium leading-relaxed resize-none shadow-inner"
                placeholder={t.scriptPlaceholder}
                value={script}
                onChange={(e) => setScript(e.target.value)}
              />
            </div>
            {isAutoSegment ? (
              <div className="space-y-5 p-5 bg-red-50/50 dark:bg-red-900/10 rounded-2xl border border-red-100 dark:border-red-900/20">
                <div className="flex items-center justify-between"><label className="text-xs font-black text-red-600 dark:text-red-400 uppercase tracking-widest flex items-center gap-2"><Zap size={14} /> {t.targetScenes}</label><span className="bg-red-600 dark:bg-red-500 text-white text-sm font-black px-3 py-1.5 rounded-lg shadow-md">{targetSceneCount}</span></div>
                <div className="flex items-center gap-4">
                  <button onClick={() => setTargetSceneCount(Math.max(1, targetSceneCount - 1))} className="p-2.5 bg-white dark:bg-slate-800 border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 rounded-lg"><Minus size={18} /></button>
                  <input type="range" min="1" max="100" value={targetSceneCount} onChange={(e) => setTargetSceneCount(parseInt(e.target.value))} className="flex-1 accent-red-600" />
                  <button onClick={() => setTargetSceneCount(Math.min(100, targetSceneCount + 1))} className="p-2.5 bg-white dark:bg-slate-800 border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 rounded-lg"><Plus size={18} /></button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2.5 p-4 bg-slate-50 dark:bg-[#12121e] rounded-xl border border-slate-100 dark:border-slate-700">
                <Info size={16} className="text-red-500 shrink-0" />
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight leading-tight">{t.manualInfo}</p>
              </div>
            )}
          </section>
          <section className="h-[280px]"><StatusMonitor logs={logs} /></section>
        </div>

        <div className="lg:col-span-8 flex flex-col gap-8">
          <section className="bg-white dark:bg-[#1a1a2e] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-8 space-y-8 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-slate-900 dark:text-white"><Settings2 size={24} className="text-red-500" /><h2 className="text-base font-black uppercase tracking-widest">{t.visualDirection}</h2></div>
              <div className="flex bg-slate-100 dark:bg-[#12121e] p-1 rounded-xl">
                <button 
                  onClick={() => changeQuality('standard')}
                  className={`px-5 py-2 rounded-lg text-xs font-black uppercase transition-all ${quality === 'standard' ? 'bg-white dark:bg-slate-700 text-red-600 dark:text-red-400 shadow-sm' : 'text-slate-400'}`}
                >
                  Standard
                </button>
                <button 
                  onClick={() => changeQuality('pro')}
                  className={`px-5 py-2 rounded-lg text-xs font-black uppercase transition-all ${quality === 'pro' ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-sm' : 'text-slate-400'}`}
                >
                  Ultra (Pro)
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-7">
                <div className="space-y-4"><label className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{t.artStyle}</label>
                  <div className="grid grid-cols-3 gap-3">{STYLE_PRESETS.map((p) => (<button key={p} onClick={() => setStylePreset(p)} className={`px-4 py-4 rounded-xl text-xs font-black border-2 transition-all ${stylePreset === p ? 'bg-red-50 dark:bg-red-900/20 border-red-500 text-red-700 dark:text-red-400' : 'bg-white dark:bg-[#0f0f1a] border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-500'}`}>{p}</button>))}</div>
                </div>
                <div className="space-y-4"><label className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{t.aspectRatio}</label>
                  <div className="flex gap-3">{ASPECT_RATIOS.map((r) => (<button key={r} onClick={() => setAspectRatio(r)} className={`flex-1 py-4 rounded-xl text-xs font-black border-2 transition-all flex items-center justify-center gap-2 ${aspectRatio === r ? 'bg-red-50 dark:bg-red-900/20 border-red-500 text-red-700 dark:text-red-400' : 'bg-white dark:bg-[#0f0f1a] border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-500'}`}><Maximize size={16} className={r === '9:16' ? 'rotate-90' : ''} />{r}</button>))}</div>
                </div>
              </div>
              <div className="space-y-5"><label className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{t.atmosphere}</label>
                <div className="flex flex-col gap-5"><textarea placeholder={t.atmospherePlaceholder} className="w-full bg-slate-50 dark:bg-[#0f0f1a] text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-xl px-5 py-4 text-sm outline-none h-[110px] focus:ring-2 focus:ring-red-500/20" value={customStyle} onChange={(e) => setCustomStyle(e.target.value)} />
                  <div className="space-y-3"><label className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{t.styleRefLabel}</label>
                    <div className="relative group">{styleRef ? (<div className="relative h-24 w-full rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800"><img src={styleRef.data} alt="Ref" className="w-full h-full object-cover" /><button onClick={() => setStyleRef(null)} className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full shadow-lg"><X size={14} /></button></div>) : (
                      <label className="h-24 w-full border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-center gap-4 text-slate-400 dark:text-slate-600 cursor-pointer hover:border-red-400 transition-colors"><ImageIcon size={24} /><div className="flex flex-col"><span className="text-xs font-bold uppercase">{t.styleRefLabel}</span><span className="text-[10px] uppercase">{t.styleRefDesc}</span></div><input type="file" className="hidden" accept="image/*" onChange={handleStyleRefUpload} /></label>)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="pt-6 border-t border-slate-50 dark:border-slate-800">
              <div className="flex items-center justify-between mb-5">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-3"><Layers size={20} className="text-red-500" /><label className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{t.charEnsemble}</label></div>
                </div>
                <div className="flex items-center gap-2">
                  {characters.length < 12 && (
                    <button onClick={handleAddCharacter} className="flex items-center gap-2 text-xs font-black text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-4 py-2 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors border border-red-100 dark:border-red-900/30 uppercase tracking-tighter">
                      <Plus size={16} /> {t.newSlot}
                    </button>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {characters.map((char) => (
                  <CharacterCard 
                    key={char.id} 
                    character={char} 
                    onUpdate={handleUpdateCharacter} 
                    onRemove={handleRemoveCharacter}
                    onRegenerate={() => generateSingleCharacterProfile(char)}
                  />
                ))}
              </div>
            </div>
          </section>

          <section className="space-y-7">
            <div className="flex items-center justify-between"><div className="flex items-center gap-3 text-slate-900 dark:text-white"><Clapperboard size={24} className="text-red-500" /><h2 className="text-base font-black uppercase tracking-widest">{t.storyboardOutput}</h2></div><div className="flex items-center gap-5">{scenes.some(s => s.status === 'error') && (<button onClick={handleRetryFailed} className="flex items-center gap-2 px-5 py-2 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-full border border-amber-100 dark:border-amber-900/30 text-xs font-black uppercase"><RefreshCcw size={14} />{t.retryFailed}</button>)}{scenes.length > 0 && (<span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">{scenes.length} {t.framesGenerated}</span>)}</div></div>
            {scenes.length > 0 ? (<SceneGallery scenes={scenes} onRegenerate={handleRegenerateScene} onZoom={setZoomUrl} isProcessing={isProcessing} />) : (
              <div className="bg-white dark:bg-[#1a1a2e] rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 py-28 flex flex-col items-center justify-center text-slate-400 dark:text-slate-600 gap-5 transition-colors"><div className="bg-slate-50 dark:bg-[#12121e] p-8 rounded-full"><Layout size={48} className="opacity-20" /></div><div className="text-center"><p className="text-base font-bold text-slate-500 dark:text-slate-400">{t.workspaceEmpty}</p><p className="text-sm">{t.workspaceEmptyDesc}</p></div></div>
            )}
          </section>
        </div>
      </main>
      <footer className="bg-white dark:bg-[#12121e] border-t border-slate-100 dark:border-slate-800 py-10 px-8 text-center mt-12 transition-colors"><p className="text-xs text-slate-400 dark:text-slate-600 font-black uppercase tracking-[0.3em]">&copy; 2025 Goosebumps Studio — AI Storyboard Engine</p></footer>
    </div>
  );
};

export default App;
