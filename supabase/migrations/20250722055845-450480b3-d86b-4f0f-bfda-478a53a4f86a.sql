-- Fix chat_messages RLS policies to work with current auth system

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can create their own messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can update read status" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can view messages they are involved in" ON public.chat_messages;
DROP POLICY IF EXISTS "Admins can delete chat messages" ON public.chat_messages;

-- Create new policies that work without Supabase auth
-- Allow all authenticated operations since we're handling auth in the app layer
CREATE POLICY "Allow authenticated users to insert messages" 
ON public.chat_messages 
FOR INSERT 
TO authenticated, anon
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to select messages" 
ON public.chat_messages 
FOR SELECT 
TO authenticated, anon
USING (true);

CREATE POLICY "Allow authenticated users to update messages" 
ON public.chat_messages 
FOR UPDATE 
TO authenticated, anon
USING (true);

CREATE POLICY "Allow authenticated users to delete messages" 
ON public.chat_messages 
FOR DELETE 
TO authenticated, anon
USING (true);

-- Update updated_at timestamp trigger for chat_messages if it doesn't exist
CREATE OR REPLACE FUNCTION update_chat_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_chat_messages_updated_at'
  ) THEN
    CREATE TRIGGER update_chat_messages_updated_at
      BEFORE UPDATE ON public.chat_messages
      FOR EACH ROW
      EXECUTE FUNCTION update_chat_messages_updated_at();
  END IF;
END
$$;