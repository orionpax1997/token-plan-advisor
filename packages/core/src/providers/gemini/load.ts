/**
 * Gemini Code Assist 家族的来源快照/回退链装载入口。
 * 实现统一在 providers/_shared.ts（单一实现，消除逐字复制）；
 * 本文件仅做家族命名别名与再导出，保证家族内 import 路径稳定。
 */
export type {
  SourceSpec as GeminiSourceSpec,
  RawSnapshot,
  FixtureManifest,
} from "../_shared.ts";
export { loadSnapshots, resolvePackageRoot, httpStatusToFailureCode } from "../_shared.ts";
