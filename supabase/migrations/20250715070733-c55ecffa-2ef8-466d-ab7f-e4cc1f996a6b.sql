-- Fix foreign key relationships
ALTER TABLE drivers DROP CONSTRAINT IF EXISTS drivers_profile_id_fkey;
ALTER TABLE drivers ADD CONSTRAINT drivers_profile_id_fkey 
  FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE students DROP CONSTRAINT IF EXISTS students_guardian_profile_id_fkey;
ALTER TABLE students ADD CONSTRAINT students_guardian_profile_id_fkey 
  FOREIGN KEY (guardian_profile_id) REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE students DROP CONSTRAINT IF EXISTS students_driver_id_fkey;
ALTER TABLE students ADD CONSTRAINT students_driver_id_fkey 
  FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE SET NULL;

-- Create sample data for testing
INSERT INTO routes (name, start_point, end_point, description) VALUES
('Route A', 'School Gate', 'Main Market', 'Morning route covering central areas'),
('Route B', 'School Gate', 'Railway Station', 'Route covering railway station area'),
('Route C', 'School Gate', 'Bus Stand', 'Route covering bus stand and nearby areas');

-- Insert sample admin profile
INSERT INTO profiles (username, email, user_type, firebase_uid, mobile_number) VALUES
('admin', 'admin@sishutirhta.com', 'admin', 'admin-firebase-uid', '9876543210')
ON CONFLICT (email) DO NOTHING;

-- Get the admin profile ID
DO $$
DECLARE
    admin_profile_id uuid;
    route_a_id uuid;
    route_b_id uuid;
    driver1_id uuid;
    driver2_id uuid;
BEGIN
    -- Get admin profile ID
    SELECT id INTO admin_profile_id FROM profiles WHERE email = 'admin@sishutirhta.com';
    
    -- Get route IDs
    SELECT id INTO route_a_id FROM routes WHERE name = 'Route A';
    SELECT id INTO route_b_id FROM routes WHERE name = 'Route B';
    
    -- Insert sample driver profiles
    INSERT INTO profiles (username, email, user_type, firebase_uid, mobile_number) VALUES
    ('driver1', 'driver1@sishutirhta.com', 'driver', 'driver1-firebase-uid', '9876543211'),
    ('driver2', 'driver2@sishutirhta.com', 'driver', 'driver2-firebase-uid', '9876543212')
    ON CONFLICT (email) DO NOTHING;
    
    -- Insert sample guardian profiles
    INSERT INTO profiles (username, email, user_type, firebase_uid, mobile_number) VALUES
    ('guardian1', 'guardian1@sishutirhta.com', 'guardian', 'guardian1-firebase-uid', '9876543213'),
    ('guardian2', 'guardian2@sishutirhta.com', 'guardian', 'guardian2-firebase-uid', '9876543214')
    ON CONFLICT (email) DO NOTHING;
    
    -- Insert drivers with proper profile references
    INSERT INTO drivers (name, mobile_number, bus_number, profile_id, route_id, license_number) VALUES
    ('Ram Kumar', '9876543211', 'HR-01-AB-1234', (SELECT id FROM profiles WHERE mobile_number = '9876543211'), route_a_id, 'DL123456789'),
    ('Shyam Singh', '9876543212', 'HR-01-AB-5678', (SELECT id FROM profiles WHERE mobile_number = '9876543212'), route_b_id, 'DL987654321');
    
    -- Get driver IDs
    SELECT id INTO driver1_id FROM drivers WHERE mobile_number = '9876543211';
    SELECT id INTO driver2_id FROM drivers WHERE mobile_number = '9876543212';
    
    -- Insert students with proper references
    INSERT INTO students (name, grade, guardian_name, guardian_mobile, pickup_point, bus_number, driver_id, guardian_profile_id, pickup_location_lat, pickup_location_lng) VALUES
    ('Rahul Sharma', '5', 'Rajesh Sharma', '9876543213', 'Main Market Stop', 'HR-01-AB-1234', driver1_id, (SELECT id FROM profiles WHERE mobile_number = '9876543213'), 28.6139, 77.2090),
    ('Priya Gupta', '7', 'Sunita Gupta', '9876543214', 'Railway Station Stop', 'HR-01-AB-5678', driver2_id, (SELECT id FROM profiles WHERE mobile_number = '9876543214'), 28.6219, 77.2166),
    ('Amit Kumar', '6', 'Rajesh Sharma', '9876543213', 'Main Market Stop', 'HR-01-AB-1234', driver1_id, (SELECT id FROM profiles WHERE mobile_number = '9876543213'), 28.6139, 77.2090);
    
END $$;