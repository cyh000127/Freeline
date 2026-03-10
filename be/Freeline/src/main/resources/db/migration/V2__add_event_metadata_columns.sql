ALTER TABLE events
ADD COLUMN IF NOT EXISTS description TEXT;

ALTER TABLE events
ADD COLUMN IF NOT EXISTS location_address VARCHAR(255);

ALTER TABLE events
ADD COLUMN IF NOT EXISTS thumbnail_image_url VARCHAR(500);

UPDATE events
SET description = ''
WHERE description IS NULL;

UPDATE events
SET location_address = ''
WHERE location_address IS NULL;

ALTER TABLE events
ALTER COLUMN description SET NOT NULL;

ALTER TABLE events
ALTER COLUMN location_address SET NOT NULL;