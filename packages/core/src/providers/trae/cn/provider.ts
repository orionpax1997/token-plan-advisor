import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { DataProvider } from "../../types.ts";
import { loadSnapshots, resolvePackageRoot } from "../load.ts";
import { normalizeFromSnapshots } from "./normalize.ts";
import { TRAE_CN_SOURCES } from "./sources.ts";

function readToolVersion(): string {
  const root = resolvePackageRoot(import.meta.url);
  const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8")) as { version?: string };
  return pkg.version ?? "0.0.0";
}

/**
 * TRAE 中国站（trae.cn，RMB，积分计费）Data Provider。
 * 营销定价页（trae.cn/pricing）为客户端渲染（`RENDER_DEPENDENT`），
 * 价目与额度通过 docs.trae.cn 帮助文档（.md 直链）替代入口完成采集（research/04 §1.2）。
 *
 * 与国际版的关键差异：CN 计费周期为"31 个自然日"（与国际版 Legacy 的
 * "30 calendar days" 不同）；CN 无官方地区清单。
 */
export function createTraeCnProvider(): DataProvider {
  const packageRoot = resolvePackageRoot(import.meta.url);
  const fixtureDir = join(packageRoot, "fixtures", "trae-cn");
  const toolVersion = readToolVersion();

  return {
    providerId: "bytedance-trae-cn",
    async collect(options) {
      const now = options.now ?? (() => new Date());
      const snapshots = await loadSnapshots(options, fixtureDir, TRAE_CN_SOURCES);
      return normalizeFromSnapshots(snapshots, options.mode, now().toISOString(), toolVersion);
    },
  };
}
