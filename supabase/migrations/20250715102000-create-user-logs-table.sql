-- Create user_logs table for tracking user login activity
CREATE TABLE user_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('driver', 'guardian', 'admin')),
  user_name VARCHAR(255) NOT NULL,
  login_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  location VARCHAR(500),
  ip_address VARCHAR(45),
  device_info TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better query performance
CREATE INDEX idx_user_logs_user_type ON user_logs(user_type);
CREATE INDEX idx_user_logs_login_time ON user_logs(login_time DESC);
CREATE INDEX idx_user_logs_user_id ON user_logs(user_id);

-- Enable Row Level Security
ALTER TABLE user_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for admin access only
CREATE POLICY "Admin can view all user logs" ON user_logs
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT profile_id::UUID
      FROM profiles 
      WHERE user_type = 'admin'
    )
  );

-- Create policy for admins to insert logs
CREATE POLICY "Admin can insert user logs" ON user_logs
  FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT profile_id::UUID
      FROM profiles 
      WHERE user_type = 'admin'
    )
  );

-- Create policy for users to insert their own logs (for login tracking)
CREATE POLICY "Users can insert own login logs" ON user_logs
  FOR INSERT
  WITH CHECK (TRUE); -- Allow any authenticated user to log their login