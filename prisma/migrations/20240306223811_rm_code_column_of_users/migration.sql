/*
  Warnings:

  - You are about to drop the column `code` on the `users` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[id]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "users_code_key";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "code";

-- CreateIndex
CREATE UNIQUE INDEX "users_id_key" ON "users"("id");
