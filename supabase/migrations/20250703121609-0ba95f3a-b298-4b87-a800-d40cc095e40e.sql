-- Phase 1: Fix Foreign Key Constraints
-- Remove duplicate and problematic foreign key constraints

-- First, remove old/duplicate foreign key constraints on assignments table
ALTER TABLE public.assignments 
DROP CONSTRAINT IF EXISTS assignments_car_id_fkey;

ALTER TABLE public.assignments 
DROP CONSTRAINT IF EXISTS assignments_responsible_user_id_fkey;

-- Remove old/duplicate foreign key constraints on assignments_employees table  
ALTER TABLE public.assignments_employees 
DROP CONSTRAINT IF EXISTS assignments_employees_assignment_id_fkey;

ALTER TABLE public.assignments_employees 
DROP CONSTRAINT IF EXISTS assignments_employees_user_id_fkey;

-- Keep only the properly named foreign key constraints that already exist:
-- fk_assignments_car_id -> cars(id)
-- fk_assignments_responsible_user_id -> profiles(id) 
-- fk_assignments_employees_assignment_id -> assignments(id)
-- fk_assignments_employees_user_id -> profiles(id)

-- Verify all foreign keys point to correct tables (not auth.users)
-- The existing fk_* constraints should already be pointing to the right tables
-- This migration just removes the duplicates

-- Add index for performance on frequently queried foreign key columns
CREATE INDEX IF NOT EXISTS idx_assignments_responsible_user_id ON public.assignments (responsible_user_id);
CREATE INDEX IF NOT EXISTS idx_assignments_employees_user_id ON public.assignments_employees (user_id);
CREATE INDEX IF NOT EXISTS idx_assignments_employees_assignment_id ON public.assignments_employees (assignment_id);