import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { inquiryStatusSchema, parseBody } from "@/lib/validation";
import { requireUser, isAdmin } from "@/lib/api-auth";

// Owner/admin: update an inquiry's status (NEW → READ → REPLIED → ARCHIVED/CLOSED)
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireUser();
  if (auth.response) return auth.response;

  const inquiry = await prisma.inquiry.findUnique({
    where: { id: params.id },
    include: { business: { select: { ownerId: true } } },
  });
  if (!inquiry) return NextResponse.json({ error: "Inquiry not found" }, { status: 404 });
  if (inquiry.business.ownerId !== auth.user.id && !isAdmin(auth.user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const parsed = parseBody(inquiryStatusSchema, body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const updated = await prisma.inquiry.update({
    where: { id: params.id },
    data: {
      status: parsed.data.status,
      repliedAt: parsed.data.status === "REPLIED" && !inquiry.repliedAt ? new Date() : inquiry.repliedAt,
    },
  });
  return NextResponse.json(updated);
}
