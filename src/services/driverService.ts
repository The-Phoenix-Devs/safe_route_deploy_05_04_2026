import { supabase } from '@/integrations/supabase/client';
import { randomUuid } from '@/utils/randomUuid';
import { allocateUniquePortalPin } from '@/services/portalPinService';
import { sendWelcomeNotification } from '@/services/notificationService';

export interface Driver {
  id: string;
  profile_id: string;
  name: string;
  mobile_number?: string;
  phone?: string;
  license_number?: string;
  bus_number: string;
  route_id?: string | null;
  qr_token?: string;
  created_at: string;
  updated_at: string;
  profile?: {
    username: string;
    email: string;
  };
  /** Set only on successful create (for admin UI / WhatsApp). */
  initial_portal_pin?: string;
}

export interface CreateDriverParams {
  name: string;
  mobile_number: string;
  phone?: string;
  license_number?: string;
  bus_number: string;
  route_id?: string;
}

// Create driver with Firebase auth for mobile OTP login
export const createDriver = async (params: CreateDriverParams): Promise<Driver> => {
  try {
    console.log('Creating driver with params:', params);
    
    // Check if a driver with this mobile number already exists
    console.log('Checking for existing profile with mobile:', params.mobile_number);
    const { data: existingProfile, error: profileCheckError } = await supabase
      .from('profiles')
      .select('id, username, user_type')
      .eq('username', params.mobile_number)
      .eq('user_type', 'driver')
      .maybeSingle();

    console.log('Existing profile check result:', { existingProfile, profileCheckError });

    if (profileCheckError) {
      console.error('Error checking existing profile:', profileCheckError);
      throw new Error(`Database error: ${profileCheckError.message}`);
    }

    if (existingProfile) {
      console.log('Found existing driver profile, throwing error');
      throw new Error(`A driver with mobile number ${params.mobile_number} already exists`);
    }

    // Check if a driver with this bus number already exists
    console.log('Checking for existing driver with bus number:', params.bus_number);
    const { data: existingDriver, error: driverCheckError } = await supabase
      .from('drivers')
      .select('id, bus_number')
      .eq('bus_number', params.bus_number)
      .maybeSingle();

    console.log('Existing driver check result:', { existingDriver, driverCheckError });

    if (driverCheckError) {
      console.error('Error checking existing driver:', driverCheckError);
      throw new Error(`Database error: ${driverCheckError.message}`);
    }

    if (existingDriver) {
      console.log('Found existing driver with same bus number, throwing error');
      throw new Error(`A driver with bus number ${params.bus_number} already exists`);
    }

    const routeId =
      params.route_id && String(params.route_id).trim() !== ""
        ? params.route_id
        : null;

    // Generate QR token and firebase UID
    const qrToken = randomUuid();
    const firebaseUid = randomUuid(); // Using UUID for now to avoid Firebase connection issues
    const tempEmail = `${params.mobile_number}@driver.temp`;
    
    console.log('Generated firebaseUid:', firebaseUid, 'for driver:', params.name);
    
    // Create a profile for the driver in Supabase
    console.log('Creating driver profile in Supabase...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert({
        firebase_uid: firebaseUid,
        username: params.mobile_number,
        email: tempEmail,
        user_type: 'driver',
        mobile_number: params.mobile_number
      })
      .select()
      .single();

    if (profileError) {
      console.error('Supabase error creating driver profile:', profileError);
      throw new Error(`Failed to create driver profile: ${profileError.message}`);
    }
    console.log('Driver profile created:', profile);

    // Now create driver record with the profile_id
    console.log('Creating driver record in Supabase...');
    const { data: driver, error } = await supabase
      .from('drivers')
      .insert({
        name: params.name,
        mobile_number: params.mobile_number,
        phone: params.phone,
        license_number: params.license_number,
        bus_number: params.bus_number,
        route_id: routeId,
        qr_token: qrToken,
        profile_id: profile.id
      })
      .select(`
        *,
        profile:profiles(username, email)
      `)
      .single();

    if (error) {
      console.error('Supabase error creating driver:', error);
      // If driver creation fails, cleanup the profile
      await supabase.from('profiles').delete().eq('id', profile.id);
      throw new Error(`Failed to create driver: ${error.message}`);
    }

    console.log('Driver created successfully:', driver);

    let portalPin = await allocateUniquePortalPin();
    let pinSet = false;
    for (let attempt = 0; attempt < 10; attempt++) {
      const { data: pinOk, error: pinError } = await supabase.rpc('init_portal_pin_for_profile', {
        p_profile_id: profile.id,
        p_mobile: params.mobile_number,
        p_plain_pin: portalPin,
      });
      if (pinOk) {
        pinSet = true;
        break;
      }
      if (pinError) {
        console.warn("init_portal_pin_for_profile", pinError);
      }
      portalPin = await allocateUniquePortalPin();
    }
    if (!pinSet) {
      await supabase.from('drivers').delete().eq('id', driver.id);
      await supabase.from('profiles').delete().eq('id', profile.id);
      throw new Error('Failed to set driver login PIN. Please try again or contact support.');
    }
    
    // Send welcome WhatsApp message to the driver
    try {
      await sendWelcomeNotification({
        recipient_type: 'driver',
        name: params.name,
        mobile_number: params.mobile_number,
        bus_number: params.bus_number,
        initial_portal_pin: portalPin,
      });
      console.log('Welcome WhatsApp message sent to driver:', params.name);
    } catch (messageError) {
      console.error('Failed to send welcome message to driver:', messageError);
      // Don't throw error as driver creation was successful
    }
    
    return { ...driver, initial_portal_pin: portalPin };
  } catch (error) {
    console.error('Error creating driver:', error);
    throw error;
  }
};

// Get all drivers
export const getDrivers = async (): Promise<Driver[]> => {
  const { data, error } = await supabase
    .from('drivers')
    .select(`
      *,
      profile:profiles(username, email)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
};

// Get driver by ID
export const getDriverById = async (id: string): Promise<Driver | null> => {
  const { data, error } = await supabase
    .from('drivers')
    .select(`
      *,
      profile:profiles(username, email)
    `)
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching driver:', error);
    return null;
  }

  return data;
};

// Update driver
export const updateDriver = async (id: string, updates: Partial<Driver>): Promise<Driver> => {
  const { data, error } = await supabase
    .from('drivers')
    .update(updates)
    .eq('id', id)
    .select(`
      *,
      profile:profiles(username, email)
    `)
    .single();

  if (error) {
    throw error;
  }

  return data;
};

// Delete driver with complete cleanup
export const deleteDriver = async (id: string): Promise<void> => {
  const { data, error } = await supabase
    .rpc('delete_driver_and_cleanup', { driver_id_param: id });

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error('Driver not found');
  }
};
