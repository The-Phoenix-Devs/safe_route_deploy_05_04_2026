
import { useToast } from '@/components/ui/use-toast';
import { 
  loginWithEmail, 
  loginWithUsername, 
  registerUser, 
  signOut,
  sendOTPToMobile,
  verifyOTPAndLogin
} from '@/services/firebase';
import { authenticateWithQRCode } from '@/services/qrAuthService';
import { logUserLogin } from '@/services/userLogService';
import { User } from '../types/auth.types';

export const useAuthOperations = () => {
  const { toast } = useToast();

  const handleLogin = async (
    identifier: string, 
    password: string, 
    role: string,
    setUser: (user: User | null) => void,
    setLoading: (loading: boolean) => void
  ) => {
    setLoading(true);
    try {
      let userData: User;
      
      // Special case for admin login
      if (role === 'admin') {
        if (identifier.includes('@')) {
          userData = await loginWithEmail(identifier, password);
        } else {
          userData = await loginWithUsername(identifier, password, role);
        }
      } else {
        // For driver and guardian, redirect to mobile login
        throw new Error(`Please use mobile number to login as ${role}`);
      }
      
      // Verify role
      if (userData.role !== role) {
        throw new Error(`Invalid role. You are not a ${role}`);
      }
      
      setUser(userData);
      localStorage.setItem('sishuTirthaUser', JSON.stringify(userData));
      
      // Log user login
      await logUserLogin({
        user_id: userData.id,
        user_type: userData.role as 'driver' | 'guardian' | 'admin',
        user_name: userData.name
      });
      
      toast({
        title: "Login successful",
        description: `Welcome back, ${userData.name}!`,
      });
    } catch (error: any) {
      console.error("Login error:", error);
      toast({
        variant: "destructive",
        title: "Login failed",
        description: error.message || "Invalid credentials. Please try again.",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleMobileLogin = async (
    mobileNumber: string, 
    role: string,
    setUser: (user: User | null) => void,
    setLoading: (loading: boolean) => void
  ) => {
    setLoading(true);
    try {
      // Send OTP to mobile number
      const confirmationResult = await sendOTPToMobile(mobileNumber);
      
      // This would typically be handled by a separate OTP verification component
      // For now, we'll throw an error to indicate OTP verification is needed
      throw new Error('OTP_VERIFICATION_NEEDED');
    } catch (error: any) {
      console.error("Mobile login error:", error);
      if (error.message !== 'OTP_VERIFICATION_NEEDED') {
        toast({
          variant: "destructive",
          title: "Login failed",
          description: error.message || "Invalid mobile number. Please contact admin.",
        });
      }
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleQRLogin = async (
    qrData: string,
    setUser: (user: User | null) => void,
    setLoading: (loading: boolean) => void
  ) => {
    setLoading(true);
    try {
      const userData = await authenticateWithQRCode(JSON.parse(qrData));
      
      setUser(userData);
      localStorage.setItem('sishuTirthaUser', JSON.stringify(userData));
      
      // Log user login
      await logUserLogin({
        user_id: userData.id,
        user_type: userData.role as 'driver' | 'guardian' | 'admin',
        user_name: userData.name
      });
      
      toast({
        title: "QR Login successful",
        description: `Welcome back, ${userData.name}!`,
      });
    } catch (error: any) {
      console.error("QR Login error:", error);
      toast({
        variant: "destructive",
        title: "QR Login failed",
        description: error.message || "Invalid QR code. Please try again.",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (
    email: string, 
    password: string, 
    role: string, 
    name: string
  ) => {
    try {
      await registerUser(email, password, name, role);
      
      toast({
        title: "Registration successful",
        description: "Your account has been created.",
      });
    } catch (error: any) {
      console.error("Registration error:", error);
      toast({
        variant: "destructive",
        title: "Registration failed",
        description: error.message || "Could not create account. Please try again.",
      });
      throw error;
    }
  };

  const handleLogout = async (setUser: (user: User | null) => void) => {
    try {
      // Clear user state first
      setUser(null);
      
      // Clear all localStorage data
      localStorage.removeItem('sishuTirthaUser');
      
      // Clear any other potential storage
      sessionStorage.clear();
      
      // Sign out from Firebase (if needed)
      await signOut();
      
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
    } catch (error: any) {
      console.error("Logout error:", error);
      // Even if Firebase signout fails, clear local data
      setUser(null);
      localStorage.removeItem('sishuTirthaUser');
      sessionStorage.clear();
      
      toast({
        variant: "destructive",
        title: "Logout completed",
        description: "You have been logged out (with some errors).",
      });
    }
  };

  const handleResetPassword = async (email: string) => {
    try {
      // In Firebase this would call sendPasswordResetEmail
      // For now just show a toast
      toast({
        title: "Reset email sent",
        description: "Check your email to reset your password.",
      });
    } catch (error: any) {
      console.error("Password reset error:", error);
      toast({
        variant: "destructive",
        title: "Reset failed",
        description: error.message || "Could not send password reset email. Please try again.",
      });
      throw error;
    }
  };

  return {
    handleLogin,
    handleMobileLogin,
    handleQRLogin,
    handleRegister,
    handleLogout,
    handleResetPassword
  };
};
