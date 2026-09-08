import type { RawSnapshot } from "./_shared.ts";

/**
 * 各 Provider 家族 extract.ts 共用的正文读取与英文日期归一化工具。
 * 家族的 extractStatedDate 正则（页面语言/格式差异）保留在家族侧，
 * 仅月份表归一化器收敛为单一实现。
 */

/** 从快照集合中取单个来源正文（失败或缺失时为空串）。 */
export function bodyOf(snapshots: RawSnapshot[], sourceId: string): string {
  return snapshots.find((s) => s.source_id === sourceId)?.body ?? "";
}

/** 按链顺序尝试读取首个非空 body；该链所有候选均无内容时返回空串。 */
export function pickBodyByChain(
  snapshots: RawSnapshot[],
  chain: { source_ids: string[] },
): string {
  for (const id of chain.source_ids) {
    const body = bodyOf(snapshots, id);
    if (body.length > 0) return body;
  }
  return "";
}

/** "February 13, 2026" → "2026-02-13"；非英文月名或无日期形状返回 null。 */
export function normalizeEnglishDate(text: string): string | null {
  const m = text.match(/([A-Za-z]+) (\d{1,2}), (\d{4})/);
  if (!m) return null;
  const months: Record<string, string> = {
    January: "01", February: "02", March: "03", April: "04", May: "05", June: "06",
    July: "07", August: "08", September: "09", October: "10", November: "11", December: "12",
  };
  const month = months[m[1]!];
  if (!month) return null;
  return `${m[3]}-${month}-${m[2]!.padStart(2, "0")}`;
}
