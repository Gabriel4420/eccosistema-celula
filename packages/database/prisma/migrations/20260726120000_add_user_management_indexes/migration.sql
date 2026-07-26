CREATE INDEX "users_church_name_id_idx"
ON "users"("church_id", "last_name", "first_name", "id");

CREATE INDEX "user_roles_church_role_deleted_idx"
ON "user_roles"("church_id", "role_id", "deleted_at");
