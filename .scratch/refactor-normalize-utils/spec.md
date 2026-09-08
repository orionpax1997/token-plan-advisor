# refactor-normalize-utils

收敛 normalize/extract 工具带：8 个家族复制的字段工厂、来源排序器、三时间戳块、抽取工具收敛为共享层。源于 2026-09-08 架构评审候选 2（Strong），事实核查基于 ticket 01 之后的 HEAD（3a1ece5）。

## 背景结论（评审 + 事实核查）

- `normalizeFromSnapshots` 签名 8 家统一（已被 `providers/factory.ts` 的 `NormalizeFromSnapshots` 类型固化）。
- 纯重复（删除后消失）：`verified` ×8 逐字相同；`unobtainable` 两个逐字组（A 族 zai+cursor×2 双参 / B 族 trae×2+codebuddy×2+gemini 单参）；`notApplicable` ×5 逐字相同；`chainSrc` ×7 仅常量名异；`bodyOf` ×8 逐字相同；`pickBodyByChain` ×5 逐字相同；`sortSourcesByRegistry` 骨架 ×7 仅常量名异；英文月名归一化器 ×5 份（每份 ~15 行，extract 侧最大纯重复）；三时间戳 `sources.map` 块 ×8 骨架同构（差异 = note 文案与分支数）。
- 不可收敛（earning its keep）：`extractStatedDate` 的正则与归一化路径（页面语言/格式差异）、zai 的 labels 循环签名、codebuddy/intl 的 `(empty)` 特判、cursor 系的 `attribute()` 归因抽取（是 pickBodyByChain 的替代品而非缺失）。
- **Unresolved Fact 判定为不可收敛**：60 处内联构造骨架仅为 `push({...})`，差异纯文案（文案即领域知识）；schema 形状仅 4 键（fact/reason/failure_code?/how_to_resolve?），无 source_ids/note。共享层最多提供已存在的类型。未来评审勿重提。
- `notApplicable` 在 zai/codebuddy×2 缺席是语义选择（codebuddy 有意用 `unobtainable`+note 表达"体系无此概念"），不是代码缺失。
- `unobtainable` 统一为双参无 schema 障碍（failure_code 本就是所有字段形状的可选枚举；gate.ts 对 failure_code 零约束）。

## 决策记录（grilling 2026-09-08）

| 决策 | 结论 |
|---|---|
| unobtainable 统一 | **双参位置签名** `(failureCode?, note?)`：B 族 ~43 处调用点机械加 `undefined, ` 占位；A 族 3 家零改动；任何调用点**不新增 failureCode 实参**（输出零变化） |
| extract 侧深度 | **只共享月份表归一化器** `normalizeEnglishDate`；`extractStatedDate` 正则与骨架保留各家（不做参数化工厂——为收 3 行骨架让共享层长分支变浅） |
| 三时间戳块 | **参数化收敛**：`buildSources(snapshots, extractStated, noteFor)`，note 策略作函数参数；zai 标签表经 extractStated 适配注入；failure_code 统一条件展开写法（与 zai 无条件写法输出等价） |
| Unresolved Fact | **踢出范围**，组装零改动 |
| 落点 | **两个新文件**：`providers/normalize-shared.ts`（字段工厂三件套、makeChainSrc、sortSourcesByRegistry、buildSources）+ `providers/extract-shared.ts`（bodyOf、pickBodyByChain、normalizeEnglishDate）；不动 `_shared.ts`（保持装载/链派生语义） |
| ticket 组织 | 新 feature 目录（01 的 spec 非目标已声明候选 2 分票） |
| 测试 | 共享工具带 TDD 单元测试（它们是新共享模块的 interface）+ 8 家端到端输出 diff 为空 |
| 词汇 | 无新领域术语（纯实现侧工具），CONTEXT.md 不动 |

## 非目标

- Unresolved Fact 组装收敛（判定不可收敛，见背景）
- 给 B 族调用点补 failureCode（输出内容变化）
- `extractStatedDate` 参数化工厂
- `notApplicable` 语义统一（zai/codebuddy×2 的缺席是领域选择）
- CLI/adapter 侧工具（评审候选 3/4/5）
