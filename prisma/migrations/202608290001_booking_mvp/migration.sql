-- This MVP intentionally resets the previous emotion-pin domain data.
DROP TABLE IF EXISTS "Report" CASCADE;
DROP TABLE IF EXISTS "Resonance" CASCADE;
DROP TABLE IF EXISTS "ExperienceMedia" CASCADE;
DROP TABLE IF EXISTS "ExperienceEmotion" CASCADE;
DROP TABLE IF EXISTS "Experience" CASCADE;
DROP TYPE IF EXISTS "Activity";
DROP TYPE IF EXISTS "Visibility";
DROP TYPE IF EXISTS "ExperienceStatus";

ALTER TABLE "User" ADD COLUMN "isDemo" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "demoExpiresAt" TIMESTAMP(3);

DROP TYPE "Emotion";
CREATE TYPE "Emotion" AS ENUM ('CALM', 'REFRESH', 'EXCITEMENT', 'AWE', 'COMFORT', 'LIBERATION', 'FOCUS', 'ENERGY');
CREATE TYPE "PartnerStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE "SpaceStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'HIDDEN');
CREATE TYPE "ExperienceStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'HIDDEN');
CREATE TYPE "SlotStatus" AS ENUM ('OPEN', 'CLOSED', 'CANCELLED');
CREATE TYPE "BookingStatus" AS ENUM ('CONFIRMED', 'CANCELLED', 'CHECKED_IN');
CREATE TYPE "ReviewStatus" AS ENUM ('PUBLISHED', 'HIDDEN');

ALTER TABLE "Place" RENAME COLUMN "latitude" TO "lat";
ALTER TABLE "Place" RENAME COLUMN "longitude" TO "lng";
DELETE FROM "Place" WHERE "externalId" IS NULL;
ALTER TABLE "Place" ALTER COLUMN "externalId" SET NOT NULL;

CREATE TABLE "PartnerApplication" (
  "id" TEXT PRIMARY KEY, "userId" TEXT NOT NULL UNIQUE, "operatorName" VARCHAR(80) NOT NULL,
  "phone" VARCHAR(30) NOT NULL, "businessRegistrationNumber" VARCHAR(30) NOT NULL,
  "status" "PartnerStatus" NOT NULL DEFAULT 'PENDING', "reviewerId" TEXT, "reviewNote" VARCHAR(300),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "reviewedAt" TIMESTAMP(3), "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PartnerApplication_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
  CONSTRAINT "PartnerApplication_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE SET NULL
);

CREATE TABLE "Space" (
  "id" TEXT PRIMARY KEY, "ownerId" TEXT NOT NULL, "placeId" TEXT, "name" VARCHAR(120) NOT NULL,
  "description" VARCHAR(1000) NOT NULL, "typeCode" VARCHAR(30) NOT NULL, "address" VARCHAR(300) NOT NULL,
  "roadAddress" VARCHAR(300), "lat" DOUBLE PRECISION NOT NULL, "lng" DOUBLE PRECISION NOT NULL,
  "rules" VARCHAR(1000), "status" "SpaceStatus" NOT NULL DEFAULT 'PUBLISHED',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Space_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE,
  CONSTRAINT "Space_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "Place"("id") ON DELETE SET NULL
);

CREATE TABLE "SpaceMedia" (
  "id" TEXT PRIMARY KEY, "spaceId" TEXT NOT NULL, "key" TEXT NOT NULL UNIQUE, "mimeType" TEXT NOT NULL,
  "size" INTEGER NOT NULL, "width" INTEGER, "height" INTEGER, "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SpaceMedia_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "Space"("id") ON DELETE CASCADE
);

CREATE TABLE "Experience" (
  "id" TEXT PRIMARY KEY, "spaceId" TEXT NOT NULL, "title" VARCHAR(120) NOT NULL, "description" VARCHAR(1000) NOT NULL,
  "durationMinutes" INTEGER NOT NULL, "priceWon" INTEGER NOT NULL DEFAULT 0, "ambienceTags" TEXT[] NOT NULL,
  "status" "ExperienceStatus" NOT NULL DEFAULT 'PUBLISHED', "isDemoPublic" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Experience_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "Space"("id") ON DELETE CASCADE
);

CREATE TABLE "ExperienceEmotion" (
  "experienceId" TEXT NOT NULL, "emotion" "Emotion" NOT NULL, PRIMARY KEY ("experienceId", "emotion"),
  CONSTRAINT "ExperienceEmotion_experienceId_fkey" FOREIGN KEY ("experienceId") REFERENCES "Experience"("id") ON DELETE CASCADE
);

