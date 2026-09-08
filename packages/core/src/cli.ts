import { createZaiProvider } from "./providers/zai/provider.ts";
import { createCodeBuddyCnProvider } from "./providers/codebuddy/cn/provider.ts";
import { createCodeBuddyIntlProvider } from "./providers/codebuddy/intl/provider.ts";
import { createCursorProvider } from "./providers/cursor/global/provider.ts";
import { createCursorStartInProvider } from "./providers/cursor/start/provider.ts";
import { createTraeIntlProvider } from "./providers/trae/intl/provider.ts";
import { createTraeCnProvider } from "./providers/trae/cn/provider.ts";
import { createGeminiCodeAssistProvider } from "./providers/gemini/provider.ts";
import type { DataProvider } from "./providers/types.ts";
import { validatePlanCollection, type PlanCollection } from "./schema/plan.ts";

/**
 * 全部已接入的 Data Provider 注册表。
 * coding-subscription 类型是本次 ticket 04 的采集目标；collect-all 仅采集这些。
 */
const PROVIDER_FACTORIES: Record<string, () => DataProvider> = {
  zai: createZaiProvider,
  "codebuddy-cn": createCodeBuddyCnProvider,
  "codebuddy-intl": createCodeBuddyIntlProvider,
  cursor: createCursorProvider,
  "cursor-start-in": createCursorStartInProvider,
  "trae-intl": createTraeIntlProvider,
  "trae-cn": createTraeCnProvider,
  "gemini-codeassist": createGeminiCodeAssistProvider,
};

/**
 * collect-all 命令要采集的 Provider 子集（spec §In Scope: 7 项 coding-subscription）。
 * 顺序按 PROVIDER_FACTORIES 的注册顺序；不再单独定义。
 */
const CODING_SUBSCRIPTION_PROVIDERS = Object.keys(PROVIDER_FACTORIES);

/**
 * 尚未接入的 coding 编码订阅候选与缺口声明。
 * 不宣称市场完整——只声明当前未覆盖、后续 ticket 待扩展的来源。
 * 父规格（.scratch/core-coding-plan-collection/spec.md）将 Claude/Codex/Google AI
 * 订阅列为 general-subscription 的 Out of Scope；collect-all 记录它们为缺口但不在本批采集。
 */
const COVERAGE_GAPS: { name: string; reason: string }[] = [
  {
    name: "Claude Code（Anthropic）",
    reason: "父规格 Out of Scope（general-subscription 候选，research/07 已调研）；本批未接入任何 Provider",
  },
  {
    name: "ChatGPT Codex（OpenAI）",
    reason: "父规格 Out of Scope（general-subscription 候选，research/06 已调研）；本批未接入任何 Provider",
  },
  {
    name: "Google AI Pro / Ultra（Gemini 个人订阅）",
    reason: "general-subscription 候选（research/08 已调研）；Gemini Code Assist 个人免费层已停服迁 Antigravity，本批不将停服层列为可购档",
  },
  {
    name: "阿里云通义灵码 / Qwen Code",
    reason: "国内 coding 助手候选未列入本批 7 项；research/12 仅覆盖 Bailian API（api-usage）",
  },
  {
    name: "其他随时间新增的 coding-subscription 候选",
    reason: "research/ 目录外的 Vendor 需先完成官方来源调研再接入；collect-all 不宣称市场完整",
  },
];

const USAGE = `Usage: tpa <command> [args]

Commands:
  collect <provider>   采集指定 Vendor 的 Coding Plan 事实并输出机读 JSON
  collect-all          一次性输出全部已接入 coding-subscription 候选 + 覆盖缺口声明

Options:
  --mode <mode>        fixture（默认，使用随包快照）或 live（实时抓取官方来源）
  --pretty             缩进输出（默认单行紧凑 JSON）

Providers:
  ${Object.keys(PROVIDER_FACTORIES).join(", ")}

Examples:
  tpa collect zai
  tpa collect zai --mode live --pretty
  tpa collect-all
  tpa collect-all --pretty
`;

export interface CliIo {
  stdout: (s: string) => void;
  stderr: (s: string) => void;
}

function writeJson(io: CliIo, value: unknown, pretty: boolean): void {
  io.stdout(JSON.stringify(value, null, pretty ? 2 : undefined) + "\n");
}

/**
 * 采集单个 provider；返回 validation.value（成功）或 null（失败）。
 * 失败信息经 io.stderr 写出（不抛异常）。
 */
async function collectOne(
  providerId: string,
  mode: "fixture" | "live",
  io: CliIo,
): Promise<PlanCollection | null> {
  const factory = PROVIDER_FACTORIES[providerId];
  if (!factory) {
    io.stderr(`Unknown provider: ${providerId}\n`);
    return null;
  }
  try {
    const collected = await factory().collect({ mode });
    const validation = validatePlanCollection(collected);
    if (!validation.ok) {
      io.stderr(
        `internal error: ${providerId} collected data failed Plan Schema v1 validation:\n${validation.issues.join("\n")}\n`,
      );
      return null;
    }
    return validation.value;
  } catch (error) {
    io.stderr(
      `collect ${providerId} failed: ${error instanceof Error ? error.message : String(error)}\n`,
    );
    return null;
  }
}

/**
 * CLI 入口：argv → 退出码。输出一律先经 Plan Schema v1 校验闸，
 * 保证 stdout 上的机读 JSON 契约可信；错误写 stderr，不污染 stdout。
 */
