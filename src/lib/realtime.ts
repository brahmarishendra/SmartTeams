import { supabase } from './supabase';

/**
 * Singleton service to handle real-time workspace-wide signals.
 */

const CHANNEL_NAME = 'workspace-realtime';

export const realtimeService = {
  /**
   * Broadcasts a signal to all connected clients.
   * This uses a transient channel for sending to avoid persistent memory overhead
   * on the sender side if they aren't the primary listener.
   */
  async broadcast(event: string, payload: any) {
    try {
      const channel = supabase.channel(`send-${Date.now()}-${Math.random()}`);
      
      // We use a temporary channel to send, then immediately remove it
      // to prevent "dangling" channels that cause phoenix.mjs warnings.
      await channel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.send({
            type: 'broadcast',
            event,
            payload: { ...payload, sentAt: new Date().toISOString() }
          });
          supabase.removeChannel(channel);
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
