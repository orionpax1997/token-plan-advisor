import { createSnapshotProvider } from "../../factory.ts";
import type { DataProvider } from "../../types.ts";
import { normalizeFromSnapshots } from "./normalize.ts";
import { TRAE_CN_CHAINS, TRAE_CN_SOURCES } from "./sources.ts";

/**
 * TRAE 中国站（trae.cn，RMB，积分计费）Data Provider。
 * 营销定价页（trae.cn/pricing）为客户端渲染（`RENDER_DEPENDENT`），
 * 价目与额度通过 docs.trae.cn 帮助文档（.md 直链）替代入口完成采集（research/04 §1.2）。
 *
 * 与国际版的关键差异：CN 计费周期为"31 个自然日"（与国际版 Legacy 的
 * "30 calendar days" 不同）；CN 无官方地区清单。
 */
export const createTraeCnProvider = (): DataProvider =>
  createSnapshotProvider({
    providerId: "bytedance-trae-cn",
    fixtureDir: "trae-cn",
    sources: TRAE_CN_SOURCES,
    chains: TRAE_CN_CHAINS,
    normalizeFromSnapshots,
  });
