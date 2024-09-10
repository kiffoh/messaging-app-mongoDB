/*
  Warnings:

  - You are about to drop the column `directMessageId` on the `Message` table. All the data in the column will be lost.
  - You are about to drop the `DirectMessage` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_DirectMessageUsers` table. If the table is not empty, all the data it contains will be lost.
  - Made the column `groupId` on table `Message` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_directMessageId_fkey";

-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_groupId_fkey";

-- DropForeignKey
ALTER TABLE "_DirectMessageUsers" DROP CONSTRAINT "_DirectMessageUsers_A_fkey";

-- DropForeignKey
ALTER TABLE "_DirectMessageUsers" DROP CONSTRAINT "_DirectMessageUsers_B_fkey";

-- AlterTable
ALTER TABLE "Group" ALTER COLUMN "name" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Message" DROP COLUMN "directMessageId",
ALTER COLUMN "groupId" SET NOT NULL;

-- DropTable
DROP TABLE "DirectMessage";

-- DropTable
DROP TABLE "_DirectMessageUsers";

-- CreateIndex
CREATE INDEX "Group_updatedAt_createdAt_idx" ON "Group"("updatedAt", "createdAt");

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
