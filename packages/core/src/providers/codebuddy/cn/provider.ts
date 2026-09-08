import { createSnapshotProvider } from "../../factory.ts";
import type { DataProvider } from "../../types.ts";
import { normalizeFromSnapshots } from "./normalize.ts";
import { CODEBUDDY_CN_CHAINS, CODEBUDDY_CN_SOURCES } from "./sources.ts";

/**
 * CodeBuddy 中国站（腾讯云代码助手）Data Provider。
 * fixture 与 live 两种模式共用同一条抽取/归一化路径，仅来源加载方式不同。
 *
 * 来源选择遵循探索 01 §7.3 的来源优先级（定价页 → 文档/帮助 → 公告 → 控制台 → 法律条款）；
 * 来源间的回退链在 sources.ts 的 CODEBUDDY_CN_CHAINS 中声明，
 * 由 normalize.ts 派生到 PlanCollection.source_chains。
 */
export const createCodeBuddyCnProvider = (): DataProvider =>
  createSnapshotProvider({
    providerId: "tencent-codebuddy-cn",
    fixtureDir: "codebuddy-cn",
    sources: CODEBUDDY_CN_SOURCES,
    chains: CODEBUDDY_CN_CHAINS,
    normalizeFromSnapshots,
  });
