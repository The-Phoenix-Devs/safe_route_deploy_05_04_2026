import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { dataSyncService } from '@/services/dataSyncService';

interface ConnectionStatusProps {
  className?: string;
  showDetails?: boolean;
  onRetry?: () => void;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  className,
  showDetails = false,
  onRetry
}) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queueLength, setQueueLength] = useState(0);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setLastSync(new Date());
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    // Update queue length periodically
    const updateQueueLength = () => {
      setQueueLength(dataSyncService.getQueueLength());
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    const queueInterval = setInterval(updateQueueLength, 1000);
    updateQueueLength(); // Initial update

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(queueInterval);
    };
  }, []);

  const handleRetry = async () => {
    if (isRetrying) return;
    
    setIsRetrying(true);
    try {
      await dataSyncService.forceSyncNow();
      setLastSync(new Date());
      onRetry?.();
    } catch (error) {
      console.error('Retry failed:', error);
    } finally {
      setIsRetrying(false);
    }
  };

  const getStatusColor = () => {
    if (!isOnline) return 'text-destructive';
    if (queueLength > 0) return 'text-orange-500';
    return 'text-green-600';
  };

  const getStatusIcon = () => {
    if (isRetrying) return <Loader2 className="h-4 w-4 animate-spin" />;
    if (!isOnline) return <WifiOff className="h-4 w-4" />;
    if (queueLength > 0) return <AlertCircle className="h-4 w-4" />;
    return <CheckCircle className="h-4 w-4" />;
  };

  const getStatusText = () => {
    if (!isOnline) return 'Offline';
    if (queueLength > 0) return `Syncing ${queueLength} items`;
    return 'Online';
  };

  if (!showDetails) {
    return (
      <div className={cn('flex items-center gap-2', getStatusColor(), className)}>
        {getStatusIcon()}
        <span className="text-sm font-medium">{getStatusText()}</span>
      </div>
    );
  }

  return (
    <Alert className={cn('border-l-4', className, {
      'border-l-red-500': !isOnline,
      'border-l-orange-500': isOnline && queueLength > 0,
      'border-l-green-500': isOnline && queueLength === 0
    })}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={getStatusColor()}>
            {getStatusIcon()}
          </div>
          <div>
            <div className="font-medium">{getStatusText()}</div>
            <AlertDescription className="text-sm text-muted-foreground">
              {!isOnline && 'Your changes will sync when connection is restored'}
              {isOnline && queueLength > 0 && 'Syncing pending changes...'}
              {isOnline && queueLength === 0 && lastSync && 
                `Last synced: ${lastSync.toLocaleTimeString()}`}
            </AlertDescription>
          </div>
        </div>
        
        {(!isOnline || queueLength > 0) && (
          <button
            onClick={handleRetry}
            disabled={isRetrying || !isOnline}
            className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRetrying ? 'Retrying...' : 'Retry'}
          </button>
        )}
      </div>
    </Alert>
  );
};

// Hook for connection status
export const useConnectionStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queueLength, setQueueLength] = useState(0);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    const updateQueueLength = () => {
      setQueueLength(dataSyncService.getQueueLength());
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    const interval = setInterval(updateQueueLength, 1000);
    updateQueueLength();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  return {
    isOnline,
    isOffline: !isOnline,
    queueLength,
    hasUnsyncedChanges: queueLength > 0
  };
};