/*
  Warnings:

  - You are about to drop the column `created_by` on the `division` table. All the data in the column will be lost.
  - You are about to drop the column `updated_by` on the `division` table. All the data in the column will be lost.
  - You are about to drop the column `created_by` on the `role` table. All the data in the column will be lost.
  - You are about to drop the column `updated_by` on the `role` table. All the data in the column will be lost.
  - You are about to drop the column `created_by` on the `user` table. All the data in the column will be lost.
  - You are about to drop the column `division_id` on the `user` table. All the data in the column will be lost.
  - You are about to drop the column `updated_by` on the `user` table. All the data in the column will be lost.
  - You are about to drop the column `created_by` on the `user_role` table. All the data in the column will be lost.
  - You are about to drop the column `division_id` on the `user_role` table. All the data in the column will be lost.
  - You are about to drop the column `updated_by` on the `user_role` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[user_id,role_id]` on the table `user_role` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "Action" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'VIEW', 'CLICK', 'OTHER');

-- CreateEnum
CREATE TYPE "ReferenceType" AS ENUM ('USER', 'DIVISION', 'ROLE', 'QS', 'INVOICE', 'BANK');

-- CreateEnum
CREATE TYPE "QSType" AS ENUM ('NEW', 'RENEWAL');

-- CreateEnum
CREATE TYPE "QSSTATUS" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'PENDING', 'VOUCHER', 'CLOSED');

-- CreateEnum
CREATE TYPE "FileReferenceType" AS ENUM ('INVOICE', 'SHIPMENT');

-- DropForeignKey
ALTER TABLE "user" DROP CONSTRAINT "user_division_id_fkey";

-- DropForeignKey
ALTER TABLE "user_role" DROP CONSTRAINT "user_role_division_id_fkey";

-- DropIndex
DROP INDEX "user_role_user_id_role_id_division_id_key";

-- AlterTable
ALTER TABLE "division" DROP COLUMN "created_by",
DROP COLUMN "updated_by";

-- AlterTable
ALTER TABLE "role" DROP COLUMN "created_by",
DROP COLUMN "updated_by";

-- AlterTable
ALTER TABLE "user" DROP COLUMN "created_by",
DROP COLUMN "division_id",
DROP COLUMN "updated_by";

-- AlterTable
ALTER TABLE "user_role" DROP COLUMN "created_by",
DROP COLUMN "division_id",
DROP COLUMN "updated_by";

-- CreateTable
CREATE TABLE "user_division" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "division_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_division_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "account_number" TEXT NOT NULL,
    "account_name" TEXT NOT NULL,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "bank_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "log" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "action" "Action" NOT NULL,
    "description" TEXT NOT NULL,
    "reference_id" TEXT,
    "reference_type" "ReferenceType",
    "details" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "qs" (
    "id" TEXT NOT NULL,
    "division_id" TEXT NOT NULL,
    "type" "QSType" NOT NULL,
    "status" "QSSTATUS" NOT NULL,
    "insured" TEXT NOT NULL,
    "vessel" TEXT NOT NULL,
    "insurance" TEXT NOT NULL,
    "member" TEXT NOT NULL,
    "leader" TEXT NOT NULL,
    "policy_number" TEXT NOT NULL,
    "period_from" TIMESTAMP(3) NOT NULL,
    "period_to" TIMESTAMP(3) NOT NULL,
    "premium_amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "remarks" TEXT NOT NULL,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "qs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice" (
    "id" TEXT NOT NULL,
    "qs_id" TEXT NOT NULL,
    "invoice_number" TEXT NOT NULL,
    "invoice_date" TIMESTAMP(3) NOT NULL,
    "due_date" TIMESTAMP(3) NOT NULL,
    "insured" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "status" "InvoiceStatus" NOT NULL,
    "remarks" TEXT NOT NULL,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "file_attachment" (
    "id" TEXT NOT NULL,
    "invoice_id" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_type" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "file_url" TEXT NOT NULL,
    "file_key" TEXT NOT NULL,
    "reference_type" "FileReferenceType" NOT NULL,
    "reference_id" TEXT NOT NULL,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "file_attachment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_division_user_id_division_id_key" ON "user_division"("user_id", "division_id");

-- CreateIndex
CREATE UNIQUE INDEX "bank_name_key" ON "bank"("name");

-- CreateIndex
CREATE UNIQUE INDEX "bank_account_number_key" ON "bank"("account_number");

-- CreateIndex
CREATE UNIQUE INDEX "invoice_invoice_number_key" ON "invoice"("invoice_number");

-- CreateIndex
CREATE UNIQUE INDEX "user_role_user_id_role_id_key" ON "user_role"("user_id", "role_id");

-- AddForeignKey
ALTER TABLE "user_division" ADD CONSTRAINT "user_division_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_division" ADD CONSTRAINT "user_division_division_id_fkey" FOREIGN KEY ("division_id") REFERENCES "division"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "log" ADD CONSTRAINT "log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qs" ADD CONSTRAINT "qs_division_id_fkey" FOREIGN KEY ("division_id") REFERENCES "division"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice" ADD CONSTRAINT "invoice_qs_id_fkey" FOREIGN KEY ("qs_id") REFERENCES "qs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
