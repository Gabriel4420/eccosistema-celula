-- Refuse to normalize identity silently. Existing incompatible slugs require an
-- explicit, audited correction before this migration can be applied.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "churches"
    WHERE "slug" !~ '^[a-z0-9]+(-[a-z0-9]+)*$'
       OR length("slug") < 3
       OR "slug" IN (
         'admin', 'api', 'app', 'auth', 'church', 'churches', 'docs',
         'health', 'login', 'logout', 'refresh', 'settings', 'users', 'www'
       )
  ) THEN
    RAISE EXCEPTION 'Church slug preflight failed';
  END IF;
END
$$;

-- Approved MVP backfill. This technical migration intentionally preserves
-- updated_at because it is not an administrative edit.
UPDATE "churches"
SET
  "country" = COALESCE("country", 'BR'),
  "timezone" = COALESCE("timezone", 'America/Sao_Paulo'),
  "week_starts_on" = COALESCE("week_starts_on", 'SUNDAY'::"DayOfWeek");

ALTER TABLE "churches"
  ALTER COLUMN "country" SET DEFAULT 'BR',
  ALTER COLUMN "country" SET NOT NULL,
  ALTER COLUMN "timezone" SET DEFAULT 'America/Sao_Paulo',
  ALTER COLUMN "timezone" SET NOT NULL,
  ALTER COLUMN "week_starts_on" SET DEFAULT 'SUNDAY',
  ALTER COLUMN "week_starts_on" SET NOT NULL;

ALTER TABLE "churches"
  ADD CONSTRAINT "churches_slug_format_check"
    CHECK (
      "slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
      AND length("slug") BETWEEN 3 AND 100
    ),
  ADD CONSTRAINT "churches_slug_reserved_check"
    CHECK (
      "slug" NOT IN (
        'admin', 'api', 'app', 'auth', 'church', 'churches', 'docs',
        'health', 'login', 'logout', 'refresh', 'settings', 'users', 'www'
      )
    ),
  ADD CONSTRAINT "churches_email_normalized_check"
    CHECK ("email" IS NULL OR "email" = lower(btrim("email"))),
  ADD CONSTRAINT "churches_phone_e164_check"
    CHECK ("phone" IS NULL OR "phone" ~ '^\+[1-9][0-9]{7,14}$'),
  ADD CONSTRAINT "churches_country_br_check"
    CHECK ("country" = 'BR'),
  ADD CONSTRAINT "churches_state_br_check"
    CHECK ("state" IS NULL OR "state" ~ '^[A-Z]{2}$'),
  ADD CONSTRAINT "churches_postal_code_br_check"
    CHECK ("postal_code" IS NULL OR "postal_code" ~ '^[0-9]{8}$'),
  ADD CONSTRAINT "churches_timezone_not_blank_check"
    CHECK (length(btrim("timezone")) > 0);
