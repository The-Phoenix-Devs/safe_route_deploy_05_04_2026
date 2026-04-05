import { supabase } from '@/integrations/supabase/client';

interface SyncData {
  id: string;
  table: string;
  operation: 'insert' | 'update' | 'delete';
  data: any;
  timestamp: number;
  synced: boolean;
}

class DataSyncService {
  private static instance: DataSyncService;
  private syncQueue: SyncData[] = [];
  private isOnline = navigator.onLine;
  private syncInProgress = false;
  private dbName = 'SafeRouteOfflineDB';
  private dbVersion = 1;

  private constructor() {
    this.initializeOfflineDB();
    this.setupOnlineListener();
    this.setupPeriodicSync();
  }

  static getInstance(): DataSyncService {
    if (!DataSyncService.instance) {
      DataSyncService.instance = new DataSyncService();
    }
    return DataSyncService.instance;
  }

  // Initialize IndexedDB for offline storage
  private async initializeOfflineDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create stores for different data types
        if (!db.objectStoreNames.contains('syncQueue')) {
          const syncStore = db.createObjectStore('syncQueue', { keyPath: 'id' });
          syncStore.createIndex('timestamp', 'timestamp');
          syncStore.createIndex('synced', 'synced');
        }

        if (!db.objectStoreNames.contains('offlineData')) {
          const dataStore = db.createObjectStore('offlineData', { keyPath: 'id' });
          dataStore.createIndex('table', 'table');
          dataStore.createIndex('lastModified', 'lastModified');
        }

        if (!db.objectStoreNames.contains('liveLocations')) {
          const locationStore = db.createObjectStore('liveLocations', { keyPath: 'user_id' });
          locationStore.createIndex('timestamp', 'timestamp');
          locationStore.createIndex('user_type', 'user_type');
        }

