import { beforeAll, describe, expect, it } from "vitest";
import { createDesignArenaCodeAdapter } from "../src/adapters/design-arena-code/adapter.ts";
import { validateBenchmarkCollection, type BenchmarkCollection } from "../src/schema/benchmark.ts";

const CAPTURED_AT = "2026-09-08T06:27:00.000Z"; // fixture manifest captured_at
const COLLECTED_AT = "2026-09-08T08:00:00.000Z"; // 注入时钟
const LEADERBOARD_CAPTURED_AT = "2026-09-08T06:27:00Z"; // 接口 captured_at
const REGISTRY_TOTAL = 496;
const LEADERBOARD_COVERED = 164;
const MIN_BATTLES_METHODOLOGY = 15;
const MIN_BATTLES_ABOUT_MAIN = 50;
const MIN_BATTLES_ABOUT_RELIABILITY = 200;

let collection: BenchmarkCollection;

beforeAll(async () => {
  const adapter = createDesignArenaCodeAdapter();
  const result = await adapter.collect({ now: () => new Date(COLLECTED_AT) });
  const validation = validateBenchmarkCollection(result);
  if (!validation.ok) {
    throw new Error(`fixture 采集结果未通过 Benchmark Schema 校验:\n${validation.issues.join("\n")}`);
  }
  collection = validation.value;
});

/** 取某模型某指标的记录。 */
function scoreRecord(modelId: string, slug: string): BenchmarkCollection["records"][number] {
  const r = collection.records.find((r) => r.record_id === `design-arena-code:leaderboard:${modelId}:${slug}`);
  if (!r) throw new Error(`缺少记录：modelId=${modelId} slug=${slug}`);
  return r;
}

