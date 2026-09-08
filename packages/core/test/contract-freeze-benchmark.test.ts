import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { beforeAll, describe, expect, it } from "vitest";
import { runCli } from "../src/cli.ts";
import {
  AllowedUses,
  BenchmarkCollection,
  BenchmarkSourceKinds,
  CapabilityTags,
  ComparabilityClasses,
  ConfidenceStatuses,
  EvidenceLevels,
  validateBenchmarkCollection,
} from "../src/schema/benchmark.ts";
import type { PlanCollection } from "../src/schema/plan.ts";

/**
 * collect-benchmark 输出契约冻结测试（ticket 05）。
 *
 * 本文件钉住 v1 契约的可见形状：顶层键集、版本号、封闭枚举、能力标签注册表、
 * 证据等级/可比性/allowed_use 三元门控、6 来源 `adapter_id` 与 fixture mode 锁定、
 * benchmark 记录与 Plan 记录的对象独立性、prohibited_inferences 必填。
 *
 * 任何断言失败都意味着契约发生了变化——必须：
 *   1. 在 docs/contracts/collect-benchmark-output-v1.md 的「变更记录」追加条目并升版号；
 *   2. 同步更新本文件与全部受影响的 Adapter 测试。
 * 静默改动契约形状是不允许的。
 */

const BENCHMARK_TOP_LEVEL_KEYS = [
  "schema_version",
  "collection",
  "benchmark",
  "task_set",
  "records",
  "sources",
  "unresolved_facts",
].sort();

const BENCHMARK_COLLECTION_META_KEYS = ["adapter_id", "mode", "collected_at", "tool_version"].sort();

const BENCHMARK_BENCHMARK_KEYS = [
  "benchmark_id",
  "benchmark_version",
  "leaderboard_or_dataset_revision",
  "maintainer",
  "source_url",
  "artifact_generated_at",
  "harness",
  "license_and_access_notes",
].sort();

const BENCHMARK_TASK_SET_KEYS = [
  "description",
  "n_tasks",
  "n_repositories",
  "languages",
].sort();

const BENCHMARK_RECORD_KEYS = [
  "record_id",
  "capability",
  "raw_metric",
  "normalized_metric",
  "normalization_method",
  "source_snapshot",
  "subject_identity",
  "conditions",
  "confidence_status",
  "evidence_level",
  "comparability_class",
  "allowed_use",
  "prohibited_inferences",
].sort();

const BENCHMARK_SOURCE_KEYS = [
  "source_id",
  "url",
  "kind",
  "fetched_at",
  "last_updated_at",
  "last_updated_note",
].sort();

const SUBJECT_IDENTITY_KEYS = [
  "subject_kind",
  "model_display_name",
  "model_api_id_or_snapshot",
  "vendor",
  "agent_or_harness",
  "reasoning_effort_or_configuration",
].sort();

const CONDITIONS_KEYS = [
  "task_set_description",
  "prompt_policy",
  "tool_environment",
  "context_limit_or_context_description",
  "success_definition",
  "repeat_count",
  "cost_and_token_metadata",
].sort();

const CONTRACT_DOC = fileURLToPath(
  new URL("../../../docs/contracts/collect-benchmark-output-v1.md", import.meta.url),
);

const ADAPTER_IDS = [
  "deepswe",
  "terminal-bench",
  "zapier-automationbench",
  "artificial-analysis-intelligence",
  "arena-agent",
  "design-arena-code",
] as const;

