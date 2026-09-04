ALTER TABLE public.assignments DISABLE TRIGGER assignment_deletion_logger;

INSERT INTO public.assignments_employees (assignment_id, user_id, is_demo)
SELECT '2e5ab798-cfbe-465e-80b8-78a3c8d837e1', 'b27d7d70-0069-449f-96a8-00323ae3febd', false
WHERE NOT EXISTS (
  SELECT 1 FROM public.assignments_employees
  WHERE assignment_id = '2e5ab798-cfbe-465e-80b8-78a3c8d837e1'
    AND user_id = 'b27d7d70-0069-449f-96a8-00323ae3febd'
);

DELETE FROM public.assignments_employees WHERE assignment_id IN ('6005ddf3-3489-4aae-b95f-dc70ef55c9c0','e16a7608-664a-4811-a9bb-b26392359d0a');
DELETE FROM public.planner_change_log WHERE assignment_id IN ('6005ddf3-3489-4aae-b95f-dc70ef55c9c0','e16a7608-664a-4811-a9bb-b26392359d0a');
DELETE FROM public.assignments WHERE id IN ('6005ddf3-3489-4aae-b95f-dc70ef55c9c0','e16a7608-664a-4811-a9bb-b26392359d0a');

ALTER TABLE public.assignments ENABLE TRIGGER assignment_deletion_logger;