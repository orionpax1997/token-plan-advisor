import type { FailureCode, PlanField, SourceRef } from "../schema/plan.ts";
import type {
  ChainResolution,
  RawSnapshot,
  SourceChainSpec,
  SourceSpec,
} from "./_shared.ts";

/**
 * 各 Provider 家族 normalize.ts 共用的字段工厂与来源清单工具带。
 * 吸收 8 份家族副本中的逐字重复：verified/notApplicable ×8、unobtainable ×8
 * （统一双参签名 (failureCode?, note?)）、chainSrc 骨架 ×7（仅链常量名异）、
 * 来源排序 ×7（仅 registry 常量名异）、三时间戳 sources.map 块 ×8（差异 = note 策略）。
 * 家族侧差异（note 文案、标签表、分支数）以函数参数注入，不进共享层。
 */

/** 官方原文 + 来源齐全的已验证字段。 */
export function verified<T>(value: T, raw: string | undefined, sourceIds: string[]): PlanField<T> {
  return {
    value,
    status: "verified",
    ...(raw !== undefined ? { raw } : {}),
    source_ids: sourceIds,
  };
}

/**
 * 不可得字段：value=null + unobtainable，可选失败分类与补充说明。
 * 统一双参位置签名 (failureCode?, note?)；仅需说明的家族调用点传
 * `unobtainable(undefined, "…")`——不新增 failureCode 实参（输出零变化）。
 */
export function unobtainable<T>(failureCode?: FailureCode, note?: string): PlanField<T> {
  return {
    value: null,
    status: "unobtainable",
    source_ids: [],
    ...(failureCode ? { failure_code: failureCode } : {}),
    ...(note ? { note } : {}),
  };
}

/**
 * 不适用字段：usd_equivalence 体系下积分公式/高峰时段等概念整体不适用。
 * 语义选择：仅 usd_equivalence / usd_equivalence 派生家族使用；
 * zai/codebuddy×2 的 credits 体系有意缺席（用 unobtainable+note 表达"体系无此概念"）。
 */
export function notApplicable<T>(note?: string): PlanField<T> {
  return {
    value: null,
    status: "not_applicable",
    source_ids: [],
    ...(note ? { note } : {}),
  };
}

/**
 * 构造家族 chainSrc：取得链内首个 ok=true 来源的 id；整链失败时退回到该链的
 * 候选数组（字段级 source_ids，保证"实际使用的来源与回退路径可从 CLI 输出追溯"）。
 * 与 deriveSourceChains 消费同一家族 CHAINS 常量（同一 sources.ts 导出，同源无漂移）。
 */
export function makeChainSrc(resolution: ChainResolution, chains: readonly SourceChainSpec[]) {
  return (chainId: string): string[] => {
    const chosen = resolution.get(chainId);
    if (chosen) return [chosen];
    const chain = chains.find((c) => c.chain_id === chainId);
    return chain?.source_ids ?? [];
  };
}

/** 将来源清单按家族 registry 声明顺序就地排序（便于阅读；未知 id 排在前，实践中不出现）。 */
export function sortSourcesByRegistry(sources: SourceRef[], registry: readonly SourceSpec[]): void {
  sources.sort((a, b) => {
    const orderA = registry.findIndex((s) => s.source_id === a.source_id);
    const orderB = registry.findIndex((s) => s.source_id === b.source_id);
    return orderA - orderB;
  });
}

/**
 * 三时间戳来源清单：source_id/url/kind/fetched_at/http_status 来自快照，
 * last_updated_at 由家族抽取策略产出（各家 extractStatedDate 正则留在家族 extract.ts），
 * last_updated_note 由家族 note 策略函数按（快照, stated）分支产出。
 * failure_code 统一条件展开（快照无失败分类时键缺席；与序列化输出等价）。
 */
export function buildSources(
  snapshots: RawSnapshot[],
  extractStated: (snapshot: RawSnapshot) => string | null,
  noteFor: (snapshot: RawSnapshot, stated: string | null) => string,
): SourceRef[] {
  return snapshots.map((snapshot) => {
    const stated = extractStated(snapshot);
    return {
      source_id: snapshot.source_id,
      url: snapshot.url,
      source_kind: snapshot.kind,
      fetched_at: snapshot.fetched_at,
      last_updated_at: stated,
      last_updated_note: noteFor(snapshot, stated),
      http_status: snapshot.http_status,
      ...(snapshot.failure_code !== undefined ? { failure_code: snapshot.failure_code } : {}),
    };
  });
}
