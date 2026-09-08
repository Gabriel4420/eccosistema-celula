-- CreateTable
CREATE TABLE "church_settings" (
    "id" UUID NOT NULL,
    "church_id" UUID NOT NULL,
    "report_deadline_hours" INTEGER NOT NULL DEFAULT 48,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),

    CONSTRAINT "church_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "church_settings_church_id_deleted_at_idx" ON "church_settings"("church_id", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "church_settings_church_id_key" ON "church_settings"("church_id");

-- CreateIndex
CREATE UNIQUE INDEX "church_settings_id_church_id_key" ON "church_settings"("id", "church_id");

-- AddForeignKey
ALTER TABLE "church_settings" ADD CONSTRAINT "church_settings_church_id_fkey" FOREIGN KEY ("church_id") REFERENCES "churches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Backfill: cria uma linha para cada igreja existente, preservando o
-- deadline padrão de 48h (comportamento atual de relatórios pendentes).
INSERT INTO "church_settings" ("id", "church_id", "report_deadline_hours", "created_at", "updated_at", "deleted_at")
SELECT gen_random_uuid(), c."id", 48, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL
FROM "churches" c
WHERE NOT EXISTS (
    SELECT 1 FROM "church_settings" cs WHERE cs."church_id" = c."id"
);
