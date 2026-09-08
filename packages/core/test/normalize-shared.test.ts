import { describe, expect, it } from "vitest";
import {
  buildSources,
  makeChainSrc,
  notApplicable,
  sortSourcesByRegistry,
  unobtainable,
  verified,
} from "../src/providers/normalize-shared.ts";
import type { FailureCode } from "../src/schema/plan.ts";
import type {
  ChainResolution,
  RawSnapshot,
  SourceChainSpec,
  SourceSpec,
} from "../src/providers/_shared.ts";

function snapshot(
  overrides: Omit<Partial<RawSnapshot>, "failure_code"> & {
    failure_code?: FailureCode | undefined;
  } = {},
): RawSnapshot {
  const { failure_code, ...rest } = overrides;
  return {
    source_id: "src-a",
    url: "https://example.com/a",
    kind: "docs_help",
    body: "body",
    fetched_at: "2026-09-01T00:00:00.000Z",
    http_status: 200,
    ...rest,
    ...(failure_code !== undefined ? { failure_code } : {}),
  };
}

describe("verified", () => {
  it("value + raw + source_ids，status=verified", () => {
    expect(verified(42, "42", ["src-a"])).toEqual({
      value: 42,
      status: "verified",
      raw: "42",
      source_ids: ["src-a"],
    });
  });

  it("raw 为 undefined 时 raw 键整体缺席", () => {
    const field = verified("x", undefined, ["src-a"]);
    expect(Object.keys(field)).not.toContain("raw");
    expect(field).toEqual({ value: "x", status: "verified", source_ids: ["src-a"] });
  });
});

describe("unobtainable（统一双参签名 failureCode?, note?）", () => {
  it("无参：value=null/status=unobtainable/空来源，无附加键", () => {
    const field = unobtainable();
    expect(field).toEqual({ value: null, status: "unobtainable", source_ids: [] });
    expect(Object.keys(field)).toHaveLength(3);
  });

  it("仅 failureCode：failure_code 存在、note 缺席", () => {
    const field = unobtainable("LOGIN_REQUIRED");
    expect(field).toEqual({ value: null, status: "unobtainable", source_ids: [], failure_code: "LOGIN_REQUIRED" });
    expect(Object.keys(field)).not.toContain("note");
  });

  it("仅 note（B 族占位形态 undefined, note）：failure_code 缺席", () => {
    const field = unobtainable<string>(undefined, "官方未给出");
    expect(field).toEqual({ value: null, status: "unobtainable", source_ids: [], note: "官方未给出" });
    expect(Object.keys(field)).not.toContain("failure_code");
  });

  it("双参齐备：两键都存在", () => {
    expect(unobtainable("GONE", "404")).toEqual({
      value: null,
      status: "unobtainable",
      source_ids: [],
      failure_code: "GONE",
      note: "404",
    });
  });
});

describe("notApplicable", () => {
  it("无参：status=not_applicable、value=null、空来源", () => {
    expect(notApplicable()).toEqual({ value: null, status: "not_applicable", source_ids: [] });
  });

  it("带 note", () => {
    expect(notApplicable("TRAE 无公开高峰时段")).toEqual({
      value: null,
      status: "not_applicable",
      source_ids: [],
      note: "TRAE 无公开高峰时段",
    });
  });
});

describe("makeChainSrc", () => {
  const chains: SourceChainSpec[] = [
    { chain_id: "c1", purpose: "p1", source_ids: ["src-a", "src-b"] },
    { chain_id: "c2", purpose: "p2", source_ids: ["src-c"] },
  ];
  const resolution: ChainResolution = new Map<string, string | null>([
    ["c1", "src-b"],
    ["c2", null],
  ]);

  it("链 chosen 来源存在时返回 [chosen]", () => {
    expect(makeChainSrc(resolution, chains)("c1")).toEqual(["src-b"]);
  });

  it("整链失败（chosen=null）时回退为候选数组", () => {
    expect(makeChainSrc(resolution, chains)("c2")).toEqual(["src-c"]);
  });

  it("未知链 id 返回空数组", () => {
    expect(makeChainSrc(resolution, chains)("nope")).toEqual([]);
  });
});

describe("sortSourcesByRegistry", () => {
  const registry: SourceSpec[] = [
    { source_id: "s1", url: "u1", file: "f1", kind: "docs_help", ok_code: "STALE_CONFLICT" },
    { source_id: "s2", url: "u2", file: "f2", kind: "pricing_page", ok_code: "RENDER_DEPENDENT" },
  ];

  it("按 registry 声明顺序就地排序", () => {
    const sources = [
      { source_id: "s2" },
      { source_id: "s1" },
    ] as never as Parameters<typeof sortSourcesByRegistry>[0];
    sortSourcesByRegistry(sources, registry);
    expect(sources.map((s) => s.source_id)).toEqual(["s1", "s2"]);
  });
});

describe("buildSources", () => {
  it("映射三时间戳字段，note 由策略函数产出，failure_code 条件展开", () => {
    const snapshots = [
      snapshot({ failure_code: "STALE_CONFLICT" }),
      snapshot({ source_id: "src-b", failure_code: undefined }),
    ];
    const sources = buildSources(
      snapshots,
      (s) => (s.source_id === "src-a" ? "2026-08-01" : null),
      (s, stated) => (stated === null ? `无时间:${s.source_id}` : `有:${stated}`),
    );
    expect(sources).toEqual([
      {
        source_id: "src-a",
        url: "https://example.com/a",
        source_kind: "docs_help",
        fetched_at: "2026-09-01T00:00:00.000Z",
        last_updated_at: "2026-08-01",
        last_updated_note: "有:2026-08-01",
        http_status: 200,
        failure_code: "STALE_CONFLICT",
      },
      {
        source_id: "src-b",
        url: "https://example.com/a",
        source_kind: "docs_help",
        fetched_at: "2026-09-01T00:00:00.000Z",
        last_updated_at: null,
        last_updated_note: "无时间:src-b",
        http_status: 200,
      },
    ]);
    expect(Object.keys(sources[1]!)).not.toContain("failure_code");
  });

  it("输出顺序跟随快照输入顺序（排序由 sortSourcesByRegistry 负责）", () => {
    const sources = buildSources(
      [snapshot({ source_id: "b" }), snapshot({ source_id: "a" })],
      () => null,
      () => "note",
    );
    expect(sources.map((s) => s.source_id)).toEqual(["b", "a"]);
  });
});
