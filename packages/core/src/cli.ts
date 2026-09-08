import { createZaiProvider } from "./providers/zai/provider.ts";
import { createCodeBuddyCnProvider } from "./providers/codebuddy/cn/provider.ts";
import { createCodeBuddyIntlProvider } from "./providers/codebuddy/intl/provider.ts";
import type { DataProvider } from "./providers/types.ts";
import { validatePlanCollection } from "./schema/plan.ts";

const PROVIDER_FACTORIES: Record<string, () => DataProvider> = {
  zai: createZaiProvider,
  "codebuddy-cn": createCodeBuddyCnProvider,
  "codebuddy-intl": createCodeBuddyIntlProvider,
};

const USAGE = `Usage: tpa collect <provider> [--mode fixture|live] [--pretty]

Commands:
  collect <provider>   采集指定 Vendor 的 Coding Plan 事实并输出机读 JSON

Options:
  --mode <mode>        fixture（默认，使用随包快照）或 live（实时抓取官方来源）
  --pretty             缩进输出（默认单行紧凑 JSON）

Providers:
  ${Object.keys(PROVIDER_FACTORIES).join(", ")}

Examples:
  tpa collect zai
  tpa collect zai --mode live --pretty
`;

export interface CliIo {
  stdout: (s: string) => void;
  stderr: (s: string) => void;
}

function writeJson(io: CliIo, value: unknown, pretty: boolean): void {
  io.stdout(JSON.stringify(value, null, pretty ? 2 : undefined) + "\n");
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
  if (command !== "collect") {
    io.stderr(`Unknown command: ${command}\n\n${USAGE}`);
    return 2;
  }

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

  let collected;
  try {
    collected = await factory().collect({ mode });
  } catch (error) {
    io.stderr(
      `collect failed: ${error instanceof Error ? error.message : String(error)}\n`,
    );
    return 1;
  }

  const validation = validatePlanCollection(collected);
  if (!validation.ok) {
    io.stderr(
      `internal error: collected data failed Plan Schema v1 validation:\n${validation.issues.join("\n")}\n`,
    );
    return 1;
  }

  writeJson(io, validation.value, pretty);
  return 0;
}

/** 进程入口（bin/tpa）。 */
export async function main(): Promise<void> {
  process.exitCode = await runCli(process.argv.slice(2), {
    stdout: (s) => process.stdout.write(s),
    stderr: (s) => process.stderr.write(s),
  });
}
