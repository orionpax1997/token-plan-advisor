import { beforeAll, describe, expect, it } from "vitest";
import { createArtificialAnalysisIntelligenceAdapter } from "../src/adapters/artificial-analysis-intelligence/adapter.ts";
import { validateBenchmarkCollection, type BenchmarkCollection } from "../src/schema/benchmark.ts";

const CAPTURED_AT = "2026-09-08T06:33:00.000Z"; // fixture manifest captured_at
const COLLECTED_AT = "2026-09-08T08:00:00.000Z"; // 注入时钟
const BENCHMARK_VERSION = "v4.1.1"; // 完整版本号（含 patch；API 字段 4.1 不含 patch）

let collection: BenchmarkCollection;

beforeAll(async () => {
  const adapter = createArtificialAnalysisIntelligenceAdapter();
  const result = await adapter.collect({ now: () => new Date(COLLECTED_AT) });
  const validation = validateBenchmarkCollection(result);
  if (!validation.ok) {
    throw new Error(`fixture 采集结果未通过 Benchmark Schema 校验:\n${validation.issues.join("\n")}`);
  }
  collection = validation.value;
});

/** 取某组成评测的权重记录。 */
function componentRecord(slug: string): BenchmarkCollection["records"][number] {
  const r = collection.records.find(
    (r) => r.record_id === `artificial-analysis-intelligence:${BENCHMARK_VERSION}:${slug}:official_index_weight`,
  );
  if (!r) throw new Error(`缺少组成评测记录：${slug}`);
  return r;
}

