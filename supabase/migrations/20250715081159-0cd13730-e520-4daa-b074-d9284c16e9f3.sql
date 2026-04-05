-- Insert drivers with proper profile references
INSERT INTO drivers (name, mobile_number, bus_number, profile_id, route_id, license_number) 
SELECT 
    'Ram Kumar', 
    '9876543211', 
    'HR-01-AB-1234', 
    p.id, 
    r.id, 
    'DL123456789'
FROM profiles p, routes r 
WHERE p.mobile_number = '9876543211' AND r.name = 'Route A'
UNION ALL
SELECT 
    'Shyam Singh', 
    '9876543212', 
    'HR-01-AB-5678', 
    p.id, 
    r.id, 
    'DL987654321'
FROM profiles p, routes r 
WHERE p.mobile_number = '9876543212' AND r.name = 'Route B';

-- Insert students with proper references
INSERT INTO students (name, grade, guardian_name, guardian_mobile, pickup_point, bus_number, driver_id, guardian_profile_id, pickup_location_lat, pickup_location_lng) 
SELECT 
    'Rahul Sharma', 
    '5', 
    'Rajesh Sharma', 
    '9876543213', 
    'Main Market Stop', 
    'HR-01-AB-1234', 
    d.id, 
    p.id, 
    28.6139, 
    77.2090
FROM drivers d, profiles p 
WHERE d.mobile_number = '9876543211' AND p.mobile_number = '9876543213'
UNION ALL
SELECT 
    'Priya Gupta', 
    '7', 
    'Sunita Gupta', 
    '9876543214', 
    'Railway Station Stop', 
    'HR-01-AB-5678', 
    d.id, 
    p.id, 
    28.6219, 
    77.2166
FROM drivers d, profiles p 
WHERE d.mobile_number = '9876543212' AND p.mobile_number = '9876543214'
UNION ALL
SELECT 
    'Amit Kumar', 
    '6', 
    'Rajesh Sharma', 
    '9876543213', 
    'Main Market Stop', 
    'HR-01-AB-1234', 
    d.id, 
    p.id, 
    28.6139, 
    77.2090
FROM drivers d, profiles p 
WHERE d.mobile_number = '9876543211' AND p.mobile_number = '9876543213';