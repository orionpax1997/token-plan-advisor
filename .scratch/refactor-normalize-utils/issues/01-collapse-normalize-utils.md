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
