CREATE TYPE "SessionRevokedReason" AS ENUM (
  'ROTATED',
  'LOGOUT',
  'PASSWORD_CHANGED',
  'TOKEN_REUSE',
  'USER_INACTIVE'
);

CREATE TABLE "sessions" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "church_id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "token_hash" VARCHAR(64) NOT NULL,
  "family_id" UUID NOT NULL,
  "expires_at" TIMESTAMPTZ(3) NOT NULL,
  "last_used_at" TIMESTAMPTZ(3),
  "revoked_at" TIMESTAMPTZ(3),
  "revoked_reason" "SessionRevokedReason",
  "replaced_by_session_id" UUID,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL,

  CONSTRAINT "sessions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "sessions_token_hash_key" UNIQUE ("token_hash"),
  CONSTRAINT "sessions_replaced_by_session_id_key" UNIQUE ("replaced_by_session_id"),
  CONSTRAINT "sessions_id_church_id_key" UNIQUE ("id", "church_id"),
  CONSTRAINT "sessions_church_id_fkey"
    FOREIGN KEY ("church_id") REFERENCES "churches"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "sessions_user_id_church_id_fkey"
    FOREIGN KEY ("user_id", "church_id") REFERENCES "users"("id", "church_id")
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "sessions_replaced_by_session_id_fkey"
    FOREIGN KEY ("replaced_by_session_id") REFERENCES "sessions"("id")
    ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "sessions_church_id_idx" ON "sessions"("church_id");
CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");
CREATE INDEX "sessions_family_id_idx" ON "sessions"("family_id");
CREATE INDEX "sessions_expires_at_idx" ON "sessions"("expires_at");
CREATE INDEX "sessions_user_id_revoked_at_idx" ON "sessions"("user_id", "revoked_at");
CREATE INDEX "sessions_church_id_user_id_idx" ON "sessions"("church_id", "user_id");
