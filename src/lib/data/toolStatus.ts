import type { AITool } from "@/lib/types/ai-tool";

/** A tool the vendor has shut down keeps its page but is never ranked, compared or sold. */
export function isActiveTool(tool: Pick<AITool, "discontinued">): boolean {
  return !tool.discontinued;
}

export function activeTools<T extends Pick<AITool, "discontinued">>(tools: T[]): T[] {
  return tools.filter(isActiveTool);
}
