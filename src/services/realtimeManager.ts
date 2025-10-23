
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

interface RealtimeSubscription {
  id: string;
  channel: RealtimeChannel;
  tables: string[];
  callback: () => void;
  active: boolean;
}

class RealtimeManager {
  private subscriptions = new Map<string, RealtimeSubscription>();
  private debounceTimers = new Map<string, NodeJS.Timeout>();
  private connectionStatus: 'connected' | 'disconnected' | 'connecting' = 'disconnected';
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  private debounce(key: string, callback: () => void, delay: number = 1500) {
    const existingTimer = this.debounceTimers.get(key);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    const timer = setTimeout(() => {
      callback();
      this.debounceTimers.delete(key);
    }, delay);

    this.debounceTimers.set(key, timer);
  }

  subscribe(
    id: string,
    tables: string[],
    callback: () => void,
    options: { filter?: string; schema?: 'public' | 'demo' } = {}
  ): RealtimeSubscription | null {
    try {
      // Clean up existing subscription with same ID
      this.unsubscribe(id);

      const schema = options.schema || 'public';
      console.log(`[RealtimeManager] Creating subscription: ${id} for tables: ${tables.join(', ')} in schema: ${schema}`);

      const channelName = `${id}_${schema}_${Math.random().toString(36).substring(2, 9)}`;
      const channel = supabase.channel(channelName);

      // Add listeners for each table
      tables.forEach(tableName => {
        channel.on(
          'postgres_changes',
          {
            event: '*',
            schema: schema,
            table: tableName,
            ...(options.filter && { filter: options.filter })
          },
          (payload) => {
            console.log(`[RealtimeManager] ${tableName} change detected in ${schema}:`, payload.eventType);
            this.debounce(`${id}_${tableName}`, callback);
          }
        );
      });

      const subscription: RealtimeSubscription = {
        id,
        channel,
        tables,
        callback,
        active: false
      };

      // Subscribe with proper status handling
      this.connectionStatus = 'connecting';
      channel.subscribe((status) => {
        console.log(`[RealtimeManager] Subscription ${id} status:`, status);
        
        if (status === 'SUBSCRIBED') {
          subscription.active = true;
          this.connectionStatus = 'connected';
          this.reconnectAttempts = 0;
          console.log(`[RealtimeManager] Successfully connected ${id}`);
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          subscription.active = false;
          this.connectionStatus = 'disconnected';
          console.warn(`[RealtimeManager] Connection failed for ${id}, status: ${status}`);
          this.handleConnectionError(id, callback);
        } else if (status === 'CLOSED') {
          subscription.active = false;
          this.connectionStatus = 'disconnected';
          console.log(`[RealtimeManager] Connection closed for ${id}`);
        }
      });

      this.subscriptions.set(id, subscription);
      return subscription;

    } catch (error) {
      console.error(`[RealtimeManager] Error creating subscription ${id}:`, error);
      return null;
    }
  }

  private handleConnectionError(subscriptionId: string, callback: () => void) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`[RealtimeManager] Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts} for ${subscriptionId}`);
      
      // Add jitter to prevent thundering herd
      const baseDelay = 2000 * this.reconnectAttempts;
      const jitter = Math.random() * 1000;
      const delay = baseDelay + jitter;
      
      setTimeout(() => {
        const subscription = this.subscriptions.get(subscriptionId);
        if (subscription) {
          console.log(`[RealtimeManager] Executing reconnection for ${subscriptionId}`);
          this.subscribe(subscriptionId, subscription.tables, callback);
        }
      }, delay);
    } else {
      console.warn(`[RealtimeManager] Max reconnection attempts reached for ${subscriptionId}, falling back to polling`);
      this.startPolling(subscriptionId, callback);
    }
  }

  private startPolling(subscriptionId: string, callback: () => void) {
    const pollInterval = setInterval(() => {
      console.log(`[RealtimeManager] Polling for updates (realtime failed) - ${subscriptionId}`);
      callback();
    }, 30000); // Poll every 30 seconds

    // Store polling interval for cleanup
    const subscription = this.subscriptions.get(subscriptionId);
    if (subscription) {
      (subscription as any).pollInterval = pollInterval;
    }
  }

  unsubscribe(id: string) {
    const subscription = this.subscriptions.get(id);
    if (subscription) {
      console.log(`[RealtimeManager] Unsubscribing: ${id}`);
      
      // Clear debounce timers
      subscription.tables.forEach(table => {
        const timerKey = `${id}_${table}`;
        const timer = this.debounceTimers.get(timerKey);
        if (timer) {
          clearTimeout(timer);
          this.debounceTimers.delete(timerKey);
        }
      });

      // Clear polling interval if exists
      if ((subscription as any).pollInterval) {
        clearInterval((subscription as any).pollInterval);
      }

      // Remove channel
      supabase.removeChannel(subscription.channel);
      this.subscriptions.delete(id);
    }
  }

  unsubscribeAll() {
    console.log('[RealtimeManager] Unsubscribing all connections');
    Array.from(this.subscriptions.keys()).forEach(id => {
      this.unsubscribe(id);
    });
  }

  getConnectionStatus() {
    return this.connectionStatus;
  }

  getActiveSubscriptions() {
    return Array.from(this.subscriptions.values()).filter(sub => sub.active);
  }

  // Health check method
  async checkConnection(): Promise<boolean> {
    try {
      const { error } = await supabase.from('profiles').select('count').limit(1);
      return !error;
    } catch {
      return false;
    }
  }
}

export const realtimeManager = new RealtimeManager();
