import type { BenchmarkCollection } from "../schema/benchmark.ts";

/**
 * Benchmark Adapter 的采集选项。
 * 本批 benchmark 采集统一以官方已发布快照为输入，不实现自动抓取
 * （benchmark-collection spec §Out of Scope；探索 02 实现约束），
 * 因此没有 mode/fetcher——快照经 fixture manifest 装载。
 */
export interface BenchmarkCollectOptions {
  /** 采集时钟；默认系统时间。测试注入固定时钟保证确定性。 */
  now?: () => Date;
}

/**
 * Benchmark Adapter：把特定 benchmark 的官方快照转换为 BenchmarkCollection。
 * 与 DataProvider 平行：benchmark 主体（模型/Agent/配置）与 Plan 是不同对象，分开建模。
 * 契约约束：不得实现跨来源加权、Plan 分数推断、缺失字段猜测或第三方榜单转载。
 */
export interface BenchmarkAdapter {
  adapterId: string;
  collect(options: BenchmarkCollectOptions): Promise<BenchmarkCollection>;
}
