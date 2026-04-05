import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Fingerprint, Eye, Smartphone } from 'lucide-react';
import { biometricService } from '@/services/biometricService';
import { toast } from 'sonner';

interface BiometricLoginProps {
  onSuccess: (credentials: { username: string; password: string }) => void;
  onFallback: () => void;
  onRegister?: (username: string) => void;
}

export const BiometricLogin: React.FC<BiometricLoginProps> = ({ onSuccess, onFallback, onRegister }) => {
  const [isAvailable, setIsAvailable] = useState(false);
  const [biometryType, setBiometryType] = useState<string>('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [hasStoredCredentials, setHasStoredCredentials] = useState(false);
  const [hasWebAuthnCredentials, setHasWebAuthnCredentials] = useState(false);

  useEffect(() => {
    checkBiometricAvailability();
  }, []);

  const checkBiometricAvailability = async () => {
    const result = await biometricService.isAvailable();
    setIsAvailable(result.isAvailable);
    setBiometryType(result.biometryType || '');
    
    // Check for stored credentials
    const credentials = await biometricService.getStoredCredentials();
    setHasStoredCredentials(!!credentials);
    
    // Check for WebAuthn credentials
    const webauthnCredentials = localStorage.getItem('webauthn_credential_id');
    setHasWebAuthnCredentials(!!webauthnCredentials);
  };

  const handleBiometricLogin = async () => {
    try {
      setIsAuthenticating(true);
      
      const authResult = await biometricService.authenticate({
        reason: 'Use your biometric authentication to sign in to Safe Route',
        title: 'Biometric Authentication',
        subtitle: 'Verify your identity to continue'
      });

      if (authResult.success) {
        // For WebAuthn, we'll get the stored username and use a token-based approach
        if (hasWebAuthnCredentials) {
          const storedUsername = localStorage.getItem('webauthn_username');
          if (storedUsername) {
            // Generate a temporary auth token for biometric login
            const tempToken = 'biometric_' + Date.now();
            localStorage.setItem('biometric_temp_token', tempToken);
            onSuccess({ username: storedUsername, password: tempToken });
            toast.success('Biometric login successful');
            return;
          }
        }

        // Fallback to stored credentials
        const credentials = await biometricService.getStoredCredentials();
        if (credentials) {
          onSuccess(credentials);
          toast.success('Biometric login successful');
        } else {
          toast.error('No stored credentials found. Please sign in with password first.');
          onFallback();
        }
      } else {
        toast.error(authResult.error || 'Biometric authentication failed');
        onFallback();
      }
    } catch (error) {
      console.error('Biometric login error:', error);
      toast.error('Authentication failed');
      onFallback();
    } finally {
      setIsAuthenticating(false);
    }
  };

  const getBiometricIcon = () => {
    switch (biometryType) {
      case 'FaceID':
        return <Eye className="h-8 w-8" />;
      case 'TouchID':
      case 'Fingerprint':
        return <Fingerprint className="h-8 w-8" />;
      default:
        return <Smartphone className="h-8 w-8" />;
    }
  };

  if (!isAvailable) {
    return null;
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          {getBiometricIcon()}
          Quick Sign In
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-center text-muted-foreground">
          {hasWebAuthnCredentials || hasStoredCredentials 
            ? `Use ${biometryType === 'FaceID' ? 'Face ID' : biometryType === 'TouchID' ? 'Touch ID' : 'biometric authentication'} to sign in quickly`
            : 'Set up biometric login for faster access'}
        </p>
        
        {/* Show status indicator */}
        {(hasWebAuthnCredentials || hasStoredCredentials) && (
          <div className="text-center text-sm text-green-600 dark:text-green-400">
            ✓ Biometric login is set up
          </div>
        )}
        
        <Button
          onClick={handleBiometricLogin}
          disabled={isAuthenticating || (!hasWebAuthnCredentials && !hasStoredCredentials)}
          className="w-full"
          size="lg"
        >
          {isAuthenticating 
            ? 'Authenticating...' 
            : hasWebAuthnCredentials || hasStoredCredentials
              ? `Use ${biometryType || 'Biometric'}`
              : 'Set up after login'
          }
        </Button>
        
        <Button
          variant="outline"
          onClick={onFallback}
          className="w-full"
        >
          Use Password Instead
        </Button>
        
        {!hasWebAuthnCredentials && !hasStoredCredentials && (
          <p className="text-xs text-center text-muted-foreground">
            Sign in with your password first to enable biometric login
          </p>
        )}
      </CardContent>
    </Card>
  );
};