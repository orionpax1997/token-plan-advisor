import { join } from "node:path";
import { attachRankingGate } from "../schema/gate.ts";
import type { PlanCollectionPayload } from "../schema/plan.ts";
import {
  loadSnapshots,
  readToolVersion,
  resolvePackageRoot,
  type RawSnapshot,
  type SourceChainSpec,
  type SourceSpec,
} from "./_shared.ts";
import type { CollectOptions, DataProvider } from "./types.ts";

/** 家族归一化入口的统一签名（8 家一致，见各家族 normalize.ts）。 */
export type NormalizeFromSnapshots = (
  snapshots: RawSnapshot[],
  mode: "fixture" | "live",
  collectedAt: string,
  toolVersion: string,
) => PlanCollectionPayload;

/**
 * createSnapshotProvider 的规格：8 份 provider.ts 模板消重后的完整差异点清单。
 * 装配语义（包定位、toolVersion、时钟、快照装载、ranking gate 接线）由工厂固定，
 * 家族侧只声明「是什么」，不重复「怎么采」。
 */
export interface SnapshotProviderSpec {
  /** PlanCollection.collection.provider_id。 */
  providerId: string;
  /** fixture 快照目录名（相对包根的 fixtures/ 目录）。 */
  fixtureDir: string;
  /** 来源注册表（家族 sources.ts）。 */
  sources: readonly SourceSpec[];
  /**
   * 回退链（Source Chain）声明（家族 sources.ts）；无链家族传 []（合法规格值，如 zai）。
   * 与 normalize 层派生 source_chains 消费的是同一个 CHAINS 常量（同一 sources.ts 导出，同源无漂移）；
   * 在 normalize 签名收敛（候选 2，非目标）之前，工厂用做装配期 fail-fast：
   * 链引用的来源必须在 sources 注册表中；运行期的快照级缺失（来源加载失败）由
   * deriveSourceChains 容错并记录 attempts。
   */
  chains: readonly SourceChainSpec[];
  /** 家族归一化入口（抽取/归一化语义留在家族侧）。 */
  normalizeFromSnapshots: NormalizeFromSnapshots;
}

/**
 * 注册表工厂：装配一个「从官方来源快照归一化 PlanCollection」的 DataProvider。
 * 吸收原 8 份 provider.ts 的全部模板步骤——resolvePackageRoot 包定位、readToolVersion
 * 读取、collect 内时钟注入、loadSnapshots 快照装载与 attachRankingGate 出口接线。
 * fixture 与 live 两种模式共用同一条抽取/归一化路径，仅来源加载方式不同。
 */
export function createSnapshotProvider(spec: SnapshotProviderSpec): DataProvider {
  const sourceIds = new Set(spec.sources.map((s) => s.source_id));
  for (const chain of spec.chains) {
    for (const sourceId of chain.source_ids) {
      if (!sourceIds.has(sourceId)) {
        throw new Error(
          `provider ${spec.providerId} 的回退链 ${chain.chain_id} 引用了未注册来源 ${sourceId}`,
        );
      }
    }
  }

  const packageRoot = resolvePackageRoot(import.meta.url);
  const fixtureDir = join(packageRoot, "fixtures", spec.fixtureDir);
  const toolVersion = readToolVersion(import.meta.url);

  return {
    providerId: spec.providerId,
    async collect(options: CollectOptions) {
      const now = options.now ?? (() => new Date());
      const snapshots = await loadSnapshots(options, fixtureDir, [...spec.sources]);
      return attachRankingGate(
        spec.normalizeFromSnapshots(snapshots, options.mode, now().toISOString(), toolVersion),
      );
    },
  };
}
