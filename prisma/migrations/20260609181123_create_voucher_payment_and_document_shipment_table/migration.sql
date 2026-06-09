-- CreateEnum
CREATE TYPE "VoucherPaymentType" AS ENUM ('CASH', 'BANK_TRANSFER', 'CHEQUE');

-- CreateEnum
CREATE TYPE "VoucherStatus" AS ENUM ('DRAFT', 'PENDING', 'CLOSED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('UNPAID', 'INSTALLMENT', 'PAID');

-- CreateTable
CREATE TABLE "document_shipment" (
    "id" TEXT NOT NULL,
    "invoice_id" TEXT NOT NULL,
    "courier" TEXT NOT NULL,
    "tracking_number" TEXT NOT NULL,
    "shipping_date" TIMESTAMP(3) NOT NULL,
    "shipping_proof_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "document_shipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_receipt" (
    "id" TEXT NOT NULL,
    "invoice_id" TEXT NOT NULL,
    "shipment_id" TEXT NOT NULL,
    "received_date" TIMESTAMP(3) NOT NULL,
    "receiver_name" TEXT NOT NULL,
    "receiver_note" TEXT,
    "received_proof_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "document_receipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "voucher" (
    "id" TEXT NOT NULL,
    "invoice_id" TEXT NOT NULL,
    "voucher_number" TEXT NOT NULL,
    "voucher_date" TIMESTAMP(3) NOT NULL,
    "payment_type" "VoucherPaymentType" NOT NULL,
    "bank_id" TEXT,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "status" "VoucherStatus" NOT NULL,
    "remarks" TEXT NOT NULL,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "voucher_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "voucher_id" TEXT NOT NULL,
    "installment_number" INTEGER NOT NULL,
    "payment_date" TIMESTAMP(3) NOT NULL,
    "due_date" TIMESTAMP(3) NOT NULL,
    "paid_amount" INTEGER NOT NULL,
    "remaining_amount" INTEGER NOT NULL,
    "payment_status" "PaymentStatus" NOT NULL,
    "payment_proof" TEXT,
    "remarks" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "document_shipment_invoice_id_key" ON "document_shipment"("invoice_id");

-- CreateIndex
CREATE UNIQUE INDEX "document_shipment_shipping_proof_id_key" ON "document_shipment"("shipping_proof_id");

-- CreateIndex
CREATE UNIQUE INDEX "document_receipt_invoice_id_key" ON "document_receipt"("invoice_id");

-- CreateIndex
CREATE UNIQUE INDEX "document_receipt_shipment_id_key" ON "document_receipt"("shipment_id");

-- CreateIndex
CREATE UNIQUE INDEX "document_receipt_received_proof_id_key" ON "document_receipt"("received_proof_id");

-- CreateIndex
CREATE UNIQUE INDEX "voucher_invoice_id_key" ON "voucher"("invoice_id");

-- CreateIndex
CREATE UNIQUE INDEX "voucher_voucher_number_key" ON "voucher"("voucher_number");

-- AddForeignKey
ALTER TABLE "document_shipment" ADD CONSTRAINT "document_shipment_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_shipment" ADD CONSTRAINT "document_shipment_shipping_proof_id_fkey" FOREIGN KEY ("shipping_proof_id") REFERENCES "file_attachment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_receipt" ADD CONSTRAINT "document_receipt_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_receipt" ADD CONSTRAINT "document_receipt_shipment_id_fkey" FOREIGN KEY ("shipment_id") REFERENCES "document_shipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_receipt" ADD CONSTRAINT "document_receipt_received_proof_id_fkey" FOREIGN KEY ("received_proof_id") REFERENCES "file_attachment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voucher" ADD CONSTRAINT "voucher_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voucher" ADD CONSTRAINT "voucher_bank_id_fkey" FOREIGN KEY ("bank_id") REFERENCES "bank"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_voucher_id_fkey" FOREIGN KEY ("voucher_id") REFERENCES "voucher"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
