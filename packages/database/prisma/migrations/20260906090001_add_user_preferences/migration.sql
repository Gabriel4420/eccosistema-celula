-- CreateTable
CREATE TABLE "user_preferences" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "church_id" UUID NOT NULL,
    "language" VARCHAR(10) NOT NULL DEFAULT 'pt-BR',
    "display_timezone" VARCHAR(64),
    "date_format" VARCHAR(16) NOT NULL DEFAULT 'dd/MM/yyyy',
    "theme" VARCHAR(10) NOT NULL DEFAULT 'system',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),

    CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_preferences_church_id_idx" ON "user_preferences"("church_id");

-- CreateIndex
CREATE INDEX "user_preferences_church_id_deleted_at_idx" ON "user_preferences"("church_id", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "user_preferences_user_id_key" ON "user_preferences"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_preferences_user_id_church_id_key" ON "user_preferences"("user_id", "church_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_preferences_id_church_id_key" ON "user_preferences"("id", "church_id");

-- AddForeignKey
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_user_id_church_id_fkey" FOREIGN KEY ("user_id", "church_id") REFERENCES "users"("id", "church_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Backfill: cria uma linha para cada usuário existente com os defaults
-- definidos no plano 013 (language pt-BR, dateFormat dd/MM/yyyy, theme
-- system e displayTimezone herdado da igreja).
INSERT INTO "user_preferences" ("id", "user_id", "church_id", "language", "display_timezone", "date_format", "theme", "created_at", "updated_at", "deleted_at")
SELECT gen_random_uuid(), u."id", u."church_id", 'pt-BR', NULL, 'dd/MM/yyyy', 'system', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL
FROM "users" u
WHERE NOT EXISTS (
    SELECT 1 FROM "user_preferences" up WHERE up."user_id" = u."id"
);