        if (!db.objectStoreNames.contains('studentData')) {
          const studentStore = db.createObjectStore('studentData', { keyPath: 'id' });
          studentStore.createIndex('guardian_profile_id', 'guardian_profile_id');
          studentStore.createIndex('driver_id', 'driver_id');
        }
      };
    });
  }

  // Setup online/offline listeners
  private setupOnlineListener(): void {
    window.addEventListener('online', () => {
      console.log('Connection restored - syncing data...');
      this.isOnline = true;
      this.syncPendingData();
    });

    window.addEventListener('offline', () => {
      console.log('Connection lost - switching to offline mode');
      this.isOnline = false;
    });
  }

  // Setup periodic sync every 30 seconds when online
  private setupPeriodicSync(): void {
    setInterval(() => {
      if (this.isOnline && !this.syncInProgress) {
        this.syncPendingData();
      }
    }, 30000);
  }

  // Add data operation to sync queue
  async queueDataOperation(
    table: string,
    operation: 'insert' | 'update' | 'delete',
    data: any
  ): Promise<void> {
    const syncItem: SyncData = {
      id: `${table}_${operation}_${Date.now()}_${Math.random()}`,
      table,
      operation,
      data,
      timestamp: Date.now(),
      synced: false
    };

    this.syncQueue.push(syncItem);
    await this.storeInOfflineDB('syncQueue', syncItem);

    // Try immediate sync if online
    if (this.isOnline) {
      this.syncPendingData();
    }
  }

  // Sync pending data operations
  private async syncPendingData(): Promise<void> {
    if (this.syncInProgress || !this.isOnline) return;

    this.syncInProgress = true;
    console.log('Starting data sync...');

    try {
      // Get pending operations from IndexedDB
      const pendingOps = await this.getFromOfflineDB('syncQueue', { synced: false });
      
      if (pendingOps.length === 0) {
        console.log('No pending operations to sync');
        return;
      }

      console.log(`Syncing ${pendingOps.length} pending operations`);

      // Process operations in order
      for (const op of pendingOps) {
        try {
          await this.executeSyncOperation(op);
          
          // Mark as synced
          op.synced = true;
          await this.storeInOfflineDB('syncQueue', op);
          
          // Remove from memory queue
          const index = this.syncQueue.findIndex(item => item.id === op.id);
          if (index > -1) {
            this.syncQueue.splice(index, 1);
          }
          
        } catch (error) {
          console.error(`Failed to sync operation ${op.id}:`, error);
          // Keep in queue for retry
        }
      }

      // Clean up old synced operations
      await this.cleanupSyncedOperations();
      
      console.log('Data sync completed');
    } catch (error) {
      console.error('Data sync failed:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  // Execute individual sync operation
  private async executeSyncOperation(op: SyncData): Promise<void> {
    switch (op.operation) {
      case 'insert':
        const { error: insertError } = await supabase
          .from(op.table as any)
          .insert(op.data);
        if (insertError) throw insertError;
        break;

      case 'update':
        const { error: updateError } = await supabase
          .from(op.table as any)
          .update(op.data.changes)
          .eq('id', op.data.id);
        if (updateError) throw updateError;
        break;

      case 'delete':
        const { error: deleteError } = await supabase
          .from(op.table as any)
          .delete()
          .eq('id', op.data.id);
        if (deleteError) throw deleteError;
        break;
    }
  }

  // Store location data (works offline)
  async storeLocationData(locationData: any): Promise<void> {
    try {
      if (this.isOnline) {
        // Try to store directly in Supabase
        const { error } = await supabase
          .from('live_locations')
          .upsert(locationData);

        if (error) throw error;
      } else {
        // Store in offline DB
        await this.storeInOfflineDB('liveLocations', locationData);
        
        // Also queue for sync
        await this.queueDataOperation('live_locations', 'insert', locationData);
      }
    } catch (error) {
      console.error('Failed to store location data:', error);
      // Fallback to offline storage
      await this.storeInOfflineDB('liveLocations', locationData);
      await this.queueDataOperation('live_locations', 'insert', locationData);
    }
  }

  // Get location data (works offline)
  async getLocationData(userId?: string): Promise<any[]> {
    try {
      if (this.isOnline) {
        let query = supabase
          .from('live_locations')
          .select('*')
          .eq('is_active', true);

        if (userId) {
          query = query.eq('user_id', userId);
        }

        const { data, error } = await query;
        
        if (error) throw error;
        
        // Cache in offline storage
        if (data) {
          await Promise.all(
            data.map(location => this.storeInOfflineDB('liveLocations', location))
          );
        }
        
        return data || [];
      } else {
        // Get from offline storage
        const filters = userId ? { user_id: userId } : {};
        return await this.getFromOfflineDB('liveLocations', filters);
      }
    } catch (error) {
      console.error('Failed to get location data:', error);
      // Fallback to offline data
      const filters = userId ? { user_id: userId } : {};
      return await this.getFromOfflineDB('liveLocations', filters);
    }
  }

  // Generic IndexedDB operations
  private async storeInOfflineDB(storeName: string, data: any): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        
        const putRequest = store.put(data);
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  private async getFromOfflineDB(storeName: string, filters: any = {}): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        
        const getAllRequest = store.getAll();
        getAllRequest.onsuccess = () => {
          let results = getAllRequest.result;
          
          // Apply filters
          if (Object.keys(filters).length > 0) {
            results = results.filter(item => {
              return Object.keys(filters).every(key => 
                item[key] === filters[key]
              );
            });
          }
          
          resolve(results);
        };
        getAllRequest.onerror = () => reject(getAllRequest.error);
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  // Clean up old synced operations (keep last 100)
  private async cleanupSyncedOperations(): Promise<void> {
    try {
      const allOps = await this.getFromOfflineDB('syncQueue');
      const syncedOps = allOps
        .filter(op => op.synced)
        .sort((a, b) => b.timestamp - a.timestamp);

      if (syncedOps.length > 100) {
        const toDelete = syncedOps.slice(100);
        
        await Promise.all(
          toDelete.map(op => this.deleteFromOfflineDB('syncQueue', op.id))
        );
      }
    } catch (error) {
      console.error('Failed to cleanup synced operations:', error);
    }
  }

  private async deleteFromOfflineDB(storeName: string, id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        
        const deleteRequest = store.delete(id);
        deleteRequest.onsuccess = () => resolve();
        deleteRequest.onerror = () => reject(deleteRequest.error);
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  // Public methods
  isOffline(): boolean {
    return !this.isOnline;
  }

  getQueueLength(): number {
    return this.syncQueue.length;
  }

  async forceSyncNow(): Promise<void> {
    if (this.isOnline) {
      await this.syncPendingData();
    }
  }

  // Clear all offline data (useful for logout)
  async clearOfflineData(): Promise<void> {
    try {
      const request = indexedDB.deleteDatabase(this.dbName);
      await new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(undefined);
        request.onerror = () => reject(request.error);
      });
      
      this.syncQueue = [];
      await this.initializeOfflineDB();
    } catch (error) {
      console.error('Failed to clear offline data:', error);
    }
  }
}

export const dataSyncService = DataSyncService.getInstance();