describe("Artificial Analysis Intelligence v4.1.1 Adapter（fixture 快照导入）", () => {
  it("采集信封：adapter 标识、fixture 模式、完整版本号 v4.1.1、维护主体与三时间戳", () => {
    expect(collection.schema_version).toBe("1");
    expect(collection.collection.adapter_id).toBe("artificial-analysis-intelligence");
    expect(collection.collection.mode).toBe("fixture");
    expect(collection.collection.collected_at).toBe(COLLECTED_AT);
    expect(collection.benchmark.benchmark_id).toBe("artificial-analysis-intelligence");
    // 完整版本号含 patch；不得降级为 API 的 major.minor
    expect(collection.benchmark.benchmark_version).toBe(BENCHMARK_VERSION);
    expect(collection.benchmark.maintainer).toBe("Artificial Analysis, Inc.");
    expect(collection.benchmark.source_url).toBe("https://artificialanalysis.ai/#intelligence");
    // 页面无统一数据更新时间字段 → 显式 null
    expect(collection.benchmark.artifact_generated_at).toBeNull();
    const homepage = collection.sources.find((s) => s.source_id === "aa-homepage");
    expect(homepage?.fetched_at).toBe(CAPTURED_AT);
    expect(homepage?.last_updated_at).toBeNull();
  });

  it("5 条可映射组成评测的官方权重记录：Index 与组成评测独立保存，数值为官方百分数原值", () => {
    expect(collection.records).toHaveLength(5);
    const weights: Record<string, number> = {};
    for (const r of collection.records) {
      expect(r.raw_metric.metric_name).toBe("official_index_weight");
      expect(r.raw_metric.metric_direction).toBe("descriptive_only");
      expect(r.raw_metric.metric_unit).toBe("percent_of_composite_index");
      expect(r.subject_identity.subject_kind).toBe("benchmark_component");
      const slug = r.record_id.split(":")[2];
      if (slug) weights[slug] = r.raw_metric.metric_value ?? Number.NaN;
    }
    // 官方权重表原值（百分数）直存，不做换算（identity）
    expect(weights["gdpval-aa-v2"]).toBe(20);
    expect(weights["tau3-banking"]).toBe(14);
    expect(weights["terminal-bench-v2-1"]).toBe(16);
    expect(weights["scicode"]).toBe(8);
    expect(weights["aa-lcr"]).toBe(6);
    // 每个 slug 只有一条记录：Index 不拆成分数记录，组成评测不互相覆盖
    expect(new Set(collection.records.map((r) => r.record_id)).size).toBe(5);
  });

  it("组成评测映射到注册表能力标签（探索 02 Answer 注册表的 AA 行）", () => {
    expect(componentRecord("gdpval-aa-v2").capability).toEqual(["agent_tool_orchestration"]);
    expect(componentRecord("tau3-banking").capability).toEqual(["agent_tool_orchestration"]);
    expect(componentRecord("terminal-bench-v2-1").capability).toEqual([
      "terminal_agent_completion",
      "code_execution_correctness",
    ]);
    expect(componentRecord("scicode").capability).toEqual(["code_execution_correctness"]);
    expect(componentRecord("aa-lcr").capability).toEqual(["long_context_understanding"]);
  });

  it("完整版本号与官方权重随每条记录保存：record_id/metric_space 携带 v4.1.1，normalization_method 内嵌完整官方权重表", () => {
    for (const r of collection.records) {
      expect(r.record_id).toContain(`:${BENCHMARK_VERSION}:`);
      expect(r.normalized_metric?.metric_space).toBe(
        `artificial-analysis-intelligence:${BENCHMARK_VERSION}:official_index_weight`,
      );
      const method = r.normalization_method;
      // 完整版本 + 类别权重
      expect(method).toContain("v4.1.1");
      expect(method).toContain("Agents 34%");
      expect(method).toContain("Coding 24%");
      expect(method).toContain("Scientific Reasoning 24%");
      expect(method).toContain("General 18%");
      // Coding 内含 Terminal-Bench v2.1 16% 与 SciCode 8%
      expect(method).toContain("Terminal-Bench v2.1 16%");
      expect(method).toContain("SciCode 8%");
      // 重加权产物不得命名为 Artificial Analysis Index；不得拆成 Coding Plan 总分
      expect(method).toContain("禁止自行重新加权后仍称 Artificial Analysis Intelligence Index");
      expect(method).toContain("禁止把 Index 拆成");
      // 与 prohibited_inferences 双重声明
      const prohibitions = r.prohibited_inferences.join("\n");
      expect(prohibitions).toContain("重新加权");
      expect(prohibitions).toContain("Coding Plan 总分");
    }
  });

  it("保留各自 harness 与 judge 条件（Stirrup / τ³ 环境 / Terminus 2 / SciCode unit tests / GPT-5.6 Luna）", () => {
    const gdpval = componentRecord("gdpval-aa-v2");
    expect(gdpval.subject_identity.agent_or_harness).toContain("Stirrup");
    expect(gdpval.conditions.tool_environment).toContain("E2B");
    expect(gdpval.conditions.tool_environment).toContain("250 turns");
    expect(gdpval.conditions.success_definition).toContain("三模型 judge panel");
    expect(gdpval.conditions.success_definition).toContain("clamp((Elo - 500) / 2000)");

    const tau3 = componentRecord("tau3-banking");
    expect(tau3.conditions.tool_environment).toContain("BM25");
    expect(tau3.conditions.tool_environment).toContain("grep");
    expect(tau3.conditions.success_definition).toContain("后端数据库状态");
    expect(tau3.conditions.success_definition).toContain("GPT-5.4 Mini");

    const tb = componentRecord("terminal-bench-v2-1");
    expect(tb.subject_identity.agent_or_harness).toContain("Terminus 2");
    expect(tb.conditions.success_definition).toContain("verification suite");
    expect(tb.conditions.tool_environment).toContain("7,200");

    const scicode = componentRecord("scicode");
    expect(scicode.conditions.success_definition).toContain("unit tests");
    expect(scicode.conditions.prompt_policy).toContain("科学家标注");

    const lcr = componentRecord("aa-lcr");
    expect(lcr.conditions.success_definition).toContain("GPT-5.6 Luna");
    expect(lcr.conditions.context_limit_or_context_description.value).toContain("128K");
    expect(lcr.conditions.context_limit_or_context_description.status).toBe("verified");
  });

  it("官方重复次数逐评测保留（1/5/3/3/3），不把重复次数当 pass@k", () => {
    expect(componentRecord("gdpval-aa-v2").conditions.repeat_count.value).toBe(1);
    expect(componentRecord("tau3-banking").conditions.repeat_count.value).toBe(5);
    expect(componentRecord("terminal-bench-v2-1").conditions.repeat_count.value).toBe(3);
    expect(componentRecord("scicode").conditions.repeat_count.value).toBe(3);
    expect(componentRecord("aa-lcr").conditions.repeat_count.value).toBe(3);
    const prohibitions = componentRecord("tau3-banking").prohibited_inferences.join("\n");
    expect(prohibitions).toContain("重复次数");
  });

  it("benchmark_component 主体：模型专属字段显式 null + not_applicable，不伪装成模型配置记录", () => {
    const r = componentRecord("terminal-bench-v2-1");
    expect(r.subject_identity.model_api_id_or_snapshot.value).toBeNull();
    expect(r.subject_identity.model_api_id_or_snapshot.status).toBe("not_applicable");
    expect(r.subject_identity.vendor.value).toBeNull();
    expect(r.subject_identity.vendor.status).toBe("not_applicable");
    expect(r.subject_identity.reasoning_effort_or_configuration.status).toBe("not_applicable");
  });

  it("证据等级 A、allowed_use=explanation、reference_only：权重是结构元数据，不是可评分能力分数", () => {
    for (const r of collection.records) {
      expect(r.evidence_level).toBe("A");
      expect(r.allowed_use).toBe("explanation");
      expect(r.comparability_class).toBe("reference_only");
      expect(r.confidence_status).toBe("point_estimate_only");
      expect(r.raw_metric.confidence_interval_or_error.value).toBeNull();
      expect(r.prohibited_inferences.join("\n")).toContain("不得把本记录的官方权重值当作模型能力分数");
    }
  });

  it("9 个组成评测在 task_set.domains 全枚举（含无注册表标签的 4 项）：数值化官方权重 + judge/环境条件全透传", () => {
    const domains = collection.task_set.domains ?? [];
    expect(domains).toHaveLength(9);
    const names = domains.map((d) => d.domain);
    expect(names).toEqual([
      "GDPval-AA v2",
      "𝜏³-Banking",
      "Terminal-Bench v2.1",
      "SciCode",
      "AA-LCR",
      "AA-Omniscience",
      "Humanity's Last Exam",
      "GPQA Diamond",
      "CritPt",
    ]);
    // 官方加权方案可机读重建：9 项数值权重齐全且合计 = 100
    for (const d of domains) {
      expect(d.weight_percent).toBeTypeOf("number");
    }
    const weightSum = domains.reduce((s, d) => s + (d.weight_percent ?? 0), 0);
    expect(weightSum).toBe(100);
    // 无注册表标签的 4 项组成评测也逐项保存（含官方数值权重），不被静默丢弃
    const omniscience = domains.find((d) => d.domain === "AA-Omniscience");
    expect(omniscience?.n_tasks).toBe(6000);
    expect(omniscience?.weight_percent).toBe(12);
    expect(omniscience?.topics?.join(" ")).toContain("Accuracy 8%");
    expect(omniscience?.topics?.join(" ")).toContain("GPT-5.6 Luna");
    const hle = domains.find((d) => d.domain === "Humanity's Last Exam");
    expect(hle?.weight_percent).toBe(12);
    expect(hle?.topics?.join(" ")).toContain("GPT-5.6 Luna");
    const gpqa = domains.find((d) => d.domain === "GPQA Diamond");
    expect(gpqa?.weight_percent).toBe(6);
    expect(gpqa?.topics?.join(" ")).toContain("regex");
    const critpt = domains.find((d) => d.domain === "CritPt");
    expect(critpt?.weight_percent).toBe(6);
    expect(critpt?.topics?.join(" ")).toContain("官方 grading server");
    // 任务数合计 = 9,220（9 个独立任务集之和，非单一统一任务集）
    expect(domains.reduce((s, d) => s + d.n_tasks, 0)).toBe(collection.task_set.n_tasks);
    expect(collection.task_set.n_tasks).toBe(9220);
    expect(collection.task_set.description).toContain("不是单一统一任务集");
    expect(collection.task_set.languages).toEqual([]);
  });

  it("主页与详情页覆盖数差异作为快照差异记录：两个视图同时保存，不静默取一", () => {
    const revision = collection.benchmark.leaderboard_or_dataset_revision ?? "";
    expect(revision).toContain("29_of_624");
    expect(revision).toContain("30_of_612");
    expect(revision).toContain("homepage_intelligence_chart");
    expect(revision).toContain("index_detail_page");
    expect(revision).toContain("coverage_views_differ=snapshot_difference_not_merged");
    // 不当作数据错误：两视图数值都原样保留
    expect(revision).not.toMatch(/29_of_624.*30_of_612.*统一为/);
    const facts = collection.unresolved_facts.map((f) => f.fact).join("\n");
    expect(facts).toContain("29 of 624");
    expect(facts).toContain("30 of 612");
    expect(facts).toContain("筛选");
  });

  it("patch 级版本、逐模型组成分数、覆盖筛选规则缺失处显式 null 并进入 Unresolved Facts", () => {
    const facts = collection.unresolved_facts.map((f) => f.fact).join("\n");
    // API 版本字段只有 major.minor（4.1），不反映 patch
    expect(facts).toContain("4.1");
    expect(facts).toContain("patch");
    // 本批快照未含逐模型分数（API tier 未取得）
    expect(facts).toContain("逐模型");
    // 统一归一化公式未公开（仅 GDPval clamp 公式公开）
    expect(facts).toContain("归一化公式");
    // 记录级 null：API 版本差异写入 revision 字符串
    const revision = collection.benchmark.leaderboard_or_dataset_revision ?? "";
    expect(revision).toContain("api_intelligence_index_version=4.1");
  });

  it("条款限制写入 license_and_access_notes；授权申请记录为待办", () => {
    const notes = collection.benchmark.license_and_access_notes.join("\n");
    expect(notes).toContain("非商业");
    expect(notes).toContain("自动化查询");
    expect(notes).toContain("scrape");
    expect(notes).toContain("结构化转写");
    expect(notes).toContain("x-api-key");
    expect(notes).toContain("归因");
    expect(notes).toContain("Commercial");
    expect(notes).toContain("待办");
  });

  it("prohibited_inferences 覆盖 research §10 禁止推断：Plan 排名 / Coding 24% 不完整 / 覆盖数全集 / 版本拼接 / 模态外推", () => {
    const text = componentRecord("gdpval-aa-v2").prohibited_inferences.join("\n");
    expect(text).toContain("Coding Plan 排名");
    expect(text).toContain("24%");
    expect(text).toContain("29 of 624");
    expect(text).toContain("4.1");
    expect(text).toContain("English");
    expect(text).toContain("GDPval");
    // GDPval Elo 特殊规则：锚定人类专家、按加入时间冻结，不是静态绝对百分比
    const gdpvalExtra = componentRecord("gdpval-aa-v2").prohibited_inferences.join("\n");
    expect(gdpvalExtra).toContain("静态绝对百分比");
  });

  it("来源引用：6 个官方来源全部登记，kind 与 URL 对应 research/15-04", () => {
    const ids = collection.sources.map((s) => s.source_id);
    expect(ids).toEqual([
      "aa-homepage",
      "aa-methodology",
      "aa-methodology-landing",
      "aa-index-detail",
      "aa-api-docs",
      "aa-terms",
    ]);
    const byId = new Map(collection.sources.map((s) => [s.source_id, s]));
    expect(byId.get("aa-methodology")?.url).toBe(
      "https://artificialanalysis.ai/methodology/intelligence-benchmarking",
    );
    expect(byId.get("aa-terms")?.kind).toBe("official_license");
    expect(byId.get("aa-homepage")?.kind).toBe("official_docs");
  });
});
