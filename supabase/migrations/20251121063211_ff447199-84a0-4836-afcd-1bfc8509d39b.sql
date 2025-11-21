-- Drop any existing overly permissive policy
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Create a new policy that allows all authenticated users to view profiles
-- This is necessary for duty management where users need to see who's on call
CREATE POLICY "Authenticated users can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- Add a comment explaining why this policy exists
COMMENT ON POLICY "Authenticated users can view all profiles" ON public.profiles IS 
'Allows all authenticated employees to view profile information (names, avatars) 
for duty coordination. This is safe as all users are verified employees and 
profile names are not sensitive workplace information.';