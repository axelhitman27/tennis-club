-- AlterTable
ALTER TABLE "TrainingSession" ADD COLUMN "cancelledAt" TIMESTAMP(3),
ADD COLUMN "cancelReason" TEXT;
