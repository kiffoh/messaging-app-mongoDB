-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "photoUrl" TEXT,
ALTER COLUMN "content" DROP NOT NULL;
