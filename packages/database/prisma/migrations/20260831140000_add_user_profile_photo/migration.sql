ALTER TABLE "users"
ADD COLUMN "profile_photo" BYTEA,
ADD COLUMN "profile_photo_content_type" VARCHAR(32),
ADD COLUMN "profile_photo_updated_at" TIMESTAMPTZ(3);

ALTER TABLE "users"
ADD CONSTRAINT "users_profile_photo_consistency_check"
CHECK (
  ("profile_photo" IS NULL AND "profile_photo_content_type" IS NULL AND "profile_photo_updated_at" IS NULL)
  OR
  ("profile_photo" IS NOT NULL AND "profile_photo_content_type" IN ('image/jpeg', 'image/png', 'image/webp') AND "profile_photo_updated_at" IS NOT NULL)
);
