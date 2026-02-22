
export interface Character {
  id: string;
  name: string;
  description?: string;
  image?: string; // base64
  mimeType?: string;
  isGenerating?: boolean;
}

export interface User {
  email: string;
  name: string;
  avatar?: string;
}

export interface SceneVariant {
  imageUrl: string;
  prompt?: string;
  timestamp: number;
}

export interface Scene {
  id: string; 
  number: string;
  description: string;
  filename: string;
  status: 'idle' | 'generating' | 'completed' | 'error';
  imageUrl?: string;
  prompt?: string;
  variants: SceneVariant[];
}

export type StylePreset = 'Photorealistic' | 'Anime Style' | '3D Render' | 'Digital Art';

export const STYLE_PRESETS: StylePreset[] = [
  'Photorealistic',
  'Anime Style',
  '3D Render',
  'Digital Art'
];

export type AspectRatio = '16:9' | '4:3' | '1:1' | '9:16';
export type Language = 'en' | 'ko';
export type Theme = 'light' | 'dark';
export type ImageQuality = 'standard' | 'pro';
