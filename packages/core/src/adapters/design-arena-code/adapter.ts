import { join } from "node:path";
import { readToolVersion, resolvePackageRoot } from "../../providers/_shared.ts";
import { loadBenchmarkSnapshots } from "../_shared.ts";
import type { BenchmarkAdapter } from "../types.ts";
import { normalizeFromSnapshots } from "./normalize.ts";
import { DESIGN_ARENA_CODE_SOURCES } from "./sources.ts";

/**
 * Design Arena Code leaderboard（Overall Frontend (Text-to-HTML)）的 Benchmark Adapter。
 *
 * 官方接口与方法页快照导入 → 解析 → 标准化，全部在确定性代码内完成。
 *
 * 关键约束（research/15-03 + ticket 04）：
 * 1. Elo/winRate/battles/avgGenerationTimeMs 限定同快照 + 同类别比较；battles 门槛
 *    与 active sampling 动态模型池进入 conditions；
 * 2. 主观偏好、无代码正确性/agent loop/工具调用限制写入 prohibited_inferences；
 * 3. 条款限制（API 文档商业使用张力）写入 license_and_access_notes；
 * 4. 官方 registry 总数 ≠ 榜单覆盖数——两个口径同时保留；
 * 5. 整体 `comparability_class=reference_only`、`allowed_use=explanation`，不进入严格数值排名。
 */
export function createDesignArenaCodeAdapter(): BenchmarkAdapter {
  const packageRoot = resolvePackageRoot(import.meta.url);
  const fixtureDir = join(packageRoot, "fixtures", "design-arena-code");
  const toolVersion = readToolVersion(import.meta.url);

  return {
    adapterId: "design-arena-code",
    async collect(options) {
      const now = options.now ?? (() => new Date());
      const snapshots = await loadBenchmarkSnapshots(fixtureDir, DESIGN_ARENA_CODE_SOURCES);
      return normalizeFromSnapshots(snapshots, now().toISOString(), toolVersion);
    },
  };
}
