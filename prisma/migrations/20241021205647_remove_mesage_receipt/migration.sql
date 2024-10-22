/*
  Warnings:

  - You are about to drop the `MessageReceipt` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "MessageReceipt" DROP CONSTRAINT "MessageReceipt_messageId_fkey";

-- DropForeignKey
ALTER TABLE "MessageReceipt" DROP CONSTRAINT "MessageReceipt_userId_fkey";

-- DropTable
DROP TABLE "MessageReceipt";
