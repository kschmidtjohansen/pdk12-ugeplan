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
import { rpcWithRefresh } from '@/integrations/supabase/safeRpc';

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

  const checkAndSendNotifications = async (records: ActiveSickLeave[]) => {
    // Check for employees sick > 7 days and send notifications if not already sent
    for (const record of records) {
      if (record.days_sick > 7) {
        try {
          // Check if notification already sent for this sick leave
          const { data: existingNotif } = await supabase
            .from('sick_leave_notifications_sent')
            .select('id')
            .eq('sick_leave_id', record.id)
            .maybeSingle();

          if (!existingNotif) {
            // Get all administrators
            const { data: admins } = await supabase
              .from('user_roles')
              .select('user_id')
              .eq('role', 'administrator');

            if (admins && admins.length > 0) {
              // Send notification to each admin
              const notifications = admins.map(admin => ({
                user_id: admin.user_id,
                type: 'sick_leave_alert',
                title: 'Lang sygeperiode opdaget',
                message: `En medarbejder har været syg i ${record.days_sick} dage (siden ${format(new Date(record.start_date), 'PPP', { locale: da })})`,
                link: '/admin?tab=sick-leave',
                read: false
              }));

              await supabase.from('notifications').insert(notifications);

              // Track that notification was sent
              await supabase.from('sick_leave_notifications_sent').insert({
                sick_leave_id: record.id,
                days_when_sent: record.days_sick
              });

              console.log(`[ActiveSickLeave] Notification sent for sick leave ${record.id}`);
            }
          }
        } catch (error) {
          console.error('[ActiveSickLeave] Error sending notification:', error);
        }
      }
    }
  };

  const fetchActiveSickLeaves = async () => {
    setLoading(true);
    try {
      // Use a direct query instead of nested select to avoid RLS issues
      const { data, error } = await supabase
        .from('sick_leave_records')
        .select('id, user_id, start_date, notes')
        .is('end_date', null)
        .order('start_date', { ascending: false });

      if (error) throw error;

      // Fetch employee names separately
      const userIds = data?.map(record => record.user_id) || [];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name')
        .in('id', userIds);

      const mapped = data?.map(record => {
        const profile = profiles?.find(p => p.id === record.user_id);
        return {
          id: record.id,
          user_id: record.user_id,
          employee_name: profile?.name || 'Ukendt medarbejder',
          start_date: record.start_date,
          days_sick: differenceInDays(new Date(), new Date(record.start_date)) + 1,
          notes: record.notes
        };
      }) || [];

      setActiveSickLeaves(mapped);
      
      // Check and send notifications for long sick leaves
      await checkAndSendNotifications(mapped);
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
                    <Badge 
                      variant={record.days_sick >= 3 ? "destructive" : "default"}
                      className={record.days_sick <= 2 ? "bg-orange-100 text-orange-800 hover:bg-orange-100 dark:bg-orange-950 dark:text-orange-400" : ""}
                    >
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
                  className="gap-2 hover:bg-green-50 hover:text-green-700 hover:border-green-300 dark:hover:bg-green-950 dark:hover:text-green-400 dark:hover:border-green-800 transition-colors"
                >
                  <UserCheck className="h-4 w-4" />
                  Raskmeld
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
