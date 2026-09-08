/**
 * @token-plan-advisor/core 公共 API：
 * Plan Schema v1（类型与校验）、Data Provider 契约、z.ai / CodeBuddy Provider、CLI 入口。
 */
export * from "./schema/plan.ts";
export type { CollectOptions, DataProvider, FetchResult, Fetcher } from "./providers/types.ts";
export { createZaiProvider } from "./providers/zai/provider.ts";
export { createCodeBuddyCnProvider } from "./providers/codebuddy/cn/provider.ts";
export { createCodeBuddyIntlProvider } from "./providers/codebuddy/intl/provider.ts";
export { runCli, main, type CliIo } from "./cli.ts";