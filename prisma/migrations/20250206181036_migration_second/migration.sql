/*
  Warnings:

  - You are about to drop the column `password` on the `User` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "password",
ADD COLUMN     "CreatedAt" TIMESTAMP(3),
ADD COLUMN     "LastSignInAt" TIMESTAMP(3),
ADD COLUMN     "avatar" VARCHAR(255),
ADD COLUMN     "disabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "emailVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;
