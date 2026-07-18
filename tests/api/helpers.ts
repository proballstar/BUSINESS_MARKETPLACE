export const BASE_URL = "http://localhost:3100";

export interface Session {
  cookie: string;
}

/** Sign in via NextAuth credentials flow; returns the session cookie header value. */
export async function login(email: string, password = "password123"): Promise<Session> {
  const csrfRes = await fetch(`${BASE_URL}/api/auth/csrf`);
  const { csrfToken } = (await csrfRes.json()) as { csrfToken: string };
  const csrfCookie = csrfRes.headers
    .getSetCookie()
    .map((c) => c.split(";")[0])
    .join("; ");

  const res = await fetch(`${BASE_URL}/api/auth/callback/credentials`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      cookie: csrfCookie,
    },
    body: new URLSearchParams({ csrfToken, email, password, json: "true" }),
    redirect: "manual",
  });

  const sessionCookies = res.headers.getSetCookie().map((c) => c.split(";")[0]);
  const all = [...csrfCookie.split("; "), ...sessionCookies].join("; ");
  if (!sessionCookies.some((c) => c.includes("session-token"))) {
    throw new Error(`Login failed for ${email}`);
  }
  return { cookie: all };
}

let ipCounter = 0;
/** Unique client IP per call so per-IP rate limits don't couple unrelated tests. */
export function freshIp(): string {
  ipCounter += 1;
  return `10.1.${Math.floor(ipCounter / 250)}.${(ipCounter % 250) + 1}`;
}

export async function api(
  path: string,
  opts: {
    method?: string;
    body?: unknown;
    session?: Session;
    ip?: string;
  } = {}
) {
  const headers: Record<string, string> = {
    "x-forwarded-for": opts.ip || freshIp(),
  };
  if (opts.body !== undefined) headers["Content-Type"] = "application/json";
  if (opts.session) headers.cookie = opts.session.cookie;

  const res = await fetch(`${BASE_URL}${path}`, {
    method: opts.method || "GET",
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
  let json: unknown = null;
  try {
    json = await res.json();
  } catch {
    // no body
  }
  return { status: res.status, json: json as Record<string, unknown> & { error?: string } };
}

/** Register a brand-new user and sign them in. */
export async function registerAndLogin(role: "CUSTOMER" | "BUSINESS_OWNER" = "CUSTOMER") {
  const email = `test-${Date.now()}-${Math.floor(Math.random() * 1e6)}@test.example`;
  const res = await api("/api/auth/register", {
    method: "POST",
    body: { name: "Test User", email, password: "password123", role },
  });
  if (res.status !== 201) throw new Error(`register failed: ${JSON.stringify(res.json)}`);
  const session = await login(email);
  return { email, session };
}

/** Fetch a seeded business by slug via the public API list. */
export async function getSeededBusiness(name: string) {
  const res = await api("/api/businesses");
  const list = res.json as unknown as { id: string; name: string; slug: string }[];
  const biz = list.find((b) => b.name === name);
  if (!biz) throw new Error(`Seeded business not found: ${name}`);
  return biz;
}
