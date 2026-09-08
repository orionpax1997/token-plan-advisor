import { createSnapshotProvider } from "../factory.ts";
import type { DataProvider } from "../types.ts";
import { normalizeFromSnapshots } from "./normalize.ts";
import { ZAI_SOURCES } from "./sources.ts";

/**
 * z.ai GLM Coding Plan（国际区，新加坡主体）的 Data Provider。
 * fixture 与 live 两种模式共用同一条抽取/归一化路径，仅来源加载方式不同。
 *
 * z.ai 暂无回退链声明：chains: [] 为合法规格值（ticket 01 决策：纯结构收敛），
 * source_chains 恒为空数组；数据拉齐另立工作。
 */
export const createZaiProvider = (): DataProvider =>
  createSnapshotProvider({
    providerId: "zai-glm-coding-plan",
    fixtureDir: "zai",
    sources: ZAI_SOURCES,
    chains: [],
    normalizeFromSnapshots,
  });
