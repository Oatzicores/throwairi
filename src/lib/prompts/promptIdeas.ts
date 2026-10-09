import type { PromptIdea } from "./promptIdeaBuilder";
import { SOURCED_IDEAS } from "./ideasSourced";
import { MEDIA_IDEAS } from "./ideasMedia";
import { AUDIO_CODE_IDEAS } from "./ideasAudioCode";
import { WORK_IDEAS } from "./ideasWork";

export { buildFullPrompt } from "./promptIdeaBuilder";
export type { PromptIdea } from "./promptIdeaBuilder";

/** Every idea the "ลองดู:" chips on the home form can draw from. */
export const ALL_PROMPT_IDEAS: PromptIdea[] = [...SOURCED_IDEAS, ...MEDIA_IDEAS, ...AUDIO_CODE_IDEAS, ...WORK_IDEAS];
