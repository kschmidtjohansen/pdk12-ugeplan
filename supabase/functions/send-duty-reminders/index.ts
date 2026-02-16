import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';
import { format } from 'https://esm.sh/date-fns@4.1.0';
import { da } from 'https://esm.sh/date-fns@4.1.0/locale/da';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Duty {
  id: string;
  duty_date: string;
  duty_type: 'skadeleder_vagt' | 'kørevagt';
  employee_id: string | null;
  employee?: {
    id: string;
    name: string;
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Validate CRON_SECRET for system-only access
  const cronSecret = Deno.env.get('CRON_SECRET');
  const providedSecret = req.headers.get('x-cron-secret');
  if (!cronSecret || providedSecret !== cronSecret) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting duty reminder check...');

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    console.log('Checking for duties on:', tomorrowStr);

    const { data: duties, error: dutiesError } = await supabase
      .from('on_call_duties')
      .select(`
        id,
        duty_date,
        duty_type,
        employee_id,
        employee:profiles!on_call_duties_employee_id_fkey(id, name)
      `)
      .eq('duty_date', tomorrowStr)
      .not('employee_id', 'is', null);

    if (dutiesError) {
      console.error('Error fetching duties:', dutiesError);
      throw dutiesError;
    }

    console.log(`Found ${duties?.length || 0} duties for tomorrow`);

    if (!duties || duties.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No duties found for tomorrow', reminders_sent: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    const remindersSent: string[] = [];
    const errors: string[] = [];

    for (const duty of duties as Duty[]) {
      if (!duty.employee_id) continue;

      const dutyTypeLabel = duty.duty_type === 'skadeleder_vagt' 
        ? 'Skadeleder vagt' 
        : 'Kørevagt';

      const formattedDate = format(new Date(duty.duty_date), 'EEEE d. MMMM', { locale: da });

      const notification = {
        user_id: duty.employee_id,
        type: 'duty',
        title: 'Vagt påmindelse',
        message: `Du har ${dutyTypeLabel} i morgen (${formattedDate})`,
        link: '/duty',
        read: false,
      };

      const { error: notificationError } = await supabase
        .from('notifications')
        .insert(notification);

      if (notificationError) {
        console.error('Error creating notification:', notificationError);
        errors.push(`Failed to notify ${duty.employee?.name || duty.employee_id}: ${notificationError.message}`);
      } else {
        remindersSent.push(duty.employee?.name || duty.employee_id);
      }
    }

    console.log(`Reminders sent: ${remindersSent.length}, Errors: ${errors.length}`);

    return new Response(
      JSON.stringify({
        success: true,
        reminders_sent: remindersSent.length,
        employees_notified: remindersSent,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error: any) {
    console.error('Error in send-duty-reminders function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
