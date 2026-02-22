
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
  LogOut,
  User as UserIcon,
  Zap,
  Scissors,
  RefreshCcw,
  Info,
  Key,
  ShieldCheck,
  ExternalLink,
  AlertTriangle,
  Sun,
  Moon,
  Cpu,
  Trophy,
  Trash2,
  Save
} from 'lucide-react';
import { Character, Scene, StylePreset, STYLE_PRESETS, AspectRatio, Language, User, SceneVariant, Theme, ImageQuality } from './types';
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
  analyzeScriptForCharacters
} from './services/geminiService';

const PERSISTENCE_KEY = 'sb_workspace_data_v1';

const TRANSLATIONS = {
  en: {
    title: "Byun-genius Cinematic AI",
    pro: "Engine",
    subtitle: "Joseon-style Cinematic Prompt Engine",
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
    atmospherePlaceholder: "e.g. Moonlight, Candlelight, Foggy morning",
    styleRefLabel: "Style Reference Image",
    styleRefDesc: "Optional reference for lighting/mood",
    charEnsemble: "Character Ensemble (Consistency Lock)",
    newSlot: "NEW SLOT",
    storyboardOutput: "Storyboard Output",
    framesGenerated: "FRAMES GENERATED",
    workspaceEmpty: "Workspace is empty",
    workspaceEmptyDesc: "Your storyboard frames will appear here once production starts.",
    stoppedLog: "⚠️ Production stopped by user.",
    logout: "Logout",
    autoSegment: "AI Auto-Segment",
    targetScenes: "Target Frame Count",
    segmenting: "AI is analyzing script...",
    manualInfo: "Manual Mode: Split by numbers (1.) or empty lines between paragraphs.",
    retryFailed: "Retry All Failed",
    apiKeyRequired: "Paid Project Key Required",
    apiKeyDesc: "The 'Ultra' quality mode requires an API key from a Google Cloud project with billing enabled. Free-tier keys are not selectable in the dialog.",
    connectKey: "Link Paid Project Key",
    billingDocs: "Billing Help",
    keyConnected: "Ultra Mode Active",
    keyDisconnected: "Standard Mode",
    quotaErrorTitle: "Quota Exceeded",
    quotaErrorDesc: "You have reached your API limit. If you are using a free key, wait a few minutes. For higher limits, use a paid project key.",
    qualityLabel: "Production Quality",
    qStandard: "Standard (Fast/Free)",
    qPro: "Ultra (High-Res/Paid)",
    qDescStandard: "Works with any Gemini key. Very fast.",
    qDescPro: "Best detail. Requires billing-enabled project.",
    resetWorkspace: "Reset Workspace",
    confirmReset: "Are you sure? This will delete all generated images and text.",
    saved: "Saved",
    customKeyLabel: "Custom API Key",
    setKey: "Set Key",
    removeKey: "Remove",
    keyPlaceholder: "Enter Gemini API Key",
    autoAnalyze: "Auto Analyze Characters",
    analyzing: "Analyzing...",
    refreshAll: "Refresh All",
    pauseProduction: "PAUSE",
    resumeProduction: "RESUME"
  },
  ko: {
    title: "변지니어스 시네마틱 AI",
    pro: "엔진",
    subtitle: "조선풍 시네마틱 프롬프트 엔진",
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
    atmospherePlaceholder: "예: 달빛, 촛불, 안개 낀 아침",
    styleRefLabel: "스타일 레퍼런스 이미지",
    styleRefDesc: "조명이나 분위기를 위한 선택적 참고 이미지",
    charEnsemble: "등장인물 설정 (일관성 유지)",
    newSlot: "새 슬롯",
    storyboardOutput: "스토리보드 결과물",
    framesGenerated: "프레임 생성됨",
    workspaceEmpty: "작업 공간이 비어 있습니다",
    workspaceEmptyDesc: "제작을 시작하면 스토리보드 프레임이 여기에 나타납니다.",
    stoppedLog: "⚠️ 사용자에 의해 제작이 중지되었습니다.",
    logout: "로그아웃",
    autoSegment: "AI 자동 장면 분할",
    targetScenes: "목표 프레임(이미지) 갯수",
    segmenting: "AI가 대본을 분석하여 장면을 나누는 중...",
    manualInfo: "수동 모드: 숫자(1.) 또는 문단 사이 빈 줄로 구분됩니다.",
    retryFailed: "실패 항목 전체 재시도",
    apiKeyRequired: "유료 프로젝트 키 필요",
    apiKeyDesc: "'울트라' 고화질 모드는 결제가 활성화된 Google Cloud 프로젝트의 키가 필요합니다. 무료 등급 키는 연결 대화상자에서 선택할 수 없습니다.",
    connectKey: "유료 프로젝트 키 연결",
    billingDocs: "결제 안내",
    keyConnected: "울트라 모드 활성",
    keyDisconnected: "표준 모드",
    quotaErrorTitle: "API 할당량 초과",
    quotaErrorDesc: "API 호출 횟수를 모두 소모했습니다. 무료 키의 경우 몇 분 뒤에 다시 시도해주세요. 더 많은 양을 원하시면 유료 프로젝트 키를 사용하세요.",
    qualityLabel: "제작 품질 설정",
    qStandard: "표준 (무료 가능/빠름)",
    qPro: "울트라 (고화질/유료전용)",
    qDescStandard: "모든 키에서 작동합니다. 속도가 매우 빠릅니다.",
    qDescPro: "최고의 디테일을 제공합니다. 결제 계정 연결이 필요합니다.",
    resetWorkspace: "워크스페이스 초기화",
    confirmReset: "정말 초기화하시겠습니까? 생성된 모든 이미지와 텍스트가 삭제됩니다.",
    saved: "저장됨",
    customKeyLabel: "커스텀 API 키",
    setKey: "키 설정",
    removeKey: "삭제",
    keyPlaceholder: "Gemini API 키 입력",
    autoAnalyze: "캐릭터 자동 분석",
    analyzing: "분석 중...",
    refreshAll: "전체 다시 분석",
    pauseProduction: "일시정지",
    resumeProduction: "이어서 제작"
  }
};

