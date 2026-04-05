
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'driver' | 'guardian';
  mobileNumber?: string;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (identifier: string, password: string, role: string) => Promise<void>;
  loginWithMobileNumber: (mobileNumber: string, role: string) => Promise<void>;
  loginWithQR: (qrData: string) => Promise<void>;
  register: (email: string, password: string, role: string, name: string) => Promise<void>;
  logout: () => void;
  resetPassword: (email: string) => Promise<void>;
}
