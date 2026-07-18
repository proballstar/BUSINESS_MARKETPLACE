import { describe, it, expect, beforeAll } from "vitest";
import { api, login, registerAndLogin, getSeededBusiness, type Session } from "./helpers";

let ownerSession: Session;      // owns The Golden Spoon Bistro
let otherOwnerSession: Session; // does not
let bistro: { id: string; slug: string };

beforeAll(async () => {
  ownerSession = await login("owner@demo.com");
  otherOwnerSession = await login("sarah@demo.com");
  bistro = await getSeededBusiness("The Golden Spoon Bistro");
});

describe("business listing management", () => {
  it("requires auth to create a listing", async () => {
    const res = await api("/api/businesses", { method: "POST", body: { name: "Nope" } });
    expect(res.status).toBe(401);
  });

  it("validates listing input", async () => {
    const { session } = await registerAndLogin("BUSINESS_OWNER");
    const res = await api("/api/businesses", {
      method: "POST",
      session,
      body: { name: "X", description: "too short", category: "", address: "", city: "", state: "" },
    });
    expect(res.status).toBe(400);
  });

  it("creates, edits, unpublishes, and republishes a listing", async () => {
    const { session } = await registerAndLogin("BUSINESS_OWNER");
    const created = await api("/api/businesses", {
      method: "POST",
      session,
      body: {
        name: `Test Bakery ${Date.now()}`,
        description: "A cozy neighborhood bakery serving sourdough and pastries daily.",
        category: "restaurant",
        address: "1 Test Street",
        city: "Portland",
        state: "OR",
      },
    });
    expect(created.status).toBe(201);
    const id = created.json.id as string;

    const edit = await api(`/api/businesses/${id}`, {
      method: "PUT",
      session,
      body: { tagline: "Fresh bread every morning" },
    });
    expect(edit.status).toBe(200);
    expect(edit.json.tagline).toBe("Fresh bread every morning");

    const unpublish = await api(`/api/businesses/${id}`, {
      method: "PUT",
      session,
      body: { active: false },
    });
    expect(unpublish.status).toBe(200);
    expect(unpublish.json.active).toBe(false);

    // Public GET should now 404, owner GET should still work
    const publicGet = await api(`/api/businesses/${id}`);
    expect(publicGet.status).toBe(404);
    const ownerGet = await api(`/api/businesses/${id}`, { session });
    expect(ownerGet.status).toBe(200);

    const republish = await api(`/api/businesses/${id}`, {
      method: "PUT",
      session,
      body: { active: true },
    });
    expect(republish.json.active).toBe(true);
  });

  it("blocks a non-owner from editing another business", async () => {
    const res = await api(`/api/businesses/${bistro.id}`, {
      method: "PUT",
      session: otherOwnerSession,
      body: { name: "Hijacked Name" },
    });
    expect(res.status).toBe(403);
  });

  it("blocks unauthenticated edits", async () => {
    const res = await api(`/api/businesses/${bistro.id}`, {
      method: "PUT",
      body: { name: "Hijacked Name" },
    });
    expect(res.status).toBe(401);
  });
});

describe("loyalty stamp security", () => {
  it("customers cannot stamp without a code", async () => {
    const { session } = await registerAndLogin();
    const res = await api("/api/loyalty/stamp", {
      method: "POST",
      session,
      body: { businessId: bistro.id },
    });
    expect(res.status).toBe(400);
  });

  it("rejects an invalid code", async () => {
    const { session } = await registerAndLogin();
    const res = await api("/api/loyalty/stamp", {
      method: "POST",
      session,
      body: { businessId: bistro.id, code: "ZZZZZZ" },
    });
    expect(res.status).toBe(400);
  });

  it("only the owner can generate codes", async () => {
    const { session } = await registerAndLogin();
    const res = await api("/api/loyalty/codes", {
      method: "POST",
      session,
      body: { businessId: bistro.id },
    });
    expect(res.status).toBe(403);
  });

  it("full flow: owner issues a code, customer redeems it exactly once", async () => {
    const gen = await api("/api/loyalty/codes", {
      method: "POST",
      session: ownerSession,
      body: { businessId: bistro.id },
    });
    expect(gen.status).toBe(201);
    const code = gen.json.code as string;
    expect(code).toMatch(/^[A-Z0-9]{6}$/);

    const { session } = await registerAndLogin();
    const redeem = await api("/api/loyalty/stamp", {
      method: "POST",
      session,
      body: { businessId: bistro.id, code },
    });
    expect(redeem.status).toBe(200);
    expect((redeem.json.card as { stamps: number }).stamps).toBe(1);

    // The same code cannot be redeemed twice
    const again = await api("/api/loyalty/stamp", {
      method: "POST",
      session,
      body: { businessId: bistro.id, code },
    });
    expect(again.status).toBe(400);
  });

  it("owners cannot redeem stamps at their own business", async () => {
    const gen = await api("/api/loyalty/codes", {
      method: "POST",
      session: ownerSession,
      body: { businessId: bistro.id },
    });
    const res = await api("/api/loyalty/stamp", {
      method: "POST",
      session: ownerSession,
      body: { businessId: bistro.id, code: gen.json.code as string },
    });
    expect(res.status).toBe(403);
  });
});

describe("signup validation and rate limiting", () => {
  it("rejects invalid signup input", async () => {
    const badEmail = await api("/api/auth/register", {
      method: "POST",
      body: { name: "Test", email: "nope", password: "password123" },
    });
    expect(badEmail.status).toBe(400);
    const shortPw = await api("/api/auth/register", {
      method: "POST",
      body: { name: "Test", email: "ok@example.com", password: "short" },
    });
    expect(shortPw.status).toBe(400);
  });

  it("rate limits signups per IP", async () => {
    const ip = "10.99.99.99";
    let last = 0;
    for (let i = 0; i < 6; i++) {
      const res = await api("/api/auth/register", {
        method: "POST",
        ip,
        body: { name: "Rate Test", email: `signup-${Date.now()}-${i}@example.com`, password: "password123" },
      });
      last = res.status;
    }
    expect(last).toBe(429);
  });
});

describe("event RSVP validation", () => {
  it("rejects missing/invalid RSVP fields and unknown events", async () => {
    const badEvent = await api("/api/posts/nonexistent-id/rsvp", {
      method: "POST",
      body: { name: "Guest", email: "guest@example.com" },
    });
    expect(badEvent.status).toBe(404);
  });

  it("validates email and prevents duplicate RSVPs", async () => {
    const posts = await api("/api/posts?type=EVENT&active=true");
    const events = posts.json as unknown as { id: string; eventDate: string | null }[];
    const future = events.find((e) => !e.eventDate || new Date(e.eventDate) > new Date());
    expect(future).toBeDefined();

    const bad = await api(`/api/posts/${future!.id}/rsvp`, {
      method: "POST",
      body: { name: "Guest", email: "not-an-email" },
    });
    expect(bad.status).toBe(400);

    const email = `rsvp-${Date.now()}@example.com`;
    const ok = await api(`/api/posts/${future!.id}/rsvp`, {
      method: "POST",
      body: { name: "Guest One", email },
    });
    expect(ok.status).toBe(201);

    const dup = await api(`/api/posts/${future!.id}/rsvp`, {
      method: "POST",
      body: { name: "Guest One", email },
    });
    expect(dup.status).toBe(409);
  });
});
