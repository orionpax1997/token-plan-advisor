import { createSnapshotProvider } from "../../factory.ts";
import type { DataProvider } from "../../types.ts";
import { normalizeFromSnapshots } from "./normalize.ts";
import { CURSOR_CHAINS, CURSOR_SOURCES } from "./sources.ts";

/**
 * Cursor（Anysphere）全球版（USD）的 Data Provider。
 * fixture 与 live 两种模式共用同一条抽取/归一化路径，仅来源加载方式不同。
 *
 * 营销定价页为客户端渲染（JS_RENDERED_DATA）：价目经页内 JSON-LD 与
 * 帮助中心/文档站替代入口完成采集；替代来源与失败码经
 * source_chains 与字段级 source_ids 从 CLI 输出追溯。
 */
export const createCursorProvider = (): DataProvider =>
  createSnapshotProvider({
    providerId: "anysphere-cursor",
    fixtureDir: "cursor",
    sources: CURSOR_SOURCES,
    chains: CURSOR_CHAINS,
    normalizeFromSnapshots,
  });
