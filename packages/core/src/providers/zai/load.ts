import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { FailureCode } from "../../schema/plan.ts";
import type { CollectOptions, Fetcher } from "../types.ts";
import { ZAI_SOURCES, type SourceSpec } from "./sources.ts";

/** 一次采集抓到的来源快照。 */
export interface RawSnapshot {
  source_id: string;
  url: string;
  kind: SourceSpec["kind"];
  body: string;
  /** 采集方抓取时间（fixture 模式 = 快照落盘时点；live 模式 = 本次抓取时点）。 */
  fetched_at: string;
  http_status: number;
  failure_code: FailureCode;
  /** 抓取失败时的说明。 */
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

function httpStatusToFailureCode(status: number): FailureCode {
  if (status === 200) return "OK_MD";
  if (status === 403 || status === 429) return "CF_BLOCKED";
  if (status === 404 || status === 410) return "GONE";
  if (status === 451) return "REGION_BLOCKED";
  return "GONE";
}

const DEFAULT_FETCHER: Fetcher = async (url) => {
  const response = await fetch(url, { redirect: "follow" });
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
): Promise<RawSnapshot[]> {
  const now = options.now ?? (() => new Date());
  const fetchedAt = now().toISOString();
  const fetcher = options.fetcher ?? DEFAULT_FETCHER;

  if (options.mode === "live") {
    const snapshots: RawSnapshot[] = [];
    for (const source of ZAI_SOURCES) {
      try {
        const result = await fetcher(source.url);
        snapshots.push({
          source_id: source.source_id,
          url: source.url,
          kind: source.kind,
          body: result.body,
          fetched_at: fetchedAt,
          http_status: result.status,
          failure_code: httpStatusToFailureCode(result.status),
          ...(result.status !== 200 ? { error_note: `HTTP ${result.status}` } : {}),
        });
      } catch (error) {
        snapshots.push({
          source_id: source.source_id,
          url: source.url,
          kind: source.kind,
          body: "",
          fetched_at: fetchedAt,
          http_status: 0,
          failure_code: "CF_BLOCKED",
          error_note: error instanceof Error ? error.message : String(error),
        });
      }
    }
    return snapshots;
  }

  // fixture 模式
  const manifest = await loadFixtureManifest(fixtureDir);
  const snapshots: RawSnapshot[] = [];
  for (const source of ZAI_SOURCES) {
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
      failure_code: "OK_MD",
    });
  }
  return snapshots;
}
