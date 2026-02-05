-- Add reply_to_id column to assignment_messages for threading
ALTER TABLE public.assignment_messages 
ADD COLUMN reply_to_id UUID REFERENCES public.assignment_messages(id) ON DELETE SET NULL;

-- Add index for performance when fetching replies
CREATE INDEX idx_assignment_messages_reply_to_id 
ON public.assignment_messages(reply_to_id);