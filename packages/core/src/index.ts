/**
 * @token-plan-advisor/core 公共 API：
 * Plan Schema v1（类型与校验）、Data Provider 契约、Benchmark Record Schema v1、
 * Benchmark Adapter 契约、CLI 入口，以及全部已接入的 Provider/Adapter。
 */
export * from "./schema/plan.ts";
export * from "./schema/benchmark.ts";
export { attachRankingGate, deriveRankingGate } from "./schema/gate.ts";
export type { CollectOptions, DataProvider, FetchResult, Fetcher } from "./providers/types.ts";
export type { BenchmarkAdapter, BenchmarkCollectOptions } from "./adapters/types.ts";
export { createZaiProvider } from "./providers/zai/provider.ts";
export { createCodeBuddyCnProvider } from "./providers/codebuddy/cn/provider.ts";
export { createCodeBuddyIntlProvider } from "./providers/codebuddy/intl/provider.ts";
export { createCursorProvider } from "./providers/cursor/global/provider.ts";
export { createCursorStartInProvider } from "./providers/cursor/start/provider.ts";
export { createTraeIntlProvider } from "./providers/trae/intl/provider.ts";
export { createTraeCnProvider } from "./providers/trae/cn/provider.ts";
export { createGeminiCodeAssistProvider } from "./providers/gemini/provider.ts";
export { createDeepSweAdapter } from "./adapters/deepswe/adapter.ts";
export { runCli, main, type CliIo } from "./cli.ts";
