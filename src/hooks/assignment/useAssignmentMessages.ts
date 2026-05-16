 import { useState, useEffect, useCallback } from 'react';
 import { supabase } from '@/integrations/supabase/client';
 import { useNotifications } from '@/context/NotificationContext';
 import { toast } from 'sonner';
 import { format } from 'date-fns';
 import { da } from 'date-fns/locale';
 
 export interface AssignmentMessage {
   id: string;
   assignment_id: string;
   user_id: string;
   message: string;
   created_at: string;
  reply_to_id?: string | null;
   sender?: {
     id: string;
     name: string;
     avatar_url?: string;
   };
  reply_to?: {
    id: string;
    message: string;
    sender_name: string;
  } | null;
 }
 
 interface UseAssignmentMessagesReturn {
   messages: AssignmentMessage[];
   loading: boolean;
  sendMessage: (message: string, replyToId?: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
   exportMessages: () => void;
   refetch: () => Promise<void>;
 }
 
export const useAssignmentMessages = (
  assignmentId: string | null,
  assignmentTitle?: string,
  assignedEmployeeIds?: string[],
  responsibleUserId?: string | null,
  siblingAssignmentIds?: string[]
): UseAssignmentMessagesReturn => {
  const [messages, setMessages] = useState<AssignmentMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const { addNotification } = useNotifications();

  // Effective IDs to read from: all sibling days of the case, or just this assignment.
  // We always WRITE to `assignmentId` (the currently opened day).
  const effectiveIds = siblingAssignmentIds && siblingAssignmentIds.length > 0
    ? siblingAssignmentIds
    : assignmentId
      ? [assignmentId]
      : [];
  const effectiveIdsKey = effectiveIds.join(',');

  const fetchMessages = useCallback(async () => {
    if (effectiveIds.length === 0) return;

    setLoading(true);
    try {
      // Fetch messages across all sibling assignment IDs (whole case series)
      const { data: messagesData, error: messagesError } = await supabase
        .from('assignment_messages')
       .select('*, reply_to_id')
        .in('assignment_id', effectiveIds)
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
 
      // Build a map of message id -> message for reply lookups
      const messagesMap = new Map<string, { message: string; user_id: string }>();
      (messagesData || []).forEach(msg => {
        messagesMap.set(msg.id, { message: msg.message, user_id: msg.user_id });
      });

       // Combine messages with sender info
      const messagesWithSenders = (messagesData || []).map(msg => {
        let replyTo = null;
        if (msg.reply_to_id) {
          const parentMsg = messagesMap.get(msg.reply_to_id);
          if (parentMsg) {
            const parentSender = profilesMap[parentMsg.user_id];
            replyTo = {
              id: msg.reply_to_id,
              message: parentMsg.message,
              sender_name: parentSender?.name || 'Ukendt'
            };
          }
        }
        return {
          ...msg,
          sender: profilesMap[msg.user_id] || { id: msg.user_id, name: 'Ukendt' },
          reply_to: replyTo
        };
      });
 
       setMessages(messagesWithSenders);
     } catch (error) {
       if (import.meta.env.DEV) console.error('[useAssignmentMessages] Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveIdsKey]);
 
   const sendMessage = useCallback(async (messageText: string, replyToId?: string) => {
      if (!assignmentId || !messageText.trim()) return;
      
      // Client-side length validation (matches DB CHECK constraint)
      if (messageText.trim().length > 5000) {
        toast.error('Beskeden er for lang (max 5000 tegn)');
        return;
      }
 
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
          message: messageText.trim(),
          reply_to_id: replyToId || null
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
       if (import.meta.env.DEV) console.error('[useAssignmentMessages] Error sending message:', error);
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
        let prefix = '';
        if (msg.reply_to) {
          prefix = `  ↳ Svar på: "${msg.reply_to.message.substring(0, 30)}${msg.reply_to.message.length > 30 ? '...' : ''}"\n  `;
        }
        lines.push(`[${timestamp}] ${msg.sender?.name || 'Ukendt'}:`);
        if (prefix) lines.push(prefix);
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
 
  const deleteMessage = useCallback(async (messageId: string) => {
    if (!assignmentId) return;
    
    try {
      const { error } = await supabase
        .from('assignment_messages')
        .delete()
        .eq('id', messageId);
        
      if (error) throw error;
      
      // Refetch to update the list
      await fetchMessages();
      toast.success('Besked slettet');
    } catch (error) {
      if (import.meta.env.DEV) console.error('[useAssignmentMessages] Error deleting message:', error);
      toast.error('Kunne ikke slette besked');
    }
  }, [assignmentId, fetchMessages]);

   // Set up realtime subscription — listen across the whole table and filter
   // client-side so we receive changes for every sibling assignment in the series.
   useEffect(() => {
     if (effectiveIds.length === 0) return;
 
     fetchMessages();
 
     const idSet = new Set(effectiveIds);
     const unsubscribe = subscribeToTable({
       key: `useAssignmentMessages:${effectiveIdsKey}`,
       table: 'assignment_messages',
       callback: (payload) => {
         const newId = (payload?.new as { assignment_id?: string } | null)?.assignment_id;
         const oldId = (payload?.old as { assignment_id?: string } | null)?.assignment_id;
         if ((newId && idSet.has(newId)) || (oldId && idSet.has(oldId))) {
           fetchMessages();
         }
       },
     });

     return () => {
       unsubscribe();
     };
     // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [effectiveIdsKey, fetchMessages]);
 
   return {
     messages,
     loading,
     sendMessage,
    deleteMessage,
     exportMessages,
     refetch: fetchMessages
   };
 };