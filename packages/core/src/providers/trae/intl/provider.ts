import { createSnapshotProvider } from "../../factory.ts";
import type { DataProvider } from "../../types.ts";
import { normalizeFromSnapshots } from "./normalize.ts";
import { TRAE_INTL_CHAINS, TRAE_INTL_SOURCES } from "./sources.ts";

/**
 * TRAE 国际站（trae.ai，USD，Dollar Usage 计费）Data Provider。
 * 营销定价页（trae.ai/pricing）为客户端渲染（`RENDER_DEPENDENT`），
 * 价目与额度通过 docs.trae.ai 帮助文档替代入口完成采集（research/04 §1.1）。
 *
 * 来源优先级遵循探索 01 §7.3：定价页 → 文档/帮助 → 公告 → 控制台 → 法律条款；
 * 来源间的回退链在 sources.ts 的 TRAE_INTL_CHAINS 中声明，
 * 由 normalize.ts 派生到 PlanCollection.source_chains。
 */
export const createTraeIntlProvider = (): DataProvider =>
  createSnapshotProvider({
    providerId: "bytedance-trae-intl",
    fixtureDir: "trae-intl",
    sources: TRAE_INTL_SOURCES,
    chains: TRAE_INTL_CHAINS,
    normalizeFromSnapshots,
  });
