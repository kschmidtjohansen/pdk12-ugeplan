import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SwapDutiesRequest {
  duty1Id: string;
  duty2Id: string;
  requestedBy: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('Authentication error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user role
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();
    
    const userRole = roleData?.role || 'servicemedarbejder';
    const isAdminOrSkadeleder = userRole === 'administrator' || userRole === 'skadeleder' || userRole === 'super_admin';

    // Parse request body — IMPORTANT: requestedBy from body is for notification routing only.
    // ALL authorization decisions MUST use the verified `user.id` from the JWT.
    const { duty1Id, duty2Id }: SwapDutiesRequest = await req.json();
    const requestedBy = user.id;

    console.log(`Swap request: duty1=${duty1Id}, duty2=${duty2Id}, requestedBy=${requestedBy}`);

    // Validate input
    if (!duty1Id || !duty2Id) {
      throw new Error('Both duty IDs are required');
    }

    if (duty1Id === duty2Id) {
      throw new Error('Cannot swap a duty with itself');
    }

    // Fetch both duties with employee details
    const { data: duties, error: fetchError } = await supabase
      .from('on_call_duties')
      .select(`
        id,
        duty_date,
        duty_type,
        employee_id,
        notes,
        employee:profiles!on_call_duties_employee_id_fkey(
          id,
          name,
          email
        )
      `)
      .in('id', [duty1Id, duty2Id]);

    if (fetchError) {
      console.error('Error fetching duties:', fetchError);
      throw new Error('Failed to fetch duties');
    }

    if (!duties || duties.length !== 2) {
      throw new Error('One or both duties not found');
    }

    const duty1 = duties.find(d => d.id === duty1Id);
    const duty2 = duties.find(d => d.id === duty2Id);

    if (!duty1 || !duty2) {
      throw new Error('One or both duties not found');
    }

    // Check if this is a duty transfer (one duty is unassigned)
    const isTransfer = !duty1.employee_id || !duty2.employee_id;
    
    if (isTransfer) {
      // At least one duty must have an employee
      if (!duty1.employee_id && !duty2.employee_id) {
        throw new Error('Cannot swap two unassigned duties');
      }
    }

    // Validate same duty type
    if (duty1.duty_type !== duty2.duty_type) {
      throw new Error('Can only swap duties of the same type');
    }

    // Validate that both duties are in the future or today (not past)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const duty1Date = new Date(duty1.duty_date);
    const duty2Date = new Date(duty2.duty_date);

    duty1Date.setHours(0, 0, 0, 0);
    duty2Date.setHours(0, 0, 0, 0);

    if (duty1Date < today || duty2Date < today) {
      throw new Error('Cannot swap duties that are in the past. Only future duties and today can be swapped.');
    }

    // Role-based restrictions for duty swapping
    if (userRole === 'servicemedarbejder') {
      if (duty1.duty_type !== 'kørevagt') {
        throw new Error('Servicemedarbejder can only swap kørevagt duties');
      }
    }
    // Administrator and Skadeleder have no restrictions

    // Check permissions based on whether it's a transfer or swap
    if (isTransfer) {
      // For transfers, user must be the one with the assigned duty OR admin/skadeleder
      const assignedDuty = duty1.employee_id ? duty1 : duty2;
      const isUserAssigned = assignedDuty.employee_id === requestedBy;
      
      if (!isUserAssigned && !isAdminOrSkadeleder) {
        throw new Error('You do not have permission to transfer this duty');
      }
    } else {
      // For swaps, user must be one of the employees OR admin/skadeleder
      const isInvolvedEmployee = duty1.employee_id === requestedBy || duty2.employee_id === requestedBy;
      if (!isInvolvedEmployee && !isAdminOrSkadeleder) {
        throw new Error('You do not have permission to swap these duties');
      }
    }

    // Role validation for skadeleder_vagt
    if (duty1.duty_type === 'skadeleder_vagt') {
      // For transfers, only validate the requesting user
      if (isTransfer) {
        const { data: userRoleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', requestedBy)
          .single();
        
        const reqUserRole = userRoleData?.role || 'servicemedarbejder';
        const isValidRole = reqUserRole === 'administrator' || reqUserRole === 'skadeleder';
        
        if (!isValidRole) {
          throw new Error('Only administrators and skadeledere can take skadeleder vagt duties');
        }
      } else {
        // For swaps, check both employees have appropriate roles
        const { data: emp1Role } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', duty1.employee_id!)
          .single();
        
        const { data: emp2Role } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', duty2.employee_id!)
          .single();

        const role1 = emp1Role?.role || 'servicemedarbejder';
        const role2 = emp2Role?.role || 'servicemedarbejder';

        const isValidRole1 = role1 === 'administrator' || role1 === 'skadeleder';
        const isValidRole2 = role2 === 'administrator' || role2 === 'skadeleder';

        if (!isValidRole1 || !isValidRole2) {
          throw new Error('Only administrators and skadeledere can be assigned to skadeleder vagt');
        }
      }
    }

    // Handle transfer vs swap
    if (isTransfer) {
      const assignedDuty = duty1.employee_id ? duty1 : duty2;
      const unassignedDuty = duty1.employee_id ? duty2 : duty1;
      
      console.log(`Transfer: User ${requestedBy} taking unassigned duty ${unassignedDuty.id}, giving up duty ${assignedDuty.id}`);
      
      // Transfer: assign the unassigned duty to the user, unassign their current duty
      const { error: assignError } = await supabase
        .from('on_call_duties')
        .update({ employee_id: requestedBy, updated_at: new Date().toISOString() })
        .eq('id', unassignedDuty.id);

      if (assignError) {
        console.error('Error assigning unassigned duty:', assignError);
        throw new Error('Failed to transfer duty');
      }

      const { error: unassignError } = await supabase
        .from('on_call_duties')
        .update({ employee_id: null, updated_at: new Date().toISOString() })
        .eq('id', assignedDuty.id);

      if (unassignError) {
        console.error('Error unassigning current duty:', unassignError);
        // Try to rollback
        await supabase
          .from('on_call_duties')
          .update({ employee_id: null })
          .eq('id', unassignedDuty.id);
        throw new Error('Failed to transfer duty');
      }
    } else {
      // Perform the atomic swap
      const { error: updateError } = await supabase.rpc('swap_duty_employees', {
        p_duty1_id: duty1Id,
        p_duty2_id: duty2Id,
        p_employee1_id: duty2.employee_id,
        p_employee2_id: duty1.employee_id
      });

      if (updateError) {
        console.error('RPC call failed, falling back to manual update:', updateError);
        
        // Fallback: Manual update in transaction-like manner
        const { error: update1Error } = await supabase
          .from('on_call_duties')
          .update({ employee_id: duty2.employee_id, updated_at: new Date().toISOString() })
          .eq('id', duty1Id);

        if (update1Error) {
          console.error('Error updating duty 1:', update1Error);
          throw new Error('Failed to swap duties');
        }

        const { error: update2Error } = await supabase
          .from('on_call_duties')
          .update({ employee_id: duty1.employee_id, updated_at: new Date().toISOString() })
          .eq('id', duty2Id);

        if (update2Error) {
          console.error('Error updating duty 2:', update2Error);
          // Try to rollback duty1
          await supabase
            .from('on_call_duties')
            .update({ employee_id: duty1.employee_id })
            .eq('id', duty1Id);
          throw new Error('Failed to swap duties');
        }
      }
    }

    // Send notifications
    const dutyTypeLabel = duty1.duty_type === 'skadeleder_vagt' ? 'Skadeleder vagt' : 'Kørevagt';
    
    const formatDate = (dateStr: string) => {
      const date = new Date(dateStr);
      return date.toLocaleDateString('da-DK', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    };

    if (isTransfer) {
      // Notification for duty transfer
      const assignedDuty = duty1.employee_id ? duty1 : duty2;
      const unassignedDuty = duty1.employee_id ? duty2 : duty1;
      
      await supabase.from('notifications').insert({
        user_id: requestedBy,
        type: 'duty',
        title: 'Vagt flyttet',
        message: `Du har flyttet din ${dutyTypeLabel} fra ${formatDate(assignedDuty.duty_date)} til ${formatDate(unassignedDuty.duty_date)}`,
        link: '/duty',
        read: false,
      });
    } else {
      // Notifications for duty swap
      // Notification for employee 1 (now gets duty 2's date)
      await supabase.from('notifications').insert({
        user_id: duty1.employee_id!,
        type: 'duty',
        title: 'Vagt byttet',
        message: `Din ${dutyTypeLabel} på ${formatDate(duty1.duty_date)} er byttet med ${(duty2.employee as any)?.name} - du har nu vagt den ${formatDate(duty2.duty_date)}`,
        link: '/duty',
        read: false,
      });

      // Notification for employee 2 (now gets duty 1's date)
      await supabase.from('notifications').insert({
        user_id: duty2.employee_id!,
        type: 'duty',
        title: 'Vagt byttet',
        message: `Din ${dutyTypeLabel} på ${formatDate(duty2.duty_date)} er byttet med ${(duty1.employee as any)?.name} - du har nu vagt den ${formatDate(duty1.duty_date)}`,
        link: '/duty',
        read: false,
      });
    }

    console.log('Duties swapped successfully');

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Duties swapped successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in swap-duties function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
