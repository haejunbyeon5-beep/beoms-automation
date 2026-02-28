
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

export type StylePreset = '야담풍' | '심리학' | 'Photorealistic' | 'Anime Style' | '3D Render' | 'Digital Art';

export const STYLE_PRESETS: StylePreset[] = [
  '야담풍',
  '심리학',
  'Photorealistic',
  'Anime Style',
  '3D Render',
  'Digital Art'
];

// 스타일별 상세 프롬프트 매핑
export const STYLE_PROMPT_MAP: Record<StylePreset, { positive: string; negative: string }> = {
  '야담풍': {
    positive: 'high-end semi-realistic Korean historical manhwa illustration, bold clean ink lineart, stylized facial shading, expressive character acting, strong warm cinematic lighting, deep shadow contrast, painterly digital coloring, character-focused rendering, non-photorealistic, hand-drawn look',
    negative: 'photorealistic, realistic skin texture, hyper detailed pores, 3D render, CGI, photography, soft blurry lineart, anime style, flat cel shading'
  },
  '심리학': {
    positive: '2D cartoon animation style, clean bold outlines, warm soft digital coloring, gentle cel-shading, expressive emotional characters, cozy warm color palette, professional illustration, matte finish',
    negative: 'photorealistic, 3D render, dark moody, sketch, minimalist, cold tones, sharp angular style'
  },
  'Photorealistic': {
    positive: 'Photorealistic',
    negative: ''
  },
  'Anime Style': {
    positive: 'Anime Style',
    negative: ''
  },
  '3D Render': {
    positive: '3D Render',
    negative: ''
  },
  'Digital Art': {
    positive: 'Digital Art',
    negative: ''
  }
};

export type AspectRatio = '16:9' | '4:3' | '1:1' | '9:16';
export type Language = 'en' | 'ko';
export type Theme = 'light' | 'dark';
export type ImageQuality = 'standard' | 'pro';
