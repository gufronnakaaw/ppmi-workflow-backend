/*
  Warnings:

  - You are about to drop the column `invoice_id` on the `file_attachment` table. All the data in the column will be lost.
  - You are about to drop the column `paymentsId` on the `file_attachment` table. All the data in the column will be lost.
  - You are about to drop the column `qsId` on the `file_attachment` table. All the data in the column will be lost.
  - You are about to drop the `payments` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterEnum
ALTER TYPE "InvoiceStatus" ADD VALUE 'SHIPPED';

-- DropForeignKey
ALTER TABLE "file_attachment" DROP CONSTRAINT "file_attachment_paymentsId_fkey";

-- DropForeignKey
ALTER TABLE "file_attachment" DROP CONSTRAINT "file_attachment_qsId_fkey";

-- DropForeignKey
ALTER TABLE "payments" DROP CONSTRAINT "payments_voucher_id_fkey";

-- AlterTable
ALTER TABLE "file_attachment" DROP COLUMN "invoice_id",
DROP COLUMN "paymentsId",
DROP COLUMN "qsId";

-- DropTable
DROP TABLE "payments";

-- CreateTable
CREATE TABLE "payment" (
    "id" TEXT NOT NULL,
    "voucher_id" TEXT NOT NULL,
    "installment_number" INTEGER NOT NULL,
    "payment_date" TIMESTAMP(3) NOT NULL,
    "due_date" TIMESTAMP(3) NOT NULL,
    "paid_amount" INTEGER NOT NULL,
    "remaining_amount" INTEGER NOT NULL,
    "payment_status" "PaymentStatus" NOT NULL,
    "remarks" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "payment" ADD CONSTRAINT "payment_voucher_id_fkey" FOREIGN KEY ("voucher_id") REFERENCES "voucher"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
