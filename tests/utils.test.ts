import { describe, it, expect, beforeEach } from "vitest";
import { cn } from "@/lib/utils";
import { getSessionId } from "@/lib/session";

describe("cn (class name merge)", () => {
  it("joins conditional classes", () => {
    expect(cn("a", false && "b", "c")).toBe("a c");
  });
  it("deduplicates conflicting tailwind classes (last wins)", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });
  it("returns empty string when no classes", () => {
    expect(cn()).toBe("");
  });
});

describe("getSessionId", () => {
  beforeEach(() => {
    localStorage.clear();
  });
  it("creates a stable id on first call and reuses it", () => {
    const id1 = getSessionId();
    const id2 = getSessionId();
    expect(id1).toBe(id2);
    expect(id1.length).toBeGreaterThan(0);
  });
  it("persists the id in localStorage", () => {
    const id = getSessionId();
    expect(localStorage.getItem("bmc_session_id")).toBe(id);
  });
  it("issues distinct ids after clearing storage", () => {
    const first = getSessionId();
    localStorage.clear();
    const second = getSessionId();
    expect(second).not.toBe(first);
  });
});
