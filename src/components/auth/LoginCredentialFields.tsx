
import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from 'lucide-react';

interface LoginCredentialFieldsProps {
  username: string;
  password: string;
  setUsername: (username: string) => void;
  setPassword: (password: string) => void;
  usernamePlaceholder?: string;
}

const LoginCredentialFields: React.FC<LoginCredentialFieldsProps> = ({
  username,
  password,
  setUsername,
  setPassword,
  usernamePlaceholder = "Enter username"
}) => {
  const [showPassword, setShowPassword] = useState(false);
  
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="username">Username</Label>
        <Input
          id="username"
          placeholder={usernamePlaceholder}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="bg-white"
          autoComplete="username"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-white"
            autoComplete="current-password"
          />
          <button 
            type="button"
            className="absolute right-2 top-2.5 text-gray-500 hover:text-gray-700"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>
    </>
  );
};

export default LoginCredentialFields;
