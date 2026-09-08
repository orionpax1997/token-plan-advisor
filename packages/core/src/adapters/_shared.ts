import type { BenchmarkSourceKind } from "../schema/benchmark.ts";
import { loadFixtureSourceBodies } from "../providers/_shared.ts";

/**
 * Benchmark Adapter 家族共用的快照装载。
 * 与 Plan Provider 的 loadSnapshots 平行但更窄：只有 fixture 模式——
 * benchmark 结果本质是版本化快照，"最新"指最新已发布的 leaderboard/dataset
 * revision，实时抓取动态榜单反而破坏可比性（benchmark-collection spec）。
 */

/** Benchmark 来源快照定义（家族侧可复用）。 */
export interface BenchmarkSourceSpec {
  source_id: string;
  url: string;
  /** fixture 文件名（相对 fixtureDir）。 */
  file: string;
  kind: BenchmarkSourceKind;
}

/** 已装载的一份来源快照。 */
export interface BenchmarkSnapshot {
  source_id: string;
  url: string;
  kind: BenchmarkSourceKind;
  body: string;
  /** 快照落盘时点（= fixture manifest captured_at，即「快照」时间戳口径）。 */
  captured_at: string;
}

// manifest 装载与 fixture 装载核心（查条目 → 读文件 → 缺失抛错）复用
// providers/_shared.ts 的单一实现（loadFixtureManifest / loadFixtureSourceBodies）。

/**
 * 装载全部来源快照（fixture）。manifest 或快照文件缺失即抛错——
 * benchmark 快照是随包分发的确定输入，缺件属于打包错误而非可降级的采集失败。
 */
export async function loadBenchmarkSnapshots(
  fixtureDir: string,
  sources: BenchmarkSourceSpec[],
): Promise<BenchmarkSnapshot[]> {
  const { captured_at, bodies } = await loadFixtureSourceBodies(fixtureDir, sources);
  return bodies.map(
    (b): BenchmarkSnapshot => ({
      source_id: b.source_id,
      url: b.url,
      kind: b.kind,
      body: b.body,
      captured_at,
    }),
  );
}
