/**
 * Cursor 家族的回退链派生入口（实现统一在 providers/_shared.ts）。
 */
export type {
  SourceChainSpec,
  ChainAttemptRecord,
  ChainResolution,
} from "../_shared.ts";
export { deriveSourceChains } from "../_shared.ts";
