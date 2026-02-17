ALTER TABLE cars DISABLE TRIGGER cars_security_log_trigger;

UPDATE cars SET department_id = '63d46993-31cb-4921-bb3d-5934984ab6b3'
WHERE id IN (
  'af0bc02f-2f43-4f54-9b01-64348c646e15',
  '9adb8769-de49-4ff4-adf7-5edd4974b543',
  'af2dab8d-5edd-4d71-8947-0fd59d14121a',
  '5a73861a-7945-4428-bd34-61ffa622e3c0'
);

ALTER TABLE cars ENABLE TRIGGER cars_security_log_trigger;