-- Persistence invariants for cell management (plan 007, section 14).
-- The checks enforce only deterministic properties of the persisted value:
-- canonical code format and non-empty name/address. Diacritics/separator
-- normalization is responsibility of the tested normalizer before writing.

ALTER TABLE "cells"
ADD CONSTRAINT "cells_code_canonical_check"
CHECK (
  "code" = upper(btrim("code"))
  AND "code" ~ '^[A-Z0-9]+(?:-[A-Z0-9]+)*$'
);

ALTER TABLE "cells"
ADD CONSTRAINT "cells_name_not_blank_check"
CHECK (length(btrim("name")) > 0);

ALTER TABLE "cells"
ADD CONSTRAINT "cells_address_not_blank_check"
CHECK (length(btrim("address")) > 0);

-- An ACTIVE cell requires a leader (plan invariant 19).
ALTER TABLE "cells"
ADD CONSTRAINT "cells_active_requires_leader_check"
CHECK ("status" <> 'ACTIVE' OR "leader_id" IS NOT NULL);
