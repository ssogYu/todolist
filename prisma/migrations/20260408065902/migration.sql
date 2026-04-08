-- CreateEnum
CREATE TYPE "Category" AS ENUM ('WORK', 'PERSONAL');

-- AlterTable
ALTER TABLE "Todo" ADD COLUMN     "category" "Category" NOT NULL DEFAULT 'WORK',
ADD COLUMN     "note" TEXT;
