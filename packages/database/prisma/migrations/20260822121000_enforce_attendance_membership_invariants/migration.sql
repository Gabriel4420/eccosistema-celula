DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM "cell_memberships"
    WHERE ("left_at" IS NOT NULL AND "left_at" < "joined_at")
       OR ("deleted_at" IS NULL AND "status" = 'ACTIVE' AND "left_at" IS NOT NULL)
       OR ("deleted_at" IS NULL AND "status" IN ('INACTIVE', 'TRANSFERRED') AND "left_at" IS NULL)
  ) THEN
    RAISE EXCEPTION 'CellMembership preflight failed: inconsistent status/date intervals';
  END IF;
END $$;

ALTER TABLE "cell_memberships"
DROP CONSTRAINT IF EXISTS "cell_memberships_left_at_after_joined_at_check";
ALTER TABLE "cell_memberships"
ADD CONSTRAINT "cell_memberships_left_at_after_joined_at_check"
CHECK ("left_at" IS NULL OR "left_at" >= "joined_at");
ALTER TABLE "cell_memberships"
ADD CONSTRAINT "cell_memberships_active_interval_consistency_check"
CHECK ("deleted_at" IS NOT NULL OR (("status" = 'ACTIVE' AND "left_at" IS NULL) OR ("status" IN ('INACTIVE', 'TRANSFERRED') AND "left_at" IS NOT NULL)));

DROP INDEX IF EXISTS "cell_memberships_one_open_per_person_idx";
CREATE UNIQUE INDEX "cell_memberships_one_active_per_person_idx"
ON "cell_memberships"("church_id", "person_id")
WHERE "deleted_at" IS NULL AND "status" = 'ACTIVE' AND "left_at" IS NULL;
CREATE INDEX "cell_memberships_attendance_history_idx"
ON "cell_memberships"("church_id", "cell_id", "joined_at", "left_at", "deleted_at", "person_id");
