/**
 * @token-plan-advisor/core 公共 API：
 * Plan Schema v1（类型与校验）、Data Provider 契约、CLI 入口，
 * 以及全部已接入的 Data Provider：z.ai / CodeBuddy / Cursor / Trae / Gemini Code Assist。
 */
export * from "./schema/plan.ts";
export { attachRankingGate, deriveRankingGate } from "./schema/gate.ts";
export type { CollectOptions, DataProvider, FetchResult, Fetcher } from "./providers/types.ts";
export { createZaiProvider } from "./providers/zai/provider.ts";
export { createCodeBuddyCnProvider } from "./providers/codebuddy/cn/provider.ts";
export { createCodeBuddyIntlProvider } from "./providers/codebuddy/intl/provider.ts";
export { createCursorProvider } from "./providers/cursor/global/provider.ts";
export { createCursorStartInProvider } from "./providers/cursor/start/provider.ts";
export { createTraeIntlProvider } from "./providers/trae/intl/provider.ts";
export { createTraeCnProvider } from "./providers/trae/cn/provider.ts";
export { createGeminiCodeAssistProvider } from "./providers/gemini/provider.ts";
export { runCli, main, type CliIo } from "./cli.ts";
