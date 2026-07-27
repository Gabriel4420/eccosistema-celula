-- Expansion only: nullable columns keep the previous API compatible.
ALTER TABLE "churches"
  ADD COLUMN "email" VARCHAR(320),
  ADD COLUMN "phone" VARCHAR(32),
  ADD COLUMN "address_line" VARCHAR(200),
  ADD COLUMN "address_number" VARCHAR(30),
  ADD COLUMN "address_complement" VARCHAR(120),
  ADD COLUMN "neighborhood" VARCHAR(120),
  ADD COLUMN "city" VARCHAR(120),
  ADD COLUMN "state" VARCHAR(2),
  ADD COLUMN "postal_code" VARCHAR(16),
  ADD COLUMN "country" CHAR(2),
  ADD COLUMN "timezone" VARCHAR(64),
  ADD COLUMN "week_starts_on" "DayOfWeek";

