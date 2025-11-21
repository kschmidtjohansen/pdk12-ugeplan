import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, UserCheck, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format, differenceInDays } from 'date-fns';
import { da } from 'date-fns/locale';
import { EndSickLeaveDialog } from './EndSickLeaveDialog';

interface ActiveSickLeave {
  id: string;
  user_id: string;
  employee_name: string;
  start_date: string;
  days_sick: number;
  notes: string | null;
}

export const ActiveSickLeaveList: React.FC<{ onUpdate: () => void }> = ({ onUpdate }) => {
  const [activeSickLeaves, setActiveSickLeaves] = useState<ActiveSickLeave[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<ActiveSickLeave | null>(null);
  const [endDialogOpen, setEndDialogOpen] = useState(false);
  const { toast } = useToast();

  const fetchActiveSickLeaves = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('sick_leave_records')
        .select(`
          id,
          user_id,
          start_date,
          notes,
          profiles!inner(name)
        `)
        .is('end_date', null)
        .order('start_date', { ascending: false });

      if (error) throw error;

      const mapped = data?.map(record => ({
        id: record.id,
        user_id: record.user_id,
        employee_name: (record.profiles as any).name,
        start_date: record.start_date,
        days_sick: differenceInDays(new Date(), new Date(record.start_date)) + 1,
        notes: record.notes
      })) || [];

      setActiveSickLeaves(mapped);
    } catch (error) {
      console.error('[ActiveSickLeave] Error fetching:', error);
      toast({
        title: "Fejl",
        description: "Kunne ikke hente aktive sygeperioder",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveSickLeaves();
  }, []);

  const handleMarkAsRecovered = (record: ActiveSickLeave) => {
    setSelectedRecord(record);
    setEndDialogOpen(true);
  };

  const handleConfirmEnd = async (endDate: Date) => {
    if (!selectedRecord) return;

    try {
      const { error } = await supabase.rpc('end_sick_leave', {
        p_record_id: selectedRecord.id,
        p_end_date: format(endDate, 'yyyy-MM-dd')
      });

      if (error) throw error;

      toast({
        title: "Medarbejder raskmeldt",
        description: `${selectedRecord.employee_name} er markeret som rask fra ${format(endDate, 'PPP', { locale: da })}`,
      });

      fetchActiveSickLeaves();
      onUpdate();
    } catch (error) {
      console.error('[ActiveSickLeave] Error ending sick leave:', error);
      toast({
        title: "Fejl",
        description: "Kunne ikke raskmelde medarbejder. Prøv igen.",
        variant: "destructive"
      });
    }
  };

  if (activeSickLeaves.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-green-600" />
            Nuværende Sygeperioder
          </CardTitle>
          <CardDescription>
            Ingen medarbejdere er pt. sygemeldt
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-amber-600" />
                Nuværende Sygeperioder
              </CardTitle>
              <CardDescription>
                {activeSickLeaves.length} {activeSickLeaves.length === 1 ? 'medarbejder er' : 'medarbejdere er'} pt. sygemeldt
              </CardDescription>
            </div>
            <Button onClick={fetchActiveSickLeaves} disabled={loading} variant="ghost" size="sm">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {activeSickLeaves.map(record => (
              <div key={record.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold">{record.employee_name}</p>
                    <Badge variant={record.days_sick > 7 ? "destructive" : "secondary"}>
                      {record.days_sick} {record.days_sick === 1 ? 'dag' : 'dage'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Syg siden: {format(new Date(record.start_date), 'PPP', { locale: da })}
                  </p>
                  {record.notes && (
                    <p className="text-xs text-muted-foreground mt-1 italic">
                      Note: {record.notes}
                    </p>
                  )}
                </div>
                <Button
                  onClick={() => handleMarkAsRecovered(record)}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <UserCheck className="h-4 w-4" />
                  Raskmeldt
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <EndSickLeaveDialog
        open={endDialogOpen}
        onOpenChange={setEndDialogOpen}
        sickLeave={selectedRecord}
        onConfirm={handleConfirmEnd}
      />
    </>
  );
};
