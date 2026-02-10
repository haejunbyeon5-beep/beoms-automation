import { GoogleGenAI, Type } from "@google/genai";
import { 
  SYSTEM_INSTRUCTION, 
  SCENE_ANALYSIS_INSTRUCTION, 
  CHARACTER_EXTRACTION_INSTRUCTION
} from "../constants";
import { GenerationSettings, OutputItem, ApiKey, SceneDefinition, Character } from "../types";

function cleanJsonString(text: string): string {
  let cleaned = text.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }
  return cleaned;
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

class KeyPool {
  private keys: { key: string; cooldownUntil: number }[] = [];
  private ptr = 0;

  constructor(apiKeys: ApiKey[]) {
    this.updateKeys(apiKeys);
  }

  updateKeys(apiKeys: ApiKey[]) {
    this.keys = apiKeys.filter(k => k.isActive).map(k => ({ key: k.key, cooldownUntil: 0 }));
    this.ptr = 0;
  }

  get count() { return this.keys.length; }

  getNextKey(): string | null {
    if (this.keys.length === 0) return null;
    const now = Date.now();
    for (let i = 0; i < this.keys.length; i++) {
      const idx = (this.ptr + i) % this.keys.length;
      if (this.keys[idx].cooldownUntil <= now) {
        this.ptr = (idx + 1) % this.keys.length;
        return this.keys[idx].key;
      }
    }
    return null;
  }

  markCooldown(key: string, durationMs: number) {
    const entry = this.keys.find(k => k.key === key);
    if (entry) {
      entry.cooldownUntil = Date.now() + durationMs;
    }
  }

  getMinWaitTime(): number {
    if (this.keys.length === 0) return 0;
    const now = Date.now();
    const waits = this.keys.map(k => k.cooldownUntil - now).filter(w => w > 0);
    if (waits.length === 0) return 0;
    return Math.min(...waits);
  }
}

export class GeminiService {
  private abortController: AbortController | null = null;
  private stopRequested: boolean = false;
  private keyPool: KeyPool;

  constructor(private apiKeys: ApiKey[]) {
    this.keyPool = new KeyPool(apiKeys);
  }

  updateApiKeys(apiKeys: ApiKey[]) {
    this.keyPool.updateKeys(apiKeys);
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    this.stopRequested = true;
  }

  requestStop() {
    this.stopRequested = true;
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  cancel() {
    this.requestStop();
  }

  private async executeWithRetry<T>(
    operation: (apiKey: string) => Promise<T>,
    model: string,
    onStatusUpdate?: (msg: string) => void
  ): Promise<T> {
    let attempts = 0;
    const maxRetries = 3;

    while (attempts <= maxRetries) {
      if (this.stopRequested) throw new Error("Operation cancelled.");
      if (this.abortController?.signal.aborted) throw new Error("Aborted.");

      let apiKey = this.keyPool.getNextKey();
      
      if (!apiKey) {
        const waitTime = this.keyPool.getMinWaitTime() || 1000;
        await delay(waitTime + 100);
        continue;
      }

      try {
        return await operation(apiKey);
      } catch (error: any) {
        const isQuotaError = error.message?.includes('429') || error.message?.includes('quota');
        
        if (isQuotaError) {
           this.keyPool.markCooldown(apiKey, 60000);
        } else {
           attempts++;
        }

        if (attempts > maxRetries) throw error;
        await delay(1000 * attempts);
      }
    }
    throw new Error("All retry attempts failed.");
  }

 async extractCharacters(script: string, model: string): Promise<Character[]> {
  this.abortController = new AbortController();
  this.stopRequested = false;
  
  return this.executeWithRetry(async (apiKey) => {
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
SYSTEM CONTEXT:
${SYSTEM_INSTRUCTION}

TASK:
Extract characters with strong visual identifiers.

SCRIPT:
${script}
`;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        systemInstruction: CHARACTER_EXTRACTION_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            characters: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  name: { type: Type.STRING },
                  gender: { type: Type.STRING },
                  age: { type: Type.STRING },
                  role: { type: Type.STRING },
                  appearance: { type: Type.STRING }
                },
                required: ["id", "name", "gender", "age", "role", "appearance"]
              }
            }
          }
        }
      }
    });

    const jsonStr = cleanJsonString(response.text || "{}");
    const parsed = JSON.parse(jsonStr);

    return Array.isArray(parsed.characters) ? parsed.characters : [];
  }, model);
}

  async analyzeScenes(script: string, targetScenes: number, model: string): Promise<SceneDefinition[]> {
    this.abortController = new AbortController();
    this.stopRequested = false;

    return this.executeWithRetry(async (apiKey) => {
      const ai = new GoogleGenAI({ apiKey });

      const prompt = `
SYSTEM CONTEXT:
${SYSTEM_INSTRUCTION}

ANALYSIS TASK:
Split this Korean script into exactly ${targetScenes} scenes.

SCRIPT:
${script}
`;

      const response = await ai.models.generateContent({
        model: model,
        contents: prompt,
        config: {
          systemInstruction: SCENE_ANALYSIS_INSTRUCTION,
          responseMimeType: "application/json"
        }
      });

      const jsonStr = cleanJsonString(response.text || "{}");
      const parsed = JSON.parse(jsonStr);

      return parsed.scenes.map((s: any) => ({
        ...s,
        estimatedCuts: 0
      }));
    }, model);
  }

  async generate(
    scenes: SceneDefinition[],
    settings: GenerationSettings,
    characterHints: string, 
    onProgress: (partial: OutputItem[], overview: string | null, sceneId: number, globalStartIndex: number) => void
  ): Promise<{ items: OutputItem[], overview: string | null }> {

    this.abortController = new AbortController();
    this.stopRequested = false;
    
    let allResults: OutputItem[] = [];
    let globalOverview: string | null = null;

    for (const scene of scenes) {
      if (this.stopRequested) break;

      await this.executeWithRetry(async (apiKey) => {
        const ai = new GoogleGenAI({ apiKey });

        const prompt = `
GLOBAL IMAGE GENERATION RULES:
${SYSTEM_INSTRUCTION}

CHARACTER DEFINITIONS (FIXED DNA – MUST BE REUSED EXACTLY):
${characterHints}

SCENE INFORMATION:
Title: ${scene.title}
Summary: ${scene.summary}

SCENE SCRIPT:
${scene.content}

TASK:
Generate image prompts STRICTLY following the SYSTEM INSTRUCTION template.

REQUIREMENTS:
- Korean summary for each cut
- English prompt text
- Camera composition must be chosen by context
- Unique visual identifiers must appear in every prompt
`;

        const response = await ai.models.generateContent({
          model: settings.model,
          contents: prompt,
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            responseMimeType: "application/json"
          }
        });

        const jsonStr = cleanJsonString(response.text || "{}");
        const parsed = JSON.parse(jsonStr);

        if (parsed.cuts) {
          allResults = [...allResults, ...parsed.cuts];
          onProgress(parsed.cuts, globalOverview, scene.id, 0);
        }

      }, settings.model);
    }

    return { items: allResults, overview: globalOverview };
  }
}
