import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useDepartment } from '@/context/DepartmentContext';
import { getSchemaClient } from '@/integrations/supabase/demoSchemaClient';

export type ChangeLogOperation =
  | 'CREATE' | 'UPDATE' | 'DELETE' | 'PUBLISH'
  | 'VACATION_REQUESTED' | 'VACATION_APPROVED' | 'VACATION_REJECTED' | 'VACATION_CANCELLED'
  | 'EMPLOYEE_CREATED' | 'EMPLOYEE_UPDATED' | 'EMPLOYEE_DELETED';

export interface ChangeLogEntry {
  id: string;
  assignment_id: string | null;
  operation: ChangeLogOperation;
  changed_by: string;
  changed_by_name: string;
  changed_by_first_name: string | null;
  change_details: any;
  created_at: string;
}

interface ChangeLogContextType {
  changeLogs: ChangeLogEntry[];
  unviewedCount: number;
  loading: boolean;
  fetchChangeLogs: () => Promise<void>;
  fetchChangeLogsByDateRange: (startDate: Date, endDate: Date) => Promise<ChangeLogEntry[]>;
  fetchChangeLogsByCaseNumber: (caseNumber: string) => Promise<ChangeLogEntry[]>;
  markAsViewed: () => void;
}

const defaultContext: ChangeLogContextType = {
  changeLogs: [],
  unviewedCount: 0,
  loading: false,
  fetchChangeLogs: async () => {},
  fetchChangeLogsByDateRange: async () => [],
  fetchChangeLogsByCaseNumber: async () => [],
  markAsViewed: () => {}
};

const ChangeLogContext = createContext<ChangeLogContextType>(defaultContext);

export const useChangeLogs = () => useContext(ChangeLogContext);

const LAST_VIEWED_KEY = 'planner-changes-last-viewed';

const isInRange = (value: string | null | undefined, startDate: Date, endDate: Date): boolean => {
  if (!value) return false;
  const time = new Date(value).getTime();
  return time >= startDate.getTime() && time <= endDate.getTime();
};

// Map a vacations row to a virtual ChangeLogEntry
const vacationRowToEntry = (row: any): ChangeLogEntry | null => {
  if (!row) return null;
  const status = row.status as string;
  let operation: ChangeLogOperation;
  let ts: string = row.updated_at || row.created_at;
  if (status === 'pending') {
    operation = 'VACATION_REQUESTED';
    ts = row.created_at || ts;
  } else if (status === 'approved') {
    operation = 'VACATION_APPROVED';
  } else if (status === 'rejected') {
    operation = 'VACATION_REJECTED';
  } else if (status === 'cancelled') {
    operation = 'VACATION_CANCELLED';
  } else {
    return null;
  }
  const employeeName = row.user?.name || row.profiles?.name || 'Medarbejder';
  const reviewerName: string | null = row.reviewer?.name || null;
  const isReviewEvent = status === 'approved' || status === 'rejected' || status === 'cancelled';
  const actorName = isReviewEvent && reviewerName ? reviewerName : employeeName;
  const actorId = isReviewEvent && row.reviewed_by ? row.reviewed_by : row.user_id;
  if (isReviewEvent && row.reviewed_at) {
    ts = row.reviewed_at;
  }
  return {
    id: `vacation-${row.id}-${status}`,
    assignment_id: null,
    operation,
    changed_by: actorId,
    changed_by_name: actorName,
    changed_by_first_name: (actorName || '').split(' ')[0] || actorName,
    change_details: {
      vacation_id: row.id,
      user_id: row.user_id,
      user_name: employeeName,
      reviewer_name: reviewerName,
      start_date: row.start_date,
      end_date: row.end_date,
      request_type: row.request_type,
      reason: row.reason,
      notes: row.notes,
    },
    created_at: ts,
  };
};

const profileRowToEmployeeCreatedEntry = (row: any): ChangeLogEntry | null => {
  if (!row?.id || !row?.created_at) return null;
  const employeeName = row.name || 'Medarbejder';
  return {
    id: `employee-created-${row.id}`,
    assignment_id: null,
    operation: 'EMPLOYEE_CREATED',
    changed_by: row.id,
    changed_by_name: 'System',
    changed_by_first_name: 'System',
    change_details: {
      employee_id: row.id,
      employee_name: employeeName,
      employee_email: row.email,
      department_id: row.home_department_id || null,
      virtual_from_profile: true,
    },
    created_at: row.created_at,
  };
};