describe("Design Arena Code Adapter（fixture 快照导入）", () => {
  it("采集信封：adapter 标识、fixture 模式、采集/发布/快照三时间戳与官方接口覆盖数", () => {
    expect(collection.schema_version).toBe("1");
    expect(collection.collection.adapter_id).toBe("design-arena-code");
    expect(collection.collection.mode).toBe("fixture");
    expect(collection.collection.collected_at).toBe(COLLECTED_AT);
    expect(collection.benchmark.benchmark_id).toBe("design-arena-code");
    // benchmark_version = leaderboard 接口 captured_at（精确时刻）
    expect(collection.benchmark.benchmark_version).toBe(LEADERBOARD_CAPTURED_AT);
    expect(collection.benchmark.maintainer).toBe("Arcada Labs Incorporated（Design Arena）");
    expect(collection.benchmark.source_url).toBe("https://www.designarena.ai/leaderboard/code");
    expect(collection.benchmark.artifact_generated_at).toBeNull();
    // 快照时间 = fixture manifest captured_at
    const leaderboard = collection.sources.find((s) => s.source_id === "design-arena-code-leaderboard");
    expect(leaderboard?.fetched_at).toBe(CAPTURED_AT);
    expect(leaderboard?.last_updated_at).toBe(LEADERBOARD_CAPTURED_AT);
  });

  it("官方 registry 总数（496）≠ 榜单覆盖数（164）：两个口径同时保留，不静默取一", () => {
    const revision = collection.benchmark.leaderboard_or_dataset_revision ?? "";
    expect(revision).toContain(`registry_total=${REGISTRY_TOTAL}`);
    expect(revision).toContain(`leaderboard_covered=${LEADERBOARD_COVERED}`);
    expect(revision).toContain("category=allcategories");
    expect(revision).toContain("active_sampling=true");
    expect(revision).toContain("single_turn_single_file_html=true");
    expect(revision).toContain("no_agent_loop=true");
    expect(collection.task_set.description).toContain(`${REGISTRY_TOTAL}`);
    expect(collection.task_set.description).toContain(`${LEADERBOARD_COVERED}`);
    expect(collection.task_set.description).toContain("registry 总数");
    // Unresolved Fact 覆盖该不一致
    const facts = collection.unresolved_facts.map((f) => f.fact).join("\n");
    expect(facts).toContain("registry");
    expect(facts).toContain("榜单覆盖数");
    // license notes 强调双口径
    const notes = collection.benchmark.license_and_access_notes.join("\n");
    expect(notes).toContain("comparability_scope");
  });

  it("每条记录 evidence_level=A / comparability_class=reference_only / allowed_use=explanation", () => {
    for (const r of collection.records) {
      expect(r.evidence_level).toBe("A");
      expect(r.comparability_class).toBe("reference_only");
      expect(r.allowed_use).toBe("explanation");
    }
  });

  it("10 个 leaderboard 行 × 4 条记录（elo / win_rate / battles / avg_generation_time_ms）= 40 条", () => {
    expect(collection.records).toHaveLength(40);
    const models = new Set(collection.records.map((r) => r.subject_identity.model_display_name));
    expect(models.size).toBe(10);
  });

  it("Elo/win_rate/battles 映射为 frontend_visual_preference；metric_space 携带 benchmark_version", () => {
    const elo = scoreRecord("gpt-6-astra", "elo");
    expect(elo.capability).toEqual(["frontend_visual_preference"]);
    expect(elo.raw_metric.metric_name).toBe("elo");
    expect(elo.raw_metric.metric_value).toBe(1487);
    expect(elo.raw_metric.metric_unit).toBe("elo_score");
    expect(elo.raw_metric.metric_direction).toBe("higher_is_better");
    // metric_space = 设计 arena-code:<benchmark_version>:<metric>
    expect(elo.normalized_metric?.metric_space).toBe(`design-arena-code:${LEADERBOARD_CAPTURED_AT}:elo`);
    expect(elo.normalization_method).toContain("Bradley-Terry");
    expect(elo.normalization_method).toContain("btStdErr=null");
    // btStdErr 当前接口为 null → 不构造伪 CI
    expect(elo.raw_metric.confidence_interval_or_error.value).toBeNull();
    expect(elo.confidence_status).toBe("point_estimate_only");

    const winRate = scoreRecord("gpt-6-astra", "win_rate");
    expect(winRate.capability).toEqual(["frontend_visual_preference"]);
    expect(winRate.raw_metric.metric_value).toBeCloseTo(0.5785, 4);
    expect(winRate.raw_metric.metric_unit).toBe("ratio");
    expect(winRate.normalized_metric?.metric_space).toBe(`design-arena-code:${LEADERBOARD_CAPTURED_AT}:win_rate`);
    expect(winRate.normalization_method).toContain("wins / battles");

    const battles = scoreRecord("gpt-6-astra", "battles");
    expect(battles.capability).toEqual(["frontend_visual_preference"]);
    expect(battles.raw_metric.metric_value).toBe(14536);
    expect(battles.raw_metric.metric_unit).toBe("count");
    expect(battles.normalized_metric?.metric_space).toBe(`design-arena-code:${LEADERBOARD_CAPTURED_AT}:battles`);
    expect(battles.normalization_method).toContain("sample size");
    expect(battles.normalization_method).toContain(String(MIN_BATTLES_METHODOLOGY));
  });

  it("avg_generation_time_ms 归入 benchmark_resource_usage 描述性，不与 Plan 延迟/SLA 混算", () => {
    const gen = scoreRecord("gpt-6-astra", "avg_generation_time_ms");
    expect(gen.capability).toEqual(["benchmark_resource_usage"]);
    expect(gen.raw_metric.metric_name).toBe("avg_generation_time_ms");
    expect(gen.raw_metric.metric_value).toBe(18400);
    expect(gen.raw_metric.metric_unit).toBe("ms");
    expect(gen.raw_metric.metric_direction).toBe("descriptive_only");
    expect(gen.normalized_metric).toBeNull();
    expect(gen.normalization_method).toContain("none");
    expect(gen.normalization_method).toContain("不与 Plan 延迟");
    expect(gen.prohibited_inferences.join("\n")).toContain("Plan 延迟");
    expect(gen.prohibited_inferences.join("\n")).toContain("SLA");
  });

  it("battles 门槛（方法页 15 / About 页 50+200）写入 conditions 与 revision，分层比较不可强行归一", () => {
    const revision = collection.benchmark.leaderboard_or_dataset_revision ?? "";
    expect(revision).toContain(`min_battles_methodology=${MIN_BATTLES_METHODOLOGY}`);
    expect(revision).toContain(`min_battles_about_main=${MIN_BATTLES_ABOUT_MAIN}`);
    expect(revision).toContain(`min_battles_about_reliability=${MIN_BATTLES_ABOUT_RELIABILITY}`);
    const r = scoreRecord("gpt-6-astra", "battles");
    // repeat_count 直接使用官方 battles 字段，status verified
    expect(r.conditions.repeat_count.value).toBe(14536);
    expect(r.conditions.repeat_count.status).toBe("verified");
    // note 同时声明方法页与 About 页门槛
    expect(r.conditions.repeat_count.note).toContain(String(MIN_BATTLES_METHODOLOGY));
    expect(r.conditions.repeat_count.note).toContain(String(MIN_BATTLES_ABOUT_MAIN));
    expect(r.conditions.repeat_count.note).toContain(String(MIN_BATTLES_ABOUT_RELIABILITY));
    // normalization_method 强制下游按门槛分层比较
    expect(r.normalization_method).toContain("分层比较");
    // prohibited_inferences 显式禁止跨门槛直接比较
    expect(r.prohibited_inferences.join("\n")).toContain("跨不同 battles 门槛");
    // Unresolved Fact 显式记录门槛差异
    const facts = collection.unresolved_facts.map((f) => f.fact).join("\n");
    expect(facts).toContain("battles 门槛");
    expect(facts).toContain("15");
    expect(facts).toContain("50");
    expect(facts).toContain("200");
  });

  it("active sampling 与 single_turn_single_file_html 进入 conditions，禁止把页面解释为多轮/agent benchmark", () => {
    const r = scoreRecord("gpt-6-astra", "elo");
    expect(r.conditions.prompt_policy).toContain("真实用户 prompt");
    expect(r.conditions.prompt_policy).toContain("prompt enhancement");
    expect(r.conditions.tool_environment).toContain("单轮");
    expect(r.conditions.tool_environment).toContain("agent loop");
    expect(r.conditions.tool_environment).toContain("tool calls");
    expect(r.conditions.tool_environment).toContain("sandboxed iframe");
    // active sampling 动态性必须进入 conditions（per-record 自足）
    expect(r.conditions.tool_environment).toContain("active sampling");
    expect(r.conditions.tool_environment).toContain("采样动态性");
    // success_definition 显式说明 pairwise preference + active sampling
    expect(r.conditions.success_definition).toContain("pairwise");
    expect(r.conditions.success_definition).toContain("active sampling");
    expect(r.conditions.success_definition).toContain("Bradley-Terry");
    // vendor = null + unobtainable（Design Arena 不公开 vendor 字段）
    expect(r.subject_identity.vendor.value).toBeNull();
    expect(r.subject_identity.vendor.status).toBe("unobtainable");
    // prohibited_inferences 覆盖：编码正确性 / agent loop / 工具调用 / 后端
    const text = r.prohibited_inferences.join("\n");
    expect(text).toContain("agent loop");
    expect(text).toContain("tool calls");
    expect(text).toContain("编译");
    expect(text).toContain("可维护性");
    expect(text).toContain("后端");
  });

  it("subject_identity：vendor/API id/snapshot/reasoning effort 显式 null + unobtainable/not_applicable", () => {
    const r = scoreRecord("gpt-6-astra", "elo");
    expect(r.subject_identity.subject_kind).toBe("model_configuration");
    expect(r.subject_identity.model_display_name).toBe("gpt-6-astra");
    expect(r.subject_identity.model_api_id_or_snapshot.value).toBeNull();
    expect(r.subject_identity.model_api_id_or_snapshot.status).toBe("unobtainable");
    expect(r.subject_identity.vendor.status).toBe("unobtainable");
    expect(r.subject_identity.reasoning_effort_or_configuration.status).toBe("not_applicable");
  });

  it("适用范围张力（API 商业使用 vs Terms 限制）+ 无保证 + 授权申请为待办写入 license_and_access_notes", () => {
    const notes = collection.benchmark.license_and_access_notes.join("\n");
    expect(notes).toContain("Arcada Labs Incorporated");
    expect(notes).toContain("署名和链接");
    expect(notes).toContain("API key");
    expect(notes).toContain("Terms");
    expect(notes).toContain("适用范围张力");
    expect(notes).toContain("不保证");
    expect(notes).toContain("reference_only");
    expect(notes).toContain("comparability_scope");
    expect(notes).toContain("待办");
  });

  it("prompt 字符上限不一致（方法页 5,000 / system prompt 10,000）写入 revision 与 conditions", () => {
    const revision = collection.benchmark.leaderboard_or_dataset_revision ?? "";
    expect(revision).toContain("prompt_char_limit_methodology");
    expect(revision).toContain("5,000 chars");
    expect(revision).toContain("prompt_char_limit_system_prompts");
    expect(revision).toContain("10,000 chars");
    const r = scoreRecord("gpt-6-astra", "elo");
    expect(r.conditions.prompt_policy).toContain("不一致");
    // Unresolved Fact 记录差异
    const facts = collection.unresolved_facts.map((f) => f.fact).join("\n");
    expect(facts).toContain("prompt 字符上限");
    expect(facts).toContain("5,000");
    expect(facts).toContain("10,000");
  });

  it("7 个来源全部登记：leaderboard + registry + methodology + about + system-prompts + terms + api-docs", () => {
    const ids = collection.sources.map((s) => s.source_id);
    expect(ids).toEqual([
      "design-arena-code-leaderboard",
      "design-arena-code-registry",
      "design-arena-code-methodology",
      "design-arena-code-about",
      "design-arena-code-system-prompts",
      "design-arena-code-terms",
      "design-arena-code-api-docs",
    ]);
    const byId = new Map(collection.sources.map((s) => [s.source_id, s]));
    expect(byId.get("design-arena-code-terms")?.kind).toBe("official_license");
    expect(byId.get("design-arena-code-registry")?.kind).toBe("task_set_artifact");
    expect(byId.get("design-arena-code-leaderboard")?.kind).toBe("leaderboard_artifact");
  });
});
