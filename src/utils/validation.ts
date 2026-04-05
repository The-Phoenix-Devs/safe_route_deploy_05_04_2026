// Security validation utilities

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

// Phone number validation
export const validatePhone = (phone: string): ValidationResult => {
  // Remove all non-digit characters for validation
  const cleanPhone = phone.replace(/\D/g, '');
  
  if (!cleanPhone) {
    return { isValid: false, error: 'Phone number is required' };
  }
  
  if (cleanPhone.length < 10) {
    return { isValid: false, error: 'Phone number must be at least 10 digits' };
  }
  
  if (cleanPhone.length > 15) {
    return { isValid: false, error: 'Phone number cannot exceed 15 digits' };
  }
  
  // Indian mobile number validation (starts with 6-9)
  if (cleanPhone.length === 10 && !/^[6-9]/.test(cleanPhone)) {
    return { isValid: false, error: 'Invalid Indian mobile number format' };
  }
  
  return { isValid: true };
};

// Email validation
export const validateEmail = (email: string): ValidationResult => {
  if (!email) {
    return { isValid: false, error: 'Email is required' };
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Please enter a valid email address' };
  }
  
  return { isValid: true };
};

// Name validation
export const validateName = (name: string): ValidationResult => {
  if (!name || name.trim().length === 0) {
    return { isValid: false, error: 'Name is required' };
  }
  
  if (name.trim().length < 2) {
    return { isValid: false, error: 'Name must be at least 2 characters' };
  }
  
  if (name.trim().length > 50) {
    return { isValid: false, error: 'Name cannot exceed 50 characters' };
  }
  
  // Only allow letters, spaces, hyphens, and apostrophes
  const nameRegex = /^[a-zA-Z\s\-']+$/;
  if (!nameRegex.test(name.trim())) {
    return { isValid: false, error: 'Name can only contain letters, spaces, hyphens, and apostrophes' };
  }
  
  return { isValid: true };
};

// Bus number validation
export const validateBusNumber = (busNumber: string): ValidationResult => {
  if (!busNumber || busNumber.trim().length === 0) {
    return { isValid: false, error: 'Bus number is required' };
  }
  
  if (busNumber.trim().length < 3) {
    return { isValid: false, error: 'Bus number must be at least 3 characters' };
  }
  
  if (busNumber.trim().length > 20) {
    return { isValid: false, error: 'Bus number cannot exceed 20 characters' };
  }
  
  // Allow alphanumeric, hyphens, and spaces
  const busRegex = /^[a-zA-Z0-9\s\-]+$/;
  if (!busRegex.test(busNumber.trim())) {
    return { isValid: false, error: 'Bus number can only contain letters, numbers, spaces, and hyphens' };
  }
  
  return { isValid: true };
};

// Grade validation
export const validateGrade = (grade: string): ValidationResult => {
  if (!grade || grade.trim().length === 0) {
    return { isValid: false, error: 'Grade is required' };
  }
  
  const validGrades = [
    'Nursery', 'LKG', 'UKG', 'KG',
    '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12',
    'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6',
    'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12'
  ];
  
  if (!validGrades.includes(grade.trim())) {
    return { isValid: false, error: 'Please enter a valid grade' };
  }
  
  return { isValid: true };
};

// License number validation
export const validateLicenseNumber = (license: string): ValidationResult => {
  if (!license || license.trim().length === 0) {
    return { isValid: false, error: 'License number is required' };
  }
  
  if (license.trim().length < 8) {
    return { isValid: false, error: 'License number must be at least 8 characters' };
  }
  
  if (license.trim().length > 20) {
    return { isValid: false, error: 'License number cannot exceed 20 characters' };
  }
  
  // Allow alphanumeric and common license format characters
  const licenseRegex = /^[a-zA-Z0-9\s\-\/]+$/;
  if (!licenseRegex.test(license.trim())) {
    return { isValid: false, error: 'Invalid license number format' };
  }
  
  return { isValid: true };
};

// Pickup point validation
export const validatePickupPoint = (point: string): ValidationResult => {
  if (!point || point.trim().length === 0) {
    return { isValid: false, error: 'Pickup point is required' };
  }
  
  if (point.trim().length < 3) {
    return { isValid: false, error: 'Pickup point must be at least 3 characters' };
  }
  
  if (point.trim().length > 100) {
    return { isValid: false, error: 'Pickup point cannot exceed 100 characters' };
  }
  
  return { isValid: true };
};

// Sanitize input to prevent XSS
export const sanitizeInput = (input: string): string => {
  return input
    .replace(/[<>\"']/g, '') // Remove potential script tags
    .trim();
};

// Rate limiting state
const rateLimitStore = new Map<string, { attempts: number; firstAttempt: number }>();

// Rate limiting function
export const checkRateLimit = (identifier: string, maxAttempts: number = 5, windowMs: number = 15 * 60 * 1000): boolean => {
  const now = Date.now();
  const record = rateLimitStore.get(identifier);
  
  if (!record) {
    rateLimitStore.set(identifier, { attempts: 1, firstAttempt: now });
    return true;
  }
  
  // Reset if window has passed
  if (now - record.firstAttempt > windowMs) {
    rateLimitStore.set(identifier, { attempts: 1, firstAttempt: now });
    return true;
  }
  
  // Check if limit exceeded
  if (record.attempts >= maxAttempts) {
    return false;
  }
  
  // Increment attempts
  record.attempts++;
  return true;
};

// Clear rate limit (for successful operations)
export const clearRateLimit = (identifier: string): void => {
  rateLimitStore.delete(identifier);
};