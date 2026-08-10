-- Indexes justified by the cell management queries (plan 007, section 14).
-- The list query filters by church, soft delete, status, leader and day, and
-- orders by allowlisted fields with an id tiebreaker. Search uses a
-- case-insensitive contains on name/code, so trigram GIN follows the existing
-- pattern already used for users and people.

CREATE INDEX "cells_church_deleted_status_name_idx"
ON "cells"("church_id", "deleted_at", "status", "name", "id");

CREATE INDEX "cells_church_leader_deleted_idx"
ON "cells"("church_id", "leader_id", "deleted_at");

CREATE INDEX "cells_church_trainee_deleted_idx"
ON "cells"("church_id", "trainee_leader_id", "deleted_at");

CREATE INDEX "supervisor_assignments_church_supervisor_deleted_leader_idx"
ON "supervisor_assignments"("church_id", "supervisor_id", "deleted_at", "leader_id");

CREATE INDEX "cells_name_trgm_idx" ON "cells" USING GIN ("name" gin_trgm_ops);
CREATE INDEX "cells_code_trgm_idx" ON "cells" USING GIN ("code" gin_trgm_ops);

-- One active supervisor per leader per church (plan invariant 21).
CREATE UNIQUE INDEX "supervisor_assignments_one_active_supervisor_per_leader_key"
ON "supervisor_assignments"("church_id", "leader_id")
WHERE "deleted_at" IS NULL;
