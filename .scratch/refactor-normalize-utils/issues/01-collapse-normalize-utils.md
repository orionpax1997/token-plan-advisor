# 01: 收敛 normalize/extract 工具带为共享层

**What to build:** 新增 `packages/core/src/providers/normalize-shared.ts`——字段工厂三件套（`verified`/`unobtainable(failureCode?, note?)`/`notApplicable`）、`makeChainSrc(resolution, chains)`、`sortSourcesByRegistry(sources, registry)`、`buildSources(snapshots, extractStated, noteFor)`；新增 `packages/core/src/providers/extract-shared.ts`——`bodyOf`、`pickBodyByChain`、`normalizeEnglishDate`。8 家 normalize.ts 改引用；B 族（trae×2/codebuddy×2/gemini）unobtainable 调用点机械加占位；5 份月份表归一化器删除、`extractStatedDate` 正则保留；三时间戳块收敛为 buildSources + 各家 note 策略。决策背景见 [spec.md](../spec.md)。

**Blocked by:** 无（基于 refactor-provider-factory 01 之后的 HEAD）

**Status:** ready-for-human

- [x] `providers/normalize-shared.ts` 落地（TDD 先行）：`verified`/`notApplicable` 逐字吸收，`unobtainable` 统一双参签名，`makeChainSrc`/`sortSourcesByRegistry` 提参去常量
- [x] `providers/extract-shared.ts` 落地（TDD 先行）：`bodyOf`/`pickBodyByChain`/`normalizeEnglishDate`；5 份月份表归一化器删除（zai、cursor/global、cursor/start 内联表、trae/intl、codebuddy/intl），各家 `extractStatedDate` 正则保留在原 extract.ts
- [x] B 族 ~43 处 `unobtainable` 调用点统一为双参占位形态；全仓库调用点无新增 failureCode 实参
- [x] 8 家三时间戳块收敛为 `buildSources` + 各家 note 策略函数（trae 三分支、zai announcement 分支各为策略函数；zai 标签表经 extractStated 适配注入）；failure_code 统一条件展开
- [x] Unresolved Fact 组装零改动（60 处文案原样）；`notApplicable` 不引入 zai/codebuddy×2
- [x] 现有测试全绿 + `normalize-shared`/`extract-shared` 单元测试新增
- [x] `collect` / `collect-all` 输出与重构前 diff 为空（fixture 模式逐 provider 核对，含 `last_updated_note` 与 note 文案逐字节一致）

## Comments

**2026-09-08 grilling 结论**：双参统一（Q1）、只共享月份表归一化器（Q2）、三时间戳块做 + Unresolved Fact 踢出（Q3）、两个新文件（Q4）、新 feature 目录（Q5）。Unresolved Fact 不可收敛的判定记入 spec，防止未来评审重提。

**2026-09-08 实现记录（agent）**

- TDD：先写 `normalize-shared.test.ts`/`extract-shared.test.ts`（Red：模块不存在）→ 实现两个共享模块（Green 22/22）→ 逐家改 extract.ts（删 bodyOf/pickBodyByChain/月份表）→ 逐家改 normalize.ts（删工厂/chainSrc/sort 块，接 buildSources+note 策略）→ B 族调用点机械加占位 → 全量验证。
- **占位统计**：B 族 43 处调用点中 36 处 note 调用点机械加 `undefined, `（trae/cn 10、trae/intl 8、codebuddy/cn 7、codebuddy/intl 5、gemini 6；含 trae/cn 1 处多行调用），另 7 处无参调用天然符合双参签名。全仓库无任何调用点新增 failureCode 实参。
- **normalizeEnglishDate 收敛口径**：共享版取 trae/intl 形态（单空格 + `[A-Za-z]+` + 月份表拒绝未知词）；codebuddy/intl 原副本正则更宽松但上游捕获只产单空格形状，可达输入下输出等价（备查句已补入 spec.md 背景）。gemini `extractIndividualsDeprecation` 内联月份表不在 ticket 所列 5 份之列（其形状不同：可选逗号 + ISO 优先），保留不动。
- **zai failure_code 无条件→条件展开**：in-memory 键缺席差异不可达（fixture 模式 failure_code 恒为 ok_code），序列化输出等价，已逐字节核对。
- **输出一致性核对方式**：重构前后各跑一次 `collect`（8 家）与 `collect-all`，JSON 归一化 `collected_at` 后逐字节 `cmp`，全部 IDENTICAL。
- 全量 364 passed | 2 skipped（基线 342 + 共享层 22），typecheck 零错，`_shared.ts`/`factory.ts`/`src/index.ts` 零改动。

**2026-09-08 code-review（双轴）**

- **Standards**：无硬违规；3 处判断题建议（codebuddy/cn 孤儿注释、extract-shared JSDoc 补正则宽松度口径、测试断言绕道字符串替换）均已修复。
- **Spec**：无缺失、无实质超纲；normalizeEnglishDate 非逐字合并的备查句已补入 spec 背景（与 Standards 轴第 2 条同源）。
