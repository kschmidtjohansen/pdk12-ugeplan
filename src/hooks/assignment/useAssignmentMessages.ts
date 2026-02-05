 import { useState, useEffect, useCallback } from 'react';
 import { supabase } from '@/integrations/supabase/client';
 import { useNotifications } from '@/context/NotificationContext';
 import { toast } from 'sonner';
 import { format } from 'date-fns';
 import { da, enGB } from 'date-fns/locale';
 
 export interface AssignmentMessage {
   id: string;
   assignment_id: string;
   user_id: string;
   message: string;
   created_at: string;
   sender?: {
     id: string;
     name: string;
     avatar_url?: string;
   };
 }
 
 interface UseAssignmentMessagesReturn {
   messages: AssignmentMessage[];
   loading: boolean;
   sendMessage: (message: string) => Promise<void>;
   exportMessages: () => void;
   refetch: () => Promise<void>;
 }
 
 export const useAssignmentMessages = (
   assignmentId: string | null,
   assignmentTitle?: string,
   assignedEmployeeIds?: string[],
   responsibleUserId?: string | null
 ): UseAssignmentMessagesReturn => {
   const [messages, setMessages] = useState<AssignmentMessage[]>([]);
   const [loading, setLoading] = useState(false);
   const { addNotification } = useNotifications();
 
   const fetchMessages = useCallback(async () => {
     if (!assignmentId) return;
 
     setLoading(true);
     try {
       // First fetch messages
       const { data: messagesData, error: messagesError } = await supabase
         .from('assignment_messages')
         .select('*')
         .eq('assignment_id', assignmentId)
         .order('created_at', { ascending: true });
 
       if (messagesError) throw messagesError;
 
       // Get unique user IDs from messages
       const userIds = [...new Set(messagesData?.map(m => m.user_id) || [])];
       
       // Fetch user profiles for senders
       let profilesMap: Record<string, { id: string; name: string; avatar_url?: string }> = {};
       if (userIds.length > 0) {
         const { data: profiles } = await supabase
           .from('profiles')
           .select('id, name, avatar_url')
           .in('id', userIds);
         
         if (profiles) {
           profilesMap = profiles.reduce((acc, p) => {
             acc[p.id] = p;
             return acc;
           }, {} as Record<string, { id: string; name: string; avatar_url?: string }>);
         }
       }
 
       // Combine messages with sender info
       const messagesWithSenders = (messagesData || []).map(msg => ({
         ...msg,
         sender: profilesMap[msg.user_id] || { id: msg.user_id, name: 'Ukendt' }
       }));
 
       setMessages(messagesWithSenders);
     } catch (error) {
       console.error('[useAssignmentMessages] Error fetching messages:', error);
     } finally {
       setLoading(false);
     }
   }, [assignmentId]);
 
   const sendMessage = useCallback(async (messageText: string) => {
     if (!assignmentId || !messageText.trim()) return;
 
     try {
       const { data: { user } } = await supabase.auth.getUser();
       if (!user) {
         toast.error('Du skal være logget ind for at sende beskeder');
         return;
       }
 
       // Get sender name for notification
       const { data: senderProfile } = await supabase
         .from('profiles')
         .select('name')
         .eq('id', user.id)
         .single();
 
       const { error } = await supabase
         .from('assignment_messages')
         .insert({
           assignment_id: assignmentId,
           user_id: user.id,
           message: messageText.trim()
         });
 
       if (error) throw error;
 
       // Send notifications to assigned employees and responsible user
       const recipientIds = new Set<string>();
       
       if (assignedEmployeeIds) {
         assignedEmployeeIds.forEach(id => {
           if (id !== user.id) recipientIds.add(id);
         });
       }
       
       if (responsibleUserId && responsibleUserId !== user.id) {
         recipientIds.add(responsibleUserId);
       }
 
       // Send notification to each recipient
       const senderName = senderProfile?.name || 'Nogen';
       const previewText = messageText.length > 50 
         ? messageText.substring(0, 50) + '...' 
         : messageText;
 
       for (const recipientId of recipientIds) {
         await addNotification({
           type: 'message',
           title: `Ny besked på ${assignmentTitle || 'sag'}`,
           message: `${senderName}: ${previewText}`,
           link: '/planner',
           targetUserId: recipientId
         });
       }
 
       // Refetch to show new message
       await fetchMessages();
       toast.success('Besked sendt');
     } catch (error) {
       console.error('[useAssignmentMessages] Error sending message:', error);
       toast.error('Kunne ikke sende besked');
     }
   }, [assignmentId, assignmentTitle, assignedEmployeeIds, responsibleUserId, addNotification, fetchMessages]);
 
   const exportMessages = useCallback(() => {
     if (messages.length === 0) {
       toast.error('Ingen beskeder at eksportere');
       return;
     }
 
     const lines = [
       `Besked-eksport for sag: ${assignmentTitle || 'Ukendt'}`,
       `Eksporteret: ${format(new Date(), 'dd-MM-yyyy HH:mm', { locale: da })}`,
       '',
       '---',
       ''
     ];
 
     messages.forEach(msg => {
       const timestamp = format(new Date(msg.created_at), 'dd-MM-yyyy HH:mm', { locale: da });
       lines.push(`[${timestamp}] ${msg.sender?.name || 'Ukendt'}:`);
       lines.push(msg.message);
       lines.push('');
     });
 
     const content = lines.join('\n');
     const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
     const url = URL.createObjectURL(blob);
     const link = document.createElement('a');
     link.href = url;
     link.download = `beskeder-${assignmentTitle || 'sag'}-${format(new Date(), 'yyyy-MM-dd')}.txt`;
     document.body.appendChild(link);
     link.click();
     document.body.removeChild(link);
     URL.revokeObjectURL(url);
 
     toast.success('Beskeder eksporteret');
   }, [messages, assignmentTitle]);
 
   // Set up realtime subscription
   useEffect(() => {
     if (!assignmentId) return;
 
     fetchMessages();
 
     const channel = supabase
       .channel(`assignment-messages-${assignmentId}`)
       .on(
         'postgres_changes',
         {
           event: '*',
           schema: 'public',
           table: 'assignment_messages',
           filter: `assignment_id=eq.${assignmentId}`
         },
         () => {
           fetchMessages();
         }
       )
       .subscribe();
 
     return () => {
       supabase.removeChannel(channel);
     };
   }, [assignmentId, fetchMessages]);
 
   return {
     messages,
     loading,
     sendMessage,
     exportMessages,
     refetch: fetchMessages
   };
 };