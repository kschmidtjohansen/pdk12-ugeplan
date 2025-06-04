
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
        .select('*')
        .order('date', { ascending: true });

      if (error) throw error;

      const formattedAssignments: Assignment[] = data.map(assignment => ({
        id: assignment.id,
        title: assignment.title || '',
        location: assignment.location,
        date: assignment.date,
        fromTime: assignment.from_time,
        toTime: assignment.to_time,
        employees: assignment.employees || [],
        car: assignment.car_assignments ? assignment.car_assignments : null,
        notes: assignment.notes || '',
        published: assignment.published || false,
        responsibleUser: assignment.responsible_user || null
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
