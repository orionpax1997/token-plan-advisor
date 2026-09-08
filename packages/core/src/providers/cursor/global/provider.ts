import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { DataProvider } from "../../types.ts";
import { loadSnapshots, resolvePackageRoot } from "../load.ts";
import { normalizeFromSnapshots } from "./normalize.ts";
import { CURSOR_SOURCES } from "./sources.ts";

function readToolVersion(): string {
  const root = resolvePackageRoot(import.meta.url);
  const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8")) as { version?: string };
  return pkg.version ?? "0.0.0";
}

/**
 * Cursor（Anysphere）全球版（USD）的 Data Provider。
 * fixture 与 live 两种模式共用同一条抽取/归一化路径，仅来源加载方式不同。
 *
 * 营销定价页为客户端渲染（JS_RENDERED_DATA）：价目经页内 JSON-LD 与
 * 帮助中心/文档站替代入口完成采集；替代来源与失败码经
 * source_chains 与字段级 source_ids 从 CLI 输出追溯。
 */
export function createCursorProvider(): DataProvider {
  const packageRoot = resolvePackageRoot(import.meta.url);
  const fixtureDir = join(packageRoot, "fixtures", "cursor");
  const toolVersion = readToolVersion();

  return {
    providerId: "anysphere-cursor",
    async collect(options) {
      const now = options.now ?? (() => new Date());
      const snapshots = await loadSnapshots(options, fixtureDir, CURSOR_SOURCES);
      return normalizeFromSnapshots(snapshots, options.mode, now().toISOString(), toolVersion);
    },
  };
}
