-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "FileReferenceType" ADD VALUE 'QS';
ALTER TYPE "FileReferenceType" ADD VALUE 'PAYMENT';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ReferenceType" ADD VALUE 'VOUCHER';
ALTER TYPE "ReferenceType" ADD VALUE 'PAYMENT';
ALTER TYPE "ReferenceType" ADD VALUE 'SHIPMENT';
ALTER TYPE "ReferenceType" ADD VALUE 'RECEIPT';

-- AlterTable
ALTER TABLE "file_attachment" ADD COLUMN     "paymentsId" TEXT,
ADD COLUMN     "qsId" TEXT;

-- AddForeignKey
ALTER TABLE "file_attachment" ADD CONSTRAINT "file_attachment_paymentsId_fkey" FOREIGN KEY ("paymentsId") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file_attachment" ADD CONSTRAINT "file_attachment_qsId_fkey" FOREIGN KEY ("qsId") REFERENCES "qs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
