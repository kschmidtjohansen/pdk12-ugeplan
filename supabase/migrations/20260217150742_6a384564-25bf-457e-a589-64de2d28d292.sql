ALTER TABLE cars DROP CONSTRAINT IF EXISTS unique_fuel_card_code_per_dept;
ALTER TABLE cars ALTER COLUMN fuel_card_code DROP NOT NULL;
ALTER TABLE cars ALTER COLUMN fuel_card_code SET DEFAULT NULL;
UPDATE cars SET fuel_card_code = NULL WHERE fuel_card_code LIKE 'AUTO-%';