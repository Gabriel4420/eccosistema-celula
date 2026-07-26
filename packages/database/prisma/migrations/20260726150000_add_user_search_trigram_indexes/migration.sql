CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX "users_first_name_trgm_idx"
ON "users" USING GIN ("first_name" gin_trgm_ops);

CREATE INDEX "users_last_name_trgm_idx"
ON "users" USING GIN ("last_name" gin_trgm_ops);

CREATE INDEX "users_email_trgm_idx"
ON "users" USING GIN ("email" gin_trgm_ops);
