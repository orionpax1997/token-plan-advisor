import { createSnapshotProvider } from "../../factory.ts";
import type { DataProvider } from "../../types.ts";
import { normalizeFromSnapshots } from "./normalize.ts";
import { DEEPSEEK_API_CHAINS, DEEPSEEK_API_SOURCES } from "./sources.ts";

/**
 * DeepSeek API（开放平台，按 token 计费的 api-usage Plan Type）的 Data Provider。
 * 本 Provider 是首批 api-usage 类型；与 coding-subscription 候选不放在同一排行榜直接比较
 * （CONTEXT.md「Plan Type」：不同类型不默认放入同一个排行榜）。
 *
 * 来源种类遵循探索 01 §7.3 的来源优先级（定价页 → 文档/帮助 → 公告 → 控制台 → 法律条款）；
 * 来源间的回退链在 sources.ts 的 DEEPSEEK_API_CHAINS 中声明，
 * 由 normalize.ts 派生到 PlanCollection.source_chains。
 *
 * fixture 与 live 两种模式共用同一条抽取/归一化路径，仅来源加载方式不同。
 */
export const createDeepSeekApiProvider = (): DataProvider =>
  createSnapshotProvider({
    providerId: "deepseek-api",
    fixtureDir: "deepseek-api",
    sources: DEEPSEEK_API_SOURCES,
    chains: DEEPSEEK_API_CHAINS,
    normalizeFromSnapshots,
  });
