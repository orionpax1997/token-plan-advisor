# 更新日志 | DeepSeek API Docs

URL: https://api-docs.deepseek.com/zh-cn/updates/

本页总览

# 更新日志

---

## 时间: 2026-08-21

### DeepSeek-V4-Flash-Vision-Exp 发布

今天，全新的多模态视觉理解模型 DeepSeek-V4-Flash-Vision-Exp 上线 DeepSeek API 平台，这是一个实验性质的模型，用户可以通过设置 model='deepseek-v4-flash-vision-exp' 访问该模型。

---

## 时间: 2026-08-13

### DeepSeek-V4-Pro 更新

DeepSeek-V4-Pro 正式版已同步在 APP、网页端和 API 更新上线。API 调用方式不变，模型名设置为 `deepseek-v4-pro`，即可使用最新版本。

Agent 能力大幅提升

正式版 DeepSeek V4 Pro 极大增强了 Agent 能力，在生产环境中的性能表现提升尤为显著。

- HLE (wo / w tools): 42.7/60.0
- Terminal Bench 2.1: 87.9
- NL2Repo: 61.5
- Cybergym: 83.3
- DeepSWE: 62.7
- Toolathlon-Verified: 74.1
- Agents' Last Exam: 25.7
- AutomationBench (Public): 31.8
- DSBench-FullStack: 71.1
- DSBench-Hard: 67.2

更灵活的思考强度控制

V4-Pro 和 V4-Flash 思考模式现支持 low / high / max 三档思考强度，用户在实际使用中可以根据任务复杂度灵活选择。

API 定价调整

随着 DeepSeek V4 全系列模型正式版上线，我们将对 API 价格进行更新调整。为了更加合理地调配资源，我们将采用峰谷定价，闲时价格为高峰时段价格的一半，鼓励用户根据实际使用情况调整任务时间。新价格将于北京时间 2026 年 8 月 17 日 0 时开始生效。

---

## 时间: 2026-07-31

### DeepSeek-V4-Flash 更新

DeepSeek-V4-Flash 正式版 API 上线公测，API 调用方式不变，模型名设置为 `deepseek-v4-flash` 即可使用最新版本。

Agent 能力大幅增强，基准测试远超 V4-Pro-Preview：

- Terminal Bench 2.1: 82.7
- NL2Repo: 54.2
- Cybergym: 76.7
- DeepSWE: 54.4
- Toolathlon verified: 70.3
- Agent Last Exam: 25.2
- Automation Bench (Public): 25.1
- DSBench-FullStack: 68.7
- DSBench-Hard: 59.6

正式版 V4-Flash 原生支持 Responses API 格式并针对性适配 Codex，具体配置方法请参考文档。

---

## 时间: 2026-04-24

### DeepSeek-V4

DeepSeek API 已支持 V4-Pro 与 V4-Flash，支持 OpenAI ChatCompletions 接口与 Anthropic 接口。访问新模型时，base_url 不变, model 参数需要改为 `deepseek-v4-pro` 或 `deepseek-v4-flash`。

旧有的 API 接口的两个模型名 `deepseek-chat` 与 `deepseek-reasoner` 将于三个月后（2026-07-24）停止使用。当前阶段内，这两个模型名分别指向 `deepseek-v4-flash` 的非思考模式与思考模式。

---

## 时间: 2025-12-01

### DeepSeek-V3.2

`deepseek-chat` 和 `deepseek-reasoner` 都已升级为 DeepSeek-V3.2.

- `deepseek-chat` 对应 DeepSeek-V3.2 的非思考模式
- `deepseek-reasoner` 对应 DeepSeek-V3.2 的思考模式
