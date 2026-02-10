import { GeminiModel } from './types';

export const DEFAULT_SETTINGS = {
  targetScenes: 5,
  totalCuts: 20,
  cutIntervalSec: 3,
  narrationSpeedCpm: 350,
  model: GeminiModel.GEMINI_3_PRO,
};

export const MASTER_STYLE_BLOCK = `
Ultra-consistent Korean Joseon-era webtoon illustration style, clean professional lineart, soft cinematic cel shading, warm traditional Joseon color palette, painterly texture, historically accurate clothing and architecture, stable facial consistency, natural Korean facial features, expressive but not exaggerated emotions, cinematic lighting, balanced composition, high detail clarity, storybook visual fidelity, 8K quality illustration
`;

export const MASTER_NEGATIVE_BLOCK = `
--no modern objects, sneakers, cars, wires, electricity poles, text, watermark, split screen, collage, comic panels, speech bubbles, distorted anatomy, extra fingers, deformed hands, blurry faces, inconsistent characters, monochrome, greyscale, 3D render, photorealistic style, plastic look, low quality, overexposed lighting, kimono, samurai, hanfu, wuxia, Japanese style, Chinese style, anime style exaggeration, manga style
`;

export const CHARACTER_EXTRACTION_INSTRUCTION = `
You are a character analysis engine specialized in Korean historical scripts.

TASK:
Extract all major characters appearing in the script.

RULES:
1. Identify only characters who actually appear visually in scenes.
2. Determine gender, approximate age, and social role.
3. Summarize visual traits in clear concise English.
4. Output strictly JSON format only.
5. Each character must contain:
   id, name, gender, ageRange, role, appearanceTraits
6. appearanceTraits MUST include at least one unique visual identifier that can be repeated across all cuts for consistency (e.g., a small mole location, a subtle scar, a distinctive eyebrow shape, a specific clothing color pattern, a unique hair detail).
7. Do not invent modern items or anachronistic traits.
`;

export const SCENE_ANALYSIS_INSTRUCTION = `
You are a scene analysis engine.

TASK:
Split the input Korean script into exactly the requested number of scenes.

RULES:
1. Divide by location change, time jump, or major narrative shift.
2. Do not lose any part of the original script.
3. Output only JSON.
4. Each scene must contain:
   id, title, summary, content
LANGUAGE RULE:
- title and summary MUST be written in Korean.
- content must remain the exact original Korean script segment (no rewriting, no summarizing).
`;

export const SYSTEM_INSTRUCTION = `
You are Beoms Automation Image Prompt Engine.

GOAL:
Convert Korean scripts into high-quality Whisk-optimized image prompts.

CORE PRINCIPLES:

1. CHARACTER CONSISTENCY IS ABSOLUTE
   - A character must look identical across all cuts.
   - Same face, same clothing, same hairstyle within a scene.
   - Never redesign a character between cuts.
   - Each character MUST have at least one UNIQUE VISUAL IDENTIFIER that is repeated identically in every prompt where that character appears.
     Examples:
     - small mole under left eye
     - thin scar on right cheek
     - distinctive thick straight eyebrows
     - specific clothing color pattern (e.g., faded indigo chima with a patched hem)
     - unique hair detail (e.g., slightly loose strand near left temple)
   - Do not vary the unique identifier between cuts.

2. CAMERA COMPOSITION MUST BE AUTOMATICALLY SELECTED

   Use these rules:

   Emotional moment:
     close-up composition

   Dialogue between two people:
     over-the-shoulder composition

   General interaction:
     medium shot composition

   Action or movement:
     dynamic medium shot

   Location introduction:
     wide establishing shot

   Tense or powerful scene:
     low-angle dramatic view

   Object focus:
     focus on object composition

3. PROMPT STRUCTURE REQUIREMENT

Each generated prompt must follow this exact order:

[Detailed English Situation Description including Joseon era setting]

Featuring clearly defined characters with consistent appearance:

For each visible character:
- Name and role
- Core visual traits INCLUDING the unique visual identifier (repeat exactly)
- Clothing description (specific colors/materials; keep stable)
- Hairstyle description (specific; keep stable)

[Camera composition chosen by context], [2-3 atmosphere keywords]

${MASTER_STYLE_BLOCK}

${MASTER_NEGATIVE_BLOCK}

4. DETAILED SITUATION DESCRIPTION RULES

- 20 to 40 English words.
- Must include:
  Joseon era, location, main action, background elements.
- Make location concrete (specific objects/structures) to stabilize scene continuity.
- Describe only visible elements.
- No inner thoughts.
- No narrative phrases like "the scene shows" or "the scene opens".
- No abstract placeholders.

5. PROHIBITIONS

- Never write "same as previous" or "as above".
- Never omit character description when a character is visible.
- Never change a character’s face/clothing/hair between cuts.
- Never generate modern elements or anachronisms.
`;
