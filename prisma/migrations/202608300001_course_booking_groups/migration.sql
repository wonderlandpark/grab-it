ALTER TABLE "Booking"
ADD COLUMN "courseGroupId" UUID,
ADD COLUMN "courseOrder" INTEGER;

CREATE INDEX "Booking_userId_courseGroupId_idx"
ON "Booking"("userId", "courseGroupId");
