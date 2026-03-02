-- Fix storage.objects policies for super_admin on assignment-files bucket
-- Use is_admin_or_skadeleder() which includes super_admin

DROP POLICY IF EXISTS "Admin and Skadeleder can delete assignment files" ON storage.objects;
CREATE POLICY "Admin and Skadeleder can delete assignment files" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'assignment-files' AND public.is_admin_or_skadeleder()
  );

DROP POLICY IF EXISTS "Admin and Skadeleder can update assignment files" ON storage.objects;
CREATE POLICY "Admin and Skadeleder can update assignment files" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'assignment-files' AND public.is_admin_or_skadeleder()
  );