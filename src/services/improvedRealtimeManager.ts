
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

interface RealtimeSubscription {
  id: string;
  channel: RealtimeChannel;
  tables: string[];
  callback: () => void;
  active: boolean;
}

class ImprovedRealtimeManager {
  private subscriptions = new Map<string, RealtimeSubscription>();
  private debounceTimers = new Map<string, NodeJS.Timeout>();
  private connectionStatus: 'connected' | 'disconnected' | 'connecting' = 'disconnected';

  // Reduced debounce for faster UI responsiveness
  private debounce(key: string, callback: () => void, delay: number = 500) {
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
    options: { filter?: string; debounceMs?: number } = {}
  ): RealtimeSubscription | null {
    try {
      // Clean up existing subscription
      this.unsubscribe(id);

      console.log(`[ImprovedRealtimeManager] Creating subscription: ${id} for tables: ${tables.join(', ')}`);

      const channelName = `improved_${id}_${Date.now()}`;
      const channel = supabase.channel(channelName);

      // Add listeners for each table with specific event handling
      tables.forEach(tableName => {
        channel.on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: tableName,
            ...(options.filter && { filter: options.filter })
          },
          (payload) => {
            console.log(`[ImprovedRealtimeManager] ${tableName} change:`, payload.eventType, payload.new?.id || payload.old?.id);
            
            // Use custom debounce delay if provided
            const debounceDelay = options.debounceMs || 500;
            this.debounce(`${id}_${tableName}`, callback, debounceDelay);
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

      // Subscribe with enhanced error handling
      channel.subscribe((status) => {
        console.log(`[ImprovedRealtimeManager] Subscription ${id} status:`, status);
        
        if (status === 'SUBSCRIBED') {
          subscription.active = true;
          this.connectionStatus = 'connected';
          console.log(`[ImprovedRealtimeManager] Successfully subscribed to ${id}`);
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          subscription.active = false;
          this.connectionStatus = 'disconnected';
          console.warn(`[ImprovedRealtimeManager] Subscription error for ${id}:`, status);
        }
      });

      this.subscriptions.set(id, subscription);
      return subscription;

    } catch (error) {
      console.error(`[ImprovedRealtimeManager] Error creating subscription ${id}:`, error);
      return null;
    }
  }

  unsubscribe(id: string) {
    const subscription = this.subscriptions.get(id);
    if (subscription) {
      console.log(`[ImprovedRealtimeManager] Unsubscribing: ${id}`);
      
      // Clear debounce timers
      subscription.tables.forEach(table => {
        const timerKey = `${id}_${table}`;
        const timer = this.debounceTimers.get(timerKey);
        if (timer) {
          clearTimeout(timer);
          this.debounceTimers.delete(timerKey);
        }
      });

      // Remove channel
      supabase.removeChannel(subscription.channel);
      this.subscriptions.delete(id);
    }
  }

  unsubscribeAll() {
    console.log('[ImprovedRealtimeManager] Unsubscribing all connections');
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
}

export const improvedRealtimeManager = new ImprovedRealtimeManager();
