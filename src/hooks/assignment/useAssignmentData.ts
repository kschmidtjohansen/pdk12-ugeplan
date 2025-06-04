
import { useState, useEffect } from 'react';
import { Assignment } from '@/types/assignment';
import { supabase } from '@/integrations/supabase/client';

export const useAssignmentData = () => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('assignments')
        .select(`
          *,
          assignments_employees(user_id)
        `)
        .order('assignment_date', { ascending: true });

      if (error) throw error;

      const formattedAssignments: Assignment[] = data.map(assignment => ({
        id: assignment.id,
        title: assignment.title || '',
        description: assignment.description || '',
        location: assignment.location,
        date: assignment.assignment_date,
        fromTime: assignment.from_time,
        toTime: assignment.to_time,
        employees: assignment.assignments_employees?.map((emp: any) => emp.user_id) || [],
        car: assignment.car_id || null,
        published: assignment.published || false,
        responsibleUser: assignment.responsible_user_id ? { id: assignment.responsible_user_id, name: '' } : null
      }));

      setAssignments(formattedAssignments);
    } catch (err) {
      console.error('Error fetching assignments:', err);
      setError('Failed to fetch assignments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  return {
    assignments,
    setAssignments,
    loading,
    error,
    fetchAssignments
  };
};
