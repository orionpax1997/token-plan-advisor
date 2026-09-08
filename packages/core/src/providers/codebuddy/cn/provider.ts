import { readFileSync } from "node:fs";
import { join } from "node:path";
import { attachRankingGate } from "../../../schema/gate.ts";
import type { DataProvider } from "../../types.ts";
import { loadSnapshots, resolvePackageRoot } from "../load.ts";
import { normalizeFromSnapshots } from "./normalize.ts";
import { CODEBUDDY_CN_SOURCES } from "./sources.ts";

function readToolVersion(): string {
  const root = resolvePackageRoot(import.meta.url);
  const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8")) as { version?: string };
  return pkg.version ?? "0.0.0";
}

/**
 * CodeBuddy 中国站（腾讯云代码助手）Data Provider。
 * fixture 与 live 两种模式共用同一条抽取/归一化路径，仅来源加载方式不同。
 *
 * 来源选择遵循探索 01 §7.3 的来源优先级（定价页 → 文档/帮助 → 公告 → 控制台 → 法律条款）；
 * 来源间的回退链在 sources.ts 的 CODEBUDDY_CN_CHAINS 中声明，
 * 由 normalize.ts 派生到 PlanCollection.source_chains。
 */
export function createCodeBuddyCnProvider(): DataProvider {
  const packageRoot = resolvePackageRoot(import.meta.url);
  const fixtureDir = join(packageRoot, "fixtures", "codebuddy-cn");
  const toolVersion = readToolVersion();

  return {
    providerId: "tencent-codebuddy-cn",
    async collect(options) {
      const now = options.now ?? (() => new Date());
      const snapshots = await loadSnapshots(options, fixtureDir, CODEBUDDY_CN_SOURCES);
      return attachRankingGate(normalizeFromSnapshots(snapshots, options.mode, now().toISOString(), toolVersion));
    },
  };
}