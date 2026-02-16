
-- Fase 10: Sikkerhedsoprydning

-- 1a) Tilføj search_path til SECURITY DEFINER funktioner (beholder originale parameternavne)

CREATE OR REPLACE FUNCTION public.can_user_access_assignment(assignment_id uuid, user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM assignments_employees ae
    WHERE ae.assignment_id = can_user_access_assignment.assignment_id
      AND ae.user_id = can_user_access_assignment.user_id
  ) OR EXISTS (
    SELECT 1 FROM assignments a
    WHERE a.id = can_user_access_assignment.assignment_id
      AND a.responsible_user_id = can_user_access_assignment.user_id
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.can_access_assignment(assignment_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (
    public.is_admin_or_skadeleder()
    OR public.can_user_access_assignment(can_access_assignment.assignment_id, auth.uid())
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
      AND role IN ('administrator', 'super_admin')
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS user_role
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role user_role;
BEGIN
  SELECT role INTO v_role
  FROM user_roles
  WHERE user_id = auth.uid();
  
  RETURN COALESCE(v_role, 'servicemedarbejder'::user_role);
END;
$$;

-- 1b) CHECK constraints
ALTER TABLE assignment_messages 
ADD CONSTRAINT message_length_check 
CHECK (length(message) <= 5000 AND length(trim(message)) > 0);

ALTER TABLE assignment_files 
ADD CONSTRAINT comment_length_check 
CHECK (comment IS NULL OR length(comment) <= 2000);

-- 1c) Stram storage bucket policy
DROP POLICY IF EXISTS "Authenticated users can read assignment files" ON storage.objects;

CREATE POLICY "Users can read assignment files they have access to"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'assignment-files' 
  AND auth.uid() IS NOT NULL
  AND (
    public.is_admin_or_skadeleder()
    OR EXISTS (
      SELECT 1 FROM public.assignment_files af
      WHERE af.file_path = storage.objects.name
      AND (
        af.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.assignments_employees ae
          WHERE ae.assignment_id = af.assignment_id AND ae.user_id = auth.uid()
        )
        OR EXISTS (
          SELECT 1 FROM public.assignments a
          WHERE a.id = af.assignment_id AND a.responsible_user_id = auth.uid()
        )
      )
    )
  )
);
