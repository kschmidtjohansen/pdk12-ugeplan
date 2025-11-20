import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';
import { format } from 'https://esm.sh/date-fns@4.1.0';
import { da } from 'https://esm.sh/date-fns@4.1.0/locale/da';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SwapDutyRequest {
  dutyId: string;
  newEmployeeId: string;
  reason?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    // Check if user has admin or skadeleder role
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!userRole || !['administrator', 'skadeleder'].includes(userRole.role)) {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      );
    }

    const { dutyId, newEmployeeId, reason }: SwapDutyRequest = await req.json();

    console.log('Swapping duty:', { dutyId, newEmployeeId, reason });

    // Get the current duty
    const { data: duty, error: dutyError } = await supabase
      .from('on_call_duties')
      .select(`
        id,
        duty_date,
        duty_type,
        employee_id,
        notes,
        original_employee:profiles!on_call_duties_employee_id_fkey(id, name)
      `)
      .eq('id', dutyId)
      .single();

    if (dutyError || !duty) {
      throw new Error('Duty not found');
    }

    // Get new employee details
    const { data: newEmployee, error: employeeError } = await supabase
      .from('profiles')
      .select('id, name, status')
      .eq('id', newEmployeeId)
      .single();

    if (employeeError || !newEmployee) {
      throw new Error('New employee not found');
    }

    if (newEmployee.status !== 'active') {
      throw new Error('New employee is not active');
    }

    // Verify role for skadeleder_vagt
    if (duty.duty_type === 'skadeleder_vagt') {
      const { data: newEmployeeRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', newEmployeeId)
        .single();

      if (!newEmployeeRole || !['administrator', 'skadeleder'].includes(newEmployeeRole.role)) {
        return new Response(
          JSON.stringify({ error: 'Only administrators and skadeledere can be assigned to skadeleder vagt' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }
    }

    // Update the duty
    const updatedNotes = reason 
      ? `${duty.notes || ''}\n\nOmtildelt: ${reason}`.trim()
      : duty.notes;

    const { error: updateError } = await supabase
      .from('on_call_duties')
      .update({ 
        employee_id: newEmployeeId,
        notes: updatedNotes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', dutyId);

    if (updateError) {
      console.error('Error updating duty:', updateError);
      throw updateError;
    }

    const dutyTypeLabel = duty.duty_type === 'skadeleder_vagt' ? 'Skadeleder vagt' : 'Kørevagt';
    const formattedDate = format(new Date(duty.duty_date), 'EEEE d. MMMM', { locale: da });

    // Notify original employee if they exist
    if (duty.employee_id) {
      await supabase.from('notifications').insert({
        user_id: duty.employee_id,
        type: 'duty',
        title: 'Vagt overført',
        message: `Din ${dutyTypeLabel} den ${formattedDate} er blevet overført til ${newEmployee.name}${reason ? `: ${reason}` : ''}`,
        link: '/duty',
        read: false,
      });
    }

    // Notify new employee
    await supabase.from('notifications').insert({
      user_id: newEmployeeId,
      type: 'duty',
      title: 'Ny vagt tildelt',
      message: `Du er blevet tildelt ${dutyTypeLabel} den ${formattedDate}${reason ? `: ${reason}` : ''}`,
      link: '/duty',
      read: false,
    });

    console.log('Duty swap successful');

    return new Response(
      JSON.stringify({
        success: true,
        message: `Duty reassigned to ${newEmployee.name}`,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error: any) {
    console.error('Error in swap-duty function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
