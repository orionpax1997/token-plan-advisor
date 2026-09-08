import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { DataProvider } from "../../types.ts";
import { loadSnapshots, resolvePackageRoot } from "../load.ts";
import { normalizeFromSnapshots } from "./normalize.ts";
import { CODEBUDDY_INTL_SOURCES } from "./sources.ts";

function readToolVersion(): string {
  const root = resolvePackageRoot(import.meta.url);
  const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8")) as { version?: string };
  return pkg.version ?? "0.0.0";
}

/**
 * CodeBuddy 国际站（Tencent Cloud International）Data Provider。
 * fixture 与 live 两种模式共用同一条抽取/归一化路径，仅来源加载方式不同。
 *
 * 来源选择遵循探索 01 §7.3 的来源优先级（定价页 → 文档/帮助 → 公告 → 控制台 → 法律条款）；
 * 来源间的回退链在 sources.ts 的 CODEBUDDY_INTL_CHAINS 中声明，
 * 由 normalize.ts 派生到 PlanCollection.source_chains。
 */
export function createCodeBuddyIntlProvider(): DataProvider {
  const packageRoot = resolvePackageRoot(import.meta.url);
  const fixtureDir = join(packageRoot, "fixtures", "codebuddy-intl");
  const toolVersion = readToolVersion();

  return {
    providerId: "tencent-codebuddy-intl",
    async collect(options) {
      const now = options.now ?? (() => new Date());
      const snapshots = await loadSnapshots(options, fixtureDir, CODEBUDDY_INTL_SOURCES);
      return normalizeFromSnapshots(snapshots, options.mode, now().toISOString(), toolVersion);
    },
  };
}