-- CreateTable
CREATE TABLE "report_exports" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "church_id" UUID NOT NULL,
    "exported_by" UUID NOT NULL,
    "report_type" VARCHAR(50) NOT NULL,
    "format" VARCHAR(10) NOT NULL,
    "scope" JSONB NOT NULL DEFAULT '{}',
    "row_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT now(),

    CONSTRAINT "report_exports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "report_exports_church_id_created_at_idx" ON "report_exports"("church_id", "created_at");

-- CreateIndex
CREATE INDEX "report_exports_church_id_report_type_idx" ON "report_exports"("church_id", "report_type");

-- CreateIndex
CREATE INDEX "report_exports_exported_by_idx" ON "report_exports"("exported_by");

-- AddForeignKey
ALTER TABLE "report_exports" ADD CONSTRAINT "report_exports_church_id_fkey" FOREIGN KEY ("church_id") REFERENCES "churches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_exports" ADD CONSTRAINT "report_exports_exported_by_fkey" FOREIGN KEY ("exported_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CheckConstraint
ALTER TABLE "report_exports" ADD CONSTRAINT "report_exports_report_type_check" CHECK ("report_type" IN ('cells', 'people', 'attendance', 'meetings'));

-- CheckConstraint
ALTER TABLE "report_exports" ADD CONSTRAINT "report_exports_format_check" CHECK ("format" IN ('csv', 'xlsx', 'pdf'));

-- CheckConstraint
ALTER TABLE "report_exports" ADD CONSTRAINT "report_exports_row_count_nonnegative_check" CHECK ("row_count" >= 0);