describe("collect-benchmark 契约冻结（v1）", () => {
  let collections: Record<string, BenchmarkCollection>;

  beforeAll(async () => {
    collections = {};
    for (const id of ADAPTER_IDS) {
      const out: string[] = [];
      const err: string[] = [];
      const code = await runCli(["collect-benchmark", id], {
        stdout: (s) => out.push(s),
        stderr: (s) => err.push(s),
      });
      if (code !== 0) {
        throw new Error(`collect-benchmark ${id} 退出码 ${code}: ${err.join("")}`);
      }
      const parsed = JSON.parse(out.join("")) as BenchmarkCollection;
      // 再次经校验闸：钉住「发出前必须过 Schema」
      const validation = validateBenchmarkCollection(parsed);
      if (!validation.ok) {
        throw new Error(
          `collect-benchmark ${id} 未通过 Benchmark Schema v1 校验:\n${validation.issues.join("\n")}`,
        );
      }
      collections[id] = validation.value;
    }
  });

  it("6 来源全部经 CLI 采集输出并通过 Benchmark Schema 校验", () => {
    expect(Object.keys(collections).sort()).toEqual([...ADAPTER_IDS].sort());
    for (const id of ADAPTER_IDS) {
      const c = collections[id]!;
      expect(c.schema_version, id).toBe("1");
      expect(c.records.length, id).toBeGreaterThan(0);
      expect(c.sources.length, id).toBeGreaterThan(0);
    }
  });

  it("6 来源 adapter_id 与 CLI 注册表一一对应（不允许出现未注册 adapter_id）", () => {
    for (const [id, c] of Object.entries(collections)) {
      expect(c.collection.adapter_id, id).toBe(id);
    }
  });

  it("mode 锁定为 fixture（本批以官方快照为唯一输入，禁止自动抓取）", () => {
    for (const [id, c] of Object.entries(collections)) {
      expect(c.collection.mode, id).toBe("fixture");
    }
  });

  it("schema_version 冻结为 \"1\"", () => {
    for (const [id, c] of Object.entries(collections)) {
      expect(c.schema_version, id).toBe("1");
    }
  });

  it("tool_version 随包版本（0.1.0）", () => {
    for (const [id, c] of Object.entries(collections)) {
      expect(c.collection.tool_version, id).toBe("0.1.0");
    }
  });

  it("BenchmarkCollection 顶层键集与冻结清单完全一致（不增不减）", () => {
    for (const [id, c] of Object.entries(collections)) {
      expect(Object.keys(c).sort(), id).toEqual(BENCHMARK_TOP_LEVEL_KEYS);
    }
  });

  it("collection 元数据块键集冻结", () => {
    for (const [id, c] of Object.entries(collections)) {
      expect(Object.keys(c.collection).sort(), id).toEqual(BENCHMARK_COLLECTION_META_KEYS);
    }
  });

  it("benchmark 元数据块键集冻结", () => {
    for (const [id, c] of Object.entries(collections)) {
      expect(Object.keys(c.benchmark).sort(), id).toEqual(BENCHMARK_BENCHMARK_KEYS);
    }
  });

  it("task_set 顶层键集冻结（domains 可选存在；不出现则视为无业务域）", () => {
    for (const [id, c] of Object.entries(collections)) {
      const taskSetKeys = Object.keys(c.task_set).sort();
      // domains 是 ticket 02 / 03 引入的可选字段：允许出现（AA / Zapier），允许不出现（其余四源）
      expect(taskSetKeys.includes("domains"), id).toBe(taskSetKeys.length === 5);
      // 必须包含的四个基础键（顺序无要求，逐项核对）
      for (const key of BENCHMARK_TASK_SET_KEYS) {
        expect(taskSetKeys, id).toContain(key);
      }
    }
  });

  it("每条 record 顶层键集冻结", () => {
    for (const [id, c] of Object.entries(collections)) {
      for (const record of c.records) {
        expect(Object.keys(record).sort(), `${id}/${record.record_id}`).toEqual(BENCHMARK_RECORD_KEYS);
      }
    }
  });

  it("subject_identity 字段集冻结", () => {
    for (const [id, c] of Object.entries(collections)) {
      for (const record of c.records) {
        expect(
          Object.keys(record.subject_identity).sort(),
          `${id}/${record.record_id}`,
        ).toEqual(SUBJECT_IDENTITY_KEYS);
      }
    }
  });

  it("conditions 字段集冻结", () => {
    for (const [id, c] of Object.entries(collections)) {
      for (const record of c.records) {
        expect(
          Object.keys(record.conditions).sort(),
          `${id}/${record.record_id}`,
        ).toEqual(CONDITIONS_KEYS);
      }
    }
  });

  it("source 引用键集冻结", () => {
    for (const [id, c] of Object.entries(collections)) {
      for (const source of c.sources) {
        expect(Object.keys(source).sort(), `${id}/${source.source_id}`).toEqual(BENCHMARK_SOURCE_KEYS);
      }
    }
  });

  it("封闭枚举冻结：任何增删都是契约变更，须显式升版", () => {
    expect([...CapabilityTags]).toEqual([
      "repository_task_completion",
      "terminal_agent_completion",
      "code_execution_correctness",
      "agent_tool_orchestration",
      "frontend_visual_preference",
      "business_workflow_state_completion",
      "long_context_understanding",
      "observed_workflow_reliability",
      "benchmark_resource_usage",
    ]);
    expect([...EvidenceLevels]).toEqual(["A", "B", "C"]);
    expect([...ComparabilityClasses]).toEqual([
      "direct_same_config",
      "source_internal_normalized",
      "reference_only",
      "not_comparable",
    ]);
    expect([...AllowedUses]).toEqual(["scoring", "explanation", "exclude"]);
    expect([...ConfidenceStatuses]).toEqual([
      "confidence_interval_reported",
      "point_estimate_only",
      "unknown",
    ]);
    expect([...BenchmarkSourceKinds]).toEqual([
      "leaderboard_artifact",
      "release_manifest",
      "task_set_artifact",
      "official_docs",
      "official_license",
    ]);
  });

  it("证据等级与 allowed_use 门控在全部 6 来源的端到端输出中正确呈现", () => {
    // 探索 02「证据等级与使用范围」表 + ticket 02/03/04 评审结论：
    // - DeepSWE / Terminal-Bench / Zapier：accuracy / pass 走 scoring
    // - Zapier private strict (ticket 02 评审)：conservatively explanation
    // - Artificial Analysis：权重结构记录 explanation
    // - Arena Agent / Design Arena Code：reference_only + explanation（ticket 04 §1）
    // - 全部资源类信号（benchmark_resource_usage）：explanation
    const scoringSources: Array<keyof typeof collections> = ["deepswe", "terminal-bench"];
    const explanationOnlySources: Array<keyof typeof collections> = [
      "artificial-analysis-intelligence",
      "arena-agent",
      "design-arena-code",
    ];
    for (const id of scoringSources) {
      const c = collections[id]!;
      expect(c.records.some((r) => r.allowed_use === "scoring"), id).toBe(true);
      expect(
        c.records
          .filter((r) => r.capability.includes("benchmark_resource_usage"))
          .every((r) => r.allowed_use === "explanation"),
        id,
      ).toBe(true);
    }
    for (const id of explanationOnlySources) {
      const c = collections[id]!;
      expect(
        c.records.every((r) => r.allowed_use !== "scoring"),
        `${id} 的全部记录 must not be scoring`,
      ).toBe(true);
    }
    // Zapier：保守为 explanation
    const zapier = collections["zapier-automationbench"]!;
    expect(zapier.records.every((r) => r.allowed_use === "explanation"), "zapier").toBe(true);
  });

  it("可比性分级按来源门控：reference_only 来源不进入严格数值排名", () => {
    const referenceOnlyIds: Array<keyof typeof collections> = ["arena-agent", "design-arena-code"];
    for (const id of referenceOnlyIds) {
      const c = collections[id]!;
      for (const r of c.records) {
        expect(r.comparability_class, `${id}/${r.record_id}`).toBe("reference_only");
      }
    }
    // scoring 来源 = direct_same_config
    for (const id of ["deepswe", "terminal-bench"] as Array<keyof typeof collections>) {
      const c = collections[id]!;
      const scoringRecords = c.records.filter((r) => r.allowed_use === "scoring");
      for (const r of scoringRecords) {
        expect(r.comparability_class, `${id}/${r.record_id}`).toBe("direct_same_config");
      }
    }
  });

  it("prohibited_inferences 必填且每条记录 ≥ 1 条机读字符串", () => {
    for (const [id, c] of Object.entries(collections)) {
      for (const record of c.records) {
        expect(record.prohibited_inferences.length, `${id}/${record.record_id}`).toBeGreaterThanOrEqual(1);
        for (const inference of record.prohibited_inferences) {
          expect(typeof inference, `${id}/${record.record_id}`).toBe("string");
          expect(inference.length, `${id}/${record.record_id}`).toBeGreaterThan(0);
        }
      }
    }
  });

  it("prohibited_inferences 至少覆盖核心禁止推断：Plan 成功率 / 跨来源比较 / cost 混算", () => {
    const requiredPatterns = [
      /Plan|Coding Plan/i, // 不把 benchmark 分数当 Plan 成功率
      /混算|跨来源|跨 release|跨配置|不同 effort|跨历史|跨类别|混同|拼接|换算|反推/i, // 不跨来源/跨配置混算或拼接
      /cost|价格|额度/i, // 不与 Plan 价格、额度、用户真实成本混算
    ];
    for (const [id, c] of Object.entries(collections)) {
      for (const record of c.records) {
        // 资源类信号必须显式禁止 cost/价格混算（schema 强约束）
        if (record.capability.includes("benchmark_resource_usage")) {
          const text = record.prohibited_inferences.join("\n");
          expect(text, `${id}/${record.record_id} resource record must forbid Plan cost/价格 混算`).toMatch(
            /Plan.*(价格|额度|cost|成本)|cost.*Plan|价格.*Plan/i,
          );
        }
        // scoring 记录必须显式禁止「当 Plan 成功率」
        if (record.allowed_use === "scoring") {
          const text = record.prohibited_inferences.join("\n");
          expect(text, `${id}/${record.record_id} scoring record must forbid Plan 成功率`).toMatch(
            /Plan.*(成功率|用户成功)/i,
          );
        }
      }
    }
    // 三个核心禁止推断模式在 6 来源的 prohibited_inferences 中至少各出现一次
    for (const id of ADAPTER_IDS) {
      const c = collections[id]!;
      const all = c.records.flatMap((r) => r.prohibited_inferences).join("\n");
      for (const pattern of requiredPatterns) {
        expect(all, `${id} 缺失核心禁止推断模式 ${pattern}`).toMatch(pattern);
      }
    }
  });

  it("未知字段全链路保持显式 null + unobtainable / not_applicable，不静默编造", () => {
    // 各来源 fixture 已锁定的「全 null」字段：模型 API ID、上下文窗口、cost_basis 等
    // DeepSWE：所有记录 vendor / api_id / context_window / cost_basis 多数为 null（官方未给出时）
    const deepswe = collections["deepswe"]!;
    for (const r of deepswe.records) {
      // model_api_id 全部 null（已 ticket 01 评审钉住）
      expect(r.subject_identity.model_api_id_or_snapshot.value, `${r.record_id} model_api_id_or_snapshot`).toBeNull();
      expect(r.subject_identity.model_api_id_or_snapshot.status, `${r.record_id} model_api_id_or_snapshot`).toBe("unobtainable");
      // context_limit_or_context_description.value 全部为 null + unobtainable（research/15-01 未公开上下文窗口）
      expect(r.conditions.context_limit_or_context_description.value, `${r.record_id} context_limit`).toBeNull();
      expect(r.conditions.context_limit_or_context_description.status, `${r.record_id} context_limit`).toBe("unobtainable");
    }
    // Design Arena Code：vendor / api_id 全 null（API 不公开 vendor 字段）
    const dac = collections["design-arena-code"]!;
    for (const r of dac.records) {
      expect(r.subject_identity.model_api_id_or_snapshot.value).toBeNull();
      expect(r.subject_identity.model_api_id_or_snapshot.status).toBe("unobtainable");
      expect(r.subject_identity.vendor.value).toBeNull();
      expect(r.subject_identity.vendor.status).toBe("unobtainable");
    }
    // Arena Agent：vendor 走官方页面字段 verified（页面公开），但 model_api_id_or_snapshot 全 null
    const arena = collections["arena-agent"]!;
    for (const r of arena.records) {
      expect(r.subject_identity.model_api_id_or_snapshot.value).toBeNull();
      expect(r.subject_identity.model_api_id_or_snapshot.status).toBe("unobtainable");
    }
  });

  it("subject_kind 支持 model_configuration 与 benchmark_component 两种（AA Index 组件记录）", () => {
    // AA Intelligence：5 条权重记录走 benchmark_component
    const aa = collections["artificial-analysis-intelligence"]!;
    expect(aa.records.some((r) => r.subject_identity.subject_kind === "benchmark_component")).toBe(true);
    // 其余来源：全 model_configuration
    for (const id of ["deepswe", "terminal-bench", "zapier-automationbench", "arena-agent", "design-arena-code"] as const) {
      const c = collections[id]!;
      for (const r of c.records) {
        expect(r.subject_identity.subject_kind, `${id}/${r.record_id}`).toBe("model_configuration");
      }
    }
  });

  it("normalized_metric 只能落在同一 benchmark release 指标空间内（跨来源/跨版本统一分被校验闸直接拒绝）", () => {
    // ticket 01 评审钉住：所有 normalized_metric.metric_space 必须以
    // <benchmark_id>:<benchmark_version>: 开头
    for (const [id, c] of Object.entries(collections)) {
      const prefix = `${c.benchmark.benchmark_id}:${c.benchmark.benchmark_version}:`;
      for (const record of c.records) {
        if (record.normalized_metric !== null) {
          expect(
            record.normalized_metric.metric_space.startsWith(prefix),
            `${id}/${record.record_id} metric_space 不在 ${prefix} 内`,
          ).toBe(true);
        }
      }
    }
  });

  it("benchmark 记录与 Plan 记录对象独立：BenchmarkCollection 不出现 Plan 顶层键", () => {
    const planTopLevelKeys: Array<keyof PlanCollection> = [
      "vendor",
      "regional_variant",
      "payment",
      "quota_system",
      "models",
      "plans",
      "regional_availability",
      "promotions",
      "source_chains",
      "ranking_gate",
    ];
    for (const [id, c] of Object.entries(collections)) {
      for (const planKey of planTopLevelKeys) {
        expect(planKey in c, `${id} 不应出现 Plan 顶层键 ${String(planKey)}`).toBe(false);
      }
    }
  });

  it("benchmark 记录与 Plan 记录对象独立：resource / vendor / plans 字段零交叉", () => {
    // record JSON 序列化体不应包含 Plan 专属键
    for (const [id, c] of Object.entries(collections)) {
      for (const record of c.records) {
        const serialized = JSON.stringify(record);
        for (const planOnlyKey of ["plans", "quota_system", "price_list", "purchase_url", "model_catalog"]) {
          expect(
            serialized.includes(`"${planOnlyKey}"`),
            `${id}/${record.record_id} 字段级不应出现 Plan 专属键 ${planOnlyKey}`,
          ).toBe(false);
        }
      }
    }
  });

  it("resource 记录（benchmark_resource_usage）不进 scoring 且与 Plan 价格额度互不混算", () => {
    for (const [id, c] of Object.entries(collections)) {
      for (const record of c.records) {
        if (record.capability.includes("benchmark_resource_usage")) {
          // schema 强约束：resource 只能 explanation
          expect(record.allowed_use, `${id}/${record.record_id}`).toBe("explanation");
          // prohibited_inferences 显式禁止与 Plan 价格/额度混算
          const text = record.prohibited_inferences.join("\n");
          expect(text, `${id}/${record.record_id}`).toMatch(/Plan.*(价格|额度|cost|成本)/i);
        }
      }
    }
  });

  it("Arena Agent 与 Design Arena Code 全部记录 comparability_class=reference_only（仅参考）", () => {
    for (const id of ["arena-agent", "design-arena-code"] as const) {
      const c = collections[id]!;
      for (const r of c.records) {
        expect(r.comparability_class, `${id}/${r.record_id}`).toBe("reference_only");
        expect(r.allowed_use, `${id}/${r.record_id}`).toBe("explanation");
      }
    }
  });

  it("契约冻结文档存在，声明 contract_version 1 并含变更记录章节", () => {
    const content = readFileSync(CONTRACT_DOC, "utf8");
    expect(content).toContain("contract_version: 1");
    expect(content).toContain("## 变更记录");
    expect(content).toContain("冻结");
    expect(content).toContain("升版");
    // 6 来源覆盖：在契约文档中显式列出
    for (const id of ADAPTER_IDS) {
      expect(content, `契约文档应覆盖来源 ${id}`).toContain(id);
    }
  });

  it("来自不同 adapter 的 6 份 BenchmarkCollection 与 collect-all Plan 集合一并存在且不交叉", async () => {
    // 端到端：collect-all 输出同时包含 PlanCollection 集合，benchmark 6 来源不进入该集合
    const out: string[] = [];
    const err: string[] = [];
    const code = await runCli(["collect-all"], {
      stdout: (s) => out.push(s),
      stderr: (s) => err.push(s),
    });
    expect(code).toBe(0);
    const parsed = JSON.parse(out.join("")) as { collections: Record<string, PlanCollection> };
    // collect-all 不包含 benchmark 集合（benchmark 单独走 collect-benchmark）
    expect(parsed.collections).toBeDefined();
    expect(Object.keys(parsed.collections)).not.toContain("deepswe");
    // 各 Plan 集合不含 benchmark 顶层键
    for (const [id, collection] of Object.entries(parsed.collections)) {
      expect("records" in collection, `${id} (Plan) 不应有 benchmark records 顶层键`).toBe(false);
      expect("benchmark" in collection, `${id} (Plan) 不应有 benchmark 元数据顶层键`).toBe(false);
    }
  });
});