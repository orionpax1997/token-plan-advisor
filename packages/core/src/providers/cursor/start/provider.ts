import { createSnapshotProvider } from "../../factory.ts";
import type { DataProvider } from "../../types.ts";
import { normalizeFromSnapshots } from "./normalize.ts";
import { CURSOR_START_CHAINS, CURSOR_START_SOURCES } from "./sources.ts";

/**
 * Cursor Start（印度区域档，INR）的 Data Provider。
 * 按 CONTEXT.md 的 Regional Variant 独立建模：独立币种（INR）、法域（印度）与
 * 套餐结构（仅第一方模型），不影响 anysphere-cursor 的 USD 主体数据。
 */
export const createCursorStartInProvider = (): DataProvider =>
  createSnapshotProvider({
    providerId: "anysphere-cursor-start-in",
    fixtureDir: "cursor-start-in",
    sources: CURSOR_START_SOURCES,
    chains: CURSOR_START_CHAINS,
    normalizeFromSnapshots,
  });
