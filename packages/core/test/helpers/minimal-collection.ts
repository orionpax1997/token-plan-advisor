import type { PlanCollection } from "../../src/schema/plan.ts";

/**
 * 构造一份覆盖全部必选区块的最小合法文档。
 * 各用例在其上覆盖自己关心的切片，保证断言聚焦在单一行为上。
 */
export function minimalCollection(): PlanCollection {
  return {
    schema_version: "1",
    collection: {
      provider_id: "zai-glm-coding-plan",
      mode: "fixture",
      collected_at: "2026-09-07T09:00:00.000Z",
      tool_version: "0.1.0",
    },
    vendor: { vendor_id: "zhipu-ai", display_name: "Z.ai（智谱）" },
    regional_variant: {
      variant_id: "z-ai-international",
      operator_entity: {
        value: "JINGSHENG HENGXING TECHNOLOGY PTE.LTD",
        status: "verified",
        source_ids: ["legal-terms-of-use"],
      },
      jurisdiction: {
        value: "Singapore",
        status: "verified",
        source_ids: ["legal-terms-of-use"],
      },
    },
    payment: { methods: ["bank card", "PayPal"], notes: [] },
    quota_system: {
      quota_model: "credits_5h_weekly",
      unit: { value: "credits", status: "verified", source_ids: ["devpack-overview"] },
      formula: {
        value: {
          raw: "Model credit usage = (Input tokens × Input multiplier + Cached Input tokens × Cached Input multiplier + Output tokens × Output multiplier) / 10,000",
          divisor: 10000,
        },
        status: "verified",
        source_ids: ["devpack-overview"],
      },
      model_multipliers: [
        {
          model_code: "GLM-5.3",
          input: { value: 6.9, status: "verified", raw: "6.9", source_ids: ["devpack-overview"] },
          cached_input: { value: 1.7, status: "verified", raw: "1.7", source_ids: ["devpack-overview"] },
          output: { value: 24, status: "verified", raw: "24", source_ids: ["devpack-overview"] },
        },
      ],
      mcp_multipliers: [],
      off_peak_discount: { value: 0.5, status: "verified", source_ids: ["devpack-overview"] },
      peak_hours: { value: "Mon-Fri 14:00-18:00 (UTC+8)", status: "verified", source_ids: ["devpack-overview"] },
    },
    models: [
      {
        model_code: "GLM-5.3",
        release_date: { value: null, status: "unobtainable", source_ids: [] },
        deprecation_date: { value: null, status: "unobtainable", source_ids: [] },
        availability: [
          {
            plans: "all",
            state: "supported",
            routed_to: null,
            status: "verified",
            source_ids: ["devpack-overview"],
          },
        ],
      },
    ],
    plans: [
      {
        plan_id: "zai-glm-coding-lite",
        plan_name: "GLM Coding Plan Lite",
        plan_type: "coding-subscription",
        audience: "individual",
        price_list: [
          {
            amount: { value: 18, status: "verified", raw: "Starting at just 18 USD per month", source_ids: ["devpack-overview"] },
            currency: { value: "USD", status: "verified", source_ids: ["devpack-overview"] },
            billing_period: "monthly",
            price_type: "starting_at",
            effective_from: null,
            effective_until: null,
            status: "verified",
            source_ids: ["devpack-overview"],
          },
        ],
        quota: {
          quota_model: "credits_5h_weekly",
          windows: [
            {
              window_type: "5h_rolling",
              window_anchor: "from_consumption",
              amount: { value: 2000, status: "verified", source_ids: ["devpack-overview"] },
              unit: "credits",
              status: "verified",
              source_ids: ["devpack-overview"],
            },
          ],
        },
        rate_limits: { value: null, status: "unobtainable", failure_code: "LOGIN_REQUIRED", source_ids: [] },
        context_window_tokens: { value: null, status: "unobtainable", source_ids: [] },
        refund_policy: {
          value: "non-refundable after purchase",
          status: "verified",
          source_ids: ["devpack-usage-policy"],
        },
        cancellation_notice: {
          value: "at least 3 days before next billing date",
          status: "verified",
          source_ids: ["devpack-usage-policy"],
        },
        purchase_url: { value: "https://z.ai/subscribe", status: "verified", source_ids: ["devpack-quick-start"] },
        data_policy: {
          training_use: {
            value: { allowed: true },
            status: "verified",
            source_ids: ["legal-terms-of-use"],
          },
          processing_location: { value: "Singapore", status: "verified", source_ids: ["legal-privacy-policy"] },
          data_retention: { value: null, status: "unobtainable", source_ids: [] },
          zdr_offered: { value: null, status: "not_applicable", source_ids: [] },
        },
      },
    ],
    regional_availability: [
      {
        region_code: "CN",
        registration: { state: "unconfirmed", status: "unobtainable", source_ids: [] },
        payment: { state: "unconfirmed", status: "unobtainable", source_ids: [] },
        network_access: { state: "unconfirmed", status: "unobtainable", source_ids: [] },
        service_policy: {
          state: "officially_restricted",
          status: "verified",
          evidence_raw: "Iran, North Korea, Cuba, Crimea, Donetsk, or Zaporizhzhia",
          source_ids: ["legal-terms-of-use"],
        },
        feature_restrictions: { state: "unconfirmed", status: "unobtainable", source_ids: [] },
      },
    ],
    promotions: [],
    sources: [
      {
        source_id: "devpack-overview",
        url: "https://docs.z.ai/devpack/overview.md",
        source_kind: "docs_help",
        fetched_at: "2026-09-07T09:00:00.000Z",
        last_updated_at: null,
      },
    ],
    source_chains: [],
    unresolved_facts: [],
    ranking_gate: { eligible: true, missing_core_fields: [] },
  };
}
