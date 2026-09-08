# 01: 合并 fixture 装载实现

**What to build:** `loadFixtureManifest` 收敛为 `providers/_shared.ts` 单一实现（async/await 形态），`adapters/_shared.ts` 删除本地实现改引用；fixture 装载核心（manifest 查条目 → 读文件 → 缺失抛错，~17 行逐字重复段）收敛为共享函数，返回来源原始体（source_id/url/kind/body），`loadSnapshots` fixture 分支与 `loadBenchmarkSnapshots` 各自 map 成自己的快照类型与特有字段（providers: `fetched_at`/`http_status`/`failure_code`；adapters: `captured_at`）。错误文案随实现合一自然归一。背景见 [spec.md](../spec.md)。

**Blocked by:** 无

**Status:** ready-for-human

- [x] `adapters/_shared.ts` 本地 `loadFixtureManifest` 删除，改从 `providers/_shared.ts` 引用；全仓库仅一份 manifest 装载实现
- [x] 装载核心（查条目/读文件/缺失抛错）单一实现，两侧快照组装保留各自字段；`loadBenchmarkSnapshots` 对外签名与窄接口语义（无 mode、缺件即抛）不变
- [x] 现有测试全绿（providers 8 家 + benchmark 6 adapter + 契约冻结）
- [x] `collect` / `collect-all` / benchmark collect 输出与重构前 diff 为空（fixture 模式逐字节，含错误路径——缺失 fixture 的抛错行为与文案语义不变）

## Comments

**2026-09-08**：跳过 grilling 直接开票（评审记录候选 4）；决策三则见 spec.md——manifest 实现放 providers 侧（依赖方向已存在）、装载核心共享而非整函数合一（push 字段差异是语义差异）、验收以输出零变化为准。

**2026-09-08 实现记录（agent）**

- 共享核心落 `providers/_shared.ts`：`FixtureSourceBody<K>` 接口 + `loadFixtureSourceBodies`（泛型 K 保留两侧 kind 字面量类型：SourceKind 与 BenchmarkSourceKind 零交集，非泛型会让 adapters 侧丢型）。返回 `{ captured_at, bodies }`——captured_at 是两家族唯一共享的时间戳语义（providers 映射为 fetched_at，adapters 原名透传）。
- `loadSnapshots` fixture 分支改为 `loadFixtureSourceBodies` + `map` 成 RawSnapshot（fetched_at/http_status: 200/failure_code 按下标取 `sources[i]!.ok_code`——bodies 与 sources 严格同序，因缺件在核心内即抛、不改变顺序；`!` 断言为仓库既定惯例）。
- `adapters/_shared.ts` 删除本地 `loadFixtureManifest`（.then() 形态）与 `FixtureManifest` 类型导入，改 import `loadFixtureSourceBodies`；对外不再暴露 manifest 装载（`adapters/_shared.ts` 是内部模块，index.ts 不导出，无外部调用方，无需兼容再导出）。
- `loadBenchmarkSnapshots` 对外签名、窄接口语义（无 mode、缺件即抛）、错误文案逐字不变；`readFile`/`join` 死导入已删。
- **输出一致性核对方式**：重构前后各跑一次 `collect zai`、`collect-all`、全部 6 家 `collect-benchmark`（其中 arena-agent 在 stash 前后各采一次，字节级 diff 全同；其余用 `jq -S walk` 归一所有 `collected_at` 时间戳后 diff 全同）。

**2026-09-08 code-review（双轴）**

- **Standards**：无硬违规（重构方向获 normalize-shared.ts 头注模式背书，术语与 CONTEXT.md 一致）；4 处判断题建议中 3 处已修复：删 `FixtureSourceBody` 未生效的默认类型参数、接口/函数 doc 去重（接口 doc 缩为一句）、adapters 侧墓碑注释压缩为一句；第 4 处（返回 `{source, body}` 配对消除下标回取）评审者自标「非本次必改」，且会越过 spec 决策 2 的返回值边界，不做。
- **Spec**：无缺失、无实质超纲；captured_at 返回与泛型接口为已声明的可接受扩展。评审建议的「bodies 与 sources 严格同序」契约已固化到 `loadFixtureSourceBodies` doc（此前仅调用侧有说明）。
