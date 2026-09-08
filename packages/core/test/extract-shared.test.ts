import { describe, expect, it } from "vitest";
import { bodyOf, normalizeEnglishDate, pickBodyByChain } from "../src/providers/extract-shared.ts";
import type { RawSnapshot } from "../src/providers/_shared.ts";

function snapshot(sourceId: string, body: string): RawSnapshot {
  return {
    source_id: sourceId,
    url: `https://example.com/${sourceId}`,
    kind: "docs_help",
    body,
    fetched_at: "2026-09-01T00:00:00.000Z",
    http_status: 200,
  };
}

describe("bodyOf", () => {
  it("命中来源返回正文", () => {
    const snapshots = [snapshot("a", "alpha"), snapshot("b", "beta")];
    expect(bodyOf(snapshots, "b")).toBe("beta");
  });

  it("来源缺失返回空串（不抛错）", () => {
    expect(bodyOf([snapshot("a", "alpha")], "missing")).toBe("");
  });
});

describe("pickBodyByChain", () => {
  it("按链顺序取首个非空 body", () => {
    const snapshots = [snapshot("a", ""), snapshot("b", "beta"), snapshot("c", "gamma")];
    expect(pickBodyByChain(snapshots, { source_ids: ["a", "b", "c"] })).toBe("beta");
  });

  it("整链无内容返回空串", () => {
    const snapshots = [snapshot("a", "")];
    expect(pickBodyByChain(snapshots, { source_ids: ["a", "ghost"] })).toBe("");
  });
});

describe("normalizeEnglishDate（月份表归一化器，5 份家族副本收敛）", () => {
  it("英文月名 → YYYY-MM-DD", () => {
    expect(normalizeEnglishDate("August 31, 2026")).toBe("2026-08-31");
    expect(normalizeEnglishDate("February 13, 2026")).toBe("2026-02-13");
  });

  it("个位日期补零", () => {
    expect(normalizeEnglishDate("June 7, 2025")).toBe("2026-06-07".replace("2026", "2025"));
  });

  it("非英文月名（大小写不合/未知词）返回 null", () => {
    expect(normalizeEnglishDate("august 31, 2026")).toBeNull();
    expect(normalizeEnglishDate("Foo 31, 2026")).toBeNull();
  });

  it("无日期形状返回 null", () => {
    expect(normalizeEnglishDate("no date here")).toBeNull();
  });
});
