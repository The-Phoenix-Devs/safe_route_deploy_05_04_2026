-- Create admin profiles for the specified users
INSERT INTO profiles (id, firebase_uid, email, username, user_type, mobile_number, created_at, updated_at)
VALUES 
  (gen_random_uuid(), 'admin_subhankar', 'subhankar.ghorui1995@gmail.com', 'Subhankar Ghorui', 'admin', '+919735750941', now(), now()),
  (gen_random_uuid(), 'admin_ranajit', 'ranajit.sasmal@gmail.com', 'Ranajit Sasmal', 'admin', '+919733594162', now(), now())
ON CONFLICT (email) DO UPDATE SET
  mobile_number = EXCLUDED.mobile_number,
  updated_at = now();