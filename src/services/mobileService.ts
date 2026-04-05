import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Device } from '@capacitor/device';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { StatusBar, Style } from '@capacitor/status-bar';

export class MobileService {
  private static instance: MobileService;

  static getInstance(): MobileService {
    if (!MobileService.instance) {
      MobileService.instance = new MobileService();
    }
    return MobileService.instance;
  }

  async initializeMobile() {
    try {
      const info = await Device.getInfo();
      console.log('Device info:', info);

      if (info.platform !== 'web') {
        // Set status bar style for mobile
        await StatusBar.setStyle({ style: Style.Default });
      }

      return info;
    } catch (error) {
      console.error('Failed to initialize mobile features:', error);
      return null;
    }
  }

  async isNativeApp(): Promise<boolean> {
    try {
      const info = await Device.getInfo();
      return info.platform !== 'web';
    } catch {
      return false;
    }
  }

  async takePhoto(): Promise<string | null> {
    try {
      const photo = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera
      });

      return photo.dataUrl || null;
    } catch (error) {
      console.error('Failed to take photo:', error);
      return null;
    }
  }

  async selectImage(): Promise<string | null> {
    try {
      const photo = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Photos
      });

      return photo.dataUrl || null;
    } catch (error) {
      console.error('Failed to select image:', error);
      return null;
    }
  }

  async hapticFeedback(type: 'light' | 'medium' | 'heavy' = 'light') {
    try {
      const isNative = await this.isNativeApp();
      if (!isNative) return;

      const impactStyle = {
        light: ImpactStyle.Light,
        medium: ImpactStyle.Medium,
        heavy: ImpactStyle.Heavy
      };

      await Haptics.impact({ style: impactStyle[type] });
    } catch (error) {
      console.error('Haptic feedback failed:', error);
    }
  }

  async setStatusBarColor(color: string) {
    try {
      const isNative = await this.isNativeApp();
      if (!isNative) return;

      await StatusBar.setBackgroundColor({ color });
    } catch (error) {
      console.error('Failed to set status bar color:', error);
    }
  }
}

export const mobileService = MobileService.getInstance();