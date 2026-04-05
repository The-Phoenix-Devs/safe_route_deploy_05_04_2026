-- Update the student record to link to the correct guardian profile
UPDATE students 
SET guardian_profile_id = '2de37e0d-2d5a-4cc5-84d6-f709db76e327'
WHERE guardian_mobile = '9907855410' 
  AND guardian_name = 'Father Name';