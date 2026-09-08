import { readFileSync } from "node:fs";
import { join } from "node:path";
import { attachRankingGate } from "../../../schema/gate.ts";
import type { DataProvider } from "../../types.ts";
import { loadSnapshots, resolvePackageRoot } from "../load.ts";
import { normalizeFromSnapshots } from "./normalize.ts";
import { TRAE_INTL_SOURCES } from "./sources.ts";

function readToolVersion(): string {
  const root = resolvePackageRoot(import.meta.url);
  const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8")) as { version?: string };
  return pkg.version ?? "0.0.0";
}

/**
 * TRAE 国际站（trae.ai，USD，Dollar Usage 计费）Data Provider。
 * 营销定价页（trae.ai/pricing）为客户端渲染（`RENDER_DEPENDENT`），
 * 价目与额度通过 docs.trae.ai 帮助文档替代入口完成采集（research/04 §1.1）。
 *
 * 来源优先级遵循探索 01 §7.3：定价页 → 文档/帮助 → 公告 → 控制台 → 法律条款；
 * 来源间的回退链在 sources.ts 的 TRAE_INTL_CHAINS 中声明，
 * 由 normalize.ts 派生到 PlanCollection.source_chains。
 */
export function createTraeIntlProvider(): DataProvider {
  const packageRoot = resolvePackageRoot(import.meta.url);
  const fixtureDir = join(packageRoot, "fixtures", "trae-intl");
  const toolVersion = readToolVersion();

  return {
    providerId: "bytedance-trae-intl",
    async collect(options) {
      const now = options.now ?? (() => new Date());
      const snapshots = await loadSnapshots(options, fixtureDir, TRAE_INTL_SOURCES);
      return attachRankingGate(normalizeFromSnapshots(snapshots, options.mode, now().toISOString(), toolVersion));
    },
  };
}
