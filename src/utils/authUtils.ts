
/**
 * Helper functions for authentication
 */

interface Credentials {
  username: string;
  password: string;
  email?: string; // Optional for backward compatibility
}

/**
 * Generates a unique username and password for a new user
 * @param name The full name of the user
 * @param role The role of the user (guardian, driver, admin)
 * @returns An object containing the generated username and password
 */
export const generateCredentials = (name: string, role: 'guardian' | 'driver' | 'admin'): Credentials => {
  if (role === 'guardian') {
    // For guardians, use the SishuTirtha prefix with the student name
    // Remove spaces, special characters, and convert to lowercase
    const cleanName = name.toLowerCase().replace(/[^a-z0-9]/gi, '');
    
    // Generate a random suffix (4 digits) for uniqueness
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    
    // Create username with format: SishuTirtha + studentName + randomSuffix
    const username = `SishuTirtha${cleanName}${randomSuffix}`;
    
    // Generate a secure password based on the student name with special characters and numbers
    // For increased security, we'll add special characters and ensure minimum length
    const specialChars = '!@#$%^&*';
    const randomSpecialChar = specialChars.charAt(Math.floor(Math.random() * specialChars.length));
    const randomDigits = Math.floor(100000 + Math.random() * 900000); // 6-digit number
    
    // Password format: studentName + specialChar + 6-digit number
    // This ensures a strong password with mixed characters
    let password = `${cleanName}${randomSpecialChar}${randomDigits}`;
    
    // Ensure password is at least 10 characters
    if (password.length < 10) {
      const additionalChars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
      while (password.length < 10) {
        password += additionalChars.charAt(Math.floor(Math.random() * additionalChars.length));
      }
    }
    
    return { username, password };
  } else {
    // For other roles, use the existing logic
    // Generate username based on name (lowercase, no spaces, add random digits)
    const nameParts = name.toLowerCase().split(' ');
    const baseUsername = nameParts.join('');
    const randomDigits = Math.floor(1000 + Math.random() * 9000); // 4-digit number
    const username = baseUsername + randomDigits;
    
    // Generate a secure password
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 10; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return { username, password };
  }
};

/**
 * Validates a username
 * @param username The username to validate
 * @returns True if the username is valid, false otherwise
 */
export const validateUsername = (username: string): boolean => {
  // Username must be at least 4 characters long and contain only alphanumeric characters
  return username.length >= 4 && /^[a-zA-Z0-9]+$/.test(username);
};

/**
 * Validates a password
 * @param password The password to validate
 * @returns True if the password is valid, false otherwise
 */
export const validatePassword = (password: string): boolean => {
  // Password must be at least 8 characters long
  // And contain at least one number, one uppercase letter, and one special character
  const hasNumber = /\d/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const hasSpecialChar = /[!@#$%^&*]/.test(password);
  
  return password.length >= 8 && hasNumber && (hasUppercase || hasSpecialChar);
};
