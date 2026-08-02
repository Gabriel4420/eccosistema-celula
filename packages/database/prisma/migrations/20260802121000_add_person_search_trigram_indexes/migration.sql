CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX "people_full_name_trgm_idx"
ON "people" USING GIN ("full_name" gin_trgm_ops);

CREATE INDEX "people_phone_trgm_idx"
ON "people" USING GIN ("phone" gin_trgm_ops);

CREATE INDEX "people_email_trgm_idx"
ON "people" USING GIN ("email" gin_trgm_ops);
