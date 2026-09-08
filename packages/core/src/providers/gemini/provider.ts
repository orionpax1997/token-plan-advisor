import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { DataProvider } from "../types.ts";
import { loadSnapshots, resolvePackageRoot } from "./load.ts";
import { normalizeFromSnapshots } from "./normalize.ts";
import { GEMINI_SOURCES } from "./sources.ts";

function readToolVersion(): string {
  const root = resolvePackageRoot(import.meta.url);
  const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8")) as { version?: string };
  return pkg.version ?? "0.0.0";
}

/**
 * Google Gemini Code Assist Data Provider（research/01）。
 * 双口径价格（Hourly 定价页 + Monthly 商业版页）以 price_list 两条目显式标注换算关系；
 * 个人免费层 2026-06-18 停服迁 Antigravity，状态通过 Unresolved Fact 可见，不作为可购买 plan。
 *
 * 来源优先级遵循探索 01 §7.3：定价页 → 文档/帮助 → 公告 → 控制台 → 法律条款；
 * 来源间的回退链在 sources.ts 的 GEMINI_CHAINS 中声明，
 * 由 normalize.ts 派生到 PlanCollection.source_chains。
 */
export function createGeminiCodeAssistProvider(): DataProvider {
  const packageRoot = resolvePackageRoot(import.meta.url);
  const fixtureDir = join(packageRoot, "fixtures", "gemini-codeassist");
  const toolVersion = readToolVersion();

  return {
    providerId: "google-gemini-codeassist",
    async collect(options) {
      const now = options.now ?? (() => new Date());
      const snapshots = await loadSnapshots(options, fixtureDir, GEMINI_SOURCES);
      return normalizeFromSnapshots(snapshots, options.mode, now().toISOString(), toolVersion);
    },
  };
}
