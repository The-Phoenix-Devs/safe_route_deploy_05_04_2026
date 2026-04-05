-- Create admin profiles for the specified users
-- First delete any existing entries to avoid conflicts
DELETE FROM profiles WHERE email IN ('subhankar.ghorui1995@gmail.com', 'ranajit.sasmal@gmail.com');

-- Insert new admin profiles
INSERT INTO profiles (id, firebase_uid, email, username, user_type, mobile_number, created_at, updated_at)
VALUES 
  (gen_random_uuid(), 'admin_subhankar_' || extract(epoch from now()), 'subhankar.ghorui1995@gmail.com', 'Subhankar Ghorui', 'admin', '+919735750941', now(), now()),
  (gen_random_uuid(), 'admin_ranajit_' || extract(epoch from now()), 'ranajit.sasmal@gmail.com', 'Ranajit Sasmal', 'admin', '+919733594162', now(), now());