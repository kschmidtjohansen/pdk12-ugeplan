 import React, { useState, useRef, useEffect } from 'react';
 import { useTranslation } from '@/context/TranslationContext';
 import { useAssignmentMessages, AssignmentMessage } from '@/hooks/assignment/useAssignmentMessages';
 import { Button } from '@/components/ui/button';
 import { Textarea } from '@/components/ui/textarea';
 import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
 import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Download, MessageSquare, Reply, X, CornerDownRight } from 'lucide-react';
 import { format } from 'date-fns';
 import { da, enGB } from 'date-fns/locale';
 import { cn } from '@/lib/utils';
 
 interface AssignmentMessagesPanelProps {
   assignmentId: string;
   assignmentTitle?: string;
   assignedEmployeeIds?: string[];
   responsibleUserId?: string | null;
 }
 
 const AssignmentMessagesPanel: React.FC<AssignmentMessagesPanelProps> = ({
   assignmentId,
   assignmentTitle,
   assignedEmployeeIds,
   responsibleUserId
 }) => {
   const { t, currentLanguage } = useTranslation();
   const [newMessage, setNewMessage] = useState('');
   const [sending, setSending] = useState(false);
  const [replyingTo, setReplyingTo] = useState<AssignmentMessage | null>(null);
   const scrollRef = useRef<HTMLDivElement>(null);
 
   const { 
     messages, 
     loading, 
     sendMessage, 
     exportMessages 
   } = useAssignmentMessages(
     assignmentId,
     assignmentTitle,
     assignedEmployeeIds,
     responsibleUserId
   );
 
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
 
   return (
     <div className="flex flex-col h-full">
       {/* Header */}
       <div className="flex items-center justify-between pb-3 border-b">
         <div className="flex items-center gap-2">
           <MessageSquare className="h-5 w-5 text-primary" />
           <h3 className="font-medium">{t('planner.messages.title')}</h3>
         </div>
         {messages.length > 0 && (
           <Button
             variant="outline"
             size="sm"
             onClick={exportMessages}
             className="flex items-center gap-1"
           >
             <Download className="h-4 w-4" />
             {t('planner.messages.exportMessages')}
           </Button>
         )}
       </div>
 
       {/* Messages List */}
       <ScrollArea className="flex-1 py-4" ref={scrollRef}>
         {loading ? (
           <div className="flex items-center justify-center h-32">
             <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
           </div>
         ) : messages.length === 0 ? (
           <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
             <MessageSquare className="h-8 w-8 mb-2 opacity-50" />
             <p className="text-sm">{t('planner.messages.noMessages')}</p>
           </div>
         ) : (
           <div className="space-y-4">
             {messages.map((msg) => (
                <div key={msg.id} className="group">
                  {/* Reply reference */}
                  {msg.reply_to && (
                    <div className="flex items-center gap-2 ml-10 mb-1 text-xs text-muted-foreground">
                      <CornerDownRight className="h-3 w-3" />
                      <span className="truncate max-w-[200px]">
                        {t('planner.messages.inReplyTo')}: "{msg.reply_to.message.substring(0, 40)}{msg.reply_to.message.length > 40 ? '...' : ''}"
                      </span>
                    </div>
                  )}
                  
                  <div className="flex gap-3">
                    <Avatar className="h-8 w-8 flex-shrink-0">
                   <AvatarImage src={msg.sender?.avatar_url} />
                   <AvatarFallback className="text-xs">
                     {getInitials(msg.sender?.name || 'U')}
                   </AvatarFallback>
                 </Avatar>
                    <div className="flex-1 min-w-0">
                   <div className="flex items-baseline gap-2">
                     <span className="font-medium text-sm">
                       {msg.sender?.name || 'Ukendt'}
                     </span>
                     <span className="text-xs text-muted-foreground">
                       {formatMessageTime(msg.created_at)}
                     </span>
                        
                        {/* Reply button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => setReplyingTo(msg)}
                        >
                          <Reply className="h-3 w-3 mr-1" />
                          <span className="text-xs">{t('planner.messages.reply')}</span>
                        </Button>
                   </div>
                   <p className="text-sm mt-1 whitespace-pre-wrap break-words">
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
       <div className="pt-3 border-t">
          {/* Reply indicator */}
          {replyingTo && (
            <div className="flex items-center gap-2 mb-2 p-2 bg-muted rounded-md text-sm">
              <Reply className="h-4 w-4 text-primary flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="text-muted-foreground">{t('planner.messages.replyingTo')}: </span>
                <span className="truncate">{replyingTo.sender?.name}: "{replyingTo.message.substring(0, 50)}{replyingTo.message.length > 50 ? '...' : ''}"</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 flex-shrink-0"
                onClick={() => setReplyingTo(null)}
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
             className="min-h-[60px] max-h-[120px] resize-none"
             disabled={sending}
           />
           <Button
             onClick={handleSend}
             disabled={!newMessage.trim() || sending}
             className="self-end"
           >
             <Send className="h-4 w-4" />
           </Button>
         </div>
       </div>
     </div>
   );
 };
 
 export default AssignmentMessagesPanel;