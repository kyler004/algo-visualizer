import type { CollabUser, WsMessage, WsMessageType } from "../types";

interface CollabWebSocketConfig {
  slug: string;
  user: CollabUser;
  onMessage: (message: WsMessage) => void;
  onOpen?: () => void;
  onClose?: () => void;
}

export class CollabWebSocket {
  private socket: WebSocket | null = null;
  private slug: string;
  private user: CollabUser;
  private onMessage: (message: WsMessage) => void;
  private onOpen?: () => void;
  private onClose?: () => void;
  private reconnectTimeout: number | null = null;
  private shouldReconnect: boolean = true;

  constructor(config: CollabWebSocketConfig) {
    this.slug = config.slug;
    this.user = config.user;
    this.onMessage = config.onMessage;
    this.onOpen = config.onOpen;
    this.onClose = config.onClose;
  }

  connect() {
    this.shouldReconnect = true;
    
    // Check if secure connection is needed (wss: vs ws:)
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host;
    
    // Connect using a relative URL (which can be proxied by Vite or handled directly)
    const url = `${protocol}//${host}/ws/collab/${this.slug}/`;
    
    console.log(`Connecting to WebSocket: ${url}`);
    this.socket = new WebSocket(url);

    this.socket.onopen = () => {
      console.log("WebSocket connection established");
      if (this.onOpen) this.onOpen();
      
      // Notify the channel group that this user has joined
      this.send("user_join", {});
    };

    this.socket.onmessage = (event) => {
      try {
        const message: WsMessage = JSON.parse(event.data);
        this.onMessage(message);
      } catch (err) {
        console.error("Error parsing incoming WebSocket message:", err);
      }
    };

    this.socket.onclose = (event) => {
      console.log("WebSocket connection closed:", event);
      if (this.onClose) this.onClose();

      // 4404 = server rejected the room (session doesn't exist) — retrying is pointless
      if (event.code === 4404) {
        this.shouldReconnect = false;
      }

      if (this.shouldReconnect) {
        // Attempt reconnection after 3 seconds
        if (this.reconnectTimeout) {
          window.clearTimeout(this.reconnectTimeout);
        }
        this.reconnectTimeout = window.setTimeout(() => {
          console.log("Attempting to reconnect WebSocket...");
          this.connect();
        }, 3000);
      }
    };

    this.socket.onerror = (error) => {
      console.error("WebSocket encountered an error:", error);
    };
  }

  send(type: WsMessageType, payload: Record<string, unknown>) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(
        JSON.stringify({
          type,
          payload,
          user: this.user,
        })
      );
    } else {
      console.warn(`WebSocket is not open (readyState: ${this.socket?.readyState}). Cannot send: ${type}`);
    }
  }

  disconnect() {
    this.shouldReconnect = false;
    if (this.reconnectTimeout) {
      window.clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    console.log("WebSocket disconnected manually");
  }
}
