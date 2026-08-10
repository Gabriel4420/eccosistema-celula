-- Idempotency-Key storage per ADR 006 (plan 007, section 6.5).
-- Stores only the key, actor, church, operation, canonical request hash,
-- status and a reference to the created resource. Never stores the payload,
-- personal data or complete addresses.

CREATE TABLE "idempotency_requests" (
    "id" UUID NOT NULL,
    "church_id" UUID NOT NULL,
    "actor_id" UUID NOT NULL,
    "operation" VARCHAR(100) NOT NULL,
    "key" UUID NOT NULL,
    "request_hash" VARCHAR(64) NOT NULL,
    "resource_id" UUID,
    "result" JSONB NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'COMPLETED',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "expires_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "idempotency_requests_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "idempotency_requests_church_actor_operation_key_key"
ON "idempotency_requests"("church_id", "actor_id", "operation", "key");

CREATE INDEX "idempotency_requests_church_created_at_idx"
ON "idempotency_requests"("church_id", "created_at");

CREATE INDEX "idempotency_requests_expires_at_idx"
ON "idempotency_requests"("expires_at");

ALTER TABLE "idempotency_requests"
ADD CONSTRAINT "idempotency_requests_church_id_fkey"
FOREIGN KEY ("church_id") REFERENCES "churches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "idempotency_requests"
ADD CONSTRAINT "idempotency_requests_actor_id_church_id_fkey"
FOREIGN KEY ("actor_id", "church_id") REFERENCES "users"("id", "church_id") ON DELETE RESTRICT ON UPDATE CASCADE;
