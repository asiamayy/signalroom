-- AI-generated cover images for projects, reusing the same fal.ai
-- (flux/schnell) pipeline already used to generate persona avatars.
ALTER TABLE projects ADD COLUMN IF NOT EXISTS cover_image_url text;
