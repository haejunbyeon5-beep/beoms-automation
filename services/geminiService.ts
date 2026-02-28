
import { GoogleGenAI, Part, Type } from "@google/genai";
import { Character, AspectRatio, ImageQuality, StylePreset, STYLE_PROMPT_MAP } from "../types";

const API_KEY_STORAGE = 'gb_studio_api_key';

export const getStoredApiKey = (): string | null => {
  return localStorage.getItem(API_KEY_STORAGE);
};

export const setStoredApiKey = (key: string): void => {
  localStorage.setItem(API_KEY_STORAGE, key);
};

export const removeStoredApiKey = (): void => {
  localStorage.removeItem(API_KEY_STORAGE);
};

export const validateApiKey = async (key: string): Promise<boolean> => {
  try {
    const ai = new GoogleGenAI({ apiKey: key });
    await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: 'Hello',
      config: { maxOutputTokens: 10 }
    });
    return true;
  } catch (e) {
    return false;
  }
};

const getAI = () => {
  const key = getStoredApiKey();
  if (!key) throw new Error('API 키가 설정되지 않았습니다. 먼저 API 키를 입력해주세요.');
  return new GoogleGenAI({ apiKey: key });
};

/**
 * 스타일 프롬프트를 생성합니다. STYLE_PROMPT_MAP에 상세 매핑이 있으면 사용하고, 없으면 프리셋 이름 그대로 반환합니다.
 */
const getStyleInstruction = (stylePreset: StylePreset): string => {
  const mapping = STYLE_PROMPT_MAP[stylePreset];
  if (mapping && mapping.positive) {
    let instruction = mapping.positive;
    if (mapping.negative) {
      instruction += ` | AVOID: ${mapping.negative}`;
    }
    return instruction;
  }
  return stylePreset;
};

/**
 * 캐릭터 프로필 이미지 생성
 */
export const generateCharacterProfileImage = async (
  name: string, 
  description: string, 
  stylePreset: StylePreset, 
  customStyle: string,
  quality: ImageQuality = 'standard'
): Promise<string | undefined> => {
  const ai = getAI();
  const model = quality === 'pro' ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';
  const styleInstruction = getStyleInstruction(stylePreset);
  
  const prompt = `A professional high-quality character concept profile portrait of "${name}". 
  Art Style: ${styleInstruction}. 
  Atmosphere/Lighting: ${customStyle || 'Studio lighting'}.
  Physical appearance & Costume: ${description}. 
  Close-up portrait, looking at camera, high detail, 1:1 aspect ratio.`;

  const response = await ai.models.generateContent({
    model,
    contents: { parts: [{ text: prompt }] },
    config: {
      imageConfig: {
        aspectRatio: "1:1",
        imageSize: "1K"
      }
    }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  return undefined;
};

export const autoSegmentScript = async (
  fullScript: string,
  targetCount: number
): Promise<{ number: string, description: string }[]> => {
  const ai = getAI();
  const systemInstruction = `You are a professional film editor and storyboard director. 
  Divide the provided script into exactly ${targetCount} logical, sequential scenes.
  
  CRITICAL RULES:
  1. The "description" for each scene MUST start with the EXACT VERBATIM first sentence/line of that specific part from the original script.
  2. Follow that first verbatim sentence with a concise visual summary (1-2 sentences) in the SAME LANGUAGE as the script.
  
  Output the result as a JSON array of objects with "number" and "description" keys.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Script: ${fullScript}`,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            number: { type: Type.STRING },
            description: { type: Type.STRING }
          },
          required: ["number", "description"]
        }
      }
    },
  });

  try {
    return JSON.parse(response.text || "[]");
  } catch (e) {
    console.error("Failed to parse segmentation JSON", e);
    return [];
  }
};

export const optimizePrompt = async (
  sceneContent: string,
  stylePreset: StylePreset,
  customStyle: string,
  characters: Character[]
): Promise<string> => {
  const ai = getAI();
  const styleInstruction = getStyleInstruction(stylePreset);
  
  const charContext = characters
    .filter(c => c.name)
    .map(c => `- Character "${c.name}": ${c.description || 'Use the provided image for reference.'}`)
    .join('\n');
  
  const systemInstruction = `You are a world-class storyboard artist and image prompting expert. 
  Transform the scene description into a professional English image generation prompt.
  
  STYLE LOCK (CRITICAL - MUST FOLLOW):
  - Art Style: ${styleInstruction}
  - Atmosphere: ${customStyle || 'Cinematic, professional lighting'}
  
  CHARACTER IDENTITY LOCK:
  ${charContext}
  
  Compose a high-quality descriptive prompt including camera angle, lighting, and action.
  Output ONLY the final English prompt, no explanations.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Transform this scene: ${sceneContent}`,
    config: {
      systemInstruction,
    },
  });

  return response.text?.trim() || sceneContent;
};

export const generateSceneImage = async (
  prompt: string,
  characters: Character[],
  aspectRatio: AspectRatio = "16:9",
  styleRef?: { data: string, mimeType: string },
  quality: ImageQuality = 'standard'
): Promise<string | undefined> => {
  const ai = getAI();
  const model = quality === 'pro' ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';
  const parts: Part[] = [];

  characters
    .filter(c => c.image && c.mimeType)
    .forEach(c => {
      parts.push({ text: `REFERENCE FOR CHARACTER "${c.name}":` });
      parts.push({
        inlineData: {
          data: c.image!.split(',')[1] || c.image!,
          mimeType: c.mimeType!,
        },
      });
    });

  if (styleRef) {
    parts.push({ text: `CRITICAL STYLE INSTRUCTION: You MUST exactly replicate the art style, color palette, line work, shading technique, and overall visual aesthetic of this reference image. Every generated scene must look like it belongs to the same artist and series as this reference. VISUAL STYLE AND LIGHTING REFERENCE:` });
    parts.push({
      inlineData: {
        data: styleRef.data.split(',')[1] || styleRef.data,
        mimeType: styleRef.mimeType,
      },
    });
  }

  parts.push({ text: `STORYBOARD INSTRUCTION: ${prompt}` });

  const response = await ai.models.generateContent({
    model,
    contents: { parts },
    config: {
      imageConfig: {
        aspectRatio: aspectRatio,
        imageSize: quality === 'pro' ? "1K" : undefined
      }
    }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }

  return undefined;
};
