export interface BusinessWithStats {
  id: string;
  name: string;
  slug: string;
  tagline?: string | null;
  description: string;
  category: string;
  subcategory?: string | null;
  tags: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  images: string;
  logoUrl?: string | null;
  hoursJson: string;
  socialLinks: string;
  priceRange?: string | null;
  yearFounded?: number | null;
  employeeCount?: string | null;
  featured: boolean;
  verified: boolean;
  premium: boolean;
  active: boolean;
  rating: number;
  reviewCount: number;
  viewCount: number;
  inquiryCount: number;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
  owner?: { name: string | null; email: string };
  reviews?: ReviewWithUser[];
}

export interface ReviewWithUser {
  id: string;
  rating: number;
  title?: string | null;
  comment: string;
  ownerReply?: string | null;
  helpful: number;
  verified: boolean;
  businessId: string;
  userId: string;
  createdAt: Date;
  user: { name: string | null; image: string | null };
}

export interface InquiryFormData {
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
}

export type UserRole = "CUSTOMER" | "BUSINESS_OWNER" | "ADMIN";

declare module "next-auth" {
  interface User {
    role?: string;
  }
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: string;
  }
}
