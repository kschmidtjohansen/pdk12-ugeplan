import * as React from 'react';
const { useState, useEffect } = React;
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';

export interface CalibrationReport {
  id: string;
  department_and_employee: string;
  report_number: string;
  control_date: string;
  notes?: string | null;
  status: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface EquipmentEntry {
  id?: string;
  report_id?: string;
  equipment_number: number;
  product_name?: string | null;
  product_number?: string | null;
  approved_margin?: string | null;
  measured_result?: string | null;
  assessment?: string | null;
  initials?: string | null;
}

export const useCalibration = () => {
  const [reports, setReports] = useState<CalibrationReport[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchReports = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('calibration_reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast({
        title: "Fejl",
        description: "Kunne ikke hente rapporter",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveReport = async (
    reportData: Omit<CalibrationReport, 'id' | 'created_at' | 'updated_at' | 'created_by'>,
    equipmentEntries: EquipmentEntry[]
  ) => {
    try {
      if (!user) throw new Error('User not authenticated');

      const { data: report, error: reportError } = await supabase
        .from('calibration_reports')
        .insert({
          ...reportData,
          created_by: user.id
        })
        .select()
        .single();

      if (reportError) throw reportError;

      // Save equipment entries
      const entriesWithReportId = equipmentEntries.map(entry => ({
        ...entry,
        report_id: report.id
      }));

      const { error: entriesError } = await supabase
        .from('calibration_equipment_entries')
        .insert(entriesWithReportId);

      if (entriesError) throw entriesError;

      toast({
        title: "Succes",
        description: "Rapporten blev gemt",
      });

      fetchReports();
      return report;
    } catch (error) {
      console.error('Error saving report:', error);
      toast({
        title: "Fejl",
        description: "Kunne ikke gemme rapporten",
        variant: "destructive",
      });
      throw error;
    }
  };

  const getEquipmentEntries = async (reportId: string): Promise<EquipmentEntry[]> => {
    try {
      const { data, error } = await supabase
        .from('calibration_equipment_entries')
        .select('*')
        .eq('report_id', reportId)
        .order('equipment_number');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching equipment entries:', error);
      return [];
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  return {
    reports,
    loading,
    saveReport,
    getEquipmentEntries,
    fetchReports
  };
};