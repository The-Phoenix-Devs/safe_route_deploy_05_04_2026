import { supabase } from '@/integrations/supabase/client';

interface SecurityCheckResponse {
  allowed: boolean;
  blocked?: boolean;
  reason?: string;
  lockTimeRemaining?: number;
  remaining_attempts?: number;
}

export class SecurityService {
  // Check rate limiting for login attempts
  static async checkLoginAttempt(identifier: string): Promise<SecurityCheckResponse> {
    try {
      const { data, error } = await supabase.functions.invoke('auth-security', {
        body: {
          action: 'login_attempt',
          identifier,
          user_agent: navigator.userAgent
        }
      });

      if (error) {
        console.error('Security check error:', error);
        return { allowed: true }; // Fail open for better UX
      }

      return data;
    } catch (error) {
      console.error('Failed to check security:', error);
      return { allowed: true }; // Fail open for better UX
    }
  }

  // Report successful login
  static async reportLoginSuccess(identifier: string, userId: string): Promise<void> {
    try {
      await supabase.functions.invoke('auth-security', {
        body: {
          action: 'login_success',
          identifier,
          user_id: userId,
          user_agent: navigator.userAgent
        }
      });
    } catch (error) {
      console.error('Failed to report login success:', error);
    }
  }

  // Log user session information
  static async logUserSession(userId: string, userType: string, userName: string): Promise<void> {
    try {
      const deviceInfo = this.getDeviceInfo();
      const location = await this.getLocationInfo();

      const { error } = await supabase
        .from('user_logs')
        .insert({
          user_id: userId,
          user_type: userType,
          user_name: userName,
          device_info: deviceInfo,
          location: location,
          ip_address: await this.getClientIP()
        });

      if (error) {
        console.error('Failed to log user session:', error);
      }
    } catch (error) {
      console.error('Error logging user session:', error);
    }
  }

  // Get device information
  private static getDeviceInfo(): string {
    const { userAgent } = navigator;
    const platform = navigator.platform;
    const language = navigator.language;
    
    return JSON.stringify({
      userAgent,
      platform,
      language,
      screen: {
        width: screen.width,
        height: screen.height
      },
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    });
  }

  // Get approximate location (if available)
  private static async getLocationInfo(): Promise<string> {
    try {
      // Try to get timezone-based location
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      return timezone;
    } catch {
      return 'Unknown';
    }
  }

  // Get client IP (approximate, since we're on client side)
  private static async getClientIP(): Promise<string> {
    try {
      // This is a fallback - actual IP will be captured on server side
      return 'client-side';
    } catch {
      return 'unknown';
    }
  }

  // Check if current session is suspicious
  static async checkSessionSecurity(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('security_audit_log')
        .select('action, created_at, ip_address')
        .eq('user_id', userId)
        .eq('action', 'suspicious_login_pattern')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours
        .limit(1);

      if (error) {
        console.error('Failed to check session security:', error);
        return true; // Assume secure if we can't check
      }

      return !data || data.length === 0;
    } catch (error) {
      console.error('Error checking session security:', error);
      return true; // Assume secure if we can't check
    }
  }

  // Validate sensitive operations with additional security
  static async validateSensitiveOperation(operation: string, userId: string): Promise<boolean> {
    try {
      // Check recent security events
      const { data, error } = await supabase
        .from('security_audit_log')
        .select('action, created_at')
        .eq('user_id', userId)
        .in('action', ['suspicious_login_pattern', 'failed_login_attempt'])
        .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString()) // Last hour
        .limit(5);

      if (error) {
        console.error('Failed to validate sensitive operation:', error);
        return true; // Allow if we can't check
      }

      // If there are recent suspicious activities, block sensitive operations
      if (data && data.length > 0) {
        console.warn(`Blocking sensitive operation ${operation} due to recent suspicious activity`);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error validating sensitive operation:', error);
      return true; // Allow if we can't check
    }
  }
}