
import { useState } from 'react';
import { useRouter } from "next/navigation";
import { useAuth } from '@/contexts/SupabaseAuthProvider';
import { toast } from '@/components/ui/use-toast';
import { authenticateWithQRCode, QRCodeData, QRAuthResult } from '@/services/qrAuthService';

export const useLoginHandler = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [role, setRole] = useState<"guardian" | "driver" | "admin">('guardian');
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();
  const { login, loginWithMobileNumber, logout } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      let loginPromise;
      
      if (role === 'admin') {
        // Admin login with username/email and password
        if (!username || !password) {
          setError('Please enter both username/email and password');
          return;
        }
        loginPromise = login(username, password, role);
      } else {
        // Guardian and Driver login with mobile number only
        if (!mobileNumber) {
          setError('Please enter your mobile number');
          return;
        }
        if (mobileNumber.length !== 10) {
          setError('Please enter a valid 10-digit mobile number');
          return;
        }
        loginPromise = loginWithMobileNumber(mobileNumber, role);
      }
      
      // Show loading toast and await login
      const loadingToast = toast({
        title: "Logging in...",
        description: "Please wait while we authenticate you.",
      });
      
      await loginPromise;
      
      // Redirect based on role
      if (role === 'admin') {
        router.push("/admin/dashboard");
      } else if (role === "driver") {
        router.push("/driver/dashboard");
      } else if (role === "guardian") {
        router.push("/guardian/dashboard");
      }
    } catch (error: any) {
      setError(error.message || 'Login failed');
      toast({
        title: "Login Failed",
        description: error.message || 'Login failed',
        variant: "destructive",
      });
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  // For QR code scanning in driver login
  const handleQrCodeScanned = async (data: string) => {
    try {
      const qrData: QRCodeData = JSON.parse(data);
      
      if (!qrData.token || !qrData.username) {
        throw new Error("Invalid QR code format");
      }
      
      setError(null);
      
      // If QR code has password, do full authentication
      if (qrData.password && qrData.email) {
        try {
          // Authenticate using regular login with credentials from QR
          await login(qrData.email, qrData.password, 'driver');
          router.push("/driver/dashboard");
          
          toast({
            title: "QR Login Successful",
            description: "You have been logged in successfully!",
          });
        } catch (loginError) {
          throw new Error("Authentication failed with QR credentials");
        }
      } else {
        // QR code without password - auto-fill username and prompt for password
        const userData = await authenticateWithQRCode(qrData);
        
        if (userData.requiresPassword) {
          // Set the username and switch to credential tab for password entry
          setUsername(qrData.username);
          setRole('driver');
          
          toast({
            title: "QR Code Verified",
            description: "Username auto-filled. Please enter your password to complete login.",
          });
        }
      }
      
    } catch (error: any) {
      console.error("QR code scan error:", error);
      setError(error.message || "Could not log in with QR code");
      toast({
        variant: "destructive",
        title: "QR Login Failed",
        description: error.message || "Invalid QR code or credentials",
      });
    }
  };

  const handleScannerError = (error: Error) => {
    console.error("Scanner error:", error);
    setError("QR scanner error: " + error.message);
  };

  return {
    username,
    setUsername,
    password,
    setPassword,
    mobileNumber,
    setMobileNumber,
    role,
    setRole,
    error,
    handleLogin,
    handleLogout,
    handleQrCodeScanned,
    handleScannerError
  };
};

export default useLoginHandler;
