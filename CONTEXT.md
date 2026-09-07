# Token Plan Advisor

用于帮助个人开发者比较 Coding Plan，并基于当前会话条件、最新可验证数据和透明评分给出套餐建议；不替用户购买、配置或建立长期画像。

## Language

### 产品与套餐

**Vendor**：提供模型或编程服务的商业主体，例如 Anthropic、OpenAI 或国内模型厂商。

**Plan**：用户可以购买或订阅的具体产品方案。

**Plan Type**：套餐的计费与使用形态。当前范围包括 `coding-subscription`、`general-subscription` 和 `api-usage`；不同类型不默认放入同一个排行榜直接比较。

**Regional Variant**：同一 Vendor 的同一产品在不同地区运营的独立变体，拥有独立的主体、币种、法域和套餐结构；不建模为两个独立 Vendor，也不共享同一套可用性结论。

### 数据与分析

**Data Provider**：从官方页面、官方 API 或官方文档获取套餐事实的连接器。它不是商业服务提供商。

**Benchmark Adapter**：将特定 benchmark 或测评结果转换为标准化指标的适配器。

**Recommendation Policy**：定义硬性约束、动态权重、评分和排序规则的策略。

**Recommendation**：基于某一时刻的数据和用户当前会话条件生成的分析结果，不是对未来价格、额度或可用性的承诺。

**Current Decision Context**：仅用于本次推荐的地区、预算、用量、工具、能力偏好和约束；不构成持久化用户画像。

### 可用性与数据质量

**Availability**：套餐在特定地区的可用性，至少分别描述注册、支付、网络访问、服务政策和功能限制，不能简化为单一“支持/不支持”。

**Official Source**：由 Vendor 直接维护的套餐页、价格页、帮助中心、API 文档、状态页或公告。

**Unresolved Fact**：当前无法从可信官方来源获取、验证或消除冲突的事实；必须在结果中提示，并允许用户补充信息，不能由模型猜测。
