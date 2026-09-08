import { existsSync, readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { FailureCode, SourceChainRef, SourceKind } from "../schema/plan.ts";
import type { CollectOptions, Fetcher } from "./types.ts";

/**
 * 各 Provider 家族（zai / codebuddy / cursor）共用的来源快照装载与回退链派生。
 * 单一实现，家族侧以类型别名/再导出薄封装（消除 load.ts/shared.ts 的逐字复制）。
 */

/** 来源快照定义（家族侧可用类型别名重命名）。 */
export interface SourceSpec {
  source_id: string;
  url: string;
  /** fixture 文件名（相对 fixtureDir）。 */
  file: string;
  kind: SourceKind;
  /** HTTP 200 时的失败分类标记。 */
  ok_code: FailureCode;
}

/** 一次采集抓到的来源快照。 */
export interface RawSnapshot {
  source_id: string;
  url: string;
  kind: SourceKind;
  body: string;
  /** 采集方抓取时间（fixture 模式 = 快照落盘时点；live 模式 = 本次抓取时点）。 */
  fetched_at: string;
  http_status: number;
  failure_code?: FailureCode;
  error_note?: string;
}

export interface FixtureManifest {
  captured_at: string;
  note?: string;
  sources: { source_id: string; file: string; url: string }[];
}

/** 从模块位置向上找最近的 package.json（src/ 与 dist/ 下都成立）。 */
export function resolvePackageRoot(fromUrl: string): string {
  let filePath = decodeURIComponent(new URL(fromUrl).pathname);
  let dir = dirname(filePath);
  for (let i = 0; i < 20; i++) {
    if (existsSync(join(dir, "package.json"))) return dir;
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error(`无法从 ${filePath} 定位 package.json`);
}

export async function loadFixtureManifest(fixtureDir: string): Promise<FixtureManifest> {
  return JSON.parse(await readFile(join(fixtureDir, "manifest.json"), "utf8")) as FixtureManifest;
}

/** 从模块位置读取包版本（CLI 与全部 Provider/Adapter 共用；ESM 实现，勿用 require）。 */
export function readToolVersion(fromUrl: string): string {
  const pkg = JSON.parse(readFileSync(join(resolvePackageRoot(fromUrl), "package.json"), "utf8")) as {
    version?: string;
  };
  return pkg.version ?? "0.0.0";
}

/**
 * 仅对可明确归因的状态给出失败分类；无法归因的（如 5xx、网络层错误）
 * 返回 null——不猜测，错误细节留在 error_note（探索 01 §7.4，CONTEXT.md「不猜测」）。
 */
export function httpStatusToFailureCode(status: number): FailureCode | null {
  if (status === 200) return null;
  if (status === 404 || status === 410) return "GONE";
  if (status === 403 || status === 429) return "CF_BLOCKED";
  if (status === 451) return "REGION_BLOCKED";
  return null;
}

const DEFAULT_FETCHER: Fetcher = async (url) => {
  // 单源超时 20s：线上服务器挂起时不至无限阻塞 live 采集；
  // 超时走与网络层错误相同的降级路径（不猜测失败分类，记录 error_note）
  const response = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(20_000) });
  const body = await response.text();
  return { status: response.status, body };
};

/**
 * 加载全部来源快照。fixture 模式读本地快照（确定性）；live 模式逐个抓取官方 URL。
 * 单个来源失败不中断采集——失败被记录为该来源的 failure_code，由归一化层降级为 Unresolved Fact。
 */
export async function loadSnapshots(
  options: CollectOptions,
  fixtureDir: string,
  sources: SourceSpec[],
): Promise<RawSnapshot[]> {
  const now = options.now ?? (() => new Date());
  const fetchedAt = now().toISOString();
  const fetcher = options.fetcher ?? DEFAULT_FETCHER;

  if (options.mode === "live") {
    const snapshots: RawSnapshot[] = [];
    for (const source of sources) {
      try {
        const result = await fetcher(source.url);
        const mapped = httpStatusToFailureCode(result.status);
        const snapshot: RawSnapshot = {
          source_id: source.source_id,
          url: source.url,
          kind: source.kind,
          body: result.body,
          fetched_at: fetchedAt,
          http_status: result.status,
          ...(result.status === 200
            ? { failure_code: source.ok_code }
            : mapped
              ? { failure_code: mapped }
              : {}),
          ...(result.status !== 200 ? { error_note: `HTTP ${result.status}` } : {}),
        };
        snapshots.push(snapshot);
      } catch (error) {
        // 网络层错误：不归因为任何具体失败分类，仅记录错误细节
        snapshots.push({
          source_id: source.source_id,
          url: source.url,
          kind: source.kind,
          body: "",
          fetched_at: fetchedAt,
          http_status: 0,
          error_note: error instanceof Error ? error.message : String(error),
        });
      }
    }
    return snapshots;
  }

  // fixture 模式
  const manifest = await loadFixtureManifest(fixtureDir);
  const snapshots: RawSnapshot[] = [];
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
      fetched_at: manifest.captured_at,
      http_status: 200,
      failure_code: source.ok_code,
    });
  }
  return snapshots;
}

// ---------------------------------------------------------------------------
// 回退链
// ---------------------------------------------------------------------------

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
  return { chains: chainsOut, resolution: resolution };
}
