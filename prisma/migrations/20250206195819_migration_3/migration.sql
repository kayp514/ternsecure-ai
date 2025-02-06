/*
  Warnings:

  - You are about to drop the column `CreatedAt` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `LastSignInAt` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "CreatedAt",
DROP COLUMN "LastSignInAt",
ADD COLUMN     "createdAt" TIMESTAMP(3),
ADD COLUMN     "lastSignInAt" TIMESTAMP(3);
