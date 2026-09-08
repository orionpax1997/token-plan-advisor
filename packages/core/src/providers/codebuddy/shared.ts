import type { FailureCode, SourceChainRef, SourceKind } from "../../schema/plan.ts";
import type { RawSnapshot } from "./load.ts";

/** 一条回退链的配置：链 id、用途与按优先级升序排列的来源 id。 */
export interface SourceChainSpec {
  chain_id: string;
  purpose: string;
  source_ids: string[];
}

/** 单次尝试的可机读记录，source_chains.attempts 的字段。 */
export interface ChainAttemptRecord {
  source_id: string;
  kind: SourceKind;
  ok: boolean;
  failure_code?: FailureCode;
  http_status?: number;
  error_note?: string;
}

/** chain_id → 该链首选 ok 来源的 source_id；整链失败时为 null。 */
export type ChainResolution = Map<string, string | null>;

/**
 * 从已加载的快照 + 链配置，派生 source_chains 字段。
 * 每条链按优先级顺序逐条尝试；首个 ok=true 的来源即 chosen_source_id；
 * 整链失败时 chosen_source_id 为 null。
 *
 * 本函数同时返回 ChainResolution，供 normalize 层在组装字段的 source_ids 时
 * 使用链内实际生效的来源——保证"实际使用的来源与回退路径可从 CLI 输出追溯"。
 *
 * 注意：本函数只做派生，不实际执行抓取——抓取失败由 loadSnapshots
 * 在更早阶段处理并写入 RawSnapshot（http_status / failure_code / error_note）。
 */
export function deriveSourceChains(
  snapshots: RawSnapshot[],
  chains: SourceChainSpec[],
): { chains: SourceChainRef[]; resolution: ChainResolution } {
  const chainsOut: SourceChainRef[] = [];
  const resolution: ChainResolution = new Map();
  for (const chain of chains) {
    const attempts: ChainAttemptRecord[] = chain.source_ids.map((sourceId) => {
      const snapshot = snapshots.find((s) => s.source_id === sourceId);
      if (!snapshot) {
        return {
          source_id: sourceId,
          kind: "docs_help",
          ok: false,
          error_note: "snapshot missing from registry",
        };
      }
      const ok = snapshot.http_status === 200 && snapshot.body.length > 0;
      const attempt: ChainAttemptRecord = {
        source_id: sourceId,
        kind: snapshot.kind,
        ok,
      };
      if (snapshot.http_status !== 0) attempt.http_status = snapshot.http_status;
      if (snapshot.failure_code !== undefined) attempt.failure_code = snapshot.failure_code;
      if (snapshot.error_note !== undefined) attempt.error_note = snapshot.error_note;
      return attempt;
    });
    const chosen = attempts.find((a) => a.ok);
    chainsOut.push({
      chain_id: chain.chain_id,
      purpose: chain.purpose,
      attempts,
      chosen_source_id: chosen ? chosen.source_id : null,
    });
    resolution.set(chain.chain_id, chosen ? chosen.source_id : null);
  }
  return { chains: chainsOut, resolution };
}