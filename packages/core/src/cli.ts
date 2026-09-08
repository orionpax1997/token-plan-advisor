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
 * 尚未接入的 `coding-subscription` 候选与缺口声明。
 * 不宣称市场完整——只声明当前未覆盖、未来 ticket 待扩展的来源。
 */
const COVERAGE_GAPS: { name: string; reason: string }[] = [
  {
    name: "Claude Code (Anthropic, 个人版/团队版)",
    reason: "本批范围仅覆盖 coding-subscription 已知 7 项；Claude Code / Codex 等其他候选在父规格的 Out of Scope 中",
  },
  {
    name: "ChatGPT Codex (OpenAI, 个人版/团队版)",
    reason: "同上；Out of Scope（属 general-subscription 候选，本批仅采集 coding-subscription）",
  },
  {
    name: "Google AI Pro / Ultra (Gemini 个人订阅)",
    reason: "general-subscription 类型；不在本批采集范围。Gemini Code Assist 个人免费层已停服（迁 Antigravity）",
  },
  {
    name: "Bailian / Qwen Code / 阿里云通义灵码 (阿里)",
    reason: "未列入本批；后续 ticket 扩展",
  },
  {
    name: "DeepSeek API 包月 / 包年套餐",
    reason: "未列入本批；research/14 仅记录 API 按量计费，月度订阅为另一来源",
  },
  {
    name: "OpenAI API / Anthropic API 包月 / 包年套餐",
    reason: "api-usage 类型；本批范围不含",
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

  // 读取工具版本（任一 provider 都共享同一包版本）
  const firstFactory = PROVIDER_FACTORIES[CODING_SUBSCRIPTION_PROVIDERS[0]!]!;
  // 用 try/catch 包一层：版本读取失败时使用占位
  let toolVersion = "0.0.0";
  try {
    // 通过工厂创建的 provider 间接读取版本；先实例化再读
    const instance = firstFactory();
    const collected = await instance.collect({ mode });
    toolVersion = collected.collection.tool_version;
  } catch {
    // ignore
  }

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
