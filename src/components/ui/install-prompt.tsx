import React, { useState, useEffect } from 'react';
import { X, Download, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { pwaService } from '@/services/pwaService';

interface InstallPromptProps {
  onInstall?: () => void;
  onDismiss?: () => void;
}

export const InstallPrompt: React.FC<InstallPromptProps> = ({
  onInstall,
  onDismiss
}) => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if app can be installed
    const checkInstallability = () => {
      const canInstall = pwaService.canInstall();
      const isAlreadyInstalled = pwaService.isInstalledApp();
      
      console.log('Install check:', { canInstall, isAlreadyInstalled });
      
      setIsInstalled(isAlreadyInstalled);
      
      // Show prompt if can install and not already installed
      if (canInstall && !isAlreadyInstalled) {
        // Delay showing prompt to avoid interrupting user
        setTimeout(() => {
          console.log('Showing install prompt');
          setShowPrompt(true);
        }, 2000);
      }
    };

    // Initial check
    checkInstallability();

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('beforeinstallprompt event received');
      e.preventDefault();
      setTimeout(checkInstallability, 100);
    };

    // Listen for app installation
    const handleAppInstalled = () => {
      console.log('App installed');
      setIsInstalled(true);
      setShowPrompt(false);
      onInstall?.();
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Also check periodically for iOS Safari users
    const intervalId = setInterval(checkInstallability, 5000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      clearInterval(intervalId);
    };
  }, [onInstall]);

  const handleInstall = async () => {
    setIsInstalling(true);
    
    try {
      const installed = await pwaService.showInstallPrompt();
      if (installed) {
        setShowPrompt(false);
        onInstall?.();
      }
    } catch (error) {
      console.error('Installation failed:', error);
    } finally {
      setIsInstalling(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    onDismiss?.();
    
    // Don't show again for this session
    sessionStorage.setItem('installPromptDismissed', 'true');
  };

  // Don't show if already installed or dismissed this session
  if (
    isInstalled || 
    !showPrompt || 
    sessionStorage.getItem('installPromptDismissed')
  ) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm">
      <Card className="border-primary shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Install Safe Route</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription className="text-sm">
            Install our app for better performance, offline access, and push notifications.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pt-0">
          <div className="flex gap-2">
            <Button
              onClick={handleInstall}
              disabled={isInstalling}
              size="sm"
              className="flex-1"
            >
              {isInstalling ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                  Installing...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Install
                </>
              )}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleDismiss}
            >
              Later
            </Button>
          </div>
          
          <div className="mt-3 text-xs text-muted-foreground">
            Features: 🔄 Offline access, 📱 Push notifications, ⚡ Fast loading
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Hook for install prompt management
export const useInstallPrompt = () => {
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const updateInstallStatus = () => {
      setCanInstall(pwaService.canInstall());
      setIsInstalled(pwaService.isInstalledApp());
    };

    updateInstallStatus();

    // Listen for prompt availability
    const handleBeforeInstallPrompt = () => {
      updateInstallStatus();
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setCanInstall(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptInstall = async () => {
    return await pwaService.showInstallPrompt();
  };

  return {
    canInstall,
    isInstalled,
    promptInstall
  };
};