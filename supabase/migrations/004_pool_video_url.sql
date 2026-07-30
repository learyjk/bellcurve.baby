-- Optional external video (e.g. YouTube) to embed on the pool detail page.
ALTER TABLE pools ADD COLUMN IF NOT EXISTS video_url text;
