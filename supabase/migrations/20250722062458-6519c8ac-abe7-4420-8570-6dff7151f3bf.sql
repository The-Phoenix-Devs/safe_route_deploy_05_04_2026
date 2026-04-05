-- Insert holiday data from the reference image
INSERT INTO public.holiday_schedule (name, description, start_date, end_date, is_recurring, affects_routes, created_by) VALUES
('New Year''s Day', 'National Holiday', '2024-01-01', '2024-01-01', true, true, (SELECT id FROM profiles WHERE user_type = 'admin' LIMIT 1)),
('Makarsangkranti', 'Traditional Hindu Festival', '2024-01-14', '2024-01-14', true, true, (SELECT id FROM profiles WHERE user_type = 'admin' LIMIT 1)),
('Netaji''s Birthday', 'National Holiday celebrating Subhas Chandra Bose', '2024-01-23', '2024-01-23', true, true, (SELECT id FROM profiles WHERE user_type = 'admin' LIMIT 1)),
('Saraswati Puja', 'Hindu festival dedicated to Goddess Saraswati', '2024-02-04', '2024-02-04', true, true, (SELECT id FROM profiles WHERE user_type = 'admin' LIMIT 1)),
('Dol Yatra', 'Holi festival celebration', '2024-03-14', '2024-03-14', true, true, (SELECT id FROM profiles WHERE user_type = 'admin' LIMIT 1)),
('ID-UL-Fittar', 'Eid al-Fitr celebration', '2024-03-31', '2024-03-31', true, true, (SELECT id FROM profiles WHERE user_type = 'admin' LIMIT 1)),
('Charak', 'Traditional Bengali festival', '2024-04-13', '2024-04-13', true, true, (SELECT id FROM profiles WHERE user_type = 'admin' LIMIT 1)),
('Bengali New Year''s', 'Poila Boishakh celebration', '2024-04-14', '2024-04-14', true, true, (SELECT id FROM profiles WHERE user_type = 'admin' LIMIT 1)),
('Good Friday', 'Christian holiday', '2024-04-14', '2024-04-14', true, true, (SELECT id FROM profiles WHERE user_type = 'admin' LIMIT 1)),
('May Day', 'International Workers'' Day', '2024-05-01', '2024-05-01', true, true, (SELECT id FROM profiles WHERE user_type = 'admin' LIMIT 1)),
('Rabaindranath''s Birth Day', 'Birthday of Rabindranath Tagore', '2024-05-09', '2024-05-09', true, true, (SELECT id FROM profiles WHERE user_type = 'admin' LIMIT 1)),
('Summer Vacation', 'School summer break - dates vary by local weather conditions', '2024-05-15', '2024-06-30', false, true, (SELECT id FROM profiles WHERE user_type = 'admin' LIMIT 1)),
('ID-UZ-Zuha', 'Eid al-Adha celebration', '2024-06-06', '2024-06-06', true, true, (SELECT id FROM profiles WHERE user_type = 'admin' LIMIT 1)),
('Ratha Yatra', 'Jagannath Rath Yatra festival', '2024-06-27', '2024-06-27', true, true, (SELECT id FROM profiles WHERE user_type = 'admin' LIMIT 1)),
('Rainy Vacation', 'Monsoon break - dates vary by local weather conditions', '2024-07-15', '2024-07-31', false, true, (SELECT id FROM profiles WHERE user_type = 'admin' LIMIT 1)),
('Independence Day', 'Indian Independence Day', '2024-08-15', '2024-08-15', true, true, (SELECT id FROM profiles WHERE user_type = 'admin' LIMIT 1)),
('Fatheha-D-Daham', 'Islamic observance', '2024-09-05', '2024-09-05', true, true, (SELECT id FROM profiles WHERE user_type = 'admin' LIMIT 1)),
('Biswakarma Puja', 'Hindu festival honoring Lord Vishvakarma', '2024-09-17', '2024-09-17', true, true, (SELECT id FROM profiles WHERE user_type = 'admin' LIMIT 1)),
('Durga Puja', 'Major Hindu festival celebrating Goddess Durga', '2024-09-29', '2024-10-06', true, true, (SELECT id FROM profiles WHERE user_type = 'admin' LIMIT 1)),
('Kalipuja and Vatridwitia', 'Hindu festivals celebrating Goddess Kali', '2024-10-20', '2024-10-23', true, true, (SELECT id FROM profiles WHERE user_type = 'admin' LIMIT 1)),
('Gurunanak''s Birth Day', 'Guru Nanak Jayanti celebration', '2024-11-05', '2024-11-05', true, true, (SELECT id FROM profiles WHERE user_type = 'admin' LIMIT 1)),
('X-Mas Day', 'Christmas Day celebration', '2024-12-25', '2024-12-25', true, true, (SELECT id FROM profiles WHERE user_type = 'admin' LIMIT 1));

-- Create function to check if today is a holiday or weekend
CREATE OR REPLACE FUNCTION public.get_today_holiday_status()
RETURNS TABLE(
  is_holiday boolean,
  is_weekend boolean,
  holiday_name text,
  holiday_message text
) 
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $$
DECLARE
  today_date date := CURRENT_DATE;
  today_dow integer := EXTRACT(DOW FROM today_date); -- 0=Sunday, 6=Saturday
  holiday_info record;
BEGIN
  -- Check for weekend (Saturday=6, Sunday=0)
  is_weekend := (today_dow = 0 OR today_dow = 6);
  
  -- Check for holidays
  SELECT h.name, h.description INTO holiday_info
  FROM public.holiday_schedule h
  WHERE today_date BETWEEN h.start_date AND h.end_date
  LIMIT 1;
  
  is_holiday := (holiday_info.name IS NOT NULL);
  holiday_name := holiday_info.name;
  
  -- Generate appropriate message
  IF is_holiday AND is_weekend THEN
    holiday_message := 'Today is ' || holiday_name || ' and it''s also a weekend. No school bus service today.';
  ELSIF is_holiday THEN
    holiday_message := 'Today is ' || holiday_name || '. No school bus service today.';
  ELSIF is_weekend THEN
    holiday_message := 'Today is a weekend. No school bus service today.';
  ELSE
    holiday_message := NULL;
  END IF;
  
  RETURN NEXT;
END;
$$;