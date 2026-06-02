-- DropForeignKey
ALTER TABLE "user_division" DROP CONSTRAINT "user_division_user_id_fkey";

-- DropForeignKey
ALTER TABLE "user_role" DROP CONSTRAINT "user_role_user_id_fkey";

-- CreateIndex
CREATE INDEX "qs_division_id_status_type_idx" ON "qs"("division_id", "status", "type");

-- AddForeignKey
ALTER TABLE "user_division" ADD CONSTRAINT "user_division_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_role" ADD CONSTRAINT "user_role_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
