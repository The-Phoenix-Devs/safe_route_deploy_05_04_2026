-- Create chat_messages table for real-time communication
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL,
  sender_name TEXT NOT NULL,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('driver', 'admin', 'guardian')),
  recipient_id UUID,
  recipient_type TEXT CHECK (recipient_type IN ('driver', 'admin', 'guardian', 'broadcast')),
  message TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'location', 'emergency', 'system')),
  metadata JSONB DEFAULT '{}',
  read_by UUID[] DEFAULT ARRAY[]::UUID[],
  is_emergency BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Policies for chat_messages
CREATE POLICY "Users can view messages they are involved in" 
ON public.chat_messages 
FOR SELECT 
USING (
  sender_id = auth.uid() OR 
  recipient_id = auth.uid() OR 
  recipient_type = 'broadcast' OR
  (sender_type = 'admin' AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type = 'admin'))
);

CREATE POLICY "Users can create their own messages" 
ON public.chat_messages 
FOR INSERT 
WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Users can update read status" 
ON public.chat_messages 
FOR UPDATE 
USING (recipient_id = auth.uid() OR sender_id = auth.uid())
WITH CHECK (recipient_id = auth.uid() OR sender_id = auth.uid());

-- Create trigger for timestamp updates
CREATE TRIGGER update_chat_messages_updated_at
BEFORE UPDATE ON public.chat_messages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add realtime for chat_messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;

-- Create chat_rooms table for group conversations
CREATE TABLE public.chat_rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'direct' CHECK (type IN ('direct', 'group', 'broadcast')),
  participants UUID[] NOT NULL DEFAULT ARRAY[]::UUID[],
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security for chat_rooms
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;

-- Policies for chat_rooms
CREATE POLICY "Users can view rooms they participate in" 
ON public.chat_rooms 
FOR SELECT 
USING (
  auth.uid() = ANY(participants) OR
  created_by = auth.uid() OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type = 'admin')
);

CREATE POLICY "Users can create rooms" 
ON public.chat_rooms 
FOR INSERT 
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Participants can update rooms" 
ON public.chat_rooms 
FOR UPDATE 
USING (auth.uid() = ANY(participants) OR created_by = auth.uid())
WITH CHECK (auth.uid() = ANY(participants) OR created_by = auth.uid());

-- Create trigger for timestamp updates
CREATE TRIGGER update_chat_rooms_updated_at
BEFORE UPDATE ON public.chat_rooms
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add realtime for chat_rooms
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_rooms;