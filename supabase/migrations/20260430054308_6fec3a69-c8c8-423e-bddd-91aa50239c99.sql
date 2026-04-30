
-- Drop pg_graphql since the application uses PostgREST only.
-- This silences lints 0026 and 0027 for every table without affecting
-- application functionality.
DROP EXTENSION IF EXISTS pg_graphql CASCADE;

-- Avatar bucket listing: ensure no broad public-role SELECT exists.
-- (CDN access via getPublicUrl bypasses RLS and continues to work.)
DROP POLICY IF EXISTS "Authenticated users can view avatars" ON storage.objects;
CREATE POLICY "Avatars readable by authenticated users"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'avatars');
