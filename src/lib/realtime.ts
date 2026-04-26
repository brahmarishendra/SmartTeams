import { supabase } from './supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

/**
 * Singleton service to handle real-time workspace-wide signals.
 */

const CHANNEL_NAME = 'workspace-realtime';
let broadcastChannel: RealtimeChannel | null = null;

export const realtimeService = {
  /**
   * Gets or initializes the persistent broadcast channel.
   */
  getChannel() {
    if (!broadcastChannel) {
      broadcastChannel = supabase.channel(CHANNEL_NAME);
      broadcastChannel.subscribe();
    }
    return broadcastChannel;
  },

  /**
   * Broadcasts a signal to all connected clients.
   * Reuses a persistent channel for maximum performance.
   */
  async broadcast(event: string, payload: any) {
    try {
      const channel = this.getChannel();
      
      return channel.send({
        type: 'broadcast',
        event,
        payload: { 
          ...payload, 
          sentAt: new Date().toISOString(),
          // Add a random ID to ensure uniqueness for React reconciliation
          _msgId: Math.random().toString(36).substring(7)
        }
      });
    } catch (err) {
      console.error("Broadcast failed:", err);
    }
  },

  async notify(data: {
    senderId: string;
    title: string;
    message: string;
    variant?: 'success' | 'info' | 'error' | 'warning' | 'assignment';
    targetRole?: 'ADMIN' | 'EMPLOYEE';
    targetId?: string;
  }) {
    return this.broadcast('NOTIFY', data);
  },

  async triggerRefresh() {
    return this.broadcast('REFRESH_TASKS', {});
  }
};
