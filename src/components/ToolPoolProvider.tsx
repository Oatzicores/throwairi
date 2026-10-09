"use client";

import { createContext, useContext } from "react";
import type { FinderTool } from "@/lib/prompts/finder";

const ToolPoolContext = createContext<FinderTool[]>([]);

/** Sends the tool list to the page once instead of once per prompt card. */
export function ToolPoolProvider({ pool, children }: { pool: FinderTool[]; children: React.ReactNode }) {
  return <ToolPoolContext.Provider value={pool}>{children}</ToolPoolContext.Provider>;
}

export const useToolPool = () => useContext(ToolPoolContext);
