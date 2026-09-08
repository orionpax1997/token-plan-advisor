import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { BenchmarkSourceKind } from "../schema/benchmark.ts";
import type { FixtureManifest } from "../providers/_shared.ts";

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

export function loadFixtureManifest(fixtureDir: string): Promise<FixtureManifest> {
  return readFile(join(fixtureDir, "manifest.json"), "utf8").then(
    (body) => JSON.parse(body) as FixtureManifest,
  );
}

/**
 * 装载全部来源快照（fixture）。manifest 或快照文件缺失即抛错——
 * benchmark 快照是随包分发的确定输入，缺件属于打包错误而非可降级的采集失败。
 */
export async function loadBenchmarkSnapshots(
  fixtureDir: string,
  sources: BenchmarkSourceSpec[],
): Promise<BenchmarkSnapshot[]> {
  const manifest = await loadFixtureManifest(fixtureDir);
  const snapshots: BenchmarkSnapshot[] = [];
  for (const source of sources) {
    const entry = manifest.sources.find((s) => s.source_id === source.source_id);
    if (!entry) {
      throw new Error(`fixture manifest 缺少来源 ${source.source_id}`);
    }
    let body: string;
    try {
      body = await readFile(join(fixtureDir, entry.file), "utf8");
    } catch (error) {
      throw new Error(`fixture 快照缺失：${entry.file}`, { cause: error });
    }
    snapshots.push({
      source_id: source.source_id,
      url: source.url,
      kind: source.kind,
      body,
      captured_at: manifest.captured_at,
    });
  }
  return snapshots;
}
