import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { prisma } from "./prisma";

export interface SessionUser {
  id: string;
  role: string;
  email?: string | null;
  name?: string | null;
}

/** Returns the authenticated user or null. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await getServerSession(authOptions);
  const u = session?.user as (SessionUser & { id?: string }) | undefined;
  if (!u?.id) return null;
  return { id: u.id, role: u.role || "CUSTOMER", email: u.email, name: u.name };
}

/** Returns the user, or a 401 response to short-circuit with. */
export async function requireUser(): Promise<
  { user: SessionUser; response?: undefined } | { user?: undefined; response: NextResponse }
> {
  const user = await getSessionUser();
  if (!user) {
    return { response: NextResponse.json({ error: "Authentication required" }, { status: 401 }) };
  }
  return { user };
}

export function isAdmin(user: SessionUser) {
  return user.role === "ADMIN";
}

/**
 * Loads a business and verifies the user owns it (or is admin).
 * Returns { business } on success, { response } (403/404) on failure.
 */
export async function requireBusinessOwner(user: SessionUser, businessId: string) {
  const business = await prisma.business.findUnique({ where: { id: businessId } });
  if (!business) {
    return { response: NextResponse.json({ error: "Business not found" }, { status: 404 }) };
  }
  if (business.ownerId !== user.id && !isAdmin(user)) {
    return { response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { business };
}

export function tooManyRequests(retryAfterSeconds: number) {
  return NextResponse.json(
    { error: "Too many requests. Please try again later." },
    { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } }
  );
}
