import { createSnapshotProvider } from "../../factory.ts";
import type { DataProvider } from "../../types.ts";
import { normalizeFromSnapshots } from "./normalize.ts";
import { CODEBUDDY_INTL_CHAINS, CODEBUDDY_INTL_SOURCES } from "./sources.ts";

/**
 * CodeBuddy 国际站（Tencent Cloud International）Data Provider。
 * fixture 与 live 两种模式共用同一条抽取/归一化路径，仅来源加载方式不同。
 *
 * 来源选择遵循探索 01 §7.3 的来源优先级（定价页 → 文档/帮助 → 公告 → 控制台 → 法律条款）；
 * 来源间的回退链在 sources.ts 的 CODEBUDDY_INTL_CHAINS 中声明，
 * 由 normalize.ts 派生到 PlanCollection.source_chains。
 */
export const createCodeBuddyIntlProvider = (): DataProvider =>
  createSnapshotProvider({
    providerId: "tencent-codebuddy-intl",
    fixtureDir: "codebuddy-intl",
    sources: CODEBUDDY_INTL_SOURCES,
    chains: CODEBUDDY_INTL_CHAINS,
    normalizeFromSnapshots,
  });
