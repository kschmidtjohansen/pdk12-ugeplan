import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface BroadcastCampaign {
  id: string;
  created_at: string;
  created_by_name: string;
  department_id: string | null;
  roles: string[];
  title: string;
  message: string;
  link: string | null;
  total_recipients: number;
  push_sent: number;
  push_failed: number;
  push_skipped_preference: number;
  push_no_subscription: number;
}

export type PushDeliveryStatus =
  | 'pending'
  | 'sent'
  | 'failed'
  | 'no_subscription'
  | 'skipped';

export interface BroadcastRecipient {
  user_id: string;
  name: string | null;
  email: string | null;
  read: boolean;
  created_at: string;
  push_status: PushDeliveryStatus;
}

export interface ResendResult {
  retried: number;
  sent: number;
  stillFailed: number;
}

/** History of broadcast messages with their delivery counters. */
export const useBroadcastCampaigns = () =>
  useQuery({
    queryKey: ['broadcast_campaigns'],
    queryFn: async (): Promise<BroadcastCampaign[]> => {
      const { data, error } = await supabase
        .from('broadcast_campaigns')
        .select(
          'id, created_at, created_by_name, department_id, roles, title, message, link, total_recipients, push_sent, push_failed, push_skipped_preference, push_no_subscription'
        )
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw new Error(error.message);
      return (data ?? []) as BroadcastCampaign[];
    },
    staleTime: 30 * 1000,
  });

/** Recipient-level detail for one broadcast (admin only, enforced server-side). */
export const useBroadcastRecipients = (campaignId: string | null) =>
  useQuery({
    queryKey: ['broadcast_recipients', campaignId],
    queryFn: async (): Promise<BroadcastRecipient[]> => {
      const { data, error } = await supabase.rpc('get_broadcast_recipients', {
        p_campaign_id: campaignId,
      });
      if (error) throw new Error(error.message);
      return (data ?? []) as BroadcastRecipient[];
    },
    enabled: !!campaignId,
    staleTime: 30 * 1000,
  });