export const ChangeLogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const { selectedDepartmentId } = useDepartment();
  const [changeLogs, setChangeLogs] = useState<ChangeLogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastViewedTime, setLastViewedTime] = useState<string | null>(
    localStorage.getItem(LAST_VIEWED_KEY)
  );

  // Get user IDs belonging to the selected department (via user_access + home_department_id)
  const getDepartmentUserIds = async (): Promise<string[] | null> => {
    if (!selectedDepartmentId) return null;
    try {
      const [{ data: access }, { data: homes }] = await Promise.all([
        supabase.from('user_access').select('user_id').eq('department_id', selectedDepartmentId),
        supabase.from('profiles').select('id').eq('home_department_id', selectedDepartmentId),
      ]);
      const ids = new Set<string>();
      (access || []).forEach((r: any) => r?.user_id && ids.add(r.user_id));
      (homes || []).forEach((r: any) => r?.id && ids.add(r.id));
      return Array.from(ids);
    } catch (e) {
      if (import.meta.env.DEV) console.warn('[ChangeLogContext] getDepartmentUserIds failed', e);
      return null;
    }
  };

  const fetchChangeLogs = async () => {
    if (!isAuthenticated || !user) return;

    try {
      setLoading(true);
      const endDate = new Date();
      const startDate = new Date(endDate);
      startDate.setDate(endDate.getDate() - 30);
      const logs = await fetchChangeLogsByDateRange(startDate, endDate);
      setChangeLogs(logs.slice(0, 50));
    } catch (error) {
      if (import.meta.env.DEV) console.error('[ChangeLogContext] Failed to fetch change logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchChangeLogsByDateRange = async (startDate: Date, endDate: Date): Promise<ChangeLogEntry[]> => {
    if (!isAuthenticated || !user) return [];
    try {
      const isDemoMode = user.email === 'test@polygongroup.com';
      const client = getSchemaClient(isDemoMode);

      // Fetch dept scoping sets (used to filter client-side)
      let deptAssignmentIdSet: Set<string> | null = null;
      if (selectedDepartmentId && !isDemoMode) {
        const { data: deptAssignments } = await client
          .from('assignments').select('id').eq('department_id', selectedDepartmentId);
        deptAssignmentIdSet = new Set((deptAssignments || []).map((a: any) => a.id));
      }
      const deptUserIds = await getDepartmentUserIds();
      const deptUserIdSet = deptUserIds ? new Set(deptUserIds) : null;

      // Planner logs: fetch unfiltered, filter client-side so we don't drop
      // rows with NULL assignment_id (bulk events) or rows whose assignment
      // has since been deleted (DELETE events).
      const plannerQ = client.from('planner_change_log').select('*')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: false });

      let vacQ = client.from('vacations')
        .select('id, user_id, start_date, end_date, request_type, status, reason, notes, created_at, updated_at, reviewed_by, reviewed_at, user:profiles!user_id(name), reviewer:profiles!reviewed_by(name)')
        .order('updated_at', { ascending: false });
      if (deptUserIds !== null) {
        if (deptUserIds.length === 0) {
          vacQ = vacQ.eq('id', '00000000-0000-0000-0000-000000000000');
        } else {
          vacQ = vacQ.in('user_id', deptUserIds);
        }
      }

      const [{ data: plannerData, error: pErr }, vacResult] = await Promise.all([plannerQ, vacQ]);
      if (pErr) throw pErr;

      // Determine which assignment_ids referenced by logs actually exist —
      // any missing ones represent deleted assignments and should still show.
      let existingAssignmentIds: Set<string> = new Set();
      const referencedIds = Array.from(new Set(
        (plannerData || [])
          .map((l: any) => l.assignment_id)
          .filter((id: any): id is string => !!id)
      ));
      if (referencedIds.length > 0) {
        const { data: existing } = await client
          .from('assignments').select('id').in('id', referencedIds);
        existingAssignmentIds = new Set((existing || []).map((a: any) => a.id));
      }

      const filteredPlanner = (plannerData || []).filter((log: any) => {
        if (deptAssignmentIdSet === null) return true; // no dept selected — show all
        if (log.operation?.startsWith?.('EMPLOYEE_')) {
          const employeeDeptId = log.change_details?.department_id;
          const employeeId = log.change_details?.employee_id;
          return employeeDeptId === selectedDepartmentId || (employeeId && deptUserIdSet?.has(employeeId));
        }
        if (!log.assignment_id) return true;           // bulk/system events
        if (deptAssignmentIdSet.has(log.assignment_id)) return true; // this dept
        if (!existingAssignmentIds.has(log.assignment_id)) return true; // deleted assignment
        return false;
      });

      const loggedEmployeeCreateIds = new Set(
        filteredPlanner
          .filter((log: any) => log.operation === 'EMPLOYEE_CREATED' && log.change_details?.employee_id)
          .map((log: any) => log.change_details.employee_id)
      );

      let employeeEntries: ChangeLogEntry[] = [];
      if (deptUserIds === null || deptUserIds.length > 0) {
        let profilesQ = client.from('profiles')
          .select('id, name, email, created_at, home_department_id')
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString())
          .order('created_at', { ascending: false });
        if (deptUserIds !== null) {
          profilesQ = profilesQ.in('id', deptUserIds);
        }
        const { data: profiles, error: profilesErr } = await profilesQ;
        if (profilesErr) {
          if (import.meta.env.DEV) console.warn('[ChangeLogContext] profiles fetch failed', profilesErr);
        } else {
          employeeEntries = (profiles || [])
            .filter((profile: any) => !loggedEmployeeCreateIds.has(profile.id))
            .map(profileRowToEmployeeCreatedEntry)
            .filter((e): e is ChangeLogEntry => e !== null);
        }
      }

      const vacEntries = (vacResult.data || [])
        .map(vacationRowToEntry)
        .filter((e): e is ChangeLogEntry => e !== null)
        .filter((e) => isInRange(e.created_at, startDate, endDate));
      return [...(filteredPlanner as ChangeLogEntry[]), ...vacEntries, ...employeeEntries]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } catch (error) {
      if (import.meta.env.DEV) console.error('[ChangeLogContext] Failed to fetch logs by date range:', error);
      return [];
    }
  };


  const fetchChangeLogsByCaseNumber = async (caseNumber: string): Promise<ChangeLogEntry[]> => {
    if (!isAuthenticated || !user) return [];
    try {
      const isDemoMode = user.email === 'test@polygongroup.com';
      const client = getSchemaClient(isDemoMode);
      const { data, error } = await client
        .from('planner_change_log').select('*')
        .contains('change_details', { case_number: caseNumber })
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as ChangeLogEntry[];
    } catch (error) {
      if (import.meta.env.DEV) console.error('[ChangeLogContext] Failed to fetch logs by case number:', error);
      return [];
    }
  };

  const markAsViewed = () => {
    const now = new Date().toISOString();
    localStorage.setItem(LAST_VIEWED_KEY, now);
    setLastViewedTime(now);
  };

  const unviewedCount = changeLogs.filter((log) => {
    if (!lastViewedTime) return true;
    return new Date(log.created_at) > new Date(lastViewedTime);
  }).length;

  useEffect(() => {
    fetchChangeLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, isAuthenticated, selectedDepartmentId]);

  // Realtime: planner_change_log + vacations
  useEffect(() => {
    if (!isAuthenticated || !user) return;
    const isDemoMode = user.email === 'test@polygongroup.com';
    const schema = isDemoMode ? 'demo' : 'public';

    const channel = supabase
      .channel('changelog-and-vacations')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema, table: 'planner_change_log' },
        async (payload) => {
          let newLog = payload.new as ChangeLogEntry;
          if (newLog.assignment_id && !newLog.change_details?.case_number) {
            const client = getSchemaClient(isDemoMode);
            const { data: assignment } = await client
              .from('assignments').select('case_number, title')
              .eq('id', newLog.assignment_id).single();
            if (assignment) {
              newLog = {
                ...newLog,
                change_details: {
                  ...newLog.change_details,
                  case_number: (assignment as any).case_number || (assignment as any).title,
                },
              };
            }
          }
          setChangeLogs((prev) => [newLog, ...prev].slice(0, 50));
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema, table: 'vacations' },
        () => {
          // Simple approach: refetch to keep department filter & user names correct
          fetchChangeLogs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user?.id, selectedDepartmentId]);

  return (
    <ChangeLogContext.Provider value={{ changeLogs, unviewedCount, loading, fetchChangeLogs, fetchChangeLogsByDateRange, fetchChangeLogsByCaseNumber, markAsViewed }}>
      {children}
    </ChangeLogContext.Provider>
  );
};
