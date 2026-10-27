import { supabase } from '@/integrations/supabase/client';

/** Car IDs linked to the given sub-department (cars may belong to any department). */
export async function carIdsForSubDepartment(subDepartmentId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('car_sub_departments')
    .select('car_id')
    .eq('sub_department_id', subDepartmentId);
  if (error) throw new Error(`Car sub-department fetch failed: ${error.message}`);
  return (data || []).map(r => r.car_id).filter(Boolean);
}

/** Car IDs (among carIds) linked to any sub-department of the given department. */
export async function carIdsLinkedInDepartment(departmentId: string, carIds: string[]): Promise<Set<string>> {
  if (carIds.length === 0) return new Set();
  const { data: subs, error: subErr } = await supabase
    .from('sub_departments')
    .select('id')
    .eq('department_id', departmentId);
  if (subErr) throw new Error(`Sub-department fetch failed: ${subErr.message}`);
  const subIds = (subs || []).map(s => s.id);
  if (subIds.length === 0) return new Set();
  const { data, error } = await supabase
    .from('car_sub_departments')
    .select('car_id')
    .in('car_id', carIds)
    .in('sub_department_id', subIds);
  if (error) throw new Error(`Car sub-department fetch failed: ${error.message}`);
  return new Set((data || []).map(r => r.car_id));
}
