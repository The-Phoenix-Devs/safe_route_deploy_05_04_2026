class PWAService {
  private deferredPrompt: any = null;
  private isInstalled = false;

  async initialize(): Promise<void> {
    // Register service worker
    if ('serviceWorker' in navigator) {
      try {
        await navigator.serviceWorker.register('/sw.js');
        console.log('PWA Service Worker registered');
      } catch (error) {
        console.error('PWA Service Worker registration failed:', error);
      }
    }

    // Listen for install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      console.log('beforeinstallprompt event fired');
      e.preventDefault();
      this.deferredPrompt = e;
    });

    // Check if already installed
    window.addEventListener('appinstalled', () => {
      this.isInstalled = true;
      console.log('PWA installed successfully');
    });

    // Check if running as PWA
    if (window.matchMedia('(display-mode: standalone)').matches || 
        (window.navigator as any).standalone === true) {
      this.isInstalled = true;
    }
  }

  async showInstallPrompt(): Promise<boolean> {
    // For iOS Safari, show manual installation instructions
    if (this.isIOSSafari()) {
      this.showIOSInstallInstructions();
      return true;
    }

    if (!this.deferredPrompt) {
      console.log('No deferred prompt available');
      return false;
    }

    try {
      console.log('Showing install prompt');
      this.deferredPrompt.prompt();
      const { outcome } = await this.deferredPrompt.userChoice;
      console.log('Install prompt outcome:', outcome);
      this.deferredPrompt = null;
      return outcome === 'accepted';
    } catch (error) {
      console.error('Install prompt failed:', error);
      return false;
    }
  }

  canInstall(): boolean {
    // Can install if we have deferred prompt OR if it's iOS Safari
    return !!this.deferredPrompt || this.isIOSSafari();
  }

  isInstalledApp(): boolean {
    // Check multiple ways for different platforms
    return this.isInstalled || 
           window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as any).standalone === true ||
           document.referrer.includes('android-app://');
  }

  // Detect iOS Safari for manual installation instructions
  private isIOSSafari(): boolean {
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(userAgent);
    const isSafari = /safari/.test(userAgent) && !/chrome|crios|fxios/.test(userAgent);
    const isNotInstalled = !this.isInstalledApp();
    
    return isIOS && isSafari && isNotInstalled;
  }

  private showIOSInstallInstructions(): void {
    // Create a custom modal for iOS installation instructions
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.8);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    `;

    modal.innerHTML = `
      <div style="
        background: white;
        border-radius: 12px;
        padding: 24px;
        max-width: 340px;
        text-align: center;
        font-family: system-ui, -apple-system, sans-serif;
      ">
        <h3 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 600;">
          Install Safe Route App
        </h3>
        <p style="margin: 0 0 20px 0; color: #666; font-size: 14px; line-height: 1.4;">
          To install this app on your iPhone:
        </p>
        <div style="text-align: left; margin-bottom: 20px;">
          <div style="display: flex; align-items: center; margin-bottom: 12px; font-size: 14px;">
            <span style="margin-right: 8px;">1.</span>
            <span>Tap the Share button 
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style="display: inline; margin: 0 4px;">
                <path d="M8.5 12L12 8.5L15.5 12" stroke="currentColor" stroke-width="2"/>
                <path d="M12 8.5V21" stroke="currentColor" stroke-width="2"/>
                <path d="M3 3H21V6H3V3Z" stroke="currentColor" stroke-width="2"/>
              </svg>
            </span>
          </div>
          <div style="display: flex; align-items: center; margin-bottom: 12px; font-size: 14px;">
            <span style="margin-right: 8px;">2.</span>
            <span>Scroll down and tap "Add to Home Screen"</span>
          </div>
          <div style="display: flex; align-items: center; font-size: 14px;">
            <span style="margin-right: 8px;">3.</span>
            <span>Tap "Add" to install</span>
          </div>
        </div>
        <button onclick="this.parentElement.parentElement.remove()" style="
          background: #007AFF;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
        ">
          Got it
        </button>
      </div>
    `;

    document.body.appendChild(modal);
  }

  // Check if app is online
  isOnline(): boolean {
    return navigator.onLine;
  }

  // Listen for online/offline changes
  onConnectionChange(callback: (isOnline: boolean) => void): () => void {
    const onlineHandler = () => callback(true);
    const offlineHandler = () => callback(false);

    window.addEventListener('online', onlineHandler);
    window.addEventListener('offline', offlineHandler);

    return () => {
      window.removeEventListener('online', onlineHandler);
      window.removeEventListener('offline', offlineHandler);
    };
  }
}

export const pwaService = new PWAService();