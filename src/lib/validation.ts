import { z } from "zod";

// ── Shared field schemas ──
export const emailSchema = z.string().trim().toLowerCase().email("Invalid email address").max(254);
export const nameSchema = z.string().trim().min(2, "Name must be at least 2 characters").max(100)
  .regex(/\p{L}/u, "Name must contain letters")
  .regex(/^[\p{L}\p{M}\p{N}'. -]+$/u, "Name contains invalid characters");
export const phoneSchema = z.string().trim().max(25)
  .regex(/^[+()0-9 .-]{7,25}$/, "Invalid phone number")
  .optional().or(z.literal("").transform(() => undefined));
export const urlSchema = z.string().trim().url("Invalid URL").max(500)
  .refine((u) => u.startsWith("http://") || u.startsWith("https://"), "URL must start with http(s)://");
export const optionalUrl = urlSchema.optional().or(z.literal("").transform(() => undefined));

// ── Auth ──
export const registerSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
  role: z.enum(["CUSTOMER", "BUSINESS_OWNER"]).default("CUSTOMER"),
});

// ── Inquiries ──
export const inquirySchema = z.object({
  businessId: z.string().cuid(),
  name: nameSchema,
  email: emailSchema,
  phone: phoneSchema,
  subject: z.string().trim().max(120).optional().or(z.literal("").transform(() => undefined)),
  message: z.string().trim().min(10, "Message must be at least 10 characters").max(5000),
});

export const INQUIRY_STATUSES = ["NEW", "READ", "REPLIED", "ARCHIVED", "CLOSED"] as const;
export const inquiryStatusSchema = z.object({
  status: z.enum(INQUIRY_STATUSES),
});

// ── Reviews ──
export const reviewSchema = z.object({
  businessId: z.string().cuid(),
  rating: z.number().int().min(1).max(5),
  title: z.string().trim().max(120).optional().or(z.literal("").transform(() => undefined)),
  comment: z.string().trim().min(10, "Review must be at least 10 characters").max(5000),
});

export const reviewUpdateSchema = z.object({
  rating: z.number().int().min(1).max(5),
  title: z.string().trim().max(120).optional().or(z.literal("").transform(() => undefined)),
  comment: z.string().trim().min(10).max(5000),
});

// ── Questions ──
export const questionSchema = z.object({
  businessId: z.string().cuid(),
  question: z.string().trim().min(5, "Question is too short").max(500),
});
export const answerSchema = z.object({
  answer: z.string().trim().min(1).max(3000),
});

// ── Business listing ──
export const businessSchema = z.object({
  name: z.string().trim().min(2).max(120),
  tagline: z.string().trim().max(160).optional().or(z.literal("").transform(() => undefined)),
  description: z.string().trim().min(20, "Description must be at least 20 characters").max(10000),
  category: z.string().trim().min(2).max(40),
  subcategory: z.string().trim().max(80).optional().or(z.literal("").transform(() => undefined)),
  address: z.string().trim().min(3).max(200),
  city: z.string().trim().min(2).max(100),
  state: z.string().trim().min(2).max(50),
  zip: z.string().trim().max(20).optional().default(""),
  phone: phoneSchema,
  email: emailSchema.optional().or(z.literal("").transform(() => undefined)),
  website: optionalUrl,
  images: z.array(urlSchema).max(10).default([]),
  tags: z.array(z.string().trim().min(1).max(40)).max(15).default([]),
  teamJson: z.array(z.object({
    name: z.string().trim().min(1).max(100),
    role: z.string().trim().min(1).max(100),
    bio: z.string().trim().max(500).optional().default(""),
    imageUrl: z.string().trim().max(500).optional().default(""),
  })).max(20).default([]),
  hoursJson: z.record(z.string(), z.object({
    open: z.string().regex(/^\d{2}:\d{2}$/),
    close: z.string().regex(/^\d{2}:\d{2}$/),
    closed: z.boolean().optional(),
  })).default({}),
  socialLinks: z.record(z.string(), z.string().max(500)).default({}),
  priceRange: z.enum(["$", "$$", "$$$", "$$$$"]).optional().or(z.literal("").transform(() => undefined)),
  yearFounded: z.coerce.number().int().min(1800).max(new Date().getFullYear()).optional()
    .or(z.literal("").transform(() => undefined)),
  employeeCount: z.string().trim().max(20).optional().or(z.literal("").transform(() => undefined)),
  active: z.boolean().optional(),
});

// ── Posts (deals/events/updates) ──
export const postSchema = z.object({
  businessId: z.string().cuid(),
  type: z.enum(["UPDATE", "DEAL", "EVENT"]),
  title: z.string().trim().min(3).max(160),
  content: z.string().trim().min(10).max(5000),
  imageUrl: optionalUrl,
  discountText: z.string().trim().max(60).optional().or(z.literal("").transform(() => undefined)),
  discountCode: z.string().trim().max(30).optional().or(z.literal("").transform(() => undefined)),
  originalPrice: z.string().trim().max(20).optional().or(z.literal("").transform(() => undefined)),
  salePrice: z.string().trim().max(20).optional().or(z.literal("").transform(() => undefined)),
  eventDate: z.string().datetime({ local: true }).optional().or(z.string().max(30).optional()).or(z.literal("").transform(() => undefined)),
  eventEndDate: z.string().max(30).optional().or(z.literal("").transform(() => undefined)),
  eventLocation: z.string().trim().max(200).optional().or(z.literal("").transform(() => undefined)),
  capacity: z.coerce.number().int().min(1).max(10000).optional().or(z.literal("").transform(() => undefined)),
  rsvpUrl: optionalUrl,
  expiresAt: z.string().max(30).optional().or(z.literal("").transform(() => undefined)),
  pinned: z.boolean().optional().default(false),
});

// ── RSVP ──
export const rsvpSchema = z.object({
  name: nameSchema,
  email: emailSchema,
});

// ── Reports ──
export const REPORT_TARGETS = ["REVIEW", "BUSINESS"] as const;
export const REPORT_REASONS = ["SPAM", "INAPPROPRIATE", "FAKE", "HARASSMENT", "OTHER"] as const;
export const reportSchema = z.object({
  targetType: z.enum(REPORT_TARGETS),
  targetId: z.string().cuid(),
  reason: z.enum(REPORT_REASONS),
  details: z.string().trim().max(1000).optional().or(z.literal("").transform(() => undefined)),
});

// ── Loyalty ──
export const loyaltyConfigSchema = z.object({
  businessId: z.string().cuid(),
  rewardName: z.string().trim().min(2).max(120),
  stampsNeeded: z.coerce.number().int().min(3).max(50),
  description: z.string().trim().max(200).optional().or(z.literal("").transform(() => undefined)),
});
export const stampRedeemSchema = z.object({
  businessId: z.string().cuid(),
  code: z.string().trim().toUpperCase().regex(/^[A-Z0-9]{6}$/, "Invalid stamp code"),
});

/** Parse a request body against a schema; returns { ok: true, data } or { ok: false, error }. */
export function parseBody<T extends z.ZodTypeAny>(schema: T, body: unknown):
  { ok: true; data: z.infer<T>; error?: undefined } | { ok: false; data?: undefined; error: string } {
  const result = schema.safeParse(body);
  if (result.success) return { ok: true, data: result.data };
  const first = result.error.issues[0];
  const path = first.path.length ? `${first.path.join(".")}: ` : "";
  return { ok: false, error: `${path}${first.message}` };
}
