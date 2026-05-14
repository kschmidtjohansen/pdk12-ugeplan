 import React, { useState, useRef, useEffect } from 'react';
 import { useTranslation } from '@/context/TranslationContext';
 import { useAssignmentMessages, AssignmentMessage } from '@/hooks/assignment/useAssignmentMessages';
 import { Button } from '@/components/ui/button';
 import { Textarea } from '@/components/ui/textarea';
 import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
 import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Reply, X, CornerDownRight, Trash2, MessageSquare } from 'lucide-react';
 import { format } from 'date-fns';
 import { da, enGB } from 'date-fns/locale';
 import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
 
interface AssignmentMessagesPanelProps {
  assignmentId: string;
  assignmentTitle?: string;
  assignedEmployeeIds?: string[];
  responsibleUserId?: string | null;
  /** All assignment IDs in the same case series (multi-day bookings).
   *  Messages are read across all of them so chat is shared across days. */
  siblingAssignmentIds?: string[];
}

const AssignmentMessagesPanel: React.FC<AssignmentMessagesPanelProps> = ({
  assignmentId,
  assignmentTitle,
  assignedEmployeeIds,
  responsibleUserId,
  siblingAssignmentIds
}) => {
  const { t, currentLanguage } = useTranslation();
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [replyingTo, setReplyingTo] = useState<AssignmentMessage | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AssignmentMessage | null>(null);
   const scrollRef = useRef<HTMLDivElement>(null);
 
   const { 
     messages, 
     loading, 
     sendMessage, 
    deleteMessage,
     exportMessages 
   } = useAssignmentMessages(
     assignmentId,
     assignmentTitle,
     assignedEmployeeIds,
     responsibleUserId,
     siblingAssignmentIds
   );
 
  const { user } = useAuth();

  // Permission check: owner can delete own messages, admin/skadeleder can delete all
  const canDeleteMessage = (message: AssignmentMessage): boolean => {
    if (!user) return false;
    
    // Owner can always delete their own messages
    if (message.user_id === user.id) return true;
    
    // Skadeleder and administrator can delete any message
    return ['super_admin', 'administrator', 'skadeleder'].includes(user.role || '');
  };

   // Auto-scroll to bottom when new messages arrive
   useEffect(() => {
     if (scrollRef.current) {
       scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
     }
   }, [messages]);
 
   const handleSend = async () => {
     if (!newMessage.trim() || sending) return;
     
     setSending(true);
    await sendMessage(newMessage, replyingTo?.id);
     setNewMessage('');
    setReplyingTo(null);
     setSending(false);
   };
 
   const handleKeyDown = (e: React.KeyboardEvent) => {
     if (e.key === 'Enter' && !e.shiftKey) {
       e.preventDefault();
       handleSend();
     }
   };
 
   const formatMessageTime = (dateString: string) => {
     const date = new Date(dateString);
     const locale = currentLanguage === 'da' ? da : enGB;
     return format(date, 'dd MMM HH:mm', { locale });
   };
 
   const getInitials = (name: string) => {
     return name
       .split(' ')
       .map(n => n[0])
       .join('')
       .toUpperCase()
       .substring(0, 2);
   };
 
  const handleDeleteMessage = async () => {
    if (!deleteTarget) return;
    await deleteMessage(deleteTarget.id);
    setDeleteTarget(null);
  };

  return (
    <TooltipProvider>
    <div className="flex flex-col h-full px-4 pt-2 pb-3">
      {/* Messages List */}
      <ScrollArea className="flex-1 py-5" ref={scrollRef}>
         {loading ? (
          <div className="flex items-center justify-center h-40">
             <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
           </div>
         ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
             <MessageSquare className="h-8 w-8 mb-2 opacity-50" />
             <p className="text-sm">{t('planner.messages.noMessages')}</p>
           </div>
         ) : (
          <div className="space-y-5">
             {messages.map((msg) => (
                <div key={msg.id} className="group">
                  {/* Reply reference */}
                  {msg.reply_to && (
                   <div className="flex items-center gap-2 ml-11 mb-1.5 text-xs text-muted-foreground">
                      <CornerDownRight className="h-3 w-3" />
                      <span className="truncate max-w-[200px]">
                        {t('planner.messages.inReplyTo')}: "{msg.reply_to.message.substring(0, 40)}{msg.reply_to.message.length > 40 ? '...' : ''}"
                      </span>
                    </div>
                  )}
                  
                  <div className="flex gap-3">
                   <Avatar className="h-9 w-9 flex-shrink-0 ring-2 ring-background shadow-sm">
                   <AvatarImage src={msg.sender?.avatar_url} />
                   <AvatarFallback className="text-xs">
                     {getInitials(msg.sender?.name || 'U')}
                   </AvatarFallback>
                 </Avatar>
                    <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm">
                       {msg.sender?.name || 'Ukendt'}
                     </span>
                    <span className="text-xs text-muted-foreground/70">
                       {formatMessageTime(msg.created_at)}
                     </span>
                        
                        {/* Reply button */}
                       <div className="flex items-center gap-1 ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                         <Tooltip>
                           <TooltipTrigger asChild>
                             <Button
                               variant="ghost"
                               size="sm"
                               className="h-7 px-2"
                               onClick={() => setReplyingTo(msg)}
                             >
                               <Reply className="h-3.5 w-3.5" />
                             </Button>
                           </TooltipTrigger>
                           <TooltipContent side="top">
                             <p>{t('planner.messages.reply')}</p>
                           </TooltipContent>
                         </Tooltip>
                         
                         {canDeleteMessage(msg) && (
                           <Tooltip>
                             <TooltipTrigger asChild>
                               <Button
                                 variant="ghost"
                                 size="sm"
                                 className="h-7 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                                 onClick={() => setDeleteTarget(msg)}
                               >
                                 <Trash2 className="h-3.5 w-3.5" />
                               </Button>
                             </TooltipTrigger>
                             <TooltipContent side="top">
                               <p>{t('planner.messages.deleteMessage')}</p>
                             </TooltipContent>
                           </Tooltip>
                         )}
                       </div>
                   </div>
                  <p className="text-sm mt-1.5 whitespace-pre-wrap break-words leading-relaxed text-foreground/90">
                     {msg.message}
                   </p>
                 </div>
                  </div>
               </div>
             ))}
           </div>
         )}
       </ScrollArea>
 
       {/* Input Area */}
      <div className="pt-4 border-t">
          {/* Reply indicator */}
          {replyingTo && (
           <div className="flex items-center gap-2 mb-3 p-2.5 bg-muted/60 rounded-lg text-sm border border-border/50">
              <Reply className="h-4 w-4 text-primary flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="text-muted-foreground">{t('planner.messages.replyingTo')}: </span>
                <span className="truncate">{replyingTo.sender?.name}: "{replyingTo.message.substring(0, 50)}{replyingTo.message.length > 50 ? '...' : ''}"</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
               className="h-7 w-7 flex-shrink-0"
                onClick={() => setReplyingTo(null)}
                aria-label={t('common.cancel') || 'Annullér svar'}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
          
         <div className="flex gap-2">
           <Textarea
             value={newMessage}
             onChange={(e) => setNewMessage(e.target.value)}
             onKeyDown={handleKeyDown}
              placeholder={replyingTo ? t('planner.messages.writeReply') : t('planner.messages.messagePlaceholder')}
             className="min-h-[70px] max-h-[120px] resize-none text-sm"
             disabled={sending}
           />
           <Button
             onClick={handleSend}
             disabled={!newMessage.trim() || sending}
             className="self-end h-10 w-10"
             size="icon"
             aria-label={t('planner.messages.send') || 'Send besked'}
           >
             <Send className="h-4 w-4" />
           </Button>
         </div>
       </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('planner.messages.deleteMessage')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('planner.messages.confirmDelete')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteMessage}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
     </div>
    </TooltipProvider>
   );
 };
 
 export default AssignmentMessagesPanel;