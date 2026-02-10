import { GoogleGenAI, Type } from "@google/genai";
import { 
  SYSTEM_INSTRUCTION, 
  SCENE_ANALYSIS_INSTRUCTION, 
  CHARACTER_EXTRACTION_INSTRUCTION,
  PROMPT_PREFIX,
  BACKGROUND_LOCK,
  MASTER_STYLE_BLOCK,
  MASTER_NEGATIVE_BLOCK
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
    this.keys = apiKeys.filter(k => k.isActive).map(k => ({ key: k.key, cooldownUntil: 0 }));
  }

  get count() { return this.keys.length; }

  // Get next available key. If all are cooling down, return null.
  getNextKey(): string | null {
    if (this.keys.length === 0) return null;
    const now = Date.now();
    for (let i = 0; i < this.keys.length; i++) {
      const idx = (this.ptr + i) % this.keys.length;
      if (this.keys[idx].cooldownUntil <= now) {
        this.ptr = (idx + 1) % this.keys.length; // Rotate for next use
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

  // If no key is available, find the shortest wait time
  getMinWaitTime(): number {
    if (this.keys.length === 0) return 0;
    const now = Date.now();
    const waits = this.keys.map(k => k.cooldownUntil - now).filter(w => w > 0);
    if (waits.length === 0) return 0; // Should be available
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

  requestStop() {
    this.stopRequested = true;
  }

  cancel() {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  // Simplified execute wrapper for single calls (Analysis/Extraction)
  private async executeWithRetry<T>(
    operation: (apiKey: string) => Promise<T>,
    model: string,
    onStatusUpdate?: (msg: string) => void
  ): Promise<T> {
    let attempts = 0;
    const maxRetries = 3;

    while (attempts <= maxRetries) {
      if (this.stopRequested) throw new Error("Operation cancelled by user.");

      let apiKey = this.keyPool.getNextKey();
      
      // If no key available, wait
      if (!apiKey) {
        const waitTime = this.keyPool.getMinWaitTime() || 1000;
        if (onStatusUpdate) onStatusUpdate(`모든 API 키 사용 중... ${Math.ceil(waitTime/1000)}초 대기`);
        await delay(waitTime + 100);
        continue;
      }

      try {
        const result = await operation(apiKey);
        return result;
      } catch (error: any) {
        // Check for Quota Exceeded (429) or Resource Exhausted
        const isQuotaError = error.message?.includes('429') || error.message?.includes('403') || error.message?.includes('quota');
        
        if (isQuotaError) {
           console.warn(`Key rate limited: ${apiKey.slice(-4)}`);
           this.keyPool.markCooldown(apiKey, 60000); // 1 minute cooldown for this key
           // Do not increment global attempts heavily if we just switched keys
           // But if we ran out of keys, we wait.
        } else {
           attempts++;
        }

        if (attempts > maxRetries) throw error;
        
        await delay(1000 * attempts); // Basic backoff
      }
    }
    throw new Error("All retry attempts failed.");
  }

  async extractCharacters(script: string, model: string): Promise<Character[]> {
    return this.executeWithRetry(async (apiKey) => {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `Script to analyze:\n${script}`;
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
                    appearance: { type: Type.STRING },
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
    return this.executeWithRetry(async (apiKey) => {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `Original Script:\n${script}\n\nSplit this into exactly ${targetScenes} scenes.`;
      const response = await ai.models.generateContent({
        model: model,
        contents: prompt,
        config: {
          systemInstruction: SCENE_ANALYSIS_INSTRUCTION,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              scenes: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.INTEGER },
                    title: { type: Type.STRING },
                    summary: { type: Type.STRING },
                    content: { type: Type.STRING },
                  },
                  required: ["id", "title", "summary", "content"]
                }
              }
            }
          }
        }
      });
      const jsonStr = cleanJsonString(response.text || "{}");
      const parsed = JSON.parse(jsonStr);
      if (!parsed.scenes || !Array.isArray(parsed.scenes)) throw new Error("Invalid scene analysis response");
      return parsed.scenes.map((s: any) => ({
        ...s,
        characterCount: s.content ? s.content.length : 0,
        estimatedCuts: 0
      }));
    }, model);
  }

  async testConnection(apiKey: string, model: string): Promise<boolean> {
    try {
      const ai = new GoogleGenAI({ apiKey });
      await ai.models.generateContent({ model: model, contents: "Test" });
      return true;
    } catch (e) {
      return false;
    }
  }

  // --- Main Generation Logic with Rate Limiting & Batching ---
  async generate(
    scenes: SceneDefinition[],
    settings: GenerationSettings,
    characterHints: string, 
    onProgress: (partial: OutputItem[], overview: string | null) => void,
    startGlobalCutIndex: number = 1,
    onStatusUpdate?: (msg: string) => void
  ): Promise<{ items: OutputItem[], overview: string | null }> {
    this.abortController = new AbortController();
    this.stopRequested = false;
    
    let allResults: OutputItem[] = [];
    let globalOverview: string | null = null;
    let cutsGeneratedSoFar = 0;

    // Rate Limit Config
    const BATCH_SIZE = 20; // Split into 20-25 cut units
    const INTER_BATCH_DELAY = 30000; // 30 seconds
    const INTER_CALL_DELAY = 2000; // 2 seconds

    for (const scene of scenes) {
      if (this.stopRequested) break;

      const sceneStartCut = cutsGeneratedSoFar + 1;
      const sceneEndCut = cutsGeneratedSoFar + scene.estimatedCuts;

      // Skip fully processed scenes
      if (sceneEndCut < startGlobalCutIndex) {
        cutsGeneratedSoFar += scene.estimatedCuts;
        continue;
      }

      const sceneCutsNeeded = scene.estimatedCuts;
      const batchesInScene = Math.ceil(sceneCutsNeeded / BATCH_SIZE);

      for (let b = 0; b < batchesInScene; b++) {
        if (this.stopRequested) break;

        const batchStartLocal = b * BATCH_SIZE + 1;
        const batchEndLocal = Math.min((b + 1) * BATCH_SIZE, sceneCutsNeeded);
        const globalBatchStart = cutsGeneratedSoFar + batchStartLocal;
        const globalBatchEnd = cutsGeneratedSoFar + batchEndLocal;

        // Skip processed batches
        if (globalBatchEnd < startGlobalCutIndex) continue;

        // --- Batch Execution ---
        if (onStatusUpdate) {
          onStatusUpdate(`생성 중: 씬 ${scene.id} - 배치 ${b + 1}/${batchesInScene} (컷 ${globalBatchStart}~${globalBatchEnd})`);
        }

        let attempts = 0;
        let batchSuccess = false;
        // Auto-retry logic: 60s -> 120s -> 180s
        const retryDelays = [60000, 120000, 180000];

        while (!batchSuccess && attempts <= 3) {
          if (this.stopRequested) break;

          const apiKey = this.keyPool.getNextKey();
          
          if (!apiKey) {
            // All keys in cooldown
            const waitTime = this.keyPool.getMinWaitTime();
            const waitSeconds = Math.ceil((waitTime || 1000) / 1000);
            if (onStatusUpdate) onStatusUpdate(`API 한도 초과 - ${waitSeconds}초 대기 중...`);
            await delay(waitTime || 1000);
            continue;
          }

          try {
            const ai = new GoogleGenAI({ apiKey });
            const prompt = `
[CONTEXT]
Scene ${scene.id}: ${scene.title}
Summary: ${scene.summary}

[SCENE SCRIPT CONTENT]
${scene.content}

[AUTO-EXTRACTED CHARACTERS & MANUAL HINTS]
${characterHints || "None provided. Extract strictly from script."}

[TASK]
Generate specific cuts for this scene.
Global Cut Range: ${globalBatchStart} to ${globalBatchEnd}.
Total cuts for this scene: ${scene.estimatedCuts}.

[WHISK OPTIMIZATION REQUIRED]
STRICTLY FOLLOW THIS ORDER FOR PROMPTS:
1) Event Description (Start with: "${PROMPT_PREFIX}")
2) Character DNA (Use Bullet points: "- [Name]: ...")
3) Camera Direction
4) Background Authenticity ("${BACKGROUND_LOCK}")
5) Style Finish ("${MASTER_STYLE_BLOCK}")
6) Negative Rules ("${MASTER_NEGATIVE_BLOCK}")

* Ensure strictly ${batchEndLocal - batchStartLocal + 1} cuts are generated.
* Summary: Korean, abstract emotion/action.
`;

            const response = await ai.models.generateContent({
              model: settings.model,
              contents: prompt,
              config: {
                systemInstruction: SYSTEM_INSTRUCTION,
                responseMimeType: "application/json",
                responseSchema: {
                  type: Type.OBJECT,
                  properties: {
                    characterOverview: { type: Type.STRING, nullable: true },
                    cuts: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          timeCode: { type: Type.STRING },
                          summary: { type: Type.STRING },
                          prompt: { type: Type.STRING },
                        },
                        required: ["timeCode", "summary", "prompt"]
                      }
                    }
                  },
                  required: ["cuts"]
                }
              }
            });

            const jsonStr = cleanJsonString(response.text || "{}");
            const parsed = JSON.parse(jsonStr);

            if (parsed && parsed.cuts && parsed.cuts.length > 0) {
              allResults = [...allResults, ...parsed.cuts];
              if (!globalOverview && parsed.characterOverview) {
                globalOverview = parsed.characterOverview;
              }
              onProgress(allResults, globalOverview);
              batchSuccess = true;
              
              // Rate Limit Protection 1: 2s delay between calls
              await delay(INTER_CALL_DELAY);
            } else {
               throw new Error("Empty result for scene batch");
            }

          } catch (error: any) {
            const isQuota = error.message?.includes('429') || error.message?.includes('quota') || error.message?.includes('403');
            
            if (isQuota) {
              console.warn(`Key rate limited during generate: ${apiKey.slice(-4)}`);
              // Mark this key as bad for 60s
              this.keyPool.markCooldown(apiKey, 60000);
              
              // If we have other keys, loop will pick them next.
              // If NO keys left (getNextKey returns null next iter), we wait.
              
              // If this was the last key, we increment attempt count to force a long wait logic?
              // Actually, keyPool handles wait. But we want to enforce the 60/120/180 rule logic if ALL fail.
              // We'll let the while loop continue. If next iteration gets no key, it waits.
              
              // If we cycled through all keys and still failed, we might need a hard wait.
              if (onStatusUpdate) onStatusUpdate(`API 키 한도 도달 (${apiKey.slice(-4)}). 전환 중...`);
            } else {
              console.error(`Batch error:`, error);
              attempts++;
              const backoff = 2000 * attempts;
              if (onStatusUpdate) onStatusUpdate(`오류 발생. ${backoff/1000}초 후 재시도 (${attempts}/3)...`);
              await delay(backoff);
            }

            if (attempts > 3) throw new Error(`Batch failed after multiple retries: ${error.message}`);
          }
        }

        if (!batchSuccess && !this.stopRequested) {
           throw new Error(`Critical failure at Scene ${scene.id}, Batch ${b+1}. Stopping.`);
        }

        // Rate Limit Protection 2: Wait 30s between batches if job is large
        // Only if there is a next batch/scene
        const hasMoreCuts = globalBatchEnd < settings.totalCuts;
        if (hasMoreCuts && batchSuccess && !this.stopRequested) {
           if (onStatusUpdate) onStatusUpdate(`안전 배치를 위해 30초 대기 중...`);
           await delay(INTER_BATCH_DELAY);
        }
      }

      cutsGeneratedSoFar += scene.estimatedCuts;
    }
    
    return { items: allResults, overview: globalOverview };
  }
}