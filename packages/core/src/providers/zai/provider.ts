import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { DataProvider } from "../types.ts";
import { loadSnapshots, resolvePackageRoot } from "./load.ts";
import { normalizeFromSnapshots } from "./normalize.ts";

function readToolVersion(): string {
  const root = resolvePackageRoot(import.meta.url);
  const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8")) as { version?: string };
  return pkg.version ?? "0.0.0";
}

/**
 * z.ai GLM Coding Plan（国际区，新加坡主体）的 Data Provider。
 * fixture 与 live 两种模式共用同一条抽取/归一化路径，仅来源加载方式不同。
 */
export function createZaiProvider(): DataProvider {
  const packageRoot = resolvePackageRoot(import.meta.url);
  const fixtureDir = join(packageRoot, "fixtures", "zai");
  const toolVersion = readToolVersion();

  return {
    providerId: "zai-glm-coding-plan",
    async collect(options) {
      const now = options.now ?? (() => new Date());
      const snapshots = await loadSnapshots(options, fixtureDir);
      return normalizeFromSnapshots(snapshots, options.mode, now().toISOString(), toolVersion);
    },
  };
}
