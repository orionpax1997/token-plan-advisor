import { join } from "node:path";
import { readToolVersion, resolvePackageRoot } from "../../providers/_shared.ts";
import { loadBenchmarkSnapshots } from "../_shared.ts";
import type { BenchmarkAdapter } from "../types.ts";
import { normalizeFromSnapshots } from "./normalize.ts";
import { ARTIFICIAL_ANALYSIS_SOURCES } from "./sources.ts";

/**
 * Artificial Analysis Intelligence v4.1.1 的 Benchmark Adapter。
 * 官方快照导入 → 解析 → 标准化，全部在确定性代码内完成：
 * 完整版本号与官方权重随每条记录保存；官方 Index 整体作为同版本内的综合能力信号
 * 保存（类别权重 + 覆盖双视图），可映射到注册表能力标签的组成评测逐项成为独立记录
 * （含各自 harness 与 judge 条件），其余组成评测在 task_set.domains 逐项保存；
 * 不自行重新加权，不把 Index 拆成 Coding Plan 总分。
 * 网站 ToS 限制自动化查询：fixture 为官方事实的结构化转写（见 sources.ts），无 live 模式。
 */
export function createArtificialAnalysisIntelligenceAdapter(): BenchmarkAdapter {
  const packageRoot = resolvePackageRoot(import.meta.url);
  const fixtureDir = join(packageRoot, "fixtures", "artificial-analysis-intelligence");
  const toolVersion = readToolVersion(import.meta.url);

  return {
    adapterId: "artificial-analysis-intelligence",
    async collect(options) {
      const now = options.now ?? (() => new Date());
      const snapshots = await loadBenchmarkSnapshots(fixtureDir, ARTIFICIAL_ANALYSIS_SOURCES);
      return normalizeFromSnapshots(snapshots, now().toISOString(), toolVersion);
    },
  };
}
