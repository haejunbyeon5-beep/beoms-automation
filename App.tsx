import React, { useState, useRef, useEffect } from 'react';
import { ApiKeyManager } from './components/ApiKeyManager';
import { SettingsPanel } from './components/SettingsPanel';
import { ResultDisplay } from './components/ResultDisplay';
import { RealTimeAnalysis } from './components/RealTimeAnalysis';
import { StepProgressBar } from './components/StepProgressBar';
import { SceneList } from './components/SceneList';
import { CharacterList } from './components/CharacterList';
import { SceneSelector } from './components/SceneSelector';
import { ApiKey, GenerationSettings, GenerationState, UiStep, AnalysisMetrics, SceneDefinition, Character, OutputItem } from './types';
import { DEFAULT_SETTINGS } from './constants';
import { GeminiService } from './services/geminiService';
import { Sparkles, ArrowRight, Play, Pause, RefreshCw, Loader2, List, Layers, XCircle } from 'lucide-react';

export const App: React.FC = () => {
  // State
  const [script, setScript] = useState<string>('');
  const [characterHints, setCharacterHints] = useState<string>('');
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [settings, setSettings] = useState<GenerationSettings>(DEFAULT_SETTINGS);
  
  const [currentUiStep, setCurrentUiStep] = useState<UiStep>('analysis');
  const [completedSteps, setCompletedSteps] = useState<UiStep[]>([]);
  
  // Generation Mode State
  const [generationMode, setGenerationMode] = useState<'full' | 'selective'>('full');
  const [selectedSceneIds, setSelectedSceneIds] = useState<Set<number>>(new Set());

  const [state, setState] = useState<GenerationState>({
    isGenerating: false,
    progress: 0,
    currentStep: '준비 완료',
    results: [],
    characterOverview: null,
    scenes: [],
    characters: [],
    error: null,
    status: 'idle'
  });

  const [metrics, setMetrics] = useState<AnalysisMetrics>({
    duration: '00:00',
    cutCount: 0,
    charCount: 0
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [processMessage, setProcessMessage] = useState('');

  const serviceRef = useRef<GeminiService | null>(null);

  // Initialize selectedSceneIds when scenes change
  useEffect(() => {
    if (state.scenes.length > 0 && selectedSceneIds.size === 0) {
       // Default to all selected
       setSelectedSceneIds(new Set(state.scenes.map(s => s.id)));
    }
  }, [state.scenes]);

  // Update service keys whenever they change in UI to ensure immediate effect
  useEffect(() => {
    if (serviceRef.current) {
      serviceRef.current.updateApiKeys(apiKeys);
    }
  }, [apiKeys]);

  // Effect: Update Real-time Analysis
  useEffect(() => {
    const charCount = script.length;
    // Heuristic: 1 cut per ~60 chars
    const estimatedCuts = Math.max(1, Math.ceil(charCount / 60));
    const durationSec = estimatedCuts * settings.cutIntervalSec;
    const minutes = Math.floor(durationSec / 60);
    const seconds = Math.floor(durationSec % 60);
    const durationStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    setMetrics({
      charCount,
      cutCount: estimatedCuts,
      duration: durationStr
    });
  }, [script, settings.cutIntervalSec]);

  // Handle Step Navigation
  const navigateToStep = (step: UiStep) => {
    if (state.isGenerating && state.status === 'running') return;
    if (isProcessing) return;
    
    setCurrentUiStep(step);
    
    const steps: UiStep[] = ['analysis', 'characters', 'scenes', 'cuts', 'generate'];
    const idx = steps.indexOf(step);
    setCompletedSteps(steps.slice(0, idx));
  };

  const handleStopAnalysis = () => {
    if (serviceRef.current) {
      serviceRef.current.cancel();
    }
    setIsProcessing(false);
    setProcessMessage('');
  };

  const handleNext = async () => {
    if (!apiKeys.some(k => k.isActive)) {
        alert("API 키가 필요합니다.");
        return;
    }

    // Step 1 -> 2: Extract Characters
    if (currentUiStep === 'analysis') {
       if (!script.trim()) {
         alert("대본을 입력해주세요.");
         return;
       }
       
       setIsProcessing(true);
       setProcessMessage('대본 분석 및 캐릭터 자동 추출 중...');
       
       // Force initialize service here if needed, or use existing
       if (!serviceRef.current) serviceRef.current = new GeminiService(apiKeys);
       else serviceRef.current.updateApiKeys(apiKeys); // Ensure current keys

       try {
         const characters = await serviceRef.current.extractCharacters(script, settings.model);
         setState(prev => ({ ...prev, characters }));
         navigateToStep('characters');
       } catch (e: any) {
         if (e.message !== "Operation cancelled by user or API key update." && e.message !== "Aborted.") {
           alert(`분석 실패: ${e.message}`);
         }
       } finally {
         setIsProcessing(false);
       }
       return;
    }

    // Step 2 -> 3: Analyze Scenes
    if (currentUiStep === 'characters') {
       setIsProcessing(true);
       setProcessMessage(`대본을 ${settings.targetScenes}개 장면으로 정밀 분할 중...`);

       if (!serviceRef.current) serviceRef.current = new GeminiService(apiKeys);
       else serviceRef.current.updateApiKeys(apiKeys);

       try {
         const scenes = await serviceRef.current.analyzeScenes(script, settings.targetScenes, settings.model);
         setState(prev => ({ ...prev, scenes }));
         // Reset selection
         setSelectedSceneIds(new Set(scenes.map(s => s.id)));
         navigateToStep('scenes');
       } catch (e: any) {
         if (e.message !== "Operation cancelled by user or API key update." && e.message !== "Aborted.") {
           alert(`장면 분석 실패: ${e.message}`);
         }
       } finally {
         setIsProcessing(false);
       }
       return;
    }

    const steps: UiStep[] = ['analysis', 'characters', 'scenes', 'cuts', 'generate'];
    const currentIndex = steps.indexOf(currentUiStep);
    if (currentIndex < steps.length - 1) {
      navigateToStep(steps[currentIndex + 1]);
    }
  };

  const handleModelChange = (model: string) => {
    setSettings(prev => ({ ...prev, model }));
  };

  const handlePause = () => {
    if (serviceRef.current) {
      serviceRef.current.requestStop();
      setState(prev => ({ 
        ...prev, 
        currentStep: '일시정지 요청 중... (현재 씬/배치 완료 후 중단)',
        status: 'paused'
      }));
    }
  };

  const toggleSceneSelection = (id: number) => {
    const newSet = new Set(selectedSceneIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedSceneIds(newSet);
  };

  const toggleAllScenes = (selectAll: boolean) => {
    if (selectAll) {
      setSelectedSceneIds(new Set(state.scenes.map(s => s.id)));
    } else {
      setSelectedSceneIds(new Set());
    }
  };

  // Main Generation Function
  const handleGenerate = async (specificSceneId?: number) => {
    if (state.status === 'running') {
      handlePause();
      return;
    }

    if (!apiKeys.some(k => k.isActive)) {
      setState(prev => ({ ...prev, error: "API 키를 추가하고 활성화해주세요." }));
      return;
    }

    let targetIds: number[] | undefined;
    
    // Determine Target Scenes
    if (specificSceneId) {
       // Single Scene Button Clicked
       targetIds = [specificSceneId];
    } else if (generationMode === 'selective') {
       // Selective Mode "Start" Button Clicked
       if (selectedSceneIds.size === 0) {
         alert("생성할 씬을 하나 이상 선택해주세요.");
         return;
       }
       targetIds = Array.from(selectedSceneIds).sort((a,b) => a-b);
    } else {
       // Full Generation Mode
       targetIds = undefined; // Undefined means ALL
    }

    const isResuming = state.status === 'paused' && state.results.length > 0 && !targetIds;
    // If selective generation, we ignore resume index (force generation of selected)
    const startCut = isResuming ? state.results.length + 1 : 1;
    
    if (state.status === 'completed' && !targetIds) {
      // If full completed and full restart requested, clear results
      setState(prev => ({ ...prev, results: [], characterOverview: null, progress: 0 }));
    }

    setState(prev => ({
      ...prev,
      isGenerating: true,
      currentStep: targetIds 
        ? `선택된 ${targetIds.length}개 씬 생성 시작...` 
        : isResuming ? `이어 생성 시작 (컷 ${startCut}부터)...` : '전체 생성 시작...',
      error: null,
      status: 'running'
    }));

    // Ensure service is ready
    if (!serviceRef.current) serviceRef.current = new GeminiService(apiKeys);
    else serviceRef.current.updateApiKeys(apiKeys);
    
    // Combine extracted characters with manual hints for the prompt
    const combinedCharacterContext = `
[AUTO-EXTRACTED CHARACTERS]
${JSON.stringify(state.characters, null, 2)}

[MANUAL HINTS]
${characterHints}
    `.trim();

    try {
      // We keep existing results to merge into
      // Make a copy to mutate safely
      let currentResults = [...state.results];

      const updateProgress = (newCuts: OutputItem[], globalIndex: number) => {
         // Merge logic: Place new cuts at the correct global index
         for (let i = 0; i < newCuts.length; i++) {
           currentResults[globalIndex + i] = newCuts[i];
         }
         
         // For progress calculation
         const validCount = currentResults.filter(Boolean).length;
         const percentage = Math.min(100, (validCount / settings.totalCuts) * 100);
         
         setState(prev => ({
           ...prev,
           results: [...currentResults], // Update with spliced array
           progress: percentage
         }));
      };

      const { items: finalItems, overview: finalOverview } = await serviceRef.current.generate(
        state.scenes, 
        settings, 
        combinedCharacterContext,
        (partialResults, partialOverview, sceneId, globalStartIndex) => {
           setState(prev => ({
             ...prev,
             characterOverview: partialOverview || prev.characterOverview
           }));
           updateProgress(partialResults, globalStartIndex);
        },
        startCut,
        (statusMsg) => setState(prev => ({ ...prev, currentStep: statusMsg })),
        targetIds
      );
      
      const isComplete = !targetIds && (finalItems.length + (isResuming ? startCut : 0)) >= settings.totalCuts; // Rough check
      // For selective, we just say "Completed" (or paused if stopped manually)
      
      setState(prev => ({
        ...prev,
        isGenerating: false,
        currentStep: '생성 완료',
        status: targetIds ? 'paused' : (isComplete ? 'completed' : 'paused') // Selective mode returns to paused/idle state effectively to allow more selections
      }));

    } catch (err: any) {
       // If manually stopped or key updated
       if (err.message === "Operation cancelled by user or API key update." || err.message === "Aborted.") {
          setState(prev => ({
            ...prev,
            isGenerating: false,
            currentStep: '작업 중단됨 (API 키 변경 또는 사용자 중지)',
            status: 'paused'
          }));
       } else {
          setState(prev => ({
            ...prev,
            isGenerating: false,
            currentStep: '오류 발생',
            status: 'error',
            error: err.message || "알 수 없는 오류가 발생했습니다."
          }));
       }
    }
  };

  const resetGeneration = () => {
    setState(prev => ({
      ...prev,
      isGenerating: false,
      progress: 0,
      currentStep: '준비 완료',
      results: [],
      characterOverview: null,
      error: null,
      status: 'idle'
    }));
  };

  const updateScenes = (newScenes: SceneDefinition[]) => {
    setState(prev => ({ ...prev, scenes: newScenes }));
  };

  const updateCharacters = (newChars: Character[]) => {
    setState(prev => ({ ...prev, characters: newChars }));
  };

  // Helper for immediate generation from Scene List
  const startImmediateGeneration = (specificId?: number) => {
    // If not selective mode but a specific ID is passed, it acts as a selective "one-off"
    // If selective mode and no ID passed, acts as batch selective
    navigateToStep('generate');
    // Give a small tick for the UI to update to 'generate' view before starting
    setTimeout(() => handleGenerate(specificId), 100);
  }

  // Render content based on Step
  const renderStepContent = () => {
    if (isProcessing) {
        return (
          <div className="flex flex-col items-center justify-center h-full animate-fadeIn">
            <Loader2 size={48} className="text-orange-500 animate-spin mb-4" />
            <h3 className="text-lg font-bold text-gray-800">{processMessage}</h3>
            <p className="text-sm text-gray-500 mt-2">Gemini 엔진이 작업을 수행하고 있습니다.</p>
            
            <button
              onClick={handleStopAnalysis}
              className="mt-6 flex items-center gap-2 px-5 py-2 bg-white border border-red-200 text-red-600 rounded-full text-sm font-bold shadow-sm hover:bg-red-50 hover:border-red-300 transition-all"
            >
               <XCircle size={16} /> 분석 정지
            </button>
          </div>
        );
    }

    switch (currentUiStep) {
      case 'analysis':
        return (
          <div className="space-y-4 animate-fadeIn">
            <div className="bg-orange-50 border border-orange-100 p-4 rounded-lg">
              <h4 className="text-orange-800 font-bold text-sm mb-2 flex items-center gap-2">
                <Sparkles size={14} /> 1단계: 대본 입력
              </h4>
              <p className="text-xs text-orange-700">
                여기에 한국어 대본을 붙여넣으세요. '다음' 버튼을 누르면 AI가 즉시 분석을 시작합니다.
              </p>
            </div>
            <textarea
              value={script}
              onChange={(e) => setScript(e.target.value)}
              placeholder="여기에 대본을 붙여넣으세요..."
              className="w-full h-96 bg-white border border-gray-200 rounded-lg p-4 text-gray-800 text-sm leading-relaxed resize-none focus:ring-2 focus:ring-orange-500 outline-none custom-scrollbar shadow-inner"
            />
          </div>
        );
      case 'characters':
        return (
           <div className="space-y-4 animate-fadeIn h-full flex flex-col">
            <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg">
              <h4 className="text-blue-800 font-bold text-sm mb-2">2단계: 캐릭터 정의</h4>
              <p className="text-xs text-blue-700">
                AI가 대본에서 추출한 캐릭터 목록입니다. 필요하면 수정하세요.
              </p>
            </div>
            
            <div className="flex-1 overflow-hidden flex flex-col gap-4">
              <div className="flex-1 min-h-0 flex flex-col border border-gray-200 rounded-lg p-4">
                 <h5 className="text-xs font-bold text-gray-500 uppercase mb-2">자동 추출된 캐릭터 (수정 가능)</h5>
                 <CharacterList characters={state.characters} onUpdate={updateCharacters} />
              </div>
              
              <div className="h-32 min-h-0 flex flex-col">
                  <h5 className="text-xs font-bold text-gray-500 uppercase mb-2">추가 힌트 (선택사항)</h5>
                  <textarea
                    value={characterHints}
                    onChange={(e) => setCharacterHints(e.target.value)}
                    placeholder="예: 특정 인물의 의상 디테일이나, 추출되지 않은 엑스트라 설정 등..."
                    className="flex-1 w-full bg-white border border-gray-200 rounded-lg p-3 text-gray-800 text-xs leading-relaxed focus:ring-2 focus:ring-orange-500 outline-none resize-none"
                  />
              </div>

               <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                 <label className="block text-sm font-bold text-gray-700 mb-2">다음 단계 설정: 목표 씬 수</label>
                 <div className="flex items-center gap-4">
                   <input
                    type="number"
                    min={1}
                    max={50}
                    value={settings.targetScenes}
                    onChange={(e) => setSettings({...settings, targetScenes: parseInt(e.target.value)})}
                    className="w-24 bg-gray-50 border border-gray-300 rounded p-2 text-lg font-bold text-gray-800 text-center"
                   />
                   <p className="text-xs text-gray-400">이 수에 맞춰 다음 단계에서 씬을 자동 분할합니다.</p>
                 </div>
              </div>
            </div>
          </div>
        );
      case 'scenes':
        return (
           <div className="space-y-4 animate-fadeIn">
             <div className="bg-purple-50 border border-purple-100 p-4 rounded-lg">
              <h4 className="text-purple-800 font-bold text-sm mb-2">3단계: 씬 분할 및 컷 배분 & 생성 모드 설정</h4>
              <p className="text-xs text-purple-700">
                분할된 씬을 확인하고 컷 수를 조정하십시오. <strong>여기서 원하는 씬만 즉시 생성할 수 있습니다.</strong>
              </p>
            </div>
            <SceneList 
              scenes={state.scenes} 
              targetTotalCuts={settings.totalCuts} 
              onUpdateScenes={updateScenes}
              onUpdateTotalCuts={(n) => setSettings({...settings, totalCuts: n})}
              
              selectedSceneIds={selectedSceneIds}
              onToggleScene={toggleSceneSelection}
              onToggleAll={toggleAllScenes}
              onGenerateSpecific={(id) => startImmediateGeneration(id)}
              onGenerateSelected={() => startImmediateGeneration()}
              generationMode={generationMode}
              setGenerationMode={setGenerationMode}
              disabled={state.isGenerating}
            />
           </div>
        );
      case 'cuts':
        return (
          <div className="space-y-4 animate-fadeIn">
             <div className="bg-green-50 border border-green-100 p-4 rounded-lg">
              <h4 className="text-green-800 font-bold text-sm mb-2">4단계: 최종 확인</h4>
              <p className="text-xs text-green-700">
                씬과 컷 배분이 확정되었습니다. 생성 속도 설정만 확인하고 생성을 시작하세요.
              </p>
            </div>
             {/* Read Only Mode for Scenes/Cuts */}
             <SettingsPanel settings={settings} onChange={setSettings} disabled={false} readOnly={true} />
             
             <div className="mt-4 p-4 bg-gray-100 rounded text-center border border-gray-200">
                <p className="text-sm text-gray-600 font-bold mb-1">총 {settings.totalCuts}컷 / {settings.targetScenes}씬</p>
                <p className="text-xs text-gray-400">캐릭터 {state.characters.length}명 포함</p>
             </div>
          </div>
        );
      case 'generate':
        const isPaused = state.status === 'paused';
        const isRunning = state.status === 'running';
        const isSelective = generationMode === 'selective';

        return (
          <div className="space-y-4 animate-fadeIn h-full flex flex-col">
              
             {/* Mode Selector Header */}
             <div className="bg-white p-2 rounded-lg border border-gray-200 shadow-sm flex items-center justify-between mb-2">
                 <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
                    <button
                      onClick={() => setGenerationMode('full')}
                      disabled={isRunning}
                      className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${generationMode === 'full' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                      <Layers size={14} className="inline mr-1" /> 전체 생성 모드
                    </button>
                    <button
                      onClick={() => setGenerationMode('selective')}
                      disabled={isRunning}
                      className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${generationMode === 'selective' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                      <List size={14} className="inline mr-1" /> 선택 생성 모드
                    </button>
                 </div>
             </div>

             {/* Main Area: Split into Left (Results/Status) and Right (Scene Selector if Selective) */}
             <div className="flex-1 min-h-0 flex gap-4">
                 <div className={`flex-1 flex flex-col min-h-0 transition-all ${isSelective ? 'w-2/3' : 'w-full'}`}>
                      <div className="mb-4 flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                        <div className="flex items-center gap-3">
                          {isRunning ? (
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                              <span className="text-sm font-bold text-orange-600 animate-pulse">생성 중...</span>
                            </div>
                          ) : isPaused ? (
                            <span className="text-sm font-bold text-blue-600">대기 / 일시정지</span>
                          ) : (
                            <span className="text-sm font-bold text-green-600">완료됨</span>
                          )}
                          <span className="text-xs text-gray-400">
                            (결과: {state.results.filter(Boolean).length} / {settings.totalCuts})
                          </span>
                        </div>

                        <div className="flex gap-2">
                          {state.status !== 'completed' && (
                            <button
                              onClick={() => handleGenerate()}
                              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm text-white transition-all ${
                                isRunning 
                                  ? 'bg-orange-400 hover:bg-orange-500' 
                                  : 'bg-blue-600 hover:bg-blue-500'
                              }`}
                            >
                              {isRunning ? (
                                <>
                                  <Pause size={16} /> 중단
                                </>
                              ) : (
                                <>
                                  <Play size={16} /> {isSelective ? '선택 생성 시작' : '전체 생성 시작'}
                                </>
                              )}
                            </button>
                          )}

                          <button 
                            onClick={resetGeneration}
                            disabled={isRunning}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg font-bold text-sm disabled:opacity-50"
                          >
                            <RefreshCw size={16} /> 초기화
                          </button>
                        </div>
                     </div>

                     {state.error && (
                        <div className="mb-4 text-red-500 bg-red-50 px-4 py-3 rounded-lg text-sm font-bold border border-red-100">
                          ⚠️ {state.error}
                        </div>
                     )}

                     <div className="flex-1 overflow-hidden">
                        <ResultDisplay results={state.results} characterOverview={state.characterOverview} />
                     </div>
                 </div>

                 {isSelective && (
                   <div className="w-80 flex-shrink-0 flex flex-col min-h-0 border-l border-gray-100 pl-4 animate-fadeIn">
                      <SceneSelector 
                        scenes={state.scenes}
                        selectedSceneIds={selectedSceneIds}
                        onToggleScene={toggleSceneSelection}
                        onToggleAll={toggleAllScenes}
                        onGenerateSpecific={(id) => handleGenerate(id)}
                        disabled={isRunning}
                      />
                   </div>
                 )}
             </div>
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-gray-50 text-gray-800 font-sans">
      
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center shadow-sm">
        <div>
           <h1 className="text-2xl font-black text-gray-800 tracking-tight flex items-center gap-2">
            <span className="text-orange-500">Beoms</span> Automation
            <span className="text-xs font-medium text-gray-400 border border-gray-200 px-2 py-0.5 rounded-full">v2.1</span>
           </h1>
           <p className="text-xs text-gray-500 mt-1">통합 엔진 • Gemini 3.0 / 2.5 호환</p>
        </div>
      </div>

      {/* Progress Bar */}
      <StepProgressBar 
        currentStep={currentUiStep} 
        onStepClick={navigateToStep} 
        completedSteps={completedSteps} 
      />

      <div className="flex-1 overflow-hidden flex flex-row max-w-7xl mx-auto w-full p-6 gap-6">
         
         {/* Main Content Area (Left/Center) */}
         <div className="flex-1 flex flex-col min-w-0 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 h-full overflow-y-auto custom-scrollbar relative">
              {renderStepContent()}
            </div>
            
            {/* Footer Navigation within Card */}
            {currentUiStep !== 'generate' && !isProcessing && (
              <div className="border-t border-gray-100 p-4 bg-gray-50 flex justify-end">
                <button
                  onClick={handleNext}
                  className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-bold text-sm transition-colors"
                >
                  {currentUiStep === 'analysis' ? '캐릭터 분석 시작' : 
                   currentUiStep === 'characters' ? '장면 분석 시작' : 
                   currentUiStep === 'cuts' ? '생성 화면으로' : 
                   '다음 단계로'} <ArrowRight size={16} />
                </button>
              </div>
            )}
         </div>

         {/* Sidebar (Right) */}
         <div className="w-80 flex-shrink-0 flex flex-col gap-6">
            <RealTimeAnalysis 
               metrics={metrics} 
               apiStatus={state.status}
               currentModel={settings.model}
               onModelChange={handleModelChange}
            />
            <ApiKeyManager 
              apiKeys={apiKeys} 
              onKeysChange={setApiKeys} 
              currentModel={settings.model} 
            />
            
            {(state.isGenerating || state.status === 'paused' || state.status === 'completed') && (
               <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                 <div className="flex justify-between text-xs font-bold text-gray-500 mb-1">
                   <span>진행률 ({state.results.filter(Boolean).length}/{settings.totalCuts})</span>
                   <span>{Math.round(state.progress)}%</span>
                 </div>
                 <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                   <div 
                     className={`h-full transition-all duration-300 ease-out ${state.status === 'paused' ? 'bg-blue-500' : state.status === 'completed' ? 'bg-green-500' : 'bg-orange-500'}`}
                     style={{ width: `${state.progress}%` }} 
                   />
                 </div>
                 <p className="text-[10px] text-gray-400 mt-2 text-center">
                   {state.status === 'paused' ? '일시정지됨 - 안전하게 중단되었습니다.' : '엄격한 GEM 프로토콜 적용 중'}
                 </p>
               </div>
            )}
         </div>

      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f9fafb; 
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #d1d5db; 
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #9ca3af; 
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};