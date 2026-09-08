import { join } from "node:path";
import { readToolVersion, resolvePackageRoot } from "../../providers/_shared.ts";
import { loadBenchmarkSnapshots } from "../_shared.ts";
import type { BenchmarkAdapter } from "../types.ts";
import { normalizeFromSnapshots } from "./normalize.ts";
import { TERMINAL_BENCH_SOURCES } from "./sources.ts";

/**
 * Terminal-Bench 4.0（Harbor Hub leaderboard 4-0-0）的 Benchmark Adapter。
 * 官方快照导入 → 解析 → 标准化，全部在确定性代码内完成；
 * accuracy 映射为 terminal_agent_completion；Tokens/Cost 仅归入
 * benchmark_resource_usage 描述性信号。
 *
 * Agent + Model + Effort 三元组作为不同 configuration 进入 conditions，
 * 不同 effort 不被合并为同一模型结果；n_trials、accuracy 公式、完整
 * prompt/tool schema、模型 snapshot 保持 null + unobtainable 并进入 Unresolved Facts。
 */
export function createTerminalBenchAdapter(): BenchmarkAdapter {
  const packageRoot = resolvePackageRoot(import.meta.url);
  const fixtureDir = join(packageRoot, "fixtures", "terminal-bench");
  const toolVersion = readToolVersion(import.meta.url);

  return {
    adapterId: "terminal-bench",
    async collect(options) {
      const now = options.now ?? (() => new Date());
      const snapshots = await loadBenchmarkSnapshots(fixtureDir, TERMINAL_BENCH_SOURCES);
      return normalizeFromSnapshots(snapshots, now().toISOString(), toolVersion);
    },
  };
}
