import { readFileSync } from "node:fs";
import { join } from "node:path";
import { attachRankingGate } from "../../../schema/gate.ts";
import type { DataProvider } from "../../types.ts";
import { loadSnapshots, resolvePackageRoot } from "../load.ts";
import { normalizeFromSnapshots } from "./normalize.ts";
import { CURSOR_START_SOURCES } from "./sources.ts";

function readToolVersion(): string {
  const root = resolvePackageRoot(import.meta.url);
  const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8")) as { version?: string };
  return pkg.version ?? "0.0.0";
}

/**
 * Cursor Start（印度区域档，INR）的 Data Provider。
 * 按 CONTEXT.md 的 Regional Variant 独立建模：独立币种（INR）、法域（印度）与
 * 套餐结构（仅第一方模型），不影响 anysphere-cursor 的 USD 主体数据。
 */
export function createCursorStartInProvider(): DataProvider {
  const packageRoot = resolvePackageRoot(import.meta.url);
  const fixtureDir = join(packageRoot, "fixtures", "cursor-start-in");
  const toolVersion = readToolVersion();

  return {
    providerId: "anysphere-cursor-start-in",
    async collect(options) {
      const now = options.now ?? (() => new Date());
      const snapshots = await loadSnapshots(options, fixtureDir, CURSOR_START_SOURCES);
      return attachRankingGate(normalizeFromSnapshots(snapshots, options.mode, now().toISOString(), toolVersion));
    },
  };
}
