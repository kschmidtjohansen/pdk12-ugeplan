-- Add certification fields to profiles table
ALTER TABLE profiles
ADD COLUMN has_asbestos_certificate BOOLEAN DEFAULT FALSE,
ADD COLUMN has_trailer_license BOOLEAN DEFAULT FALSE,
ADD COLUMN has_drivers_license BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN profiles.has_asbestos_certificate IS 'Asbestbevis - Asbestos certificate';
COMMENT ON COLUMN profiles.has_trailer_license IS 'Trailerkørekort - Trailer driving license';
COMMENT ON COLUMN profiles.has_drivers_license IS 'Kørekort - General driving license';