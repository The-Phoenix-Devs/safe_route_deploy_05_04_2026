import { supabase } from '@/integrations/supabase/client';
import { randomUuid } from '@/utils/randomUuid';
import { allocateUniquePortalPin } from '@/services/portalPinService';
import { sendWelcomeNotification } from '@/services/notificationService';

export interface Student {
  id: string;
  name: string;
  grade: string;
  guardian_name: string;
  guardian_mobile?: string;
  guardian_profile_id?: string;
  pickup_point: string;
  driver_id?: string;
  bus_number?: string;
  created_at: string;
  updated_at: string;
  guardian_profile?: {
    username: string;
    email: string;
  };
  /** Set only on successful create (for admin UI / WhatsApp). */
  initial_portal_pin?: string;
  driver?: {
    name: string;
    bus_number: string;
  };
}

export interface CreateStudentParams {
  name: string;
  grade: string;
  guardian_name: string;
  guardian_mobile: string;
  pickup_point: string;
  driver_id?: string;
  bus_number?: string;
}

// Create student with guardian profile (Supabase only)
export const createStudent = async (params: CreateStudentParams): Promise<Student> => {
  try {
    console.log('Creating student with params:', params);

    // Validate required fields
    if (!params.name || !params.grade || !params.guardian_name || !params.guardian_mobile || !params.pickup_point) {
      throw new Error('Missing required fields for student creation');
    }

    // Generate a unique firebase_uid for the guardian profile
    const firebaseUid = randomUuid();
    const tempEmail = `${params.guardian_mobile}@guardian.temp`;

    // Create a profile for the guardian in Supabase
    console.log('Creating guardian profile in Supabase...');
    const { data: guardianProfile, error: profileError } = await supabase
      .from('profiles')
      .insert({
        firebase_uid: firebaseUid,
        username: params.guardian_mobile,
        email: tempEmail,
        user_type: 'guardian',
        mobile_number: params.guardian_mobile
      })
      .select()
      .single();

    if (profileError) {
      console.error('Supabase error creating guardian profile:', profileError);
      throw new Error(`Failed to create guardian profile: ${profileError.message}`);
    }
    console.log('Guardian profile created:', guardianProfile);

    let portalPin = await allocateUniquePortalPin();
    let pinSet = false;
    for (let attempt = 0; attempt < 10; attempt++) {
      const { data: pinOk, error: pinError } = await supabase.rpc('init_portal_pin_for_profile', {
        p_profile_id: guardianProfile.id,
        p_mobile: params.guardian_mobile,
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
      await supabase.from('profiles').delete().eq('id', guardianProfile.id);
      throw new Error('Failed to set guardian login PIN. Please try again or contact support.');
    }

    // Now create student record with the guardian_profile_id
    console.log('Creating student record in Supabase...');
    const { data: student, error } = await supabase
      .from('students')
      .insert({
        name: params.name,
        grade: params.grade,
        guardian_name: params.guardian_name,
        guardian_mobile: params.guardian_mobile,
        pickup_point: params.pickup_point,
        driver_id: params.driver_id || null,
        bus_number: params.bus_number || null,
        guardian_profile_id: guardianProfile.id
      })
      .select(`
        *,
        driver:drivers(name, bus_number)
      `)
      .single();

    if (error) {
      console.error('Supabase error creating student:', error);
      // If student creation fails, cleanup the guardian profile
      try {
        await supabase.from('profiles').delete().eq('id', guardianProfile.id);
        console.log('Cleaned up guardian profile after student creation failure');
      } catch (cleanupError) {
        console.error('Error cleaning up guardian profile:', cleanupError);
      }
      throw new Error(`Failed to create student: ${error.message}`);
    }

    console.log('Student created successfully:', student);
    
    // Send welcome WhatsApp message to the guardian
    try {
      // Get driver information if assigned
      let driverName = 'TBD';
      if (student.driver && student.driver.name) {
        driverName = student.driver.name;
      }
      
      await sendWelcomeNotification({
        recipient_type: 'guardian',
        name: params.guardian_name,
        mobile_number: params.guardian_mobile,
        bus_number: params.bus_number || 'TBD',
        pickup_point: params.pickup_point,
        driver_name: driverName,
        initial_portal_pin: portalPin,
      });
      console.log('Welcome WhatsApp message sent to guardian:', params.guardian_name);
    } catch (messageError) {
      console.error('Failed to send welcome message to guardian:', messageError);
      // Don't throw error as student creation was successful
    }
    
    return { ...student, initial_portal_pin: portalPin };
  } catch (error) {
    console.error('Error creating student:', error);
    throw error;
  }
};

// Get all students
export const getStudents = async (): Promise<Student[]> => {
  const { data, error } = await supabase
    .from('students')
    .select(`
      *,
      guardian_profile:profiles!guardian_profile_id(username, email),
      driver:drivers(name, bus_number)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
};

// Get student by ID
export const getStudentById = async (id: string): Promise<Student | null> => {
  const { data, error } = await supabase
    .from('students')
    .select(`
      *,
      guardian_profile:profiles!guardian_profile_id(username, email),
      driver:drivers(name, bus_number)
    `)
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching student:', error);
    return null;
  }

  return data;
};

// Update student
export const updateStudent = async (id: string, updates: Partial<Student>): Promise<Student> => {
  const { data, error } = await supabase
    .from('students')
    .update(updates)
    .eq('id', id)
    .select(`
      *,
      guardian_profile:profiles!guardian_profile_id(username, email),
      driver:drivers(name, bus_number)
    `)
    .single();

  if (error) {
    throw error;
  }

  return data;
};

// Delete student
export const deleteStudent = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('students')
    .delete()
    .eq('id', id);

  if (error) {
    throw error;
  }
};
