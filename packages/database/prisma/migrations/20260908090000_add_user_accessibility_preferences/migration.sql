ALTER TABLE "user_preferences"
  ADD COLUMN "accessibility_contrast" VARCHAR(10) NOT NULL DEFAULT 'system',
  ADD COLUMN "accessibility_text_scale" VARCHAR(16) NOT NULL DEFAULT 'standard',
  ADD COLUMN "accessibility_motion" VARCHAR(10) NOT NULL DEFAULT 'system',
  ADD COLUMN "accessibility_focus" VARCHAR(10) NOT NULL DEFAULT 'standard';
