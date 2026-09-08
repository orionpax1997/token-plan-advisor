import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { SourceSpec } from "../../src/providers/_shared.ts";
import type { Fetcher } from "../../src/providers/types.ts";

/**
 * 把 fixture 快照伪装成 HTTP 响应，验证 live 路径的解析逻辑（不发起真实网络请求）。
 * URL 未注册时返回 404，覆盖「单来源失败不中断采集」的测试路径。
 */
export function fakeLiveFetcher(
  fixtureDir: string,
  sources: readonly Pick<SourceSpec, "source_id" | "file" | "url">[],
): Fetcher {
  return async (url) => {
    const source = sources.find((s) => s.url === url);
    if (!source) return { status: 404, body: "" };
    const body = await readFile(join(fixtureDir, source.file), "utf8");
    return { status: 200, body };
  };
}
