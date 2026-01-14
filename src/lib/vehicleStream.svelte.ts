// src/lib/vehicleStream.svelte.ts
const url = import.meta.env.VITE_URL;

export interface Vehicle {
  id: number;
  plateNumber: string;
  type: string;
  capacity: number;
  currentLat: number | null;
  currentLng: number | null;
  heading: number | null;
  speed: number | null;
  lastUpdate: string | null;
  route?: {
    id: number;
    name: string;
    code: string;
    color: string | null;
  };
}

class VehicleStreamManager {
  vehicles = $state<Vehicle[]>([]);
  isConnected = $state(false);
  error = $state<string | null>(null);

  private eventSource: EventSource | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;
  private currentRouteId?: number; // Store current routeId for reconnection

  connect(routeId?: number) {
    if (this.eventSource) {
      this.disconnect();
    }

    this.error = null;
    this.currentRouteId = routeId; // Save for reconnection

    const streamUrl = routeId
      ? `${url}/vehicles/stream?routeId=${routeId}`
      : `${url}/vehicles/stream`;

    try {
      this.eventSource = new EventSource(streamUrl);

      this.eventSource.addEventListener('initial', (event) => {
        try {
          this.vehicles = JSON.parse(event.data).map((v: Vehicle) => ({
            ...v,
            lastUpdate: v.lastUpdate ? new Date(v.lastUpdate).toISOString() : null
          }));
          this.isConnected = true;
          this.reconnectAttempts = 0;
          console.log('📍 Initial vehicles loaded:', this.vehicles.length);
        } catch (err) {
          console.error('Failed to parse initial data:', err);
          this.error = 'Failed to load initial data';
        }
      });

      this.eventSource.addEventListener('update', (event) => {
        try {
          const updates: Vehicle[] = JSON.parse(event.data).map((v: Vehicle) => ({
            ...v,
            lastUpdate: v.lastUpdate ? new Date(v.lastUpdate).toISOString() : null
          }));

          const map = new Map(this.vehicles.map(v => [v.id, v]));

          for (const v of updates) {
            map.set(v.id, v);
          }

          this.vehicles = Array.from(map.values());
          console.log('🔄 Vehicles updated:', updates.length);
        } catch (err) {
          console.error('Failed to parse update data:', err);
        }
      });

      this.eventSource.addEventListener('error', (event) => {
        console.error('SSE Error event:', event);
        this.handleError();
      });

      this.eventSource.onerror = () => {
        console.error('SSE connection error');
        this.handleError();
      };

    } catch (err) {
      console.error('Failed to create EventSource:', err);
      this.error = 'Failed to connect to vehicle stream';
    }
  }

  private handleError() {
    this.isConnected = false;

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Reconnecting... Attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);

      setTimeout(() => {
        if (!this.isConnected) { // Only reconnect if still not connected
          this.connect(this.currentRouteId); // Use saved routeId
        }
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      this.error = 'Connection lost. Please refresh the page.';
      this.disconnect();
    }
  }

  disconnect() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
      this.isConnected = false;
      this.reconnectAttempts = 0;
      console.log('🔌 Disconnected from vehicle stream');
    }
  }

  getVehiclesByRoute(routeId: number): Vehicle[] {
    return this.vehicles.filter(v => v.route?.id === routeId);
  }

  getVehicle(id: number): Vehicle | undefined {
    return this.vehicles.find(v => v.id === id);
  }
}

export const vehicleStream = new VehicleStreamManager();
