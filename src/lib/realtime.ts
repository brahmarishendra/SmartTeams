import { supabase } from './supabase';

/**
 * Singleton service to handle real-time workspace-wide signals.
 * This ensures we use a single persistent channel for all communications.
 */

const CHANNEL_NAME = 'workspace-realtime';

export const realtimeService = {
  /**
   * Broadcasts a signal to all connected clients.
   * @param event The event name (e.g., 'REFRESH_TASKS', 'NOTIFY')
   * @param payload The data to send
   */
  async broadcast(event: string, payload: any) {
    const channel = supabase.channel(CHANNEL_NAME);
    // Note: We don't subscribe here, we just use the channel to send.
    // The channel should be subscribed to in a global layout.
    return channel.send({
      type: 'broadcast',
      event,
      payload
    });
  },

  /**
   * Helper to notify users via broadcast
   */
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

  /**
   * Helper to trigger a data refresh for all users
   */
  async triggerRefresh() {
    return this.broadcast('REFRESH_TASKS', {});
  }
};