const ASPECT_RATIOS: AspectRatio[] = ['16:9', '4:3', '1:1', '9:16'];

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>({ name: "Guest", email: "guest@example.com", avatar: "" });
  const [lang, setLang] = useState<Language>('ko');
  const [theme, setTheme] = useState<Theme>('dark');
  
  // Persistence States
  const [quality, setQuality] = useState<ImageQuality>('standard');
  const [script, setScript] = useState('');
  const [targetSceneCount, setTargetSceneCount] = useState(5);
  const [isAutoSegment, setIsAutoSegment] = useState(true);
  const [stylePreset, setStylePreset] = useState<StylePreset>('사극 영화 톤(Historical Drama)');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [customStyle, setCustomStyle] = useState('');
  const [styleRef, setStyleRef] = useState<{ data: string, mimeType: string } | null>(null);
  const [characters, setCharacters] = useState<Character[]>([{ id: '1', name: '' }]);
  const [scenes, setScenes] = useState<Scene[]>([]);
  
  // UI States
  const [isProcessing, setIsProcessing] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [zoomUrl, setZoomUrl] = useState<string | null>(null);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [quotaError, setQuotaError] = useState(false);
  const [lastSaved, setLastSaved] = useState<number | null>(null);
  
  const stopRequestedRef = useRef(false);
  const isInitialMount = useRef(true);

  const [customApiKey, setCustomApiKey] = useState('');
  const [showKeyInput, setShowKeyInput] = useState(false);

  // Load Saved Data
  useEffect(() => {
    const savedUser = localStorage.getItem('sb_user');
    if (savedUser) setUser(JSON.parse(savedUser));
    checkApiKeyStatus();

    const savedKey = localStorage.getItem('custom_gemini_api_key');
    if (savedKey) setCustomApiKey(savedKey);

    const savedData = localStorage.getItem(PERSISTENCE_KEY);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setQuality(parsed.quality || 'standard');
        setScript(parsed.script || '');
        setTargetSceneCount(parsed.targetSceneCount || 5);
        setIsAutoSegment(parsed.isAutoSegment ?? true);
        setStylePreset(parsed.stylePreset || '사극 영화 톤(Historical Drama)');
        setAspectRatio(parsed.aspectRatio || '16:9');
        setCustomStyle(parsed.customStyle || '');
        setStyleRef(parsed.styleRef || null);
        setCharacters(parsed.characters || [{ id: '1', name: '' }]);
        setScenes(parsed.scenes || []);
        addLog(lang === 'ko' ? "📁 이전 작업 상태를 복구했습니다." : "📁 Restored previous workspace state.");
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
          quality,
          script,
          targetSceneCount,
          isAutoSegment,
          stylePreset,
          aspectRatio,
          customStyle,
          styleRef,
          characters,
          scenes
        };
        localStorage.setItem(PERSISTENCE_KEY, JSON.stringify(dataToSave));
        setLastSaved(Date.now());
      } catch (e: any) {
        if (e.name === 'QuotaExceededError') {
          console.warn("Storage quota exceeded. Some images might not be saved.");
          addLog("⚠️ " + (lang === 'ko' ? "저장 공간이 부족하여 일부 데이터가 저장되지 않을 수 있습니다." : "Storage quota exceeded."));
        }
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [quality, script, targetSceneCount, isAutoSegment, stylePreset, aspectRatio, customStyle, styleRef, characters, scenes]);

  useEffect(() => {
    document.documentElement.classList.add('dark');
    localStorage.setItem('sb_theme', 'dark');
  }, []);

  const checkApiKeyStatus = async () => {
    const isSelected = await (window as any).aistudio.hasSelectedApiKey();
    setHasApiKey(isSelected);
  };

  const handleSelectKey = async () => {
    try {
      await (window as any).aistudio.openSelectKey();
      const isSelected = await (window as any).aistudio.hasSelectedApiKey();
      setHasApiKey(isSelected);
      setQuotaError(false);
    } catch (e) {
      console.error("Failed to select key", e);
    }
  };

  const handleSaveCustomKey = () => {
    if (customApiKey.trim()) {
      localStorage.setItem('custom_gemini_api_key', customApiKey.trim());
      setShowKeyInput(false);
      addLog(lang === 'ko' ? "🔑 커스텀 API 키가 저장되었습니다." : "🔑 Custom API Key saved.");
    }
  };

  const handleRemoveCustomKey = () => {
    localStorage.removeItem('custom_gemini_api_key');
    setCustomApiKey('');
    setShowKeyInput(false);
    addLog(lang === 'ko' ? "🗑️ 커스텀 API 키가 삭제되었습니다." : "🗑️ Custom API Key removed.");
  };

  const handleResetWorkspace = () => {
    if (window.confirm(t.confirmReset)) {
      stopProduction();
      setScript('');
      setScenes([]);
      setCharacters([{ id: '1', name: '' }]);
      setCustomStyle('');
      setStyleRef(null);
      setLogs([]);
      // Clear persistence
      localStorage.removeItem(PERSISTENCE_KEY);
      addLog(lang === 'ko' ? "🧹 워크스페이스가 초기화되었습니다." : "🧹 Workspace cleared.");
    }
  };

  const changeQuality = async (newQuality: ImageQuality) => {
    if (newQuality === 'pro') {
      const isSelected = await (window as any).aistudio.hasSelectedApiKey();
      if (!isSelected) {
        await handleSelectKey();
        const confirmed = await (window as any).aistudio.hasSelectedApiKey();
        if (!confirmed) {
          addLog("⚠️ " + (lang === 'ko' ? '울트라 모드를 위해 유료 키 연결이 필요합니다. 표준 모드로 유지합니다.' : 'Ultra mode needs a paid key. Staying on Standard.'));
          return;
        }
      }
    }
    setQuality(newQuality);
  };

  const handleLogout = () => {
    localStorage.removeItem('sb_user');
    setUser(null);
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
      if (quality === 'pro') {
        setHasApiKey(false);
      }
    } else {
      addLog(`❌ ${scenePrefix}FAILED: ${error.message || 'Unknown error'}`);
    }
  };

  const generateSingleCharacterProfile = async (targetChar: Character) => {
    if (!targetChar.name) return;
    setCharacters(prev => prev.map(c => c.id === targetChar.id ? { ...c, isGenerating: true } : c));
    
    try {
      const imageUrl = await generateCharacterProfileImage(
        targetChar.name, 
        targetChar.description || "", 
        stylePreset, 
        customStyle,
        quality
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

  const handleAutoAnalyzeCharacters = async () => {
    if (!script) {
      alert(lang === 'ko' ? "먼저 스크립트를 입력해주세요." : "Please enter a script first.");
      return;
    }
    
    setIsProcessing(true);
    addLog(lang === 'ko' ? "🤖 캐릭터 분석 중..." : "🤖 Analyzing characters...");
    
    try {
      const analyzedChars = await analyzeScriptForCharacters(script);
      if (analyzedChars.length > 0) {
        const charsWithLoading = analyzedChars.map(c => ({ ...c, isGenerating: true }));
        setCharacters(charsWithLoading);
        
        addLog(lang === 'ko' ? `✅ ${analyzedChars.length}명의 캐릭터를 찾았습니다. 이미지 생성 시작...` : `✅ Found ${analyzedChars.length} characters. Generating images...`);
        
        const promises = charsWithLoading.map(async (char) => {
           try {
             const imageUrl = await generateCharacterProfileImage(
               char.name, 
               char.description || "", 
               stylePreset, 
               customStyle,
               quality
             );
             
             setCharacters(prev => prev.map(c => c.id === char.id ? { ...c, image: imageUrl, isGenerating: false } : c));
           } catch (e) {
             console.error(e);
             setCharacters(prev => prev.map(c => c.id === char.id ? { ...c, isGenerating: false } : c));
           }
        });
        
        await Promise.all(promises);
      } else {
        addLog(lang === 'ko' ? "⚠️ 캐릭터를 찾지 못했습니다." : "⚠️ No characters found.");
      }
    } catch (e) {
      console.error(e);
      addLog(lang === 'ko' ? "❌ 분석 실패" : "❌ Analysis failed");
    } finally {
      setIsProcessing(false);
    }
  };

  const resumeProduction = async () => {
    const pendingScenes = scenes.filter(s => s.status === 'idle' || s.status === 'error');
    if (pendingScenes.length === 0) return alert(lang === 'ko' ? '제작할 남은 장면이 없습니다.' : 'No pending scenes.');
    
    setIsProcessing(true);
    stopRequestedRef.current = false;
    addLog(`▶️ ${lang === 'ko' ? '제작 재개' : 'Resuming production'}: ${pendingScenes.length} scenes remaining.`);
    
    for (const scene of pendingScenes) {
      if (stopRequestedRef.current) break;
      await generateSingleScene(scene);
    }
    
    setIsProcessing(false);
    if (!stopRequestedRef.current) {
      addLog(`✅ ${lang === 'ko' ? '모든 프로세스 종료' : 'All processes ended'}.`);
    }
  };

  const startProduction = async () => {
    if (!script.trim()) return alert(lang === 'ko' ? '스크립트를 입력해주세요.' : 'Script is empty.');
    
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
            id: Math.random().toString(36).substr(2, 9),
            number: seg.number,
            description: seg.description,
            filename: `${seg.number}_${cleanTitle}.png`,
            status: 'idle',
            variants: []
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



  if (quotaError) {
    return (
      <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center p-6 transition-colors">
        <div className="max-w-md w-full bg-[#12141a] rounded-[2.5rem] border border-slate-800/50 shadow-2xl p-10 text-center">
          <div className="bg-red-900/20 text-red-500 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-red-900/30">
            <AlertTriangle size={40} />
          </div>
          <h1 className="text-3xl font-black text-slate-200 mb-4 uppercase tracking-tight">{t.quotaErrorTitle}</h1>
          <p className="text-base text-slate-500 mb-8 leading-relaxed font-medium">{t.quotaErrorDesc}</p>
          
          <div className="flex flex-col gap-3">
            <button 
              onClick={() => { setQuotaError(false); setQuality('standard'); }}
              className="w-full bg-slate-800 text-slate-300 py-4 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-[0.98] hover:bg-slate-700"
            >
              {lang === 'ko' ? '표준 모드로 계속하기' : 'Continue in Standard Mode'}
            </button>
            <button 
              onClick={handleSelectKey}
              className="w-full bg-gradient-to-r from-red-900 to-orange-900 text-red-100 py-4 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 hover:from-red-800 hover:to-orange-800 shadow-xl shadow-black/40 border border-red-900/30 transition-all active:scale-[0.98]"
            >
              <RefreshCcw size={20} />
              {lang === 'ko' ? '유료 키로 다시 시도' : 'Try Paid Project Key'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0b] text-slate-400 font-sans selection:bg-red-900/30 selection:text-red-200">
      {zoomUrl && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 cursor-zoom-out backdrop-blur-sm" onClick={() => setZoomUrl(null)}>
          <button className="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors"><X size={32} /></button>
          <img src={zoomUrl} alt="Zoomed" className="max-w-full max-h-full rounded-lg shadow-2xl object-contain ring-1 ring-white/10" />
        </div>
      )}

      <nav className="bg-[#0a0a0b]/80 backdrop-blur-md border-b border-slate-800/50 sticky top-0 z-40 px-8 py-4 flex items-center justify-between shadow-lg shadow-black/40">
        <div className="flex items-center gap-4">
          <div className="bg-gradient-to-br from-red-900 to-orange-900 text-red-100 p-3 rounded-xl shadow-lg shadow-red-900/10 border border-red-800/30"><Clapperboard size={24} /></div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black tracking-tight text-slate-200 uppercase">{t.title} <span className="text-red-700">{t.pro}</span></h1>
              {lastSaved && (
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-900 rounded text-[10px] font-bold text-slate-600 uppercase transition-all border border-slate-800">
                  <Save size={10} /> {t.saved}
                </div>
              )}
            </div>
            <p className="text-xs text-slate-600 font-bold uppercase tracking-widest">{t.subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Theme toggle removed as we are enforcing dark mode */}
          
          <button 
            onClick={toggleLanguage} 
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-800 text-xs font-black text-slate-500 hover:bg-slate-800 hover:text-slate-300 transition-all uppercase"
          >
            <Languages size={16} />{lang === 'en' ? 'KO' : 'EN'}
          </button>

          <div className="relative">
            <button 
              onClick={() => setShowKeyInput(!showKeyInput)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-black transition-all uppercase ${customApiKey ? 'bg-red-900/10 border-red-900/30 text-red-500' : 'border-slate-800 text-slate-500 hover:bg-slate-800 hover:text-slate-300'}`}
            >
              <Key size={16} /> {customApiKey ? (lang === 'ko' ? '키 사용 중' : 'Key Active') : (lang === 'ko' ? '키 설정' : 'Set Key')}
            </button>
            
            {showKeyInput && (
              <div className="absolute top-full right-0 mt-2 w-72 bg-[#12141a] rounded-2xl border border-slate-800 shadow-2xl shadow-black p-4 z-50 flex flex-col gap-3">
                <label className="text-xs font-black text-slate-500 uppercase">{t.customKeyLabel}</label>
                <input 
                  type="password" 
                  value={customApiKey} 
                  onChange={(e) => setCustomApiKey(e.target.value)} 
                  placeholder={t.keyPlaceholder}
                  className="w-full px-3 py-2 bg-[#0a0a0b] border border-slate-800 rounded-lg text-sm outline-none focus:ring-1 focus:ring-red-900 text-slate-300 placeholder-slate-700"
                />
                <div className="flex gap-2">
                  <button onClick={handleSaveCustomKey} className="flex-1 bg-red-900 text-red-100 py-2 rounded-lg text-xs font-bold hover:bg-red-800 transition-colors border border-red-800">
                    {t.setKey}
                  </button>
                  <button onClick={handleRemoveCustomKey} className="px-3 bg-slate-800 text-slate-400 rounded-lg text-xs font-bold hover:bg-slate-700 hover:text-white transition-colors border border-slate-700">
                    {t.removeKey}
                  </button>
                </div>
              </div>
            )}
          </div>

          <button 
            onClick={() => changeQuality(quality === 'standard' ? 'pro' : 'standard')}
            className={`flex items-center gap-2 px-4 py-2 border rounded-full text-xs font-black transition-all uppercase tracking-tight ${quality === 'pro' ? 'bg-amber-900/10 border-amber-900/30 text-amber-600' : 'bg-slate-900 border-slate-800 text-slate-500'}`}
          >
            {quality === 'pro' ? <Trophy size={16} /> : <Cpu size={16} />}
            {quality === 'pro' ? 'Ultra (Paid)' : 'Standard (Free)'}
          </button>

          {quality === 'pro' && (
            <button 
              onClick={handleSelectKey}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-900/10 border border-emerald-900/30 rounded-full text-xs font-black text-emerald-600 hover:bg-emerald-900/20 transition-colors uppercase tracking-tight"
            >
              <ShieldCheck size={16} />
              {hasApiKey ? t.keyConnected : t.connectKey}
            </button>
          )}
          
          <button onClick={() => downloadAsZip(scenes)} disabled={isProcessing || !scenes.some(s => s.variants.length > 0)} className="flex items-center gap-2 px-6 py-3 rounded-xl border border-slate-800 text-sm font-bold text-slate-500 hover:bg-slate-800 hover:text-slate-300 disabled:opacity-30 transition-all uppercase"><Download size={18} />{t.exportZip}</button>
        </div>
      </nav>

      <main className="flex-1 max-w-[1800px] mx-auto w-full p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 flex flex-col gap-6">
          <section className="bg-[#12141a] rounded-3xl border border-slate-800/50 shadow-xl p-6 flex flex-col gap-6 h-full">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-slate-300"><Layout size={24} className="text-slate-600" /><h2 className="text-base font-black uppercase tracking-widest">{t.masterScript}</h2></div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={handleResetWorkspace} 
                  className="flex items-center gap-2 px-3 py-1.5 bg-red-900/10 text-red-500 rounded-lg text-xs font-black uppercase hover:bg-red-900/20 transition-colors border border-red-900/20"
                  title={t.resetWorkspace}
                >
                  <Trash2 size={14} /> {t.resetWorkspace}
                </button>
                <div className="bg-red-900/10 text-red-700 text-xs font-bold px-2.5 py-1 rounded-md border border-red-900/20">{t.scriptBadge}</div>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-[#0a0a0b] rounded-2xl border border-slate-800/50">
              <div className="flex items-center gap-4">
                <div className={`p-2.5 rounded-lg ${isAutoSegment ? 'bg-red-900 text-red-100 shadow-lg shadow-black/20 border border-red-800' : 'bg-slate-900 text-slate-600 border border-slate-800'}`}><Scissors size={20} /></div>
                <div><h3 className="text-sm font-black text-slate-300 uppercase tracking-tight">{t.autoSegment}</h3><p className="text-xs text-slate-600 font-medium">Gemini Intelligence</p></div>
              </div>
              <button onClick={() => setIsAutoSegment(!isAutoSegment)} className={`w-14 h-7 rounded-full transition-colors relative border border-slate-800 ${isAutoSegment ? 'bg-red-900' : 'bg-slate-900'}`}><div className={`absolute top-1 bg-slate-200 w-5 h-5 rounded-full transition-all ${isAutoSegment ? 'left-8' : 'left-1'}`} /></button>
            </div>
            <div className="relative group flex-1">
              <textarea
                className="w-full h-full min-h-[400px] p-6 bg-[#0a0a0b] text-slate-300 border border-slate-800/50 rounded-2xl focus:ring-1 focus:ring-red-900/50 focus:border-red-900/50 outline-none text-base font-medium leading-relaxed resize-none shadow-inner placeholder-slate-700"
                placeholder={t.scriptPlaceholder}
                value={script}
                onChange={(e) => setScript(e.target.value)}
              />
            </div>
            {isAutoSegment ? (
              <div className="space-y-4 p-5 bg-red-900/5 rounded-2xl border border-red-900/10">
                <div className="flex items-center justify-between"><label className="text-xs font-black text-red-800 uppercase tracking-widest flex items-center gap-2"><Zap size={14} /> {t.targetScenes}</label><span className="bg-red-900 text-red-100 text-sm font-black px-3 py-1.5 rounded-lg shadow-md border border-red-800">{targetSceneCount}</span></div>
                <div className="flex items-center gap-4">
                  <button onClick={() => setTargetSceneCount(Math.max(1, targetSceneCount - 1))} className="p-2.5 bg-[#0a0a0b] border border-slate-800 text-slate-500 rounded-lg hover:bg-slate-900 transition-colors"><Minus size={18} /></button>
                  <input type="range" min="1" max="100" value={targetSceneCount} onChange={(e) => setTargetSceneCount(parseInt(e.target.value))} className="flex-1 accent-red-900 h-2 bg-slate-900 rounded-lg appearance-none cursor-pointer" />
                  <button onClick={() => setTargetSceneCount(Math.min(100, targetSceneCount + 1))} className="p-2.5 bg-[#0a0a0b] border border-slate-800 text-slate-500 rounded-lg hover:bg-slate-900 transition-colors"><Plus size={18} /></button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2.5 p-4 bg-slate-900/50 rounded-xl border border-slate-800">
                <Info size={16} className="text-slate-600 shrink-0" />
                <p className="text-xs font-bold text-slate-500 uppercase tracking-tight leading-tight">
                  {t.manualInfo}
                </p>
              </div>
            )}
          </section>
        </div>

        <div className="lg:col-span-8 flex flex-col gap-6">
          <section className="bg-[#12141a] rounded-3xl border border-slate-800/50 shadow-xl p-8 space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-slate-300"><Settings2 size={24} className="text-slate-600" /><h2 className="text-base font-black uppercase tracking-widest">{t.visualDirection}</h2></div>
              <div className="flex bg-[#0a0a0b] p-1 rounded-xl border border-slate-800">
                <button 
                  onClick={() => changeQuality('standard')}
                  className={`px-5 py-2 rounded-lg text-xs font-black uppercase transition-all ${quality === 'standard' ? 'bg-slate-800 text-red-500 shadow-sm border border-slate-700' : 'text-slate-600 hover:text-slate-400'}`}
                >
                  Standard
                </button>
                <button 
                  onClick={() => changeQuality('pro')}
                  className={`px-5 py-2 rounded-lg text-xs font-black uppercase transition-all ${quality === 'pro' ? 'bg-slate-800 text-amber-600 shadow-sm border border-slate-700' : 'text-slate-600 hover:text-slate-400'}`}
                >
                  Ultra (Pro)
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-7">
                <div className="space-y-4"><label className="text-xs font-black text-slate-600 uppercase tracking-widest">{t.artStyle}</label>
                  <div className="grid grid-cols-2 gap-3">{STYLE_PRESETS.map((p) => (<button key={p} onClick={() => setStylePreset(p)} className={`px-5 py-4 rounded-xl text-xs font-black border transition-all ${stylePreset === p ? 'bg-red-900/10 border-red-900/30 text-red-500' : 'bg-[#0a0a0b] border-slate-800 text-slate-500 hover:border-slate-700 hover:text-slate-400'}`}>{p}</button>))}</div>
                </div>
                <div className="space-y-4"><label className="text-xs font-black text-slate-600 uppercase tracking-widest">{t.aspectRatio}</label>
                  <div className="flex gap-3">{ASPECT_RATIOS.map((r) => (<button key={r} onClick={() => setAspectRatio(r)} className={`flex-1 py-4 rounded-xl text-xs font-black border transition-all flex items-center justify-center gap-2 ${aspectRatio === r ? 'bg-red-900/10 border-red-900/30 text-red-500' : 'bg-[#0a0a0b] border-slate-800 text-slate-500 hover:border-slate-700 hover:text-slate-400'}`}><Maximize size={16} className={r === '9:16' ? 'rotate-90' : ''} />{r}</button>))}</div>
                </div>
              </div>
              <div className="space-y-5"><label className="text-xs font-black text-slate-600 uppercase tracking-widest">{t.atmosphere}</label>
                <div className="flex flex-col gap-5"><textarea placeholder={t.atmospherePlaceholder} className="w-full bg-[#0a0a0b] text-slate-300 border border-slate-800 rounded-xl px-5 py-4 text-sm outline-none h-[110px] focus:ring-1 focus:ring-red-900/30 placeholder-slate-700" value={customStyle} onChange={(e) => setCustomStyle(e.target.value)} />
                  <div className="space-y-3"><label className="text-xs font-black text-slate-600 uppercase tracking-widest">{t.styleRefLabel}</label>
                    <div className="relative group">{styleRef ? (<div className="relative h-24 w-full rounded-xl overflow-hidden border border-slate-800"><img src={styleRef.data} alt="Ref" className="w-full h-full object-cover" /><button onClick={() => setStyleRef(null)} className="absolute top-2 right-2 bg-red-900 text-red-100 p-1.5 rounded-full shadow-lg border border-red-800"><X size={14} /></button></div>) : (
                      <label className="h-24 w-full border border-dashed border-slate-800 rounded-xl flex items-center justify-center gap-4 text-slate-600 cursor-pointer hover:border-red-900/30 hover:text-red-500 transition-all bg-[#0a0a0b]"><ImageIcon size={24} /><div className="flex flex-col"><span className="text-xs font-bold uppercase">{t.styleRefLabel}</span><span className="text-[10px] uppercase">{t.styleRefDesc}</span></div><input type="file" className="hidden" accept="image/*" onChange={handleStyleRefUpload} /></label>)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="pt-6 border-t border-slate-800/50">
              <div className="flex items-center justify-between mb-5">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-3"><Layers size={20} className="text-slate-600" /><label className="text-xs font-black text-slate-600 uppercase tracking-widest">{t.charEnsemble}</label></div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={handleAutoAnalyzeCharacters}
                    disabled={isProcessing}
                    className="flex items-center gap-2 text-xs font-black text-slate-300 bg-slate-800 px-4 py-2 rounded-full hover:bg-slate-700 transition-colors border border-slate-700 uppercase tracking-tighter disabled:opacity-50"
                  >
                    <Sparkles size={14} className="text-yellow-500" /> 
                    {characters.length > 1 ? t.refreshAll : t.autoAnalyze}
                  </button>
                  {characters.length < 12 && (
                    <button onClick={handleAddCharacter} className="flex items-center gap-2 text-xs font-black text-red-500 bg-red-900/10 px-4 py-2 rounded-full hover:bg-red-900/20 transition-colors border border-red-900/20 uppercase tracking-tighter">
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

          <section className="space-y-7 bg-[#12141a] p-8 rounded-3xl border border-slate-800/50 shadow-xl">
            <div className="flex items-center justify-between"><div className="flex items-center gap-3 text-slate-300"><Clapperboard size={24} className="text-slate-600" /><h2 className="text-base font-black uppercase tracking-widest">{t.storyboardOutput}</h2></div><div className="flex items-center gap-5">{scenes.some(s => s.status === 'error') && (<button onClick={handleRetryFailed} className="flex items-center gap-2 px-5 py-2 bg-amber-900/10 text-amber-600 rounded-full border border-amber-900/20 text-xs font-black uppercase"><RefreshCcw size={14} />{t.retryFailed}</button>)}{scenes.length > 0 && (<span className="text-xs font-bold text-slate-600 uppercase">{scenes.length} {t.framesGenerated}</span>)}</div></div>
            {scenes.length > 0 ? (<SceneGallery scenes={scenes} onRegenerate={handleRegenerateScene} onZoom={setZoomUrl} isProcessing={isProcessing} />) : (
              <div className="bg-[#0a0a0b] rounded-3xl border border-dashed border-slate-800 py-28 flex flex-col items-center justify-center text-slate-600 gap-5 transition-colors"><div className="bg-slate-900 p-8 rounded-full border border-slate-800"><Layout size={48} className="opacity-20" /></div><div className="text-center"><p className="text-base font-bold text-slate-500">{t.workspaceEmpty}</p><p className="text-sm text-slate-700">{t.workspaceEmptyDesc}</p></div></div>
            )}
            
            <div className="pt-8 border-t border-slate-800/50">
               <StatusMonitor logs={logs} />
            </div>
          </section>
          
          {/* Bottom Action Bar */}
          <div className="sticky bottom-6 z-30">
             {!isProcessing ? (
               <div className="flex gap-4">
                 {scenes.length > 0 && scenes.some(s => s.status === 'idle' || s.status === 'error') ? (
                   <button onClick={resumeProduction} className="flex-1 flex items-center justify-center gap-3 px-10 py-5 rounded-2xl bg-gradient-to-r from-blue-900 to-indigo-800 text-blue-50 text-lg font-black hover:from-blue-800 hover:to-indigo-700 shadow-2xl shadow-black/50 transition-all hover:-translate-y-1 uppercase tracking-wide border border-blue-800/50 ring-1 ring-white/5">
                     <Play size={24} fill="currentColor" className="text-blue-200" />
                     {t.resumeProduction}
                   </button>
                 ) : (
                   <button onClick={startProduction} className="w-full flex items-center justify-center gap-3 px-10 py-5 rounded-2xl bg-gradient-to-r from-red-900 to-orange-800 text-red-50 text-lg font-black hover:from-red-800 hover:to-orange-700 shadow-2xl shadow-black/50 transition-all hover:-translate-y-1 uppercase tracking-wide border border-red-800/50 ring-1 ring-white/5">
                     <Play size={24} fill="currentColor" className="text-red-200" />
                     {t.startProduction}
                   </button>
                 )}
               </div>
             ) : (
               <div className="flex gap-4">
                 <div className="flex-1 flex items-center justify-center gap-3 px-8 py-5 rounded-2xl bg-slate-900 text-slate-500 text-lg font-black uppercase border border-slate-800">
                   <Sparkles className="animate-spin text-red-800" size={24} />
                   {t.running}
                 </div>
                 <button onClick={stopProduction} className="px-8 py-5 rounded-2xl bg-slate-900 text-red-800 text-lg font-black hover:bg-slate-800 border border-slate-800 hover:border-red-900/30 transition-all uppercase flex items-center gap-2" title={t.stopProduction}>
                   <Square size={24} fill="currentColor" />
                   <span className="text-xs font-bold">{t.pauseProduction}</span>
                 </button>
               </div>
             )}
          </div>
        </div>
      </main>
      <footer className="bg-[#12141a] border-t border-slate-800/50 py-10 px-8 text-center mt-12"><p className="text-xs text-slate-700 font-black uppercase tracking-[0.3em]">&copy; 2025 Byun-genius Cinematic AI Engine</p></footer>
    </div>
  );
};

export default App;
