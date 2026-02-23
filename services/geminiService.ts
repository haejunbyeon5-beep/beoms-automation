
import { GoogleGenAI, GenerateContentResponse, Part, Type } from "@google/genai";
import { Character, Scene, AspectRatio, ImageQuality } from "../types";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY as string });

/**
 * 캐릭터 프로필 이미지 생성
 * @param quality 'standard'는 flash 모델, 'pro'는 pro 이미지 모델 사용
 */
export const generateCharacterProfileImage = async (
  name: string, 
  description: string, 
  stylePreset: string, 
  customStyle: string,
  quality: ImageQuality = 'standard'
): Promise<string | undefined> => {
  const ai = getAI();
  const model = quality === 'pro' ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';
  
  const prompt = `A professional high-quality character concept profile portrait of "${name}". 
  Art Style: ${stylePreset}. 
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
  stylePreset: string,
  customStyle: string,
  characters: Character[]
): Promise<string> => {
  const ai = getAI();
  
  const charContext = characters
    .filter(c => c.name)
    .map(c => `- Character "${c.name}": ${c.description || 'Use the provided image for reference.'}`)
    .join('\n');
  
  const systemInstruction = `You are a world-class storyboard artist and image prompting expert. 
  Transform the scene description into a professional English image generation prompt.
  
  STYLE LOCK:
  - Art Style: ${stylePreset}
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
    parts.push({ text: "VISUAL STYLE AND LIGHTING REFERENCE:" });
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
