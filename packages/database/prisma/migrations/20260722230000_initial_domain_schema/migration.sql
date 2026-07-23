-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'BLOCKED');

-- CreateEnum
CREATE TYPE "CellStatus" AS ENUM ('FORMING', 'ACTIVE', 'SUSPENDED', 'CLOSED');

-- CreateEnum
CREATE TYPE "MembershipStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'TRANSFERRED');

-- CreateEnum
CREATE TYPE "MeetingStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELED');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'EXCUSED');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('NOT_STARTED', 'DRAFT', 'SUBMITTED', 'RETURNED', 'CANCELED');

-- CreateEnum
CREATE TYPE "DayOfWeek" AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');

-- CreateTable
CREATE TABLE "churches" (
    "id" UUID NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),

    CONSTRAINT "churches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "church_id" UUID NOT NULL,
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(320) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "status" "UserStatus" NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" UUID NOT NULL,
    "church_id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "id" UUID NOT NULL,
    "church_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supervisor_assignments" (
    "id" UUID NOT NULL,
    "church_id" UUID NOT NULL,
    "supervisor_id" UUID NOT NULL,
    "leader_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),

    CONSTRAINT "supervisor_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cells" (
    "id" UUID NOT NULL,
    "church_id" UUID NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "status" "CellStatus" NOT NULL,
    "leader_id" UUID,
    "trainee_leader_id" UUID,
    "meeting_day" "DayOfWeek" NOT NULL,
    "meeting_time" TIME(0) NOT NULL,
    "address" VARCHAR(500) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),

    CONSTRAINT "cells_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "people" (
    "id" UUID NOT NULL,
    "church_id" UUID NOT NULL,
    "full_name" VARCHAR(200) NOT NULL,
    "phone" VARCHAR(32),
    "email" VARCHAR(320),
    "birth_date" DATE,
    "gender" VARCHAR(50),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),

    CONSTRAINT "people_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cell_memberships" (
    "id" UUID NOT NULL,
    "church_id" UUID NOT NULL,
    "person_id" UUID NOT NULL,
    "cell_id" UUID NOT NULL,
    "status" "MembershipStatus" NOT NULL,
    "joined_at" TIMESTAMPTZ(3) NOT NULL,
    "left_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),

    CONSTRAINT "cell_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meetings" (
    "id" UUID NOT NULL,
    "church_id" UUID NOT NULL,
    "cell_id" UUID NOT NULL,
    "meeting_date" DATE NOT NULL,
    "status" "MeetingStatus" NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),

    CONSTRAINT "meetings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meeting_attendances" (
    "id" UUID NOT NULL,
    "church_id" UUID NOT NULL,
    "meeting_id" UUID NOT NULL,
    "person_id" UUID NOT NULL,
    "attendance_status" "AttendanceStatus" NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),

    CONSTRAINT "meeting_attendances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meeting_reports" (
    "id" UUID NOT NULL,
    "church_id" UUID NOT NULL,
    "meeting_id" UUID NOT NULL,
    "observations" TEXT,
    "submitted_by" UUID,
    "submitted_at" TIMESTAMPTZ(3),
    "status" "ReportStatus" NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),

    CONSTRAINT "meeting_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "church_id" UUID NOT NULL,
    "user_id" UUID,
    "entity" VARCHAR(100) NOT NULL,
    "entity_id" UUID NOT NULL,
    "action" VARCHAR(100) NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "churches_slug_key" ON "churches"("slug");

-- CreateIndex
CREATE INDEX "churches_deleted_at_idx" ON "churches"("deleted_at");

-- CreateIndex
CREATE INDEX "users_church_id_status_idx" ON "users"("church_id", "status");

-- CreateIndex
CREATE INDEX "users_church_id_deleted_at_idx" ON "users"("church_id", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "users_id_church_id_key" ON "users"("id", "church_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_church_id_email_key" ON "users"("church_id", "email");

-- CreateIndex
CREATE INDEX "roles_church_id_deleted_at_idx" ON "roles"("church_id", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "roles_id_church_id_key" ON "roles"("id", "church_id");

-- CreateIndex
CREATE UNIQUE INDEX "roles_church_id_name_key" ON "roles"("church_id", "name");

-- CreateIndex
CREATE INDEX "user_roles_user_id_idx" ON "user_roles"("user_id");

-- CreateIndex
CREATE INDEX "user_roles_role_id_idx" ON "user_roles"("role_id");

-- CreateIndex
CREATE INDEX "user_roles_church_id_deleted_at_idx" ON "user_roles"("church_id", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "user_roles_church_user_role_key" ON "user_roles"("church_id", "user_id", "role_id");

-- CreateIndex
CREATE INDEX "supervisor_assignments_supervisor_id_idx" ON "supervisor_assignments"("supervisor_id");

-- CreateIndex
CREATE INDEX "supervisor_assignments_leader_id_idx" ON "supervisor_assignments"("leader_id");

-- CreateIndex
CREATE INDEX "supervisor_assignments_church_deleted_at_idx" ON "supervisor_assignments"("church_id", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "supervisor_assignments_church_supervisor_leader_key" ON "supervisor_assignments"("church_id", "supervisor_id", "leader_id");

-- CreateIndex
CREATE INDEX "cells_church_id_status_idx" ON "cells"("church_id", "status");

-- CreateIndex
CREATE INDEX "cells_leader_id_idx" ON "cells"("leader_id");

-- CreateIndex
CREATE INDEX "cells_trainee_leader_id_idx" ON "cells"("trainee_leader_id");

-- CreateIndex
CREATE INDEX "cells_church_id_deleted_at_idx" ON "cells"("church_id", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "cells_id_church_id_key" ON "cells"("id", "church_id");

-- CreateIndex
CREATE UNIQUE INDEX "cells_church_id_code_key" ON "cells"("church_id", "code");

-- CreateIndex
CREATE INDEX "people_church_id_phone_idx" ON "people"("church_id", "phone");

-- CreateIndex
CREATE INDEX "people_church_id_email_idx" ON "people"("church_id", "email");

-- CreateIndex
CREATE INDEX "people_church_name_birth_date_idx" ON "people"("church_id", "full_name", "birth_date");

-- CreateIndex
CREATE INDEX "people_church_id_deleted_at_idx" ON "people"("church_id", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "people_id_church_id_key" ON "people"("id", "church_id");

-- CreateIndex
CREATE INDEX "cell_memberships_church_cell_status_idx" ON "cell_memberships"("church_id", "cell_id", "status");

-- CreateIndex
CREATE INDEX "cell_memberships_church_person_status_idx" ON "cell_memberships"("church_id", "person_id", "status");

-- CreateIndex
CREATE INDEX "cell_memberships_cell_id_idx" ON "cell_memberships"("cell_id");

-- CreateIndex
CREATE INDEX "cell_memberships_person_id_idx" ON "cell_memberships"("person_id");

-- CreateIndex
CREATE INDEX "cell_memberships_church_deleted_at_idx" ON "cell_memberships"("church_id", "deleted_at");

-- CreateIndex
CREATE INDEX "meetings_church_status_date_idx" ON "meetings"("church_id", "status", "meeting_date");

-- CreateIndex
CREATE INDEX "meetings_church_deleted_at_idx" ON "meetings"("church_id", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "meetings_id_church_id_key" ON "meetings"("id", "church_id");

-- CreateIndex
CREATE UNIQUE INDEX "meetings_church_cell_date_key" ON "meetings"("church_id", "cell_id", "meeting_date");

-- CreateIndex
CREATE INDEX "meeting_attendances_church_meeting_status_idx" ON "meeting_attendances"("church_id", "meeting_id", "attendance_status");

-- CreateIndex
CREATE INDEX "meeting_attendances_person_id_idx" ON "meeting_attendances"("person_id");

-- CreateIndex
CREATE INDEX "meeting_attendances_church_deleted_at_idx" ON "meeting_attendances"("church_id", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "meeting_attendances_church_meeting_person_key" ON "meeting_attendances"("church_id", "meeting_id", "person_id");

-- CreateIndex
CREATE INDEX "meeting_reports_church_status_submitted_idx" ON "meeting_reports"("church_id", "status", "submitted_at");

-- CreateIndex
CREATE INDEX "meeting_reports_submitted_by_idx" ON "meeting_reports"("submitted_by");

-- CreateIndex
CREATE INDEX "meeting_reports_church_deleted_at_idx" ON "meeting_reports"("church_id", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "meeting_reports_meeting_church_key" ON "meeting_reports"("meeting_id", "church_id");

-- CreateIndex
CREATE INDEX "audit_logs_church_created_at_idx" ON "audit_logs"("church_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_church_entity_entity_id_idx" ON "audit_logs"("church_id", "entity", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_church_user_created_at_idx" ON "audit_logs"("church_id", "user_id", "created_at");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_church_id_fkey" FOREIGN KEY ("church_id") REFERENCES "churches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roles" ADD CONSTRAINT "roles_church_id_fkey" FOREIGN KEY ("church_id") REFERENCES "churches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_church_id_fkey" FOREIGN KEY ("church_id") REFERENCES "churches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_church_id_fkey" FOREIGN KEY ("user_id", "church_id") REFERENCES "users"("id", "church_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_church_id_fkey" FOREIGN KEY ("role_id", "church_id") REFERENCES "roles"("id", "church_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supervisor_assignments" ADD CONSTRAINT "supervisor_assignments_church_id_fkey" FOREIGN KEY ("church_id") REFERENCES "churches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supervisor_assignments" ADD CONSTRAINT "supervisor_assignments_supervisor_id_church_id_fkey" FOREIGN KEY ("supervisor_id", "church_id") REFERENCES "users"("id", "church_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supervisor_assignments" ADD CONSTRAINT "supervisor_assignments_leader_id_church_id_fkey" FOREIGN KEY ("leader_id", "church_id") REFERENCES "users"("id", "church_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cells" ADD CONSTRAINT "cells_church_id_fkey" FOREIGN KEY ("church_id") REFERENCES "churches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cells" ADD CONSTRAINT "cells_leader_id_church_id_fkey" FOREIGN KEY ("leader_id", "church_id") REFERENCES "users"("id", "church_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cells" ADD CONSTRAINT "cells_trainee_leader_id_church_id_fkey" FOREIGN KEY ("trainee_leader_id", "church_id") REFERENCES "users"("id", "church_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "people" ADD CONSTRAINT "people_church_id_fkey" FOREIGN KEY ("church_id") REFERENCES "churches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cell_memberships" ADD CONSTRAINT "cell_memberships_church_id_fkey" FOREIGN KEY ("church_id") REFERENCES "churches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cell_memberships" ADD CONSTRAINT "cell_memberships_person_id_church_id_fkey" FOREIGN KEY ("person_id", "church_id") REFERENCES "people"("id", "church_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cell_memberships" ADD CONSTRAINT "cell_memberships_cell_id_church_id_fkey" FOREIGN KEY ("cell_id", "church_id") REFERENCES "cells"("id", "church_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meetings" ADD CONSTRAINT "meetings_church_id_fkey" FOREIGN KEY ("church_id") REFERENCES "churches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meetings" ADD CONSTRAINT "meetings_cell_id_church_id_fkey" FOREIGN KEY ("cell_id", "church_id") REFERENCES "cells"("id", "church_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meeting_attendances" ADD CONSTRAINT "meeting_attendances_church_id_fkey" FOREIGN KEY ("church_id") REFERENCES "churches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meeting_attendances" ADD CONSTRAINT "meeting_attendances_meeting_id_church_id_fkey" FOREIGN KEY ("meeting_id", "church_id") REFERENCES "meetings"("id", "church_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meeting_attendances" ADD CONSTRAINT "meeting_attendances_person_id_church_id_fkey" FOREIGN KEY ("person_id", "church_id") REFERENCES "people"("id", "church_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meeting_reports" ADD CONSTRAINT "meeting_reports_church_id_fkey" FOREIGN KEY ("church_id") REFERENCES "churches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meeting_reports" ADD CONSTRAINT "meeting_reports_meeting_id_church_id_fkey" FOREIGN KEY ("meeting_id", "church_id") REFERENCES "meetings"("id", "church_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meeting_reports" ADD CONSTRAINT "meeting_reports_submitted_by_church_id_fkey" FOREIGN KEY ("submitted_by", "church_id") REFERENCES "users"("id", "church_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_church_id_fkey" FOREIGN KEY ("church_id") REFERENCES "churches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_church_id_fkey" FOREIGN KEY ("user_id", "church_id") REFERENCES "users"("id", "church_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Persistence invariants not expressible in the Prisma schema.
ALTER TABLE "cells"
ADD CONSTRAINT "cells_distinct_leaders_check"
CHECK (
  "leader_id" IS NULL
  OR "trainee_leader_id" IS NULL
  OR "leader_id" <> "trainee_leader_id"
);

ALTER TABLE "supervisor_assignments"
ADD CONSTRAINT "supervisor_assignments_distinct_users_check"
CHECK ("supervisor_id" <> "leader_id");

ALTER TABLE "cell_memberships"
ADD CONSTRAINT "cell_memberships_valid_period_check"
CHECK ("left_at" IS NULL OR "left_at" >= "joined_at");

CREATE UNIQUE INDEX "cell_memberships_one_open_per_person_key"
ON "cell_memberships"("church_id", "person_id")
WHERE "left_at" IS NULL AND "deleted_at" IS NULL;
