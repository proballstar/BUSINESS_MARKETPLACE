import { describe, it, expect, beforeAll } from "vitest";
import { api, login, freshIp, getSeededBusiness, type Session } from "./helpers";

let ownerSession: Session;      // owns The Golden Spoon Bistro
let otherOwnerSession: Session; // owns other businesses, NOT the bistro
let bistro: { id: string; slug: string };

beforeAll(async () => {
  ownerSession = await login("owner@demo.com");
  otherOwnerSession = await login("sarah@demo.com");
  bistro = await getSeededBusiness("The Golden Spoon Bistro");
});

describe("inquiry creation (public)", () => {
  it("accepts a valid inquiry and does not echo contact details", async () => {
    const res = await api("/api/inquiries", {
      method: "POST",
      body: {
        businessId: bistro.id,
        name: "Pat Doe",
        email: `pat-${Date.now()}@example.com`,
        message: "Do you take reservations for 6 people on Friday?",
      },
    });
    expect(res.status).toBe(201);
    expect(res.json).toHaveProperty("id");
    expect(res.json).not.toHaveProperty("email");
    expect(res.json).not.toHaveProperty("message");
  });

  it("rejects an invalid email", async () => {
    const res = await api("/api/inquiries", {
      method: "POST",
      body: { businessId: bistro.id, name: "Pat Doe", email: "not-an-email", message: "Hello there, question." },
    });
    expect(res.status).toBe(400);
  });

  it("rejects a too-short message", async () => {
    const res = await api("/api/inquiries", {
      method: "POST",
      body: { businessId: bistro.id, name: "Pat Doe", email: "pat@example.com", message: "hi" },
    });
    expect(res.status).toBe(400);
  });

  it("blocks duplicate inquiries from the same email within 10 minutes", async () => {
    const email = `dup-${Date.now()}@example.com`;
    const body = { businessId: bistro.id, name: "Dup Tester", email, message: "First message, long enough." };
    const first = await api("/api/inquiries", { method: "POST", body });
    expect(first.status).toBe(201);
    const second = await api("/api/inquiries", { method: "POST", body });
    expect(second.status).toBe(429);
  });

  it("rate limits by IP after 5 submissions", async () => {
    const ip = freshIp();
    let lastStatus = 0;
    for (let i = 0; i < 6; i++) {
      const res = await api("/api/inquiries", {
        method: "POST",
        ip,
        body: {
          businessId: bistro.id,
          name: "Rate Tester",
          email: `rate-${Date.now()}-${i}@example.com`,
          message: "A perfectly reasonable question about hours.",
        },
      });
      lastStatus = res.status;
    }
    expect(lastStatus).toBe(429);
  });
});

describe("inquiry retrieval (private)", () => {
  it("rejects unauthenticated access", async () => {
    const res = await api(`/api/inquiries?businessId=${bistro.id}`);
    expect(res.status).toBe(401);
  });

  it("rejects a different business owner", async () => {
    const res = await api(`/api/inquiries?businessId=${bistro.id}`, { session: otherOwnerSession });
    expect(res.status).toBe(403);
  });

  it("allows the owning business owner and returns leads", async () => {
    const res = await api(`/api/inquiries?businessId=${bistro.id}`, { session: ownerSession });
    expect(res.status).toBe(200);
    const list = res.json as unknown as { email: string; status: string }[];
    expect(list.length).toBeGreaterThan(0);
    expect(list[0]).toHaveProperty("email");
    expect(list[0]).toHaveProperty("status");
  });
});

describe("inquiry lead management", () => {
  it("owner can walk an inquiry through the status flow; others cannot", async () => {
    const listRes = await api(`/api/inquiries?businessId=${bistro.id}`, { session: ownerSession });
    const inquiry = (listRes.json as unknown as { id: string }[])[0];

    const forbidden = await api(`/api/inquiries/${inquiry.id}`, {
      method: "PATCH",
      session: otherOwnerSession,
      body: { status: "READ" },
    });
    expect(forbidden.status).toBe(403);

    for (const status of ["READ", "REPLIED", "ARCHIVED", "CLOSED"]) {
      const res = await api(`/api/inquiries/${inquiry.id}`, {
        method: "PATCH",
        session: ownerSession,
        body: { status },
      });
      expect(res.status).toBe(200);
      expect(res.json.status).toBe(status);
    }

    const bad = await api(`/api/inquiries/${inquiry.id}`, {
      method: "PATCH",
      session: ownerSession,
      body: { status: "NONSENSE" },
    });
    expect(bad.status).toBe(400);
  });
});
