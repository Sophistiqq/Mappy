<script lang="ts">
  import {
    MapLibre,
    NavigationControl,
    ScaleControl,
    GeolocateControl,
    Marker,
    Popup,
  } from "svelte-maplibre-gl";
  import { onMount, onDestroy } from "svelte";
  import { vehicleStream } from "./vehicleStream.svelte";

  // Montalban, Rizal coordinates
  const montalbanCenter = { lng: 121.1394, lat: 14.7306 };

  // Use OpenFreeMap's Liberty style (free, no API key needed)
  const mapStyle = "https://tiles.openfreemap.org/styles/liberty";

  onMount(() => {
    // Connect to vehicle stream when component mounts
    vehicleStream.connect();
  });

  onDestroy(() => {
    // Disconnect when component unmounts
    vehicleStream.disconnect();
  });

  // Helper function to get vehicle icon based on type
  function getVehicleIcon(type: string) {
    switch (type) {
      case "jeepney":
        return "🚐";
      case "uv_express":
        return "🚙";
      case "bus":
        return "🚌";
      default:
        return "🚗";
    }
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
      <span>Live • {vehicleStream.vehicles.length} vehicles</span>
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

    <!-- Render vehicle markers -->
    {#each vehicleStream.vehicles as vehicle (vehicle.id)}
      {#if vehicle.currentLat && vehicle.currentLng}
        <Marker lnglat={[vehicle.currentLng, vehicle.currentLat]}>
          <div
            class="vehicle-marker"
            style="--route-color: {vehicle.route?.color || '#2a9d8f'}"
            style:transform="rotate({vehicle.heading || 0}deg)"
          >
            <span class="vehicle-icon">{getVehicleIcon(vehicle.type)}</span>
          </div>

          <Popup offset={[0, -15]}>
            <div class="vehicle-popup">
              <div class="popup-header">
                <span class="vehicle-type-badge"
                  >{vehicle.type.replace("_", " ").toUpperCase()}</span
                >
                <span class="plate-number">{vehicle.plateNumber}</span>
              </div>

              {#if vehicle.route}
                <div class="route-info">
                  <div
                    class="route-badge"
                    style="background: {vehicle.route.color || '#2a9d8f'}"
                  >
                    {vehicle.route.code}
                  </div>
                  <span class="route-name">{vehicle.route.name}</span>
                </div>
              {/if}

              <div class="vehicle-stats">
                {#if vehicle.speed !== null}
                  <div class="stat">
                    <span class="stat-label">Speed</span>
                    <span class="stat-value"
                      >{Math.round(vehicle.speed)} km/h</span
                    >
                  </div>
                {/if}
                <div class="stat">
                  <span class="stat-label">Capacity</span>
                  <span class="stat-value">{vehicle.capacity} seats</span>
                </div>
              </div>

              <div class="last-update">
                Updated {getTimeAgo(vehicle.lastUpdate)}
              </div>
            </div>
          </Popup>
        </Marker>
      {/if}
    {/each}
  </MapLibre>
</div>

<style>
  .map-container {
    width: 100%;
    height: calc(100svh - 4.5rem); /* Account for topbar */
    position: relative;
    overflow: hidden;
  }

  :global(.map) {
    width: 100%;
    height: 100%;
  }

  /* Customize MapLibre controls for dark theme */
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

  :global(.maplibregl-ctrl-group button:active) {
    background: rgba(255, 255, 255, 0.12) !important;
  }

  /* Scale control styling */
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

  /* Geolocation control active state */
  :global(.maplibregl-ctrl-geolocate-active) {
    background: rgba(42, 157, 143, 0.2) !important;
  }

  :global(.maplibregl-ctrl-geolocate-active .maplibregl-ctrl-icon) {
    filter: invert(0.7) sepia(1) saturate(3) hue-rotate(130deg) brightness(0.9);
  }

  /* User location dot */
  :global(.maplibregl-user-location-dot) {
    background: var(--verdigris);
    border: 3px solid #fff;
    box-shadow: 0 0 12px rgba(42, 157, 143, 0.5);
  }

  :global(.maplibregl-user-location-accuracy-circle) {
    background: rgba(42, 157, 143, 0.15);
    border: 1px solid rgba(42, 157, 143, 0.3);
  }

  /* Remove default attribution (we'll add custom one) */
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
    border: 2px solid rgba(0, 0, 0, 0.2);
    border-top-color: #000;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
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

  /* Vehicle marker */
  :global(.vehicle-marker) {
    width: 3rem;
    height: 3rem;
    background: var(--route-color, #2a9d8f);
    border: 3px solid #fff;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
    transition:
      transform 0.2s,
      box-shadow 0.2s;
  }

  :global(.vehicle-marker:hover) {
    transform: scale(1.1);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3);
  }

  :global(.vehicle-marker .vehicle-icon) {
    font-size: 1.5rem;
    line-height: 1;
  }

  /* Popup styling */
  :global(.maplibregl-popup-content) {
    background: rgba(26, 26, 26, 0.98) !important;
    border: 1px solid rgba(255, 255, 255, 0.1) !important;
    border-radius: 16px !important;
    padding: 0 !important;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4) !important;
    min-width: 280px !important;
    backdrop-filter: blur(20px);
  }

  :global(.maplibregl-popup-tip) {
    border-top-color: rgba(26, 26, 26, 0.98) !important;
  }

  .vehicle-popup {
    padding: 1rem;
    color: #fff;
  }

  .popup-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.75rem;
  }

  .vehicle-type-badge {
    font-size: 0.625rem;
    font-weight: 700;
    padding: 0.25rem 0.5rem;
    background: rgba(42, 157, 143, 0.2);
    color: var(--verdigris);
    border-radius: 6px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .plate-number {
    font-size: 1rem;
    font-weight: 600;
    color: #fff;
  }

  .route-info {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .route-badge {
    font-size: 0.75rem;
    font-weight: 700;
    padding: 0.25rem 0.5rem;
    border-radius: 6px;
    color: #fff;
  }

  .route-name {
    font-size: 0.875rem;
    color: rgba(255, 255, 255, 0.9);
  }

  .vehicle-stats {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
    margin-bottom: 0.75rem;
  }

  .stat {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .stat-label {
    font-size: 0.6875rem;
    color: rgba(255, 255, 255, 0.5);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .stat-value {
    font-size: 1rem;
    font-weight: 600;
    color: #fff;
  }

  .last-update {
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.4);
    text-align: center;
    padding-top: 0.5rem;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }
</style>
