ALTER TABLE "meetings"
ADD COLUMN "attendance_revision" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "meetings"
ADD CONSTRAINT "meetings_attendance_revision_nonnegative_check"
CHECK ("attendance_revision" >= 0);

CREATE TABLE "meeting_visitors" (
  "id" UUID NOT NULL,
  "church_id" UUID NOT NULL,
  "meeting_id" UUID NOT NULL,
  "person_id" UUID NOT NULL,
  "invited_by_person_id" UUID,
  "observation" VARCHAR(500),
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL,
  "deleted_at" TIMESTAMPTZ(3),
  CONSTRAINT "meeting_visitors_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "meeting_visitors_church_meeting_person_key" ON "meeting_visitors"("church_id", "meeting_id", "person_id");
CREATE INDEX "meeting_visitors_church_meeting_deleted_idx" ON "meeting_visitors"("church_id", "meeting_id", "deleted_at");
CREATE INDEX "meeting_visitors_church_person_idx" ON "meeting_visitors"("church_id", "person_id");
CREATE INDEX "meeting_visitors_church_inviter_idx" ON "meeting_visitors"("church_id", "invited_by_person_id");

ALTER TABLE "meeting_visitors" ADD CONSTRAINT "meeting_visitors_church_id_fkey" FOREIGN KEY ("church_id") REFERENCES "churches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "meeting_visitors" ADD CONSTRAINT "meeting_visitors_meeting_id_church_id_fkey" FOREIGN KEY ("meeting_id", "church_id") REFERENCES "meetings"("id", "church_id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "meeting_visitors" ADD CONSTRAINT "meeting_visitors_person_id_church_id_fkey" FOREIGN KEY ("person_id", "church_id") REFERENCES "people"("id", "church_id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "meeting_visitors" ADD CONSTRAINT "meeting_visitors_invited_by_person_id_church_id_fkey" FOREIGN KEY ("invited_by_person_id", "church_id") REFERENCES "people"("id", "church_id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "meeting_visitors" ADD CONSTRAINT "meeting_visitors_attendance_fkey" FOREIGN KEY ("church_id", "meeting_id", "person_id") REFERENCES "meeting_attendances"("church_id", "meeting_id", "person_id") ON DELETE RESTRICT ON UPDATE CASCADE;
