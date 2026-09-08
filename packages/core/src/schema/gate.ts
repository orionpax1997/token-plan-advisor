// 运行时导入 PlanTypes 仅在 deriveRankingGate 函数体内使用（模块初始化期不触达），
// 与 plan.ts 对本模块的运行时依赖构成安全的延迟循环（ESM live bindings）。
import { PlanTypes } from "./plan.ts";
import type {
  CoreFieldGap,
  CoreFieldId,
  Plan,
  PlanCollection,
  PlanCollectionPayload,
  RankingGate,
} from "./plan.ts";

/**
 * 探索 01 §7.1「核心字段（缺失应阻止强排名）」的确定性派生：
 * 从采集文档内容逐项核对八项核心字段，缺失项输出机读缺口清单，
 * 供下游门控「不可进入后续强排名」——而非输出错误排名信号。
 *
 * 派生规则（与 docs/contracts/collect-output-v1.md 冻结契约一致）：
 * 1. price            —— 每个 Plan 至少一条「金额+币种」齐备的价格条目
 * 2. plan_identity    —— plans 非空且每个 Plan 的 plan_id / plan_name 非空
 * 3. billing_period   —— 每个 Plan 的 price_list 非空（条目级周期由 Schema 强制）
 * 4. quota_expression —— 每个 Plan 至少一条「原始表达(raw)或有效数值」的额度条目
 *                        （原始表达是可比性底线：数值未获取但有官方原文不算缺失）
 * 5. model_catalog    —— models 非空且每个模型至少一条与 Plan 的绑定关系
 * 6. regional_support —— regional_availability 非空且至少一个地区有官方明确维度（非 unconfirmed）
 * 7. privacy_data     —— 每个 Plan 的 data_policy 四项（训练用途/处理地/保留期/ZDR）至少一项可获取
 * 8. purchase_entry   —— 每个 Plan 的 purchase_url 非空
 */

const FIELD_LABEL: Record<CoreFieldId, string> = {
  price: "价格（含币种）",
  plan_identity: "Plan 标识与 Plan Type",
  billing_period: "计费周期",
  quota_expression: "额度原始表达",
  model_catalog: "模型清单（含与 Plan 的绑定关系）",
  regional_support: "地区支持",
  privacy_data: "隐私/数据处理",
  purchase_entry: "购买/订阅入口",
};

function gap(fieldId: CoreFieldId, reason: string): CoreFieldGap {
  return { field_id: fieldId, reason: `${FIELD_LABEL[fieldId]}缺失：${reason}` };
}

function joinIds(ids: string[]): string {
  return ids.join("、");
}

/**
 * 逐 Plan 判定的缺口收集：任一 Plan 不满足谓词，则该字段整体缺失，
 * reason 点名具体 plan_id（缺口清单的可追溯性所在）。
 */
function collectPlanGap(
  missing: CoreFieldGap[],
  fieldId: CoreFieldId,
  prefix: string,
  plans: Plan[],
  satisfied: (plan: Plan) => boolean,
): void {
  const lacking = plans.filter((p) => !satisfied(p));
  if (lacking.length > 0) {
    missing.push(gap(fieldId, `${prefix}：${joinIds(lacking.map((p) => p.plan_id))}`));
  }
}

export function deriveRankingGate(payload: PlanCollectionPayload): RankingGate {
  const missing: CoreFieldGap[] = [];
  const plans = payload.plans;

  // 2. plan_identity：plans 非空、标识非空，且每档的 Plan Type 都在受控词表内
  if (plans.length === 0) {
    missing.push(gap("plan_identity", "plans 为空，未采集到任何可购买的 Plan"));
  } else {
    const unnamed = plans.filter((p) => p.plan_id.length === 0 || p.plan_name.length === 0);
    if (unnamed.length > 0) {
      missing.push(gap("plan_identity", `以下 Plan 缺少 plan_id 或 plan_name：${joinIds(unnamed.map((p) => p.plan_id || "(空)"))}`));
    }
    const untyped = plans.filter((p) => !PlanTypes.includes(p.plan_type));
    if (untyped.length > 0) {
      missing.push(gap("plan_identity", `以下 Plan 的 plan_type 不在受控词表内：${joinIds(untyped.map((p) => p.plan_id))}`));
    }
  }

  // 1. price + 3. billing_period（逐 Plan 的价格表）
  collectPlanGap(missing, "price", "以下 Plan 的 price_list 中没有金额与币种齐备的价格条目", plans, (p) =>
    p.price_list.some((e) => e.amount.value !== null && e.currency.value !== null),
  );
  collectPlanGap(missing, "billing_period", "以下 Plan 的 price_list 为空，无计费周期可核对", plans, (p) => p.price_list.length > 0);

  // 4. quota_expression（逐 Plan 的额度窗口；原始表达是可比性底线：数值未获取但有官方原文不算缺失）
  collectPlanGap(
    missing,
    "quota_expression",
    "以下 Plan 的 quota.windows 中既无官方原始表达也无有效数值",
    plans,
    (p) => p.quota.windows.some((w) => (w.raw !== undefined && w.raw.length > 0) || w.amount.value !== null),
  );

  // 5. model_catalog（模型清单 + 与 Plan 的绑定关系）
  if (payload.models.length === 0) {
    missing.push(gap("model_catalog", "models 为空，官方来源未给出任何模型清单"));
  } else {
    const unbound = payload.models.filter((m) => m.availability.length === 0);
    if (unbound.length > 0) {
      missing.push(
        gap("model_catalog", `以下模型缺少与 Plan 的绑定关系（availability 为空）：${joinIds(unbound.map((m) => m.model_code))}`),
      );
    }
  }

  // 6. regional_support：门控只核对「存在官方地区结论」这一门槛；
  // 具体地区覆盖面与排除清单的完整性属下游分析职责，不在此判定
  const confirmedRegions = payload.regional_availability.filter((r) =>
    [r.registration, r.payment, r.network_access, r.service_policy, r.feature_restrictions].some(
      (d) => d.state !== "unconfirmed",
    ),
  );
  if (payload.regional_availability.length === 0) {
    missing.push(gap("regional_support", "regional_availability 为空，无任何地区结论"));
  } else if (confirmedRegions.length === 0) {
    missing.push(
      gap("regional_support", `所有地区（${joinIds(payload.regional_availability.map((r) => r.region_code))}）的五维结论均为 unconfirmed，无任何官方地区清单`),
    );
  }

  // 7. privacy_data（逐 Plan 的数据政策四项）
  collectPlanGap(
    missing,
    "privacy_data",
    "以下 Plan 的 data_policy 四项（训练用途/处理地/保留期/ZDR）全部不可获取",
    plans,
    (p) =>
      p.data_policy.training_use.value !== null ||
      p.data_policy.processing_location.value !== null ||
      p.data_policy.data_retention.value !== null ||
      p.data_policy.zdr_offered.value !== null,
  );

  // 8. purchase_entry（逐 Plan 的购买入口）
  collectPlanGap(missing, "purchase_entry", "以下 Plan 的 purchase_url 缺失", plans, (p) =>
    p.purchase_url.value !== null && p.purchase_url.value.length > 0,
  );

  return { eligible: missing.length === 0, missing_core_fields: missing };
}

/**
 * 归一化层的装配入口：为采集文档附上门控标记。
 * 各 Provider 的 collect 出口统一调用，保证门控标记永远从文档内容派生、
 * 与 validatePlanCollection 的「标记不可撒谎」核对天然一致。
 */
export function attachRankingGate(payload: PlanCollectionPayload): PlanCollection {
  return { ...payload, ranking_gate: deriveRankingGate(payload) };
}
