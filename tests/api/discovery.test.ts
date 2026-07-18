import { describe, it, expect } from "vitest";
import { api } from "./helpers";

describe("public business discovery", () => {
  it("lists active businesses publicly", async () => {
    const res = await api("/api/businesses");
    expect(res.status).toBe(200);
    const list = res.json as unknown as Record<string, unknown>[];
    expect(Array.isArray(list)).toBe(true);
    expect(list.length).toBeGreaterThanOrEqual(8);
    const first = list[0];
    expect(first).toHaveProperty("name");
    expect(first).toHaveProperty("slug");
    expect(first).toHaveProperty("city");
  });

  it("does not leak owner details in the public list", async () => {
    const res = await api("/api/businesses");
    const list = res.json as unknown as Record<string, unknown>[];
    for (const b of list) {
      expect(b).not.toHaveProperty("owner");
      expect(b).not.toHaveProperty("ownerId");
    }
  });

  it("requires auth to list businesses by ownerId", async () => {
    const res = await api("/api/businesses?ownerId=someone");
    expect(res.status).toBe(401);
  });
});
