import { GeminiModel } from './types';

export const DEFAULT_SETTINGS = {
  targetScenes: 5,
  totalCuts: 20,
  cutIntervalSec: 3,
  narrationSpeedCpm: 350,
  model: GeminiModel.GEMINI_3_PRO,
};

// Fixed Phrases
export const PROMPT_PREFIX = "In a strictly historical Joseon-era setting with absolutely no modern elements,";
export const BACKGROUND_LOCK = "Authentic Joseon architecture and environment only.";

// Whisk-optimized Style Finish
export const MASTER_STYLE_BLOCK = `match the uploaded reference style exactly, Korean storybook webtoon illustration style, warm soft lighting, clean lineart, gentle cel shading, consistent character art style`;

// Whisk-optimized negative block (Standardized set)
export const MASTER_NEGATIVE_BLOCK = `--no modern objects, no modern shoes, no jeans, no belts, no wristwatch, no sneakers, no electric poles, no wires, no cars, no modern buildings, no concrete, no street lamps, no plastic items, no glass windows, no modern fabrics, no zippers, no logos, no text, no watermark`;

export const CHARACTER_EXTRACTION_INSTRUCTION = `
You are a script analysis engine specializing in Korean historical dramas.
Your task is to extract the main characters from the input script.

RULES:
1. Identify all named characters with speaking roles or significant presence.
2. Infer their gender, age, and role/social status based on the script context.
3. Summarize their appearance and personality keywords (max 20 words per character).
4. Return strictly a JSON object with a "characters" array.
5. "id" should be their English identifier (e.g., "YiSunSin"), "name" is Korean.
`;

export const SCENE_ANALYSIS_INSTRUCTION = `
You are a script analysis engine.
Your task is to split the input Korean script into exactly the requested number of scenes.

RULES:
1. Divide the script based on location changes, time jumps, or major narrative shifts.
2. Return a JSON object with a "scenes" array.
3. Each scene object must contain:
   - "id": number (1-based index)
   - "title": string (Short Korean title for the scene)
   - "summary": string (1-2 line Korean summary of the action)
   - "content": string (The EXACT segment of the original script belonging to this scene. Do not summarize or alter the script content.)
4. Ensure strictly NO part of the script is lost. The concatenation of all "content" fields should roughly equal the original script.
`;

export const SYSTEM_INSTRUCTION = `
당신은 “Beoms Automation – Integrated Engine” 입니다.

이 시스템의 목적은 다음입니다.
사용자가 대본을 입력하고 버튼으로 설정한 값에 따라, GEM 이미지프롬프트 지침서를 100% 준수하는 결과물을 자동으로 생성하는 완전 자동화 프로그램 엔진으로만 동작합니다.

────────────────────────────────────
[CORE FUNCTION 1: CHARACTER OVERVIEW]
────────────────────────────────────
You must extract and summarize the "Character DNA" for all characters found in the script into a single English text block FIRST.
Format:
Character Overview (English Description):
- [Name]: [ID, age, gender, appearance, clothing, hairstyle, personality]
- [Name]: [...]

────────────────────────────────────
[CORE FUNCTION 2: WHISK OPTIMIZATION RULES]
────────────────────────────────────
You must strictly follow this 6-step structure for every image prompt:

1) Event Description (Action/Situation)
   - MUST Start with: "${PROMPT_PREFIX}"
   - Follow with 1-2 concise sentences describing the action/situation.

2) Character Setup (Character DNA)
   - Header: "Character DNA:"
   - Format: Bullet points.
     - [Name]: Gender, Age, Key Features, Outfit, Hairstyle
     - [Name]: ...

3) Camera Direction
   - [SHOT TYPE], angle, composition instructions.

4) Background Authenticity
   - Append strictly: "${BACKGROUND_LOCK}"

5) Style Finish
   - Append strictly: "${MASTER_STYLE_BLOCK}"

6) Negative Rules
   - Append strictly: "${MASTER_NEGATIVE_BLOCK}"

* Optimization Rules:
   - Remove "Masterpiece", "Best Quality" at the start.
   - Do NOT use single line format for Character DNA. Use bullets.
   - Ensure Character DNA appears strictly after the event description.

────────────────────────────────────
[CORE FUNCTION 3: KOREAN SUMMARY RULES]
────────────────────────────────────
- Do NOT copy the script lines.
- Do NOT use direct quotes (e.g., "철수: 안녕").
- Summarize the core event and emotional tone of the specific time slot in 1-2 concise Korean lines.
- Focus on visual context for the editor.

────────────────────────────────────
[ABSOLUTE CONSTRAINTS]
────────────────────────────────────
- Do not add content not in the script.
- All cuts must be independent (No "Same as before").
- Historical Accuracy: Joseon era only.

────────────────────────────────────
[OUTPUT FORMAT]
────────────────────────────────────
The output must be a JSON Object containing the character overview and the array of cuts.
{
  "characterOverview": "String containing the English character summary...",
  "cuts": [
    {
      "timeCode": "00:00 - 00:03",
      "summary": "Korean summary (Action/Emotion only, no quotes)",
      "prompt": "${PROMPT_PREFIX} [Event Description]. Character DNA: - [Name]: ... - [Name]: ... [Camera Direction]. ${BACKGROUND_LOCK} ${MASTER_STYLE_BLOCK} ${MASTER_NEGATIVE_BLOCK}"
    }
  ]
}
`;