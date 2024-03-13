/*
  Warnings:

  - Added the required column `status` to the `stores` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "StoreStatus" AS ENUM ('OPEN', 'CLOSED', 'DISABLED');

-- AlterTable
ALTER TABLE "stores" ADD COLUMN     "status" "StoreStatus" NOT NULL;
