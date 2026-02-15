
-- Tilføj manglende indexes for department_id/sub_department_id filtrering
CREATE INDEX IF NOT EXISTS idx_assignments_department ON assignments(department_id);
CREATE INDEX IF NOT EXISTS idx_assignments_sub_department ON assignments(sub_department_id);
CREATE INDEX IF NOT EXISTS idx_on_call_duties_department ON on_call_duties(department_id);
CREATE INDEX IF NOT EXISTS idx_on_call_duties_sub_department ON on_call_duties(sub_department_id);
CREATE INDEX IF NOT EXISTS idx_vacations_department ON vacations(department_id);
CREATE INDEX IF NOT EXISTS idx_vacations_sub_department ON vacations(sub_department_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_items_department ON warehouse_items(department_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_items_sub_department ON warehouse_items(sub_department_id);

-- Fjern redundante indexes på assignments
DROP INDEX IF EXISTS idx_assignments_date_published;
DROP INDEX IF EXISTS idx_assignments_responsible_user;
DROP INDEX IF EXISTS idx_assignments_responsible_published;
