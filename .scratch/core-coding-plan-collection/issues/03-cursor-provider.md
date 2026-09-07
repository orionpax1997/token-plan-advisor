# 03: Cursor Provider：动态渲染回退与美元等值双池

**What to build:** 接入 Cursor（Anysphere）作为最难的订阅型来源：营销页 JS 渲染走 `JS_RENDERED_DATA` 分类，用 JSON-LD 与文档站替代入口完成采集；落地"美元等值双池"（Other Models 美元等值 @ API 价 + on-demand）这一 `usd_equivalence` 额度原语；INR 的 Cursor Start 作为 `regional_variant`；iOS 内购排除大陆写入五维 Availability 的对应维度；Admin API 能力标记为 `API_AVAILABLE`（仅声明，不登录、不读取账户数据）。来源事实以 [research/02](../../token-plan-advisor/research/02-cursor.md) 为准，失败分类与回退链复用 ticket 02 的契约。

**Blocked by:** 02（失败分类与来源回退链）

**Status:** ready-for-agent

- [ ] JS 渲染定价页经 JSON-LD/文档站替代入口采集成功，实际使用的替代来源与失败码在输出中可见
- [ ] `usd_equivalence` 双池额度原语被结构化：等值语义、适用模型池、on-demand 溢出计费显式标注，不与 messages/tokens 混算
- [ ] Pro 2025-06 请求制→用量制改制的语义在新 Schema 下表达正确（用量制为准，改制历史仅作来源注释）
- [ ] INR 区域档位作为 `regional_variant` 独立建模，不影响 USD 主体数据
- [ ] "iOS 内购除大陆外全球可用"落在 Availability 的支付/功能维度，不产生"支持中国"单一布尔
- [ ] Privacy Mode / ZDR 进入 `data_policy`；Admin API 仅作 `API_AVAILABLE` 声明标记
- [ ] fixture 端到端测试经 CLI seam 验证上述外部行为
