-- Change planner_change_log foreign key to preserve historical entries when assignments are deleted
-- Drop the existing foreign key constraint
ALTER TABLE public.planner_change_log 
DROP CONSTRAINT IF EXISTS planner_change_log_assignment_id_fkey;

-- Recreate the foreign key with ON DELETE SET NULL instead of CASCADE
-- This preserves all historical log entries even after the assignment is deleted
ALTER TABLE public.planner_change_log 
ADD CONSTRAINT planner_change_log_assignment_id_fkey 
FOREIGN KEY (assignment_id) 
REFERENCES public.assignments(id) 
ON DELETE SET NULL;