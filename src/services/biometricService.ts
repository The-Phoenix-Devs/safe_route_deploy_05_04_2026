import { Device } from '@capacitor/device';

// Enhanced biometric service with WebAuthn support for PWA Android installations

export interface BiometricOptions {
  reason?: string;
  title?: string;
  subtitle?: string;
  fallbackTitle?: string;
}

export interface BiometricResult {
  isAvailable: boolean;
  biometryType?: 'TouchID' | 'FaceID' | 'Fingerprint' | 'None';
  success?: boolean;
  error?: string;
}

export class BiometricService {
  private static instance: BiometricService;

  static getInstance(): BiometricService {
    if (!BiometricService.instance) {
      BiometricService.instance = new BiometricService();
    }
    return BiometricService.instance;
  }

  async isAvailable(): Promise<BiometricResult> {
    try {
      // Check if running as PWA (standalone mode) or in browser
      const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                   (window.navigator as any).standalone === true;
      
      // Check WebAuthn support
      if (!window.PublicKeyCredential) {
        return {
          isAvailable: false,
          biometryType: 'None',
          error: 'WebAuthn not supported by browser'
        };
      }

      // Check for platform authenticator (biometric)
      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      
      if (!available) {
        return {
          isAvailable: false,
          biometryType: 'None',
          error: 'Platform authenticator not available'
        };
      }

      // Detect platform type
      const userAgent = navigator.userAgent.toLowerCase();
      let biometryType: 'TouchID' | 'FaceID' | 'Fingerprint' | 'None' = 'Fingerprint';
      
      if (userAgent.includes('iphone') || userAgent.includes('ipad')) {
        biometryType = 'TouchID'; // Could be FaceID on newer devices
      } else if (userAgent.includes('android')) {
        biometryType = 'Fingerprint';
      }

      return {
        isAvailable: true,
        biometryType
      };
    } catch (error) {
      return {
        isAvailable: false,
        biometryType: 'None',
        error: 'Failed to check biometric availability'
      };
    }
  }

  async authenticate(options: BiometricOptions = {}): Promise<BiometricResult> {
    try {
      const availability = await this.isAvailable();
      
      if (!availability.isAvailable) {
        return availability;
      }

      return this.webAuthenticate(options);
    } catch (error) {
      return {
        isAvailable: false,
        success: false,
        error: 'Authentication failed'
      };
    }
  }

  private async webAuthenticate(options: BiometricOptions): Promise<BiometricResult> {
    try {
      if (!window.PublicKeyCredential) {
        return {
          isAvailable: false,
          success: false,
          error: 'WebAuthn not supported'
        };
      }

      // Generate a challenge for authentication
      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);

      const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
        challenge,
        allowCredentials: [],
        userVerification: 'required',
        timeout: 60000,
      };

      // Check if we have stored credentials for this user
      const storedCredentialId = localStorage.getItem('webauthn_credential_id');
      if (storedCredentialId) {
        publicKeyCredentialRequestOptions.allowCredentials = [{
          id: this.base64ToArrayBuffer(storedCredentialId),
          type: 'public-key',
          transports: ['internal']
        }];
      }

      const credential = await navigator.credentials.get({
        publicKey: publicKeyCredentialRequestOptions
      }) as PublicKeyCredential;

      if (credential) {
        return {
          isAvailable: true,
          biometryType: 'Fingerprint',
          success: true
        };
      }

      return {
        isAvailable: true,
        success: false,
        error: 'Authentication cancelled or failed'
      };

    } catch (error: any) {
      console.error('WebAuthn authentication error:', error);
      
      // Handle specific WebAuthn errors
      if (error.name === 'NotAllowedError') {
        return {
          isAvailable: true,
          success: false,
          error: 'Authentication was cancelled or not allowed'
        };
      } else if (error.name === 'NotSupportedError') {
        return {
          isAvailable: false,
          success: false,
          error: 'Biometric authentication not supported on this device'
        };
      } else if (error.name === 'SecurityError') {
        return {
          isAvailable: false,
          success: false,
          error: 'Security error - ensure HTTPS connection'
        };
      }

      return {
        isAvailable: false,
        success: false,
        error: 'Authentication failed: ' + error.message
      };
    }
  }

  async registerBiometric(username: string): Promise<BiometricResult> {
    try {
      if (!window.PublicKeyCredential) {
        return {
          isAvailable: false,
          success: false,
          error: 'WebAuthn not supported'
        };
      }

      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);

      const userId = new TextEncoder().encode(username);

      const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
        challenge,
        rp: {
          name: "Safe Route",
          id: window.location.hostname,
        },
        user: {
          id: userId,
          name: username,
          displayName: username,
        },
        pubKeyCredParams: [
          {
            alg: -7, // ES256
            type: "public-key"
          },
          {
            alg: -257, // RS256
            type: "public-key"
          }
        ],
        authenticatorSelection: {
          authenticatorAttachment: "platform",
          userVerification: "required",
          requireResidentKey: false
        },
        timeout: 60000,
        attestation: "direct"
      };

      const credential = await navigator.credentials.create({
        publicKey: publicKeyCredentialCreationOptions
      }) as PublicKeyCredential;

      if (credential) {
        // Store credential ID for future authentication
        const credentialId = this.arrayBufferToBase64(credential.rawId);
        localStorage.setItem('webauthn_credential_id', credentialId);
        localStorage.setItem('webauthn_username', username);

        return {
          isAvailable: true,
          biometryType: 'Fingerprint',
          success: true
        };
      }

      return {
        isAvailable: true,
        success: false,
        error: 'Failed to register biometric credential'
      };

    } catch (error: any) {
      console.error('WebAuthn registration error:', error);
      return {
        isAvailable: false,
        success: false,
        error: 'Registration failed: ' + error.message
      };
    }
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = window.atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  async storeCredentials(username: string, password: string): Promise<boolean> {
    try {
      // Store encrypted credentials in localStorage for biometric login
      // In production, use more secure storage methods
      const credentials = {
        username,
        password: btoa(password), // Simple encoding, use proper encryption in production
        timestamp: Date.now()
      };

      localStorage.setItem('biometric_credentials', JSON.stringify(credentials));
      return true;
    } catch (error) {
      console.error('Failed to store credentials:', error);
      return false;
    }
  }

  async getStoredCredentials(): Promise<{ username: string; password: string } | null> {
    try {
      const stored = localStorage.getItem('biometric_credentials');
      if (!stored) return null;

      const credentials = JSON.parse(stored);
      
      // Check if credentials are not too old (7 days)
      const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      if (credentials.timestamp < weekAgo) {
        localStorage.removeItem('biometric_credentials');
        return null;
      }

      return {
        username: credentials.username,
        password: atob(credentials.password)
      };
    } catch (error) {
      console.error('Failed to get stored credentials:', error);
      return null;
    }
  }

  async clearStoredCredentials(): Promise<void> {
    localStorage.removeItem('biometric_credentials');
  }
}

export const biometricService = BiometricService.getInstance();