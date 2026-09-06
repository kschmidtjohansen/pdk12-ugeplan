-- 1) Warehouse items: scope reads to the user's departments
DROP POLICY IF EXISTS warehouse_items_select_policy_authenticated ON public.warehouse_items;

CREATE POLICY warehouse_items_select_policy_authenticated
ON public.warehouse_items
FOR SELECT
TO authenticated
USING (
  public.is_super_admin()
  OR department_id = ANY (public.get_user_department_ids())
);

-- 2) Realtime broadcast: remove unscoped open policies (app uses postgres_changes only)
DROP POLICY IF EXISTS authenticated_can_receive_broadcasts ON realtime.messages;
DROP POLICY IF EXISTS authenticated_can_send_broadcasts ON realtime.messages;