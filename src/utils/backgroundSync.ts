/**
 * Background Sync Manager - Handles offline operations and sync when online
 */

import { cacheManager } from './cacheManager';

export interface PendingOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  collection: string;
  data: any;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
}

class BackgroundSyncManager {
  private pendingOperations: PendingOperation[] = [];
  private isOnline = navigator.onLine;
  private syncInProgress = false;

  constructor() {
    this.initialize();
    this.loadPendingOperations();
  }

  /**
   * Initialize event listeners
   */
  private initialize(): void {
    // Listen for online/offline events
    window.addEventListener('online', () => {
      console.log('BackgroundSync: Online detected, starting sync...');
      this.isOnline = true;
      this.syncPendingOperations();
    });

    window.addEventListener('offline', () => {
      console.log('BackgroundSync: Offline detected');
      this.isOnline = false;
    });

    // Periodic sync check (every 30 seconds)
    setInterval(() => {
      if (this.isOnline && !this.syncInProgress && this.pendingOperations.length > 0) {
        this.syncPendingOperations();
      }
    }, 30000);
  }

  /**
   * Add operation to pending queue
   */
  async addPendingOperation(
    type: 'create' | 'update' | 'delete',
    collection: string,
    data: any,
    maxRetries = 3
  ): Promise<string> {
    const operation: PendingOperation = {
      id: `${type}_${collection}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      collection,
      data,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries
    };

    this.pendingOperations.push(operation);
    await this.savePendingOperations();

    console.log(`BackgroundSync: Added pending operation`, {
      id: operation.id,
      type,
      collection
    });

    // Try to sync immediately if online
    if (this.isOnline) {
      this.syncPendingOperations();
    }

    return operation.id;
  }

  /**
   * Sync all pending operations
   */
  async syncPendingOperations(): Promise<void> {
    if (this.syncInProgress || !this.isOnline || this.pendingOperations.length === 0) {
      return;
    }

    this.syncInProgress = true;
    console.log(`BackgroundSync: Starting sync of ${this.pendingOperations.length} operations`);

    const operationsToProcess = [...this.pendingOperations];
    const successfulOps: string[] = [];
    const failedOps: string[] = [];

    for (const operation of operationsToProcess) {
      try {
        await this.executeOperation(operation);
        successfulOps.push(operation.id);
        console.log(`BackgroundSync: Operation completed`, { id: operation.id });
      } catch (error) {
        operation.retryCount++;

        const errorMessage = error instanceof Error ? error.message : String(error);

        if (operation.retryCount >= operation.maxRetries) {
          console.error(`BackgroundSync: Operation failed permanently`, {
            id: operation.id,
            error: errorMessage
          });
          failedOps.push(operation.id);
        } else {
          console.warn(`BackgroundSync: Operation failed, will retry`, {
            id: operation.id,
            retryCount: operation.retryCount,
            error: errorMessage
          });
        }
      }
    }

    // Remove successful operations
    this.pendingOperations = this.pendingOperations.filter(
      op => !successfulOps.includes(op.id)
    );

    // Remove permanently failed operations
    this.pendingOperations = this.pendingOperations.filter(
      op => !failedOps.includes(op.id)
    );

    await this.savePendingOperations();

    this.syncInProgress = false;

    console.log(`BackgroundSync: Sync completed`, {
      processed: operationsToProcess.length,
      successful: successfulOps.length,
      failed: failedOps.length,
      remaining: this.pendingOperations.length
    });
  }

  /**
   * Execute a single operation
   */
  private async executeOperation(operation: PendingOperation): Promise<void> {
    // This would typically call the actual service methods
    // For now, we'll simulate the operation
    switch (operation.type) {
      case 'create':
        console.log(`BackgroundSync: Creating ${operation.collection}`, operation.data);
        // await taskService.createTask(operation.data.userId, operation.data);
        break;
      case 'update':
        console.log(`BackgroundSync: Updating ${operation.collection}`, operation.data);
        // await taskService.updateTask(operation.data.userId, operation.data.id, operation.data.updates);
        break;
      case 'delete':
        console.log(`BackgroundSync: Deleting ${operation.collection}`, operation.data);
        // await taskService.deleteTask(operation.data.userId, operation.data.id);
        break;
      default:
        throw new Error(`Unknown operation type: ${operation.type}`);
    }

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  /**
   * Get pending operations count
   */
  getPendingCount(): number {
    return this.pendingOperations.length;
  }

  /**
   * Get pending operations
   */
  getPendingOperations(): PendingOperation[] {
    return [...this.pendingOperations];
  }

  /**
   * Clear all pending operations
   */
  async clearPendingOperations(): Promise<void> {
    this.pendingOperations = [];
    await this.savePendingOperations();
    console.log('BackgroundSync: Cleared all pending operations');
  }

  /**
   * Check if currently syncing
   */
  isCurrentlySyncing(): boolean {
    return this.syncInProgress;
  }

  /**
   * Get sync status
   */
  getSyncStatus(): {
    isOnline: boolean;
    pendingCount: number;
    isSyncing: boolean;
  } {
    return {
      isOnline: this.isOnline,
      pendingCount: this.pendingOperations.length,
      isSyncing: this.syncInProgress
    };
  }

  /**
   * Load pending operations from cache
   */
  private async loadPendingOperations(): Promise<void> {
    try {
      const cached = await cacheManager.get<PendingOperation[]>('pending_operations');
      if (cached) {
        this.pendingOperations = cached;
        console.log(`BackgroundSync: Loaded ${cached.length} pending operations from cache`);
      }
    } catch (error) {
      console.warn('BackgroundSync: Failed to load pending operations', error);
    }
  }

  /**
   * Save pending operations to cache
   */
  private async savePendingOperations(): Promise<void> {
    try {
      await cacheManager.set('pending_operations', this.pendingOperations, { ttl: 24 * 60 * 60 * 1000 }); // 24 hours
    } catch (error) {
      console.warn('BackgroundSync: Failed to save pending operations', error);
    }
  }
}

// Create singleton instance
export const backgroundSyncManager = new BackgroundSyncManager();
