-- profiles: GPS for medarbejderens hjemmepostnummer
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS lat float8;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS lng float8;

-- assignments: GPS for opgavens lokation
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS lat float8;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS lng float8;