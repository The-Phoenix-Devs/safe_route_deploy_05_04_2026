import { useState, useEffect } from 'react';
import { mobileService } from '@/services/mobileService';

export const useMobile = () => {
  const [isNative, setIsNative] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState<any>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializeMobile = async () => {
      try {
        const info = await mobileService.initializeMobile();
        const isNativeApp = await mobileService.isNativeApp();
        
        setDeviceInfo(info);
        setIsNative(isNativeApp);
      } catch (error) {
        console.error('Failed to initialize mobile:', error);
        setIsNative(false);
      } finally {
        setIsInitialized(true);
      }
    };

    initializeMobile();
  }, []);

  const takePhoto = async () => {
    return await mobileService.takePhoto();
  };

  const selectImage = async () => {
    return await mobileService.selectImage();
  };

  const hapticFeedback = async (type: 'light' | 'medium' | 'heavy' = 'light') => {
    await mobileService.hapticFeedback(type);
  };

  const setStatusBarColor = async (color: string) => {
    await mobileService.setStatusBarColor(color);
  };

  return {
    isNative,
    deviceInfo,
    isInitialized,
    takePhoto,
    selectImage,
    hapticFeedback,
    setStatusBarColor
  };
};