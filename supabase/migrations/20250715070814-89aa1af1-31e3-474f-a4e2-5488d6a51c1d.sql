-- Create sample data for testing
INSERT INTO routes (name, start_point, end_point, description) VALUES
('Route A', 'School Gate', 'Main Market', 'Morning route covering central areas'),
('Route B', 'School Gate', 'Railway Station', 'Route covering railway station area'),
('Route C', 'School Gate', 'Bus Stand', 'Route covering bus stand and nearby areas');

-- Insert sample profiles
INSERT INTO profiles (username, email, user_type, firebase_uid, mobile_number) VALUES
('admin', 'admin@sishutirhta.com', 'admin', 'admin-firebase-uid', '9876543210'),
('driver1', 'driver1@sishutirhta.com', 'driver', 'driver1-firebase-uid', '9876543211'),
('driver2', 'driver2@sishutirhta.com', 'driver', 'driver2-firebase-uid', '9876543212'),
('guardian1', 'guardian1@sishutirhta.com', 'guardian', 'guardian1-firebase-uid', '9876543213'),
('guardian2', 'guardian2@sishutirhta.com', 'guardian', 'guardian2-firebase-uid', '9876543214');