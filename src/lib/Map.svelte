<script lang="ts">
  import {
    MapLibre,
    NavigationControl,
    ScaleControl,
    GeolocateControl,
    Marker,
    Popup,
  } from "svelte-maplibre-gl";
  import { Bus, Car, MapPin, Gauge, Users, Clock } from "lucide-svelte";
  import { onMount, onDestroy } from "svelte";
  import { vehicleStream } from "./vehicleStream.svelte";
  import BottomSheet from "./BottomSheet.svelte";

  // Montalban, Rizal coordinates
  const montalbanCenter = { lng: 121.1394, lat: 14.7306 };

  // Use OpenFreeMap's Liberty style (free, no API key needed)
  const mapStyle = "https://tiles.openfreemap.org/styles/liberty";

  const url = import.meta.env.VITE_URL;

  // State for routes and terminals
  let routes = $state<any[]>([]);
  let terminals = $state<any[]>([]);
  let selectedRoute = $state<number | null>(null);
  let loading = $state(true);

  // Fetch routes and terminals
  async function fetchData() {
    try {
      const [routesRes, terminalsRes] = await Promise.all([
        fetch(`${url}/routes`),
        fetch(`${url}/terminals`),
      ]);

      if (routesRes.ok) {
        const routesData = await routesRes.json();
        routes = routesData.map((route: any) => ({
          ...route,
          vehicleCount: route.vehicles?.length || 0,
        }));
      }

      if (terminalsRes.ok) {
        terminals = await terminalsRes.json();
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    vehicleStream.connect();
    fetchData();
  });

  onDestroy(() => {
    vehicleStream.disconnect();
  });

  // Filter vehicles by selected route
  const displayedVehicles = $derived(
    selectedRoute
      ? vehicleStream.vehicles.filter((v) => v.route?.id === selectedRoute)
      : vehicleStream.vehicles,
  );

  function handleRouteSelect(routeId: number | null) {
    selectedRoute = routeId;
  }

  // Get time ago string
  function getTimeAgo(timestamp: string | null) {
    if (!timestamp) return "Unknown";
    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Just now";
    if (diffMins === 1) return "1 min ago";
    if (diffMins < 60) return `${diffMins} mins ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1) return "1 hour ago";
    return `${diffHours} hours ago`;
  }

  // Helper to get vehicle icon component
  function getVehicleIconComponent(type: string) {
    switch (type) {
      case "bus":
        return Bus;
      default:
        return Car;
    }
  }

  function createVehicleMarkerEl(vehicle) {
    const el = document.createElement("div");
    el.className = "custom-vehicle-marker";

    const color = vehicle.route?.color || "#2a9d8f";

    el.innerHTML = `
      <div class="pin-marker" style="--marker-color: ${color}">
        <div class="pin-circle">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            ${
              vehicle.type === "bus"
                ? '<path d="M8 6v6"/><path d="M15 6v6"/><path d="M2 12h19.6"/><path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"/><circle cx="7" cy="18" r="2"/><path d="M9 18h5"/><circle cx="16" cy="18" r="2"/>'
                : '<path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/>'
            }
          </svg>
        </div>
        <div class="pin-point"></div>
      </div>
    `;

    return el;
  }

  function createTerminalMarkerEl(terminal) {
    const el = document.createElement("div");
    el.className = "custom-terminal-marker";

    el.innerHTML = `
      <div class="terminal-pin-marker">
        <div class="terminal-pulse"></div>
        <div class="terminal-circle">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
        </div>
        <div class="terminal-point"></div>
      </div>
    `;

    return el;
  }
</script>

<div class="map-container">
  <!-- Connection status indicator -->
  {#if !vehicleStream.isConnected}
    <div class="status-indicator connecting">
      <div class="spinner-small"></div>
      <span>Connecting to live tracking...</span>
    </div>
  {:else}
    <div class="status-indicator connected">
      <div class="pulse-dot"></div>
      <span>Live • {displayedVehicles.length} vehicles</span>
    </div>
  {/if}

  {#if vehicleStream.error}
    <div class="error-banner">
      {vehicleStream.error}
    </div>
  {/if}

  <MapLibre
    class="map"
    style={mapStyle}
    zoom={13}
    center={montalbanCenter}
    attributionControl={false}
  >
    <NavigationControl position="top-right" />
    <ScaleControl position="bottom-left" />
    <GeolocateControl
      position="top-right"
      trackUserLocation={true}
      showUserLocation={true}
    />

    <!-- Terminal markers -->
    {#each terminals as terminal (terminal.id)}
      {#if terminal.latitude && terminal.longitude}
        <Marker
          lnglat={[terminal.longitude, terminal.latitude]}
          element={createTerminalMarkerEl(terminal)}
        >
          <Popup offset={[0, -35]} closeButton={true}>
            <div class="terminal-popup">
              <div class="popup-badge">TERMINAL</div>
              <h3 class="terminal-title">{terminal.name}</h3>
              {#if terminal.address}
                <p class="terminal-address">{terminal.address}</p>
              {/if}

              {#if terminal.routeStops && terminal.routeStops.length > 0}
                <div class="routes-section">
                  <span class="section-label">ROUTES:</span>
                  <div class="route-pills">
                    {#each terminal.routeStops as stop}
                      <span class="route-pill">{stop.route.code}</span>
                    {/each}
                  </div>
                </div>
              {/if}
            </div>
          </Popup>
        </Marker>
      {/if}
    {/each}

    <!-- Vehicle markers -->
    {#each displayedVehicles as vehicle (vehicle.id)}
      {#if vehicle.currentLat && vehicle.currentLng}
        <Marker
          lnglat={[vehicle.currentLng, vehicle.currentLat]}
          anchor="bottom"
          element={createVehicleMarkerEl(vehicle)}
        >
          <Popup offset={[0, -38]} closeButton={true}>
            <div class="vehicle-popup">
              <div class="popup-top">
                <span class="vehicle-badge"
                  >{vehicle.type.replace("_", " ").toUpperCase()}</span
                >
                <span class="plate-badge">{vehicle.plateNumber}</span>
              </div>

              {#if vehicle.route}
                <div class="route-section">
                  <div
                    class="route-color-bar"
                    style="background: {vehicle.route.color || '#2a9d8f'}"
                  ></div>
                  <div class="route-details">
                    <span class="route-code-badge">{vehicle.route.code}</span>
                    <span class="route-name-text">{vehicle.route.name}</span>
                  </div>
                </div>
              {/if}

              <div class="stats-grid">
                {#if vehicle.speed !== null}
                  <div class="stat-item">
                    <Gauge size={16} />
                    <div class="stat-content">
                      <span class="stat-label">Speed</span>
                      <span class="stat-value"
                        >{Math.round(vehicle.speed)} km/h</span
                      >
                    </div>
                  </div>
                {/if}

                <div class="stat-item">
                  <Users size={16} />
                  <div class="stat-content">
                    <span class="stat-label">Capacity</span>
                    <span class="stat-value">{vehicle.capacity} seats</span>
                  </div>
                </div>
              </div>

              <div class="popup-footer">
                <Clock size={14} />
                <span>Updated {getTimeAgo(vehicle.lastUpdate)}</span>
              </div>
            </div>
          </Popup>
        </Marker>
      {/if}
    {/each}
  </MapLibre>

  <BottomSheet {routes} {selectedRoute} onRouteSelect={handleRouteSelect} />
</div>

<style>
  .map-container {
    width: 100%;
    height: calc(100svh - 4.5rem);
    position: relative;
    overflow: hidden;
  }

  :global(.map) {
    width: 100%;
    height: 100%;
  }

  /* MapLibre controls */
  :global(.maplibregl-ctrl-group) {
    background: rgba(26, 26, 26, 0.95) !important;
    border: 1px solid rgba(255, 255, 255, 0.1) !important;
    border-radius: 12px !important;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3) !important;
    backdrop-filter: blur(10px);
  }

  :global(.maplibregl-ctrl-group button) {
    background: transparent !important;
    border: none !important;
    width: 36px !important;
    height: 36px !important;
  }

  :global(.maplibregl-ctrl-group button + button) {
    border-top: 1px solid rgba(255, 255, 255, 0.1) !important;
  }

  :global(.maplibregl-ctrl-icon) {
    filter: invert(1) brightness(0.9);
  }

  :global(.maplibregl-ctrl-group button:hover) {
    background: rgba(255, 255, 255, 0.08) !important;
  }

  :global(.maplibregl-ctrl-scale) {
    background: rgba(26, 26, 26, 0.8) !important;
    border: 1px solid rgba(255, 255, 255, 0.1) !important;
    border-top: 2px solid rgba(255, 255, 255, 0.3) !important;
    color: #fff !important;
    font-size: 11px !important;
    padding: 4px 8px !important;
    border-radius: 8px !important;
    backdrop-filter: blur(10px);
  }

  :global(.maplibregl-user-location-dot) {
    background: #2a9d8f;
    border: 3px solid #fff;
    box-shadow: 0 0 12px rgba(42, 157, 143, 0.5);
  }

  :global(.maplibregl-ctrl-bottom-right) {
    display: none;
  }

  /* Status indicator */
  .status-indicator {
    position: absolute;
    top: 1rem;
    left: 50%;
    transform: translateX(-50%);
    z-index: 10;
    padding: 0.625rem 1rem;
    border-radius: 24px;
    font-size: 0.8125rem;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    backdrop-filter: blur(10px);
  }

  .status-indicator.connecting {
    background: rgba(233, 196, 106, 0.95);
    color: #000;
  }

  .status-indicator.connected {
    background: rgba(42, 157, 143, 0.95);
    color: #fff;
  }

  .spinner-small {
    width: 1rem;
    height: 1rem;
    aspect-ratio: 1/1;
    border: 2px solid rgba(0, 0, 0, 0.2);
    border-top-color: #000;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .pulse-dot {
    width: 0.5rem;
    height: 0.5rem;
    background: #fff;
    border-radius: 50%;
    animation: pulse-dot 2s ease-in-out infinite;
  }

  @keyframes pulse-dot {
    0%,
    100% {
      opacity: 1;
      transform: scale(1);
    }
    50% {
      opacity: 0.5;
      transform: scale(0.8);
    }
  }

  .error-banner {
    position: absolute;
    top: 4rem;
    left: 50%;
    transform: translateX(-50%);
    z-index: 10;
    padding: 0.75rem 1.25rem;
    background: rgba(231, 111, 81, 0.95);
    color: #fff;
    border-radius: 12px;
    font-size: 0.875rem;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }

  /* ====== PIN-STYLE VEHICLE MARKERS ====== */
  :global(.custom-vehicle-marker) {
    cursor: pointer;
    filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
    transition: all 0.2s ease;
  }

  :global(.custom-vehicle-marker:hover) {
    filter: drop-shadow(0 6px 12px rgba(0, 0, 0, 0.4));
    transform: translateY(-2px);
  }

  :global(.pin-marker) {
    position: relative;
    width: 36px;
    height: 44px;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  :global(.pin-circle) {
    width: 36px;
    height: 36px;
    background: var(--marker-color);
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg);
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2.5px solid white;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  }

  :global(.pin-circle svg) {
    transform: rotate(45deg);
    color: white;
    width: 18px;
    height: 18px;
  }

  :global(.pin-point) {
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 0;
    height: 0;
    border-left: 5px solid transparent;
    border-right: 5px solid transparent;
    border-top: 8px solid var(--marker-color);
  }

  /* ====== PIN-STYLE TERMINAL MARKERS ====== */
  :global(.custom-terminal-marker) {
    cursor: pointer;
    transition: all 0.2s ease;
    filter: drop-shadow(0 4px 8px rgba(233, 196, 106, 0.3));
  }

  :global(.custom-terminal-marker:hover) {
    transform: translateY(-2px);
    filter: drop-shadow(0 6px 12px rgba(233, 196, 106, 0.4));
  }

  :global(.terminal-pin-marker) {
    position: relative;
    width: 36px;
    height: 44px;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  :global(.terminal-pulse) {
    position: absolute;
    top: 0;
    left: 0;
    width: 36px;
    height: 36px;
    background: #e9c46a;
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg);
    opacity: 0.4;
    animation: pulse-terminal 2s ease-out infinite;
  }

  @keyframes pulse-terminal {
    0% {
      transform: rotate(-45deg) scale(0.9);
      opacity: 0.6;
    }
    100% {
      transform: rotate(-45deg) scale(1.3);
      opacity: 0;
    }
  }

  :global(.terminal-circle) {
    position: relative;
    width: 36px;
    height: 36px;
    background: #e9c46a;
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg);
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2.5px solid white;
    box-shadow: 0 2px 8px rgba(233, 196, 106, 0.3);
    z-index: 1;
  }

  :global(.terminal-circle svg) {
    transform: rotate(45deg);
    color: #000;
    width: 18px;
    height: 18px;
  }

  :global(.terminal-point) {
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 0;
    height: 0;
    border-left: 5px solid transparent;
    border-right: 5px solid transparent;
    border-top: 8px solid #e9c46a;
    z-index: 1;
  }

  /* ====== POPUP STYLES ====== */
  :global(.maplibregl-popup-content) {
    background: rgba(20, 20, 20, 0.98) !important;
    border: 1px solid rgba(255, 255, 255, 0.12) !important;
    border-radius: 16px !important;
    padding: 0 !important;
    box-shadow:
      0 12px 32px rgba(0, 0, 0, 0.5),
      0 0 0 1px rgba(255, 255, 255, 0.05) !important;
    min-width: 300px !important;
    backdrop-filter: blur(24px);
  }

  :global(.maplibregl-popup-tip) {
    border-top-color: rgba(20, 20, 20, 0.98) !important;
  }

  :global(.maplibregl-popup-close-button) {
    color: rgba(255, 255, 255, 0.5) !important;
    font-size: 20px !important;
    width: 28px !important;
    height: 28px !important;
    padding: 0 !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    right: 12px !important;
    top: 12px !important;
    border-radius: 6px !important;
    transition: all 0.2s ease !important;
  }

  :global(.maplibregl-popup-close-button:hover) {
    background: rgba(255, 255, 255, 0.1) !important;
    color: #fff !important;
    transform: scale(1.1) !important;
  }

  :global(.maplibregl-popup-close-button:active) {
    transform: scale(0.95) !important;
  }

  /* Terminal Popup */
  .terminal-popup {
    padding: 1.25rem;
    color: #fff;
  }

  .popup-badge {
    display: inline-block;
    font-size: 0.625rem;
    font-weight: 800;
    padding: 0.375rem 0.75rem;
    background: linear-gradient(135deg, #e9c46a 0%, #f4a261 100%);
    color: #000;
    border-radius: 8px;
    letter-spacing: 1px;
    text-transform: uppercase;
    margin-bottom: 0.75rem;
  }

  .terminal-title {
    font-size: 1.25rem;
    font-weight: 700;
    color: #fff;
    margin: 0 0 0.5rem 0;
    line-height: 1.3;
  }

  .terminal-address {
    font-size: 0.875rem;
    color: rgba(255, 255, 255, 0.6);
    margin: 0 0 1rem 0;
    line-height: 1.5;
  }

  .routes-section {
    padding-top: 1rem;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }

  .section-label {
    font-size: 0.6875rem;
    font-weight: 700;
    color: rgba(255, 255, 255, 0.5);
    letter-spacing: 1px;
    text-transform: uppercase;
    display: block;
    margin-bottom: 0.625rem;
  }

  .route-pills {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .route-pill {
    font-size: 0.75rem;
    font-weight: 700;
    padding: 0.375rem 0.75rem;
    background: rgba(42, 157, 143, 0.2);
    color: #2a9d8f;
    border: 1px solid rgba(42, 157, 143, 0.3);
    border-radius: 8px;
    letter-spacing: 0.5px;
  }

  /* Vehicle Popup */
  .vehicle-popup {
    padding: 1.25rem;
    color: #fff;
  }

  .popup-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    gap: 0.75rem;
  }

  .vehicle-badge {
    font-size: 0.625rem;
    font-weight: 800;
    padding: 0.375rem 0.75rem;
    background: rgba(42, 157, 143, 0.2);
    color: #2a9d8f;
    border: 1px solid rgba(42, 157, 143, 0.3);
    border-radius: 8px;
    letter-spacing: 1px;
    text-transform: uppercase;
  }

  .plate-badge {
    font-size: 1rem;
    font-weight: 700;
    padding-top: 1rem;
    color: #fff;
    font-family: "Courier New", monospace;
    letter-spacing: 1px;
  }

  .route-section {
    display: flex;
    gap: 0.75rem;
    margin-bottom: 1rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .route-color-bar {
    width: 4px;
    border-radius: 2px;
    flex-shrink: 0;
  }

  .route-details {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
  }

  .route-code-badge {
    font-size: 0.8125rem;
    font-weight: 700;
    color: rgba(255, 255, 255, 0.9);
    letter-spacing: 0.5px;
  }

  .route-name-text {
    font-size: 0.9375rem;
    color: rgba(255, 255, 255, 0.7);
    line-height: 1.4;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .stat-item {
    display: flex;
    gap: 0.625rem;
    align-items: flex-start;
  }

  .stat-item :global(svg) {
    color: rgba(255, 255, 255, 0.4);
    flex-shrink: 0;
    margin-top: 2px;
  }

  .stat-content {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .stat-label {
    font-size: 0.6875rem;
    color: rgba(255, 255, 255, 0.5);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-weight: 600;
  }

  .stat-value {
    font-size: 1.125rem;
    font-weight: 700;
    color: #fff;
  }

  .popup-footer {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding-top: 1rem;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    font-size: 0.8125rem;
    color: rgba(255, 255, 255, 0.4);
  }

  .popup-footer :global(svg) {
    flex-shrink: 0;
  }
</style>
