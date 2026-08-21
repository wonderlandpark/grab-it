CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');
CREATE TYPE "Activity" AS ENUM ('REST', 'WALK', 'EAT', 'TALK', 'VIEW', 'EXERCISE', 'OTHER');
CREATE TYPE "Emotion" AS ENUM ('CALM', 'REFRESH', 'EXCITEMENT', 'AWE', 'COMFORT', 'LIBERATION');
CREATE TYPE "Visibility" AS ENUM ('PUBLIC', 'PRIVATE');
CREATE TYPE "ExperienceStatus" AS ENUM ('PUBLISHED', 'HIDDEN', 'DELETED');
CREATE TYPE "ReportStatus" AS ENUM ('OPEN', 'RESOLVED', 'DISMISSED');

CREATE TABLE "User" (
	"id" TEXT PRIMARY KEY,
	"name" TEXT,
	"email" TEXT UNIQUE,
	"emailVerified" TIMESTAMP(3),
	"image" TEXT,
	"role" "Role" NOT NULL DEFAULT 'USER',
	"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
	"updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "Account" (
	"id" TEXT PRIMARY KEY,
	"userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
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
	UNIQUE ("provider", "providerAccountId")
);

CREATE TABLE "Session" (
	"id" TEXT PRIMARY KEY,
	"sessionToken" TEXT NOT NULL UNIQUE,
	"userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
	"expires" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "VerificationToken" (
	"identifier" TEXT NOT NULL,
	"token" TEXT NOT NULL UNIQUE,
	"expires" TIMESTAMP(3) NOT NULL,
	UNIQUE ("identifier", "token")
);

CREATE TABLE "Place" (
	"id" TEXT PRIMARY KEY,
	"source" TEXT NOT NULL,
	"externalId" TEXT,
	"name" TEXT NOT NULL,
	"category" TEXT,
	"address" TEXT,
	"roadAddress" TEXT,
	"latitude" DOUBLE PRECISION NOT NULL,
	"longitude" DOUBLE PRECISION NOT NULL,
	"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
	"updatedAt" TIMESTAMP(3) NOT NULL,
	UNIQUE ("source", "externalId")
);

CREATE TABLE "Experience" (
	"id" TEXT PRIMARY KEY,
	"authorId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
	"placeId" TEXT REFERENCES "Place"("id") ON DELETE SET NULL,
	"activity" "Activity" NOT NULL,
	"body" VARCHAR(500) NOT NULL,
	"visibility" "Visibility" NOT NULL DEFAULT 'PUBLIC',
	"status" "ExperienceStatus" NOT NULL DEFAULT 'PUBLISHED',
	"exactLatitude" DOUBLE PRECISION NOT NULL,
	"exactLongitude" DOUBLE PRECISION NOT NULL,
	"displayLatitude" DOUBLE PRECISION NOT NULL,
	"displayLongitude" DOUBLE PRECISION NOT NULL,
	"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
	"updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "ExperienceEmotion" (
	"experienceId" TEXT NOT NULL REFERENCES "Experience"("id") ON DELETE CASCADE,
	"emotion" "Emotion" NOT NULL,
	PRIMARY KEY ("experienceId", "emotion")
);

CREATE TABLE "ExperienceMedia" (
	"id" TEXT PRIMARY KEY,
	"experienceId" TEXT NOT NULL REFERENCES "Experience"("id") ON DELETE CASCADE,
	"storageKey" TEXT NOT NULL UNIQUE,
	"contentType" TEXT NOT NULL,
	"position" INTEGER NOT NULL DEFAULT 0,
	"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Resonance" (
	"experienceId" TEXT NOT NULL REFERENCES "Experience"("id") ON DELETE CASCADE,
	"userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
	"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY ("experienceId", "userId")
);

CREATE TABLE "Report" (
	"id" TEXT PRIMARY KEY,
	"experienceId" TEXT NOT NULL REFERENCES "Experience"("id") ON DELETE CASCADE,
	"reporterId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
	"moderatorId" TEXT REFERENCES "User"("id") ON DELETE SET NULL,
	"reason" VARCHAR(300) NOT NULL,
	"status" "ReportStatus" NOT NULL DEFAULT 'OPEN',
	"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
	"resolvedAt" TIMESTAMP(3),
	UNIQUE ("experienceId", "reporterId")
);

CREATE INDEX "Place_name_idx" ON "Place"("name");
CREATE INDEX "Experience_author_created_idx" ON "Experience"("authorId", "createdAt" DESC);
CREATE INDEX "Experience_public_created_idx" ON "Experience"("createdAt" DESC)
	WHERE "visibility" = 'PUBLIC' AND "status" = 'PUBLISHED';
CREATE INDEX "Experience_emotion_idx" ON "ExperienceEmotion"("emotion");
CREATE INDEX "Experience_display_location_gist_idx" ON "Experience" USING GIST (
	ST_SetSRID(ST_MakePoint("displayLongitude", "displayLatitude"), 4326)
);
CREATE INDEX "Resonance_user_created_idx" ON "Resonance"("userId", "createdAt" DESC);
CREATE INDEX "Report_status_created_idx" ON "Report"("status", "createdAt" DESC);
