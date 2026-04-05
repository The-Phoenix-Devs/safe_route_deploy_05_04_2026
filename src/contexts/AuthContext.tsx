
import React, { createContext, useContext } from 'react';
import { AuthContextType, User } from './types/auth.types';
import { useAuthState } from './hooks/useAuthState';
import { useAuthOperations } from './services/authOperations';

// Initialize with empty values
const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, setUser, loading, setLoading } = useAuthState();
  const {
    handleLogin,
    handleMobileLogin,
    handleQRLogin,
    handleRegister,
    handleLogout,
    handleResetPassword
  } = useAuthOperations();

  // Login function for admin (email/password)
  const login = async (identifier: string, password: string, role: string) => {
    await handleLogin(identifier, password, role, setUser, setLoading);
  };

  // Mobile number login function for drivers and guardians
  const loginWithMobileNumber = async (mobileNumber: string, role: string) => {
    await handleMobileLogin(mobileNumber, role, setUser, setLoading);
  };

  // QR Code login function
  const loginWithQR = async (qrData: string) => {
    await handleQRLogin(qrData, setUser, setLoading);
  };

  // Register function
  const register = async (email: string, password: string, role: string, name: string) => {
    await handleRegister(email, password, role, name);
  };

  // Logout function
  const logout = async () => {
    await handleLogout(setUser);
  };

  // Reset password
  const resetPassword = async (email: string) => {
    await handleResetPassword(email);
  };

  const value = {
    user,
    loading,
    login,
    loginWithMobileNumber,
    loginWithQR,
    register,
    logout,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// Re-export the User type for backward compatibility
export type { User };
