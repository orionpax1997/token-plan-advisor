import type { CollectOptions } from "../types.ts";
import type { RawSnapshot } from "../_shared.ts";
import { loadSnapshots as loadAllSnapshots, resolvePackageRoot } from "../_shared.ts";
import { ZAI_SOURCES } from "./sources.ts";

/**
 * z.ai 家族的来源快照装载入口。
 * 快照装载实现统一在 providers/_shared.ts（单一实现，消除逐字复制）；
 * z.ai 的来源注册表（ZAI_SOURCES）在 sources.ts 中声明，此处固定注入。
 */
export type { RawSnapshot, FixtureManifest } from "../_shared.ts";
export { resolvePackageRoot, httpStatusToFailureCode } from "../_shared.ts";

/** 加载 z.ai 全部来源快照（fixture 读本地快照；live 逐个抓取官方 URL）。 */
export async function loadSnapshots(options: CollectOptions, fixtureDir: string): Promise<RawSnapshot[]> {
  return loadAllSnapshots(options, fixtureDir, ZAI_SOURCES);
}
