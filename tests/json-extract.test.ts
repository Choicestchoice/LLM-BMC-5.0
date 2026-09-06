import { describe, it, expect } from "vitest";
import { extractJson } from "@/lib/json-extract";

describe("extractJson", () => {
  it("parses a bare JSON object", () => {
    expect(extractJson('{"a":1}')).toEqual({ a: 1 });
  });
  it("strips leading and trailing prose", () => {
    expect(extractJson('Sure! {"a":2} done.')).toEqual({ a: 2 });
  });
  it("unwraps a ```json fenced block", () => {
    expect(extractJson('```json\n{"a":3}\n```')).toEqual({ a: 3 });
  });
  it("unwraps a plain ``` fenced block", () => {
    expect(extractJson('```\n{"a":4}\n```')).toEqual({ a: 4 });
  });
  it("falls back to arrays when no object is present", () => {
    expect(extractJson("prefix [1,2,3] suffix")).toEqual([1, 2, 3]);
  });
  it("throws when there is no JSON at all", () => {
    expect(() => extractJson("no json here")).toThrow();
  });
  it("throws on malformed JSON", () => {
    expect(() => extractJson("{not: 'json'}")).toThrow();
  });
});
