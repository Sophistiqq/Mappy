// src/lib/vehicleStream.svelte.ts
const url = import.meta.env.VITE_URL;

interface Vehicle {
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

  connect(routeId?: number) {
    if (this.eventSource) {
      this.disconnect();
    }

    this.error = null;

    const streamUrl = routeId
      ? `${url}/vehicles/stream?routeId=${routeId}`
      : `${url}/vehicles/stream`;

    try {
      this.eventSource = new EventSource(streamUrl);

      this.eventSource.addEventListener('initial', (event) => {
        try {
          this.vehicles = JSON.parse(event.data);
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
          this.vehicles = JSON.parse(event.data);
          console.log('🔄 Vehicles updated:', this.vehicles.length);
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
        if (this.eventSource) {
          this.connect();
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
