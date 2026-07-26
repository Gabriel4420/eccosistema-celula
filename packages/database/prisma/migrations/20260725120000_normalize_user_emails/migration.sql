DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "users"
    GROUP BY "church_id", lower(btrim("email"))
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'normalized user email collisions must be resolved before migration';
  END IF;
END
$$;

UPDATE "users"
SET "email" = lower(btrim("email"))
WHERE "email" <> lower(btrim("email"));

ALTER TABLE "users"
ADD CONSTRAINT "users_email_normalized_check"
CHECK ("email" = lower(btrim("email")));
