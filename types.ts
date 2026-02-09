export interface ApiKey {
  key: string;
  label: string;
  isActive: boolean;
}

export interface GenerationSettings {
  targetScenes: number;
  totalCuts: number;
  cutIntervalSec: number;
  narrationSpeedCpm: number;
  model: string;
}

export interface OutputItem {
  timeCode: string;
  summary: string;
  prompt: string;
}

export interface SceneDefinition {
  id: number;
  title: string;
  summary: string;
  content: string; // The segment of the script
  characterCount: number;
  estimatedCuts: number;
}

export interface Character {
  id: string;
  name: string;
  gender: string;
  age: string;
  role: string;
  appearance: string;
}

export interface GenerationState {
  isGenerating: boolean;
  progress: number; // 0-100
  currentStep: string;
  results: OutputItem[];
  characterOverview: string | null;
  characters: Character[];
  scenes: SceneDefinition[];
  error: string | null;
  status: 'idle' | 'running' | 'paused' | 'completed' | 'error';
}

export enum GeminiModel {
  GEMINI_3_PRO = 'gemini-3-pro-preview',
  GEMINI_3_FLASH = 'gemini-3-flash-preview',
  GEMINI_2_5_PRO = 'gemini-2.5-pro',
  GEMINI_2_5_FLASH = 'gemini-2.5-flash',
}

export type UiStep = 'analysis' | 'characters' | 'scenes' | 'cuts' | 'generate';

export interface AnalysisMetrics {
  duration: string;
  cutCount: number;
  charCount: number;
}