CREATE TABLE IF NOT EXISTS "User" (
  "id" TEXT NOT NULL,
  "name" TEXT,
  "email" TEXT NOT NULL,
  "emailVerified" TIMESTAMP(3),
  "password" TEXT,
  "image" TEXT,
  "role" TEXT NOT NULL DEFAULT 'CUSTOMER',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");

CREATE TABLE IF NOT EXISTS "Account" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "providerAccountId" TEXT NOT NULL,
  "refresh_token" TEXT,
  "access_token" TEXT,
  "expires_at" INTEGER,
  "token_type" TEXT,
  "scope" TEXT,
  "id_token" TEXT,
  "session_state" TEXT,
  CONSTRAINT "Account_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");
CREATE INDEX IF NOT EXISTS "Account_userId_idx" ON "Account"("userId");

CREATE TABLE IF NOT EXISTS "Session" (
  "id" TEXT NOT NULL,
  "sessionToken" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "expires" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Session_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "Session_sessionToken_key" ON "Session"("sessionToken");
CREATE INDEX IF NOT EXISTS "Session_userId_idx" ON "Session"("userId");

CREATE TABLE IF NOT EXISTS "Business" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "tagline" TEXT,
  "description" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "subcategory" TEXT,
  "tags" TEXT NOT NULL DEFAULT '[]',
  "address" TEXT NOT NULL,
  "city" TEXT NOT NULL,
  "state" TEXT NOT NULL,
  "zip" TEXT NOT NULL,
  "country" TEXT NOT NULL DEFAULT 'US',
  "phone" TEXT,
  "email" TEXT,
  "website" TEXT,
  "images" TEXT NOT NULL DEFAULT '[]',
  "logoUrl" TEXT,
  "hoursJson" TEXT NOT NULL DEFAULT '{}',
  "socialLinks" TEXT NOT NULL DEFAULT '{}',
  "teamJson" TEXT NOT NULL DEFAULT '[]',
  "priceRange" TEXT,
  "yearFounded" INTEGER,
  "employeeCount" TEXT,
  "featured" BOOLEAN NOT NULL DEFAULT false,
  "verified" BOOLEAN NOT NULL DEFAULT false,
  "premium" BOOLEAN NOT NULL DEFAULT false,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "reviewCount" INTEGER NOT NULL DEFAULT 0,
  "viewCount" INTEGER NOT NULL DEFAULT 0,
  "inquiryCount" INTEGER NOT NULL DEFAULT 0,
  "ownerId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Business_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Business_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "Business_slug_key" ON "Business"("slug");
CREATE INDEX IF NOT EXISTS "Business_ownerId_idx" ON "Business"("ownerId");
CREATE INDEX IF NOT EXISTS "Business_active_category_city_idx" ON "Business"("active", "category", "city");

CREATE TABLE IF NOT EXISTS "BusinessPost" (
  "id" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "imageUrl" TEXT,
  "discountText" TEXT,
  "discountCode" TEXT,
  "originalPrice" TEXT,
  "salePrice" TEXT,
  "eventDate" TIMESTAMP(3),
  "eventEndDate" TIMESTAMP(3),
  "eventLocation" TEXT,
  "capacity" INTEGER,
  "rsvpCount" INTEGER NOT NULL DEFAULT 0,
  "rsvpUrl" TEXT,
  "expiresAt" TIMESTAMP(3),
  "active" BOOLEAN NOT NULL DEFAULT true,
  "pinned" BOOLEAN NOT NULL DEFAULT false,
  "businessId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BusinessPost_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "BusinessPost_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "BusinessPost_businessId_idx" ON "BusinessPost"("businessId");
CREATE INDEX IF NOT EXISTS "BusinessPost_type_active_eventDate_idx" ON "BusinessPost"("type", "active", "eventDate");

CREATE TABLE IF NOT EXISTS "PostRsvp" (
  "id" TEXT NOT NULL,
  "postId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PostRsvp_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PostRsvp_postId_fkey" FOREIGN KEY ("postId") REFERENCES "BusinessPost"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "PostRsvp_postId_email_key" ON "PostRsvp"("postId", "email");
CREATE INDEX IF NOT EXISTS "PostRsvp_postId_idx" ON "PostRsvp"("postId");

CREATE TABLE IF NOT EXISTS "Question" (
  "id" TEXT NOT NULL,
  "question" TEXT NOT NULL,
  "answer" TEXT,
  "answeredAt" TIMESTAMP(3),
  "helpful" INTEGER NOT NULL DEFAULT 0,
  "businessId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Question_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Question_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Question_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "Question_businessId_idx" ON "Question"("businessId");
CREATE INDEX IF NOT EXISTS "Question_userId_idx" ON "Question"("userId");

CREATE TABLE IF NOT EXISTS "LoyaltyConfig" (
  "id" TEXT NOT NULL,
  "businessId" TEXT NOT NULL,
  "rewardName" TEXT NOT NULL,
  "stampsNeeded" INTEGER NOT NULL DEFAULT 10,
  "description" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LoyaltyConfig_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "LoyaltyConfig_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "LoyaltyConfig_businessId_key" ON "LoyaltyConfig"("businessId");

CREATE TABLE IF NOT EXISTS "LoyaltyCard" (
  "id" TEXT NOT NULL,
  "businessId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "stamps" INTEGER NOT NULL DEFAULT 0,
  "totalEarned" INTEGER NOT NULL DEFAULT 0,
  "rewardsClaimed" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LoyaltyCard_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "LoyaltyCard_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "LoyaltyCard_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "LoyaltyCard_businessId_userId_key" ON "LoyaltyCard"("businessId", "userId");
CREATE INDEX IF NOT EXISTS "LoyaltyCard_userId_idx" ON "LoyaltyCard"("userId");

CREATE TABLE IF NOT EXISTS "Review" (
  "id" TEXT NOT NULL,
  "rating" INTEGER NOT NULL,
  "title" TEXT,
  "comment" TEXT NOT NULL,
  "ownerReply" TEXT,
  "helpful" INTEGER NOT NULL DEFAULT 0,
  "verified" BOOLEAN NOT NULL DEFAULT false,
  "businessId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Review_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Review_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "Review_businessId_idx" ON "Review"("businessId");
CREATE INDEX IF NOT EXISTS "Review_userId_idx" ON "Review"("userId");

CREATE TABLE IF NOT EXISTS "Inquiry" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "phone" TEXT,
  "subject" TEXT,
  "message" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'NEW',
  "repliedAt" TIMESTAMP(3),
  "businessId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Inquiry_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Inquiry_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "Inquiry_businessId_idx" ON "Inquiry"("businessId");
CREATE INDEX IF NOT EXISTS "Inquiry_status_idx" ON "Inquiry"("status");

CREATE TABLE IF NOT EXISTS "BusinessAnalytic" (
  "id" TEXT NOT NULL,
  "businessId" TEXT NOT NULL,
  "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "views" INTEGER NOT NULL DEFAULT 0,
  "clicks" INTEGER NOT NULL DEFAULT 0,
  "inquiries" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "BusinessAnalytic_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "BusinessAnalytic_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "BusinessAnalytic_businessId_date_idx" ON "BusinessAnalytic"("businessId", "date");
