# 0001: Monorepo 核心包 + 薄 Skill，CLI 优先

确定性分析核心——Plan Schema、Data Provider、Benchmark Adapter、Recommendation Policy、fixture 与测试——作为独立 npm 包放在本仓库内；Agent Skill 只保留调用说明与结果渲染约定，通过 CLI 调用核心包，不内嵌采集或评分脚本。数据源变化频率远高于推荐逻辑，独立版本化和独立测试让抓取修复不牵动 Skill；Skill 文本保持宿主无关、可移植。

## Considered Options

- **脚本内嵌 Skill 目录**：单工件分发最简单，但 Skill 版本被采集细节绑架，依赖管理与测试薄弱；且正经维护时它仍是一个包，只是被 vendored。否决。
- **MCP Server 优先**：接口标准化好，但首版仪式成本高，暂无第二个 MCP 宿主需求。推迟为后续可选包装层。

## Consequences

- 仓库采用 monorepo 布局：核心包 + Skill 目录。
- 采集与评分必须完全在核心包的确定性管道内完成；Skill 文本不得指示 LLM 自行浏览官方来源并汇总事实。
- CLI 的输入/输出契约在探索 ticket 01、02 的结论落地后才冻结；此前不实现生产 CLI 契约。
