<script lang="ts">
  import { Marker, Popup } from "svelte-maplibre-gl";
  import { Gauge, Users, Clock } from "lucide-svelte";
  import type { Vehicle } from "./vehicleStream.svelte";

  export let vehicle: Vehicle;
  let markerEl: HTMLDivElement;

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

{#if vehicle.currentLat && vehicle.currentLng}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="custom-vehicle-marker"
    bind:this={markerEl}
    style="--marker-color: {vehicle.route?.color || '#2a9d8f'}"
  >
    <div class="pin-marker">
      <div class="pin-circle">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          {#if vehicle.type === "bus"}
            <path d="M8 6v6" />
            <path d="M15 6v6" />
            <path d="M2 12h19.6" />
            <path
              d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"
            />
            <circle cx="7" cy="18" r="2" />
            <path d="M9 18h5" />
            <circle cx="16" cy="18" r="2" />
          {:else}
            <path
              d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"
            />
            <circle cx="7" cy="17" r="2" />
            <path d="M9 17h6" />
            <circle cx="17" cy="17" r="2" />
          {/if}
        </svg>
      </div>
      <div class="pin-point"></div>
    </div>
  </div>

  <Marker
    lnglat={[vehicle.currentLng, vehicle.currentLat]}
    element={markerEl}
    subpixelPositioning={true}
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
                <span class="stat-value">{Math.round(vehicle.speed)} km/h</span>
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