CREATE TABLE "ExperienceMedia" (
  "id" TEXT PRIMARY KEY, "experienceId" TEXT NOT NULL, "key" TEXT NOT NULL UNIQUE, "mimeType" TEXT NOT NULL,
  "size" INTEGER NOT NULL, "width" INTEGER, "height" INTEGER, "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ExperienceMedia_experienceId_fkey" FOREIGN KEY ("experienceId") REFERENCES "Experience"("id") ON DELETE CASCADE
);

CREATE TABLE "Slot" (
  "id" TEXT PRIMARY KEY, "experienceId" TEXT NOT NULL, "startsAt" TIMESTAMP(3) NOT NULL, "endsAt" TIMESTAMP(3) NOT NULL,
  "bookingClosesAt" TIMESTAMP(3) NOT NULL, "capacity" INTEGER NOT NULL, "status" "SlotStatus" NOT NULL DEFAULT 'OPEN',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Slot_experienceId_fkey" FOREIGN KEY ("experienceId") REFERENCES "Experience"("id") ON DELETE CASCADE
);

CREATE TABLE "Booking" (
  "id" TEXT PRIMARY KEY, "slotId" TEXT NOT NULL, "userId" TEXT NOT NULL,
  "status" "BookingStatus" NOT NULL DEFAULT 'CONFIRMED', "currentState" VARCHAR(40), "desiredEmotion" "Emotion" NOT NULL,
  "qrTokenHash" TEXT NOT NULL UNIQUE, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "cancelledAt" TIMESTAMP(3), "checkedInAt" TIMESTAMP(3), UNIQUE ("slotId", "userId"),
  CONSTRAINT "Booking_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "Slot"("id") ON DELETE CASCADE,
  CONSTRAINT "Booking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE TABLE "Review" (
  "id" TEXT PRIMARY KEY, "bookingId" TEXT NOT NULL UNIQUE, "afterEmotion" "Emotion" NOT NULL,
  "highlightTags" TEXT[] NOT NULL, "body" VARCHAR(500), "isPublic" BOOLEAN NOT NULL DEFAULT true,
  "status" "ReviewStatus" NOT NULL DEFAULT 'PUBLISHED', "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Review_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE
);

CREATE TABLE "Report" (
  "id" TEXT PRIMARY KEY, "reviewId" TEXT NOT NULL, "reporterId" TEXT NOT NULL, "reason" VARCHAR(500) NOT NULL,
  "status" "ReportStatus" NOT NULL DEFAULT 'OPEN', "moderatorId" TEXT, "resolvedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, UNIQUE ("reviewId", "reporterId"),
  CONSTRAINT "Report_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Review"("id") ON DELETE CASCADE,
  CONSTRAINT "Report_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE CASCADE,
  CONSTRAINT "Report_moderatorId_fkey" FOREIGN KEY ("moderatorId") REFERENCES "User"("id") ON DELETE SET NULL
);

CREATE INDEX "PartnerApplication_status_createdAt_idx" ON "PartnerApplication"("status", "createdAt");
CREATE INDEX "User_isDemo_demoExpiresAt_idx" ON "User"("isDemo", "demoExpiresAt");
CREATE INDEX "Space_ownerId_status_idx" ON "Space"("ownerId", "status");
CREATE INDEX "Space_lat_lng_idx" ON "Space"("lat", "lng");
CREATE INDEX "SpaceMedia_spaceId_sortOrder_idx" ON "SpaceMedia"("spaceId", "sortOrder");
CREATE INDEX "Experience_spaceId_status_idx" ON "Experience"("spaceId", "status");
CREATE INDEX "ExperienceEmotion_emotion_idx" ON "ExperienceEmotion"("emotion");
CREATE INDEX "ExperienceMedia_experienceId_sortOrder_idx" ON "ExperienceMedia"("experienceId", "sortOrder");
CREATE INDEX "Slot_experienceId_startsAt_idx" ON "Slot"("experienceId", "startsAt");
CREATE INDEX "Slot_status_startsAt_idx" ON "Slot"("status", "startsAt");
CREATE INDEX "Booking_userId_status_createdAt_idx" ON "Booking"("userId", "status", "createdAt");
CREATE INDEX "Booking_slotId_status_idx" ON "Booking"("slotId", "status");
CREATE INDEX "Review_status_isPublic_createdAt_idx" ON "Review"("status", "isPublic", "createdAt");
CREATE INDEX "Report_status_createdAt_idx" ON "Report"("status", "createdAt");
