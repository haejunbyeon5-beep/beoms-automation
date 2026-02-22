import { GoogleGenAI, Part, Type } from "@google/genai";
import { Character, AspectRatio, ImageQuality } from "../types";

// [보안] 키 설정 우선 적용
const getApiKey = () =>
  localStorage.getItem("my_gemini_key") ||
  import.meta.env.VITE_GEMINI_API_KEY;
const getAI = () => new GoogleGenAI({ apiKey: getApiKey() });

// [STYLE] 조선시대 시네마틱 고정 스타일 블록
const MASTER_STYLE_BLOCK = "(Masterpiece:1.3), (best quality:1.3), (High-quality modern webtoon style illustration:1.4), semi-realistic anime influence, East Asian facial structure true to Joseon-era, dramatic cinematic lighting, atmospheric Joseon setting";

export const generateCharacterProfileImage = async (name: string, description: string, stylePreset: string, customStyle: string, quality: ImageQuality = 'standard'): Promise<string | undefined> => {
  const ai = getAI();
  const model = quality === 'pro' ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';
  const prompt = `A professional profile of "${name}". Style: ${stylePreset}. Atmosphere: ${MASTER_STYLE_BLOCK}. DNA: Joseon-era clothing, Sangtu or traditional hair, ${description}. 1:1 ratio.`;
  const response = await ai.models.generateContent({ model, contents: { parts: [{ text: prompt }] }, config: { imageConfig: { aspectRatio: "1:1", imageSize: "1K" } } });
  
  const part = response.candidates?.[0]?.content?.parts?.[0];
  if (part?.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
  return undefined;
};

export const analyzeScriptForCharacters = async (script: string): Promise<Character[]> => {
  const ai = getAI();
  const systemInstruction = `Analyze the script and extract up to 4 main characters.
  Return a JSON array of objects with "name" and "description" keys.
  "description" should be a concise visual description (appearance, clothing, age) based on the script.
  Example: [{"name": "Hong Gil-dong", "description": "Young man in blue Hanbok, sharp eyes, holding a flute"}]`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Script: ${script}`,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            description: { type: Type.STRING }
          },
          required: ["name", "description"]
        }
      }
    }
  });

  try {
    const parsed = JSON.parse(response.text || "[]");
    return parsed.map((c: any, index: number) => ({
      id: Date.now().toString() + index,
      name: c.name,
      description: c.description
    }));
  } catch (e) {
    console.error("Failed to parse character analysis", e);
    return [];
  }
};

export const autoSegmentScript = async (fullScript: string, targetCount: number): Promise<{ number: string, description: string }[]> => {
  const ai = getAI();
  const systemInstruction = `Divide script into exactly ${targetCount} scenes. CRITICAL: Start description with EXACT VERBATIM text from script. DO NOT SUMMARIZE.`;
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
    } 
  });
  try { return JSON.parse(response.text || "[]"); } catch (e) { return []; }
};

export const optimizePrompt = async (sceneContent: string, stylePreset: string, customStyle: string, characters: Character[]): Promise<string> => {
  const ai = getAI();
  const charContext = characters.filter(c => c.name).map(c => `- Character "${c.name}": Joseon-era Hanbok and Sangtu(topknot) required.`).join('\n');
  
  const systemInstruction = `Transform scene into a professional English image prompt.
  RULES:
  1. FORCE DNA: Every person MUST wear "Joseon-era Hanbok" and "Sangtu".
  2. STRUCTURE: Use [SHOT] [ACTION] [DNA] [STYLE] order.
  3. STYLE: Always include "${MASTER_STYLE_BLOCK}" at the end.`;

  const response = await ai.models.generateContent({ 
    model: 'gemini-3-flash-preview', 
    contents: `Scene: ${sceneContent}\nChars:\n${charContext}`, 
    config: { systemInstruction } 
  });
  return response.text?.trim() || sceneContent;
};

export const generateSceneImage = async (prompt: string, characters: Character[], aspectRatio: AspectRatio = "16:9", styleRef?: { data: string, mimeType: string }, quality: ImageQuality = 'standard'): Promise<string | undefined> => {
  const ai = getAI();
  const model = quality === 'pro' ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';
  const parts: Part[] = [];
  
  characters.filter(c => c.image).forEach(c => { 
    parts.push({ text: `FACE REF ("${c.name}"):` }, { inlineData: { data: c.image!.split(',')[1], mimeType: c.mimeType! } }); 
  });
  
  if (styleRef) { 
    parts.push({ text: "STYLE REF:" }, { inlineData: { data: styleRef.data.split(',')[1], mimeType: styleRef.mimeType } }); 
  }
  
  parts.push({ text: `PROMPT: ${prompt}` });

  const response = await ai.models.generateContent({ 
    model, 
    contents: { parts }, 
    config: { imageConfig: { aspectRatio, imageSize: quality === 'pro' ? "1K" : undefined } } 
  });

  const part = response.candidates?.[0]?.content?.parts?.[0];
  if (part?.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
  return undefined;
};
