// WebSocket/SSE connection for real-time reel status updates
export type ReelUpdateHandler = (update: ReelStatusUpdate) => void;

export interface ReelStatusUpdate {
  id: number;
  status: string;
  ts: string;
  message?: string;
  video_url?: string;
  thumbnail_url?: string;
}

class ReelWebSocketClient {
  private ws: WebSocket | null = null;
  private handlers: Set<ReelUpdateHandler> = new Set();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  connect() {
    // Mock WebSocket endpoint - in production, this would be wss://api.example.com/v1/reels/ws
    console.log("Connecting to WebSocket for real-time updates...");
    
    // For now, we'll simulate updates
    this.simulateUpdates();
  }

  private simulateUpdates() {
    // Simulate periodic status updates for generating reels
    setInterval(() => {
      const mockUpdate: ReelStatusUpdate = {
        id: Math.floor(Math.random() * 10) + 1,
        status: "generating",
        ts: new Date().toISOString(),
        message: "Generation in progress..."
      };
      
      this.notifyHandlers(mockUpdate);
    }, 5000);
  }

  subscribe(handler: ReelUpdateHandler) {
    this.handlers.add(handler);
    return () => this.unsubscribe(handler);
  }

  unsubscribe(handler: ReelUpdateHandler) {
    this.handlers.delete(handler);
  }

  private notifyHandlers(update: ReelStatusUpdate) {
    this.handlers.forEach(handler => handler(update));
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

// Singleton instance
export const reelWebSocket = new ReelWebSocketClient();