function readToolVersion(): string {
  // 直接读 package.json，不走完整的 provider 采集路径（后者会重复抓取全部来源）
  const { readFileSync } = require("node:fs") as typeof import("node:fs");
  const { join, dirname } = require("node:path") as typeof import("node:path");
  const { fileURLToPath } = require("node:url") as typeof import("node:url");
  const here = dirname(fileURLToPath(import.meta.url));
  // dist/cli.js → ../../../package.json (从 dist 向上找 package.json)
  let dir = here;
  for (let i = 0; i < 6; i++) {
    try {
      const pkg = JSON.parse(readFileSync(join(dir, "package.json"), "utf8")) as { version?: string };
      if (typeof pkg.version === "string") return pkg.version;
    } catch {
      // continue
    }
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return "0.0.0";
}

export async function runCli(argv: string[], io: CliIo): Promise<number> {
  const [command = null, ...rest] = argv;
  if (command === null || command === "help" || command === "--help") {
    io.stderr(USAGE);
    return command === null ? 2 : 0;
  }

  if (command === "collect-all") {
    return runCollectAll(rest, io);
  }

  if (command !== "collect") {
    io.stderr(`Unknown command: ${command}\n\n${USAGE}`);
    return 2;
  }
  return runCollect(rest, io);
}

async function runCollect(rest: string[], io: CliIo): Promise<number> {
  let providerId: string | undefined;
  let mode: "fixture" | "live" = "fixture";
  let pretty = false;
  for (let i = 0; i < rest.length; i++) {
    const arg = rest[i];
    if (arg === "--mode") {
      const value = rest[++i];
      if (value !== "fixture" && value !== "live") {
        io.stderr(`--mode must be "fixture" or "live", got: ${value}\n\n${USAGE}`);
        return 2;
      }
      mode = value;
    } else if (arg === "--pretty") {
      pretty = true;
    } else if (arg === "--help") {
      io.stderr(USAGE);
      return 0;
    } else if (arg?.startsWith("--")) {
      io.stderr(`Unknown option: ${arg}\n\n${USAGE}`);
      return 2;
    } else if (providerId === undefined) {
      providerId = arg;
    } else {
      io.stderr(`Unexpected argument: ${arg}\n\n${USAGE}`);
      return 2;
    }
  }
  if (!providerId) {
    io.stderr(`Missing provider.\n\n${USAGE}`);
    return 2;
  }
  const factory = PROVIDER_FACTORIES[providerId];
  if (!factory) {
    io.stderr(
      `Unknown provider: ${providerId}. Available providers: ${Object.keys(PROVIDER_FACTORIES).join(", ")}\n`,
    );
    return 2;
  }
  const result = await collectOne(providerId, mode, io);
  if (!result) return 1;
  writeJson(io, result, pretty);
  return 0;
}

/**
 * collect-all 命令：一次性输出全部已接入 coding-subscription Provider
 * 与覆盖缺口声明（spec §In Scope 7 项）。
 *
 * 输出 schema：
 * {
 *   schema_version: "1",
 *   collected_at: ISO8601,
 *   tool_version: "x.y.z",
 *   mode: "fixture" | "live",
 *   coverage_scope: { plan_type: "coding-subscription", count: N, providers: [...] },
 *   coverage_gaps: [{ name, reason }, ...],
 *   collections: { <provider_id>: PlanCollection, ... }
 * }
 *
 * 单个 Provider 采集失败不阻塞其他 Provider；失败的 Provider 收集于 errors 字段。
 * 不宣称市场完整——coverage_gaps 字段如实声明尚未接入的来源。
 */
async function runCollectAll(rest: string[], io: CliIo): Promise<number> {
  let mode: "fixture" | "live" = "fixture";
  let pretty = false;
  for (let i = 0; i < rest.length; i++) {
    const arg = rest[i];
    if (arg === "--mode") {
      const value = rest[++i];
      if (value !== "fixture" && value !== "live") {
        io.stderr(`--mode must be "fixture" or "live", got: ${value}\n\n${USAGE}`);
        return 2;
      }
      mode = value;
    } else if (arg === "--pretty") {
      pretty = true;
    } else if (arg === "--help") {
      io.stderr(USAGE);
      return 0;
    } else if (arg?.startsWith("--")) {
      io.stderr(`Unknown option: ${arg}\n\n${USAGE}`);
      return 2;
    } else {
      io.stderr(`Unexpected argument: ${arg}\n\n${USAGE}`);
      return 2;
    }
  }

  // 读取工具版本（任一 provider 都共享同一包版本）：直接读 package.json
  const toolVersion = readToolVersion();

  const collections: Record<string, PlanCollection> = {};
  const errors: { provider_id: string; error: string }[] = [];

  for (const providerId of CODING_SUBSCRIPTION_PROVIDERS) {
    const result = await collectOne(providerId, mode, io);
    if (result) {
      collections[providerId] = result;
    } else {
      errors.push({ provider_id: providerId, error: "see stderr for details" });
    }
  }

  const collectedAt = new Date().toISOString();
  const summary = {
    schema_version: "1",
    collected_at: collectedAt,
    tool_version: toolVersion,
    mode,
    coverage_scope: {
      plan_type: "coding-subscription",
      count: CODING_SUBSCRIPTION_PROVIDERS.length,
      providers: CODING_SUBSCRIPTION_PROVIDERS,
    },
    coverage_gaps: COVERAGE_GAPS,
    errors,
    collections,
  };

  writeJson(io, summary, pretty);

  // 部分失败时仍以 0 退出（输出包含错误明细），全部失败时退出 1
  if (errors.length === CODING_SUBSCRIPTION_PROVIDERS.length) {
    return 1;
  }
  return 0;
}

/** 进程入口（bin/tpa）。 */
export async function main(): Promise<void> {
  process.exitCode = await runCli(process.argv.slice(2), {
    stdout: (s) => process.stdout.write(s),
    stderr: (s) => process.stderr.write(s),
  });
}
