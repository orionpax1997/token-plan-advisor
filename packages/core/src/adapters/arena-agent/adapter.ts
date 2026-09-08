import { join } from "node:path";
import { readToolVersion, resolvePackageRoot } from "../../providers/_shared.ts";
import { loadBenchmarkSnapshots } from "../_shared.ts";
import type { BenchmarkAdapter } from "../types.ts";
import { normalizeFromSnapshots } from "./normalize.ts";
import { ARENA_AGENT_SOURCES } from "./sources.ts";

/**
 * Arena Agent leaderboard 的 Benchmark Adapter。
 *
 * 官方页面公开字段快照导入 → 解析 → 标准化，全部在确定性代码内完成。
 *
 * 关键约束（research/15-02 + ticket 04）：
 * 1. 服务条款禁止程序化/自动化抓取——fixture 为官方页面公开字段的结构化快照；
 * 2. Net Improvement 是相对 baseline 的 treatment effect，不是绝对成功率；
 * 3. 五类组件信号方向差异显式保留（Confirmed Success/Praise/Complaint/Steerability
 *    是 higher_is_better；Bash Recovery/Tool Hallucination 是 lower_is_better），
 *    不统一换算方向或归一化到同一尺度；
 * 4. 没有固定任务集/prompt/重复次数——这些限制进入 conditions 与 Unresolved Fact；
 * 5. session 数、模型数、快照时间强制保留；
 * 6. P50 cost/token + page-level price 字段仅作 `benchmark_resource_usage` 描述性信号，
 *    不与 Plan 价格、额度或用户真实成本混算；
 * 7. 整体 `comparability_class=reference_only`、`allowed_use=explanation`，不进入严格数值排名。
 */
export function createArenaAgentAdapter(): BenchmarkAdapter {
  const packageRoot = resolvePackageRoot(import.meta.url);
  const fixtureDir = join(packageRoot, "fixtures", "arena-agent");
  const toolVersion = readToolVersion(import.meta.url);

  return {
    adapterId: "arena-agent",
    async collect(options) {
      const now = options.now ?? (() => new Date());
      const snapshots = await loadBenchmarkSnapshots(fixtureDir, ARENA_AGENT_SOURCES);
      return normalizeFromSnapshots(snapshots, now().toISOString(), toolVersion);
    },
  };
}
