# unify-fixture-loading

合并 providers 与 adapters 两侧重复的 fixture 装载实现（架构评审 2026-09-08 候选 4，Worth exploring → 开小票）。判定与防重提记录见 `.scratch/architecture-review-2026-09-08.md`。

## 事实

- `providers/_shared.ts:51-53` 与 `adapters/_shared.ts:32-34` 各有一份 `loadFixtureManifest`：行为等价、写法已漂移（async/await vs `.then()`）；类型已从 providers 侧共享（adapters 侧 import type），实现未合一。
- fixture 装载主体：`providers/_shared.ts:135-159`（`loadSnapshots` fixture 分支）与 `adapters/_shared.ts:44-68`（`loadBenchmarkSnapshots`）核心 ~17 行逐字相同——manifest 查条目、读文件、缺失抛错（连错误文案 `fixture manifest 缺少来源 …` / `fixture 快照缺失：…` 都逐字同，共同演化压力真实）。
- 差异部分是语义差异，保留：providers 版 push `fetched_at`/`http_status: 200`/`failure_code: ok_code`，adapters 版 push `captured_at`；快照类型 `RawSnapshot[]` vs `BenchmarkSnapshot[]`。
- `loadBenchmarkSnapshots` 的窄 interface（无 mode、缺件即抛）是合理语义（实时抓取动态榜单反而破坏可比性），保留不动。

## 决策（跳过 grilling，体量一小时级；事实来自子代理核查 2026-09-08）

1. `loadFixtureManifest` 单一实现放 `providers/_shared.ts`（依赖方向已存在：adapters → providers 类型导入），`adapters/_shared.ts` 改引用。
2. 装载核心收敛为共享「manifest 查条目 → 读文件 → 缺失抛错」函数，返回来源原始体（source_id/url/kind/body）；两侧各自 map 成自己的快照类型与特有字段——**不做整函数合一**，push 字段差异是语义差异。
3. 验收以输出零变化为准（collect / collect-all / benchmark collect fixture 模式逐字节 diff）。

## 非目标

- `loadBenchmarkSnapshots` 的 interface 形状（窄接口语义保留）
- live 抓取路径（`DEFAULT_FETCHER`、live 分支）
- benchmark 侧其他收敛（评审候选 5 已关闭，见评审记录）
