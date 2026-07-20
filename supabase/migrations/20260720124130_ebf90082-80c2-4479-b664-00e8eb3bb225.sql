ALTER TABLE public.planner_change_log
DROP CONSTRAINT IF EXISTS planner_change_log_operation_check;

ALTER TABLE public.planner_change_log
ADD CONSTRAINT planner_change_log_operation_check
CHECK (operation = ANY (ARRAY[
  'CREATE'::text,
  'UPDATE'::text,
  'DELETE'::text,
  'PUBLISH'::text,
  'EMPLOYEE_CREATED'::text,
  'EMPLOYEE_UPDATED'::text,
  'EMPLOYEE_DELETED'::text
]));