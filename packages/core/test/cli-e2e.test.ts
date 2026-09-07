import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { fileURLToPath } from "node:url";
import { validatePlanCollection } from "../src/schema/plan.ts";

const BIN = fileURLToPath(new URL("../dist/tpa.js", import.meta.url));
const hasBuild = existsSync(BIN);

/**
 * 真实进程端到端：spawn 编译产物 `node dist/tpa.js collect zai --mode fixture`，
 * 验证外部行为——stdout 上是单个可校验的 JSON 文档，进程退出码 0。
 * `pnpm test` 会先执行构建，因此该文件在常规流程中总是生效。
 */
describe.skipIf(!hasBuild)("tpa CLI 端到端（spawn dist/tpa.js）", () => {
  it("collect zai 输出通过 Schema 校验的机读 JSON", async () => {
    const result = await new Promise<{ code: number | null; stdout: string; stderr: string }>(
      (resolve, reject) => {
        const child = spawn(process.execPath, [BIN, "collect", "zai", "--mode", "fixture"], {
          env: { ...process.env, NODE_OPTIONS: "--disable-warning=ExperimentalWarning" },
        });
        let stdout = "";
        let stderr = "";
        child.stdout.on("data", (d) => (stdout += d));
        child.stderr.on("data", (d) => (stderr += d));
        child.on("error", reject);
        child.on("close", (code) => resolve({ code, stdout, stderr }));
      },
    );
    if (result.code !== 0) {
      throw new Error(`CLI exited ${result.code}: ${result.stderr}`);
    }
    // stdout 必须是单个 JSON 文档（即便 stderr 有内容）
    const parsed = JSON.parse(result.stdout);
    const validation = validatePlanCollection(parsed);
    expect(validation.ok).toBe(true);
    if (validation.ok) {
      expect(validation.value.collection.provider_id).toBe("zai-glm-coding-plan");
      expect(validation.value.collection.mode).toBe("fixture");
    }
  });
});
