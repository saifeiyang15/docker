import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import type { IMessage } from '@stomp/stompjs';

const WS_URL = process.env.REACT_APP_WS_URL || 'http://localhost:8080/ws';

class WebSocketService {
  private client: Client | null = null;
  private connected: boolean = false;

  connect(onConnect: () => void, onError: (error: any) => void): void {
    const socket = new SockJS(WS_URL);
    this.client = new Client();
    this.client.webSocketFactory = () => socket as any;

    this.client.onConnect = () => {
      this.connected = true;
      onConnect();
    };

    this.client.onStompError = (frame) => {
      console.error('STOMP error:', frame);
      onError(frame);
    };

    this.client.activate();
  }

  disconnect(): void {
    if (this.client) {
      this.client.deactivate();
      this.connected = false;
    }
  }

  subscribe(destination: string, callback: (message: any) => void): void {
    if (this.client && this.connected) {
      this.client.subscribe(destination, (message: IMessage) => {
        callback(JSON.parse(message.body));
      });
    }
  }

  send(destination: string, body: any): void {
    if (this.client && this.connected) {
      this.client.publish({
        destination,
        body: JSON.stringify(body),
      });
    }
  }

  isConnected(): boolean {
    return this.connected;
  }
}

const webSocketService = new WebSocketService();
export default webSocketService;
