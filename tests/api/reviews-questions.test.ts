import { describe, it, expect, beforeAll } from "vitest";
import { api, login, registerAndLogin, getSeededBusiness, type Session } from "./helpers";

let ownerSession: Session; // owns The Golden Spoon Bistro
let bistro: { id: string; slug: string };

beforeAll(async () => {
  ownerSession = await login("owner@demo.com");
  bistro = await getSeededBusiness("The Golden Spoon Bistro");
});

describe("review rules", () => {
  it("requires authentication", async () => {
    const res = await api("/api/reviews", {
      method: "POST",
      body: { businessId: bistro.id, rating: 5, comment: "Great food, will come again!" },
    });
    expect(res.status).toBe(401);
  });

  it("blocks owners from reviewing their own business", async () => {
    const res = await api("/api/reviews", {
      method: "POST",
      session: ownerSession,
      body: { businessId: bistro.id, rating: 5, comment: "We are simply the best restaurant." },
    });
    expect(res.status).toBe(403);
  });

  it("accepts a valid review once, rejects the duplicate", async () => {
    const { session } = await registerAndLogin();
    const body = { businessId: bistro.id, rating: 4, title: "Nice", comment: "Lovely dinner and friendly staff." };
    const first = await api("/api/reviews", { method: "POST", session, body });
    expect(first.status).toBe(201);
    const second = await api("/api/reviews", { method: "POST", session, body });
    expect(second.status).toBe(409);
  });

  it("rejects invalid rating and too-short comment", async () => {
    const { session } = await registerAndLogin();
    const badRating = await api("/api/reviews", {
      method: "POST",
      session,
      body: { businessId: bistro.id, rating: 9, comment: "A long enough comment here." },
    });
    expect(badRating.status).toBe(400);
    const shortComment = await api("/api/reviews", {
      method: "POST",
      session,
      body: { businessId: bistro.id, rating: 4, comment: "meh" },
    });
    expect(shortComment.status).toBe(400);
  });

  it("author can edit and delete own review; others cannot", async () => {
    const { session } = await registerAndLogin();
    const created = await api("/api/reviews", {
      method: "POST",
      session,
      body: { businessId: bistro.id, rating: 3, comment: "It was fine, nothing special." },
    });
    expect(created.status).toBe(201);
    const reviewId = created.json.id as string;

    const { session: stranger } = await registerAndLogin();
    const strangerEdit = await api(`/api/reviews/${reviewId}`, {
      method: "PUT",
      session: stranger,
      body: { rating: 1, comment: "Hijacked review content here." },
    });
    expect(strangerEdit.status).toBe(403);
    const strangerDelete = await api(`/api/reviews/${reviewId}`, { method: "DELETE", session: stranger });
    expect(strangerDelete.status).toBe(403);

    const edit = await api(`/api/reviews/${reviewId}`, {
      method: "PUT",
      session,
      body: { rating: 5, comment: "Upgraded my rating after a second visit!" },
    });
    expect(edit.status).toBe(200);
    expect(edit.json.rating).toBe(5);

    const del = await api(`/api/reviews/${reviewId}`, { method: "DELETE", session });
    expect(del.status).toBe(200);
  });
});

describe("question rules", () => {
  it("blocks owners from asking questions on their own business", async () => {
    const res = await api("/api/questions", {
      method: "POST",
      session: ownerSession,
      body: { businessId: bistro.id, question: "Are we open on Sundays?" },
    });
    expect(res.status).toBe(403);
  });

  it("accepts a customer question and only the owner can answer it", async () => {
    const { session } = await registerAndLogin();
    const created = await api("/api/questions", {
      method: "POST",
      session,
      body: { businessId: bistro.id, question: "Do you have outdoor seating?" },
    });
    expect(created.status).toBe(201);
    const questionId = created.json.id as string;

    const strangerAnswer = await api(`/api/questions/${questionId}/answer`, {
      method: "POST",
      session,
      body: { answer: "Yes we do (but I do not own this business)" },
    });
    expect(strangerAnswer.status).toBe(403);

    const ownerAnswer = await api(`/api/questions/${questionId}/answer`, {
      method: "POST",
      session: ownerSession,
      body: { answer: "Yes — our patio seats 20 in summer." },
    });
    expect(ownerAnswer.status).toBe(200);
    expect(ownerAnswer.json.answer).toContain("patio");
  });
});

describe("reports", () => {
  it("lets a signed-in user report a listing once", async () => {
    const { session } = await registerAndLogin();
    const first = await api("/api/reports", {
      method: "POST",
      session,
      body: { targetType: "BUSINESS", targetId: bistro.id, reason: "SPAM", details: "Test report" },
    });
    expect(first.status).toBe(201);
    const dup = await api("/api/reports", {
      method: "POST",
      session,
      body: { targetType: "BUSINESS", targetId: bistro.id, reason: "SPAM" },
    });
    expect(dup.status).toBe(409);
  });

  it("blocks non-admins from the admin report list", async () => {
    const { session } = await registerAndLogin();
    const res = await api("/api/admin/reports", { session });
    expect(res.status).toBe(403);
  });

  it("lets an admin list and resolve reports", async () => {
    const admin = await login("admin@demo.com");
    const list = await api("/api/admin/reports", { session: admin });
    expect(list.status).toBe(200);
    const reports = list.json as unknown as { id: string }[];
    expect(reports.length).toBeGreaterThan(0);
    const resolve = await api(`/api/admin/reports/${reports[0].id}`, {
      method: "PATCH",
      session: admin,
      body: { status: "DISMISSED" },
    });
    expect(resolve.status).toBe(200);
  });
});
