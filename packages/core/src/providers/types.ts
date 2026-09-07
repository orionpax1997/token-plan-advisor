import type { PlanCollection } from "../schema/plan.ts";

/** 单次抓取结果。 */
export interface FetchResult {
  status: number;
  body: string;
}

/** HTTP 抓取函数；测试与离线场景可注入替身。 */
export type Fetcher = (url: string) => Promise<FetchResult>;

export interface CollectOptions {
  mode: "fixture" | "live";
  /** 采集时钟；默认系统时间。测试注入固定时钟保证确定性。 */
  now?: () => Date;
  /** live 模式的抓取函数；默认全局 fetch。 */
  fetcher?: Fetcher;
}

/**
 * Data Provider：从官方来源获取套餐事实并归一化为 PlanCollection 的连接器。
 * 采集与归一化全部在确定性代码内完成（ADR-0001）。
 */
export interface DataProvider {
  providerId: string;
  collect(options: CollectOptions): Promise<PlanCollection>;
}
