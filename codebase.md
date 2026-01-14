
# src/app.css

```css
:root {
  --charcoal-blue: #264653ff;
  --verdigris: #2a9d8fff;
  --tuscan-sun: #e9c46aff;
  --sandy-brown: #f4a261ff;
  --burnt-peach: #e76f51ff;
  -tap-highlight-color: transparent;
  -webkit-tap-highlight-color: transparent;

  color-scheme: dark;
}

* {
  padding: 0;
  margin: 0;
  box-sizing: border-box;
}

html {
  font-family: "Comfortaa", sans-serif;
}


a {
  text-decoration: none;
  color: inherit;
}

```

# src/App.svelte

```svelte
<script lang="ts">
  import { Router } from "sv-router";
  import "./router.ts";
  import { route } from "./router";
  import Topbar from "./lib/Topbar.svelte";

  // Read setup state directly - no need for onMount
  let setupState = $state(localStorage.getItem("setupState"));

  // Optional: Listen for storage changes across tabs
  if (typeof window !== "undefined") {
    window.addEventListener("storage", (e) => {
      if (e.key === "setupState") {
        setupState = e.newValue;
      }
    });
  }

  // Routes where topbar should be hidden
  const hideTopbarRoutes = ["/login", "/"];

  // Reactive check for showing topbar
  let showTopbar = $derived(
    setupState === "done" && !hideTopbarRoutes.includes(route.pathname),
  );
</script>

<main>
  {#if showTopbar}
    <Topbar />
  {/if}
  <Router />
</main>

```

# src/assets/svelte.svg

This is a file of the type: SVG Image

# src/auth.svelte.ts

```ts
const url = import.meta.env.VITE_URL

interface User {
  id: number
  first_name: string
  last_name: string
  email: string
  username: string
  role: string
}

interface AuthState {
  isAuthenticated: boolean | null
  loading: boolean
  user: User | null
}

class AuthManager {
  state = $state<AuthState>({
    isAuthenticated: null,
    loading: false,
    user: null
  })

  // Prevent multiple simultaneous auth checks
  private authCheckPromise: Promise<boolean> | null = null

  async login(username: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      this.state.loading = true

      const res = await fetch(`${url}/auth/login`, {
        method: "POST",
        body: JSON.stringify({ username, password }),
        headers: {
          'Content-Type': "application/json"
        },
        credentials: 'include'
      })

      if (!res.ok) {
        this.state.loading = false
        return { success: false, error: 'Invalid credentials' }
      }

      // After successful login, fetch user details
      await this.fetchUser()

      return { success: true }
    } catch (error) {
      console.error('Login error:', error)
      this.state.loading = false
      return { success: false, error: 'Network error' }
    }
  }

  async fetchUser(): Promise<User | null> {
    try {
      const res = await fetch(`${url}/auth/me`, {
        method: 'POST',
        credentials: 'include'
      })

      if (!res.ok) {
        this.state.isAuthenticated = false
        this.state.user = null
        this.state.loading = false
        return null
      }

      const user: User = await res.json()
      this.state.isAuthenticated = true
      this.state.user = user
      this.state.loading = false

      return user
    } catch (error) {
      console.error('Fetch user error:', error)
      this.state.isAuthenticated = false
      this.state.user = null
      this.state.loading = false
      return null
    }
  }

  async checkAuth(): Promise<boolean> {
    // If already checking auth, return the existing promise
    if (this.authCheckPromise) {
      return this.authCheckPromise
    }

    // If we already know the auth state and it's recent, use it
    if (this.state.isAuthenticated !== null && !this.state.loading) {
      return this.state.isAuthenticated
    }

    this.authCheckPromise = (async () => {
      try {
        this.state.loading = true

        const user = await this.fetchUser()

        return user !== null
      } catch (error) {
        console.error('Auth check error:', error)
        this.state.isAuthenticated = false
        this.state.loading = false
        return false
      } finally {
        this.authCheckPromise = null
      }
    })()

    return this.authCheckPromise
  }

  async logout(): Promise<void> {
    try {
      await fetch(`${url}/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      })

      this.state.isAuthenticated = false
      this.state.user = null
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  // Derived state using $derived
  get isLoggedIn() {
    return this.state.isAuthenticated === true
  }

  get isLoading() {
    return this.state.loading
  }

  get fullName() {
    if (!this.state.user) return ''
    return `${this.state.user.first_name} ${this.state.user.last_name}`.trim()
  }
}

// Export a singleton instance
export const auth = new AuthManager()

```

# src/lib/Map.svelte

```svelte
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

```

# src/lib/Topbar.svelte

```svelte
<script lang="ts">
  import {
    ArrowLeft,
    Menu,
    X,
    House,
    LogOut,
    User,
    Settings,
    Mail,
    Bell,
    Globe,
  } from "lucide-svelte";
  import { navigate, route } from "../router";
  import { auth } from "../auth.svelte";
  import logo from "../assets/svelte.svg";

  let isOpen = $state(false);
  let isAnimating = $state(false);

  async function handleLogout() {
    await auth.logout();
    isOpen = false;
    navigate("/login");
  }

  function handleNavigate(path: any) {
    isOpen = false;
    navigate(path);
  }

  function closeSidebar() {
    isOpen = false;
  }

  function toggleSidebar() {
    if (!isAnimating) {
      isAnimating = true;
      isOpen = !isOpen;
      // Reset animation lock after transition completes
      setTimeout(() => {
        isAnimating = false;
      }, 300);
    }
  }
</script>

<!-- Topbar -->
<div class="topbar">
  <button
    type="button"
    class="icon-btn"
    onclick={() => {
      if (route.pathname === "/" || route.pathname === "/home") {
        navigate("/");
      } else {
        navigate(-1);
      }
    }}
  >
    {#if route.pathname === "/" || route.pathname === "/home"}
      <img src={logo} alt="Svelte Logo" class="logo" />
    {:else}
      <ArrowLeft size={22} strokeWidth={2.5} />
    {/if}
  </button>

  <h3>Mappy</h3>

  {#if auth.isLoggedIn}
    <button type="button" class="menu-btn" onclick={toggleSidebar}>
      <Menu size={22} strokeWidth={2.5} />
    </button>
  {/if}
</div>

<!-- Overlay -->
<button
  class="overlay"
  class:visible={isOpen}
  onclick={closeSidebar}
  aria-label="Close sidebar"
  tabindex={isOpen ? 0 : -1}
></button>

<!-- Sidebar -->
<aside class="sidebar" class:open={isOpen}>
  <div class="sidebar-header">
    <h2>Main Menu</h2>
    <button type="button" class="icon-btn-light" onclick={closeSidebar}>
      <X size={24} />
    </button>
  </div>

  {#if auth.state.user}
    <div class="sidebar-content">
      <!-- User Info Section -->
      <div class="user-section">
        <div class="avatar">
          <User size={28} strokeWidth={2} />
        </div>
        <div class="user-text">
          <h4>{auth.fullName || auth.state.user.username}</h4>
          <p>{auth.state.user.email}</p>
        </div>
      </div>

      <!-- Main Menu Grid -->
      <div class="menu-section">
        <h3 class="section-title">Main Menu</h3>
        <div class="bento-grid">
          <button
            type="button"
            class="glass-card"
            onclick={() => handleNavigate("/home")}
          >
            <div class="card-icon">
              <House size={24} strokeWidth={2} />
            </div>
            <span class="card-label">House</span>
          </button>

          <button
            type="button"
            class="glass-card"
            onclick={() => handleNavigate("/settings")}
          >
            <div class="card-icon">
              <Settings size={24} strokeWidth={2} />
            </div>
            <span class="card-label">Settings</span>
          </button>

          <button
            type="button"
            class="glass-card"
            onclick={() => handleNavigate("/profile")}
          >
            <div class="card-icon">
              <User size={24} strokeWidth={2} />
            </div>
            <span class="card-label">Profile</span>
          </button>
          <button
            type="button"
            class="glass-card"
            onclick={() => handleNavigate("/profile")}
          >
            <div class="card-icon">
              <User size={24} strokeWidth={2} />
            </div>
            <span class="card-label">Profile</span>
          </button>
        </div>
      </div>

      <!-- Messages Section -->
      <div class="menu-section">
        <h3 class="section-title">Messages</h3>
        <div class="list-section">
          <button
            type="button"
            class="list-item"
            onclick={() => handleNavigate("/inbox")}
          >
            <div class="list-icon">
              <Mail size={20} strokeWidth={2} />
            </div>
            <span>Inbox</span>
          </button>
          <button
            type="button"
            class="list-item"
            onclick={() => handleNavigate("/notifications")}
          >
            <div class="list-icon">
              <Bell size={20} strokeWidth={2} />
            </div>
            <span>Notifications</span>
          </button>
        </div>
      </div>

      <!-- Account Section -->
      <div class="menu-section">
        <h3 class="section-title">Account and Security</h3>
        <div class="list-section">
          <button
            type="button"
            class="list-item"
            onclick={() => handleNavigate("/account")}
          >
            <div class="list-icon">
              <User size={20} strokeWidth={2} />
            </div>
            <span>Update Account Data</span>
          </button>
          <button
            type="button"
            class="list-item"
            onclick={() => handleNavigate("/language")}
          >
            <div class="list-icon">
              <Globe size={20} strokeWidth={2} />
            </div>
            <span>Language</span>
          </button>
        </div>
      </div>

      <!-- Logout Button -->
      <button type="button" class="logout-btn" onclick={handleLogout}>
        <LogOut size={20} strokeWidth={2} />
        <span>Logout</span>
      </button>
    </div>
  {/if}
</aside>

<style>
  /* Topbar */
  .topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 1.25rem;
    position: sticky;
    top: 0;
    z-index: 100;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(10px);
  }

  .topbar h3 {
    font-size: 1.375rem;
    font-weight: 600;
    color: #fff;
    letter-spacing: -0.02em;
  }

  .icon-btn {
    border: none;
    background: transparent;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2.5rem;
    height: 2.5rem;
    cursor: pointer;
    border-radius: 8px;
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
  }

  .logo {
    width: 1.75rem;
    height: 1.75rem;
  }

  .menu-btn {
    padding: 0.75rem 1.25rem;
    border: none;
    background-color: transparent;
    color: white;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
  }

  /* Overlay - Mobile optimized */
  .overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.7);
    z-index: 150;
    border: none;
    padding: 0;
    cursor: pointer;
    opacity: 0;
    visibility: hidden;
    transition:
      opacity 0.2s ease-out,
      visibility 0.2s;
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
  }

  .overlay.visible {
    opacity: 1;
    visibility: visible;
  }

  /* Sidebar - Mobile optimized with 3D transforms */
  .sidebar {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    width: min(90vw, 380px);
    background: linear-gradient(180deg, #1a1a1a 0%, #0a0a0a 100%);
    z-index: 200;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    overflow-x: hidden;
    -webkit-overflow-scrolling: touch;

    /* Use 3D transforms for better mobile performance */
    transform: translate3d(100%, 0, 0);
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    /* Force GPU acceleration */
    will-change: transform;
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;
  }

  .sidebar.open {
    transform: translate3d(0, 0, 0);
  }

  /* Optimize scrolling on mobile */
  .sidebar::-webkit-scrollbar {
    display: none;
  }

  .sidebar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }

  .sidebar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.5rem 1.5rem 1rem;
    flex-shrink: 0;
  }

  .sidebar-header h2 {
    font-size: 1.75rem;
    font-weight: 600;
    color: #fff;
  }

  .icon-btn-light {
    border: none;
    background: rgba(255, 255, 255, 0.05);
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2.5rem;
    height: 2.5rem;
    cursor: pointer;
    border-radius: 50%;
    transition: background 0.15s;
    color: #fff;
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
  }

  .icon-btn-light:active {
    background: rgba(255, 255, 255, 0.15);
  }

  .sidebar-content {
    padding: 0 1.5rem 2rem;
    display: flex;
    flex-direction: column;
    gap: 2rem;
    flex: 1;
  }

  /* User Section */
  .user-section {
    padding: 1.5rem;
    display: flex;
    align-items: center;
    gap: 1rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }

  .avatar {
    width: 3.5rem;
    height: 3.5rem;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.15);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    flex-shrink: 0;
  }

  .user-text {
    flex: 1;
    min-width: 0;
  }

  .user-text h4 {
    font-size: 1rem;
    font-weight: 600;
    color: #fff;
    margin: 0 0 0.25rem 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .user-text p {
    font-size: 0.8125rem;
    color: rgba(255, 255, 255, 0.5);
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* Menu Section */
  .menu-section {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .section-title {
    font-size: 1rem;
    font-weight: 600;
    color: #fff;
    margin: 0;
    padding: 0 0.25rem;
  }

  /* Bento Grid */
  .bento-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
  }

  .glass-card {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    padding: 1.25rem;
    cursor: pointer;
    transition: background 0.15s;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
    min-height: 100px;
    font-family: inherit;
    text-align: left;
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
  }

  .glass-card:active {
    background: rgba(255, 255, 255, 0.12);
    transform: scale(0.98);
  }

  .card-icon {
    width: 3rem;
    height: 3rem;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
  }

  .card-label {
    font-size: 1rem;
    font-weight: 500;
    color: #fff;
  }

  /* List Section */
  .list-section {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .list-item {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    padding: 1rem 1.25rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.875rem;
    transition: background 0.15s;
    font-family: inherit;
    font-size: 0.9375rem;
    color: #fff;
    text-align: left;
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
  }

  .list-item:active {
    background: rgba(255, 255, 255, 0.12);
  }

  .list-icon {
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.08);
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgba(255, 255, 255, 0.8);
    flex-shrink: 0;
  }

  /* Logout Button */
  .logout-btn {
    background: rgba(231, 111, 81, 0.15);
    border: 1px solid rgba(231, 111, 81, 0.3);
    border-radius: 12px;
    padding: 1rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    transition: background 0.15s;
    font-family: inherit;
    font-size: 1rem;
    font-weight: 600;
    color: var(--burnt-peach);
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
  }

  .logout-btn:active {
    background: rgba(231, 111, 81, 0.3);
  }
</style>

```

# src/lib/vehicleStream.svelte.ts

```ts
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

```

# src/main.ts

```ts
import { mount } from 'svelte'
import './app.css'
import '@fontsource/comfortaa'
import App from './App.svelte'

const app = mount(App, {
  target: document.getElementById('app')!,
})

export default app

```

# src/router.ts

```ts
import { createRouter } from 'sv-router';
import GettingStarted from "./routes/GettingStarted.svelte"
import Home from './routes/Home.svelte';
import { auth } from './auth.svelte';
import Login from './routes/Login.svelte';

// Helper to check setup state dynamically
function isSetupComplete(): boolean {
  return localStorage.getItem('setupState') === 'done'
}

export const { p, navigate, isActive, route } = createRouter({
  '/': {
    '/': GettingStarted,
    hooks: {
      async beforeLoad() {
        // Check dynamically instead of module scope
        if (isSetupComplete()) {
          // Check if user is already authenticated
          const isAuthenticated = await auth.checkAuth()
          if (isAuthenticated) {
            throw navigate('/home')
          } else {
            throw navigate('/login')
          }
        }
      }
    }
  },
  '/home': {
    '/': Home,
    hooks: {
      async beforeLoad() {
        // Redirect to setup if not complete
        if (!isSetupComplete()) {
          throw navigate('/')
        }

        // Redirect to login if not authenticated
        const isAuthenticated = await auth.checkAuth()
        if (!isAuthenticated) {
          throw navigate('/login')
        }
      }
    }
  },
  '/login': {
    '/': Login,
    hooks: {
      async beforeLoad() {
        // Redirect to setup if not complete
        if (!isSetupComplete()) {
          throw navigate('/')
        }

        // Redirect to home if already authenticated
        const isAuthenticated = await auth.checkAuth()
        if (isAuthenticated) {
          throw navigate('/home')
        }
      }
    }
  },
});

```

# src/routes/GettingStarted.svelte

```svelte
<script lang="ts">
    import { navigate } from "../router";

     function setup() {
        localStorage.setItem('setupState', 'done')
        navigate('/')
    }
</script>

<button type="button" onclick={setup}>
    Continue
</button>
```

# src/routes/Home.svelte

```svelte
<script lang="ts">
  import { auth } from "../auth.svelte";
  import Map from "../lib/Map.svelte";
</script>

{#if auth.isLoading}
  <div class="loading">
    <div class="spinner"></div>
    <p>Loading map...</p>
  </div>
{:else if auth.isLoggedIn && auth.state.user}
  <div class="home">
    <Map />
  </div>
{:else}
  <div class="error">
    <p>Not authenticated</p>
  </div>
{/if}

<style>
  .home {
    width: 100%;
    height: calc(100svh - 4.5rem);
    position: relative;
    background: #0a0a0a;
  }

  .loading {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    min-height: 50vh;
    gap: 1rem;
    color: #fff;
  }

  .loading p {
    font-size: 0.875rem;
    color: rgba(255, 255, 255, 0.6);
  }

  .spinner {
    width: 2.5rem;
    height: 2.5rem;
    border: 3px solid rgba(42, 157, 143, 0.2);
    border-top-color: var(--verdigris);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .error {
    text-align: center;
    padding: 2rem;
    color: var(--burnt-peach);
  }
</style>

```

# src/routes/Login.svelte

```svelte
<script lang="ts">
  import { auth } from "../auth.svelte";
  import { navigate } from "../router";
  import { LogIn, User, Lock, AlertCircle } from "lucide-svelte";

  let username = $state("");
  let password = $state("");
  let error = $state("");

  async function login(e: Event) {
    e.preventDefault();

    if (!username || !password) {
      error = "Please fill in all fields";
      return;
    }

    error = "";

    const result = await auth.login(username, password);

    if (result.success) {
      navigate("/home");
    } else {
      error = result.error || "Login failed";
    }
  }
</script>

<div class="login-container">
  <div class="login-card">
    <div class="logo-section">
      <div class="logo-circle">
        <LogIn size={40} strokeWidth={2} />
      </div>
      <h1>Welcome Back</h1>
      <p class="subtitle">Sign in to continue to Mappy</p>
    </div>

    <form onsubmit={login}>
      <div class="input-group">
        <label for="username">Username</label>
        <div class="input-wrapper">
          <div class="input-icon">
            <User size={20} strokeWidth={2} />
          </div>
          <input
            id="username"
            type="text"
            bind:value={username}
            placeholder="Enter your username"
            disabled={auth.isLoading}
            autocomplete="username"
          />
        </div>
      </div>

      <div class="input-group">
        <label for="password">Password</label>
        <div class="input-wrapper">
          <div class="input-icon">
            <Lock size={20} strokeWidth={2} />
          </div>
          <input
            id="password"
            type="password"
            bind:value={password}
            placeholder="Enter your password"
            disabled={auth.isLoading}
            autocomplete="current-password"
          />
        </div>
      </div>

      {#if error}
        <div class="error-message">
          <AlertCircle size={18} strokeWidth={2} />
          <span>{error}</span>
        </div>
      {/if}

      <button type="submit" class="login-btn" disabled={auth.isLoading}>
        {#if auth.isLoading}
          <div class="spinner"></div>
          <span>Logging in...</span>
        {:else}
          <LogIn size={20} strokeWidth={2} />
          <span>Sign In</span>
        {/if}
      </button>
    </form>

    <div class="footer-links">
      <button type="button" class="link-btn">Forgot password?</button>
      <button type="button" class="link-btn">Create account</button>
    </div>
  </div>
</div>

<style>
  .login-container {
    min-height: 100svh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1.5rem;
    background: linear-gradient(180deg, #1a1a1a 0%, #0a0a0a 100%);
    position: relative;
    overflow: hidden;
  }

  /* Animated background gradient */
  .login-container::before {
    content: "";
    position: absolute;
    width: 500px;
    height: 500px;
    background: radial-gradient(circle, var(--verdigris) 0%, transparent 70%);
    opacity: 0.15;
    top: -250px;
    right: -250px;
    animation: pulse 8s ease-in-out infinite;
  }

  .login-container::after {
    content: "";
    position: absolute;
    width: 400px;
    height: 400px;
    background: radial-gradient(circle, var(--tuscan-sun) 0%, transparent 70%);
    opacity: 0.1;
    bottom: -200px;
    left: -200px;
    animation: pulse 10s ease-in-out infinite;
  }

  @keyframes pulse {
    0%,
    100% {
      transform: scale(1);
      opacity: 0.15;
    }
    50% {
      transform: scale(1.1);
      opacity: 0.2;
    }
  }

  .login-card {
    width: 100%;
    max-width: 420px;
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 24px;
    padding: 2.5rem;
    position: relative;
    z-index: 1;
  }

  .logo-section {
    text-align: center;
    margin-bottom: 2.5rem;
  }

  .logo-circle {
    width: 5rem;
    height: 5rem;
    border-radius: 50%;
    background: linear-gradient(
      135deg,
      var(--verdigris) 0%,
      var(--tuscan-sun) 100%
    );
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    margin: 0 auto 1.5rem;
    box-shadow: 0 8px 24px rgba(42, 157, 143, 0.3);
  }

  .logo-section h1 {
    font-size: 1.875rem;
    font-weight: 600;
    color: #fff;
    margin: 0 0 0.5rem 0;
  }

  .subtitle {
    font-size: 0.9375rem;
    color: rgba(255, 255, 255, 0.6);
    margin: 0;
  }

  form {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .input-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  label {
    font-size: 0.875rem;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.9);
    padding-left: 0.25rem;
  }

  .input-wrapper {
    position: relative;
  }

  .input-icon {
    position: absolute;
    left: 1rem;
    top: 50%;
    transform: translateY(-50%);
    color: rgba(255, 255, 255, 0.4);
    display: flex;
    align-items: center;
    pointer-events: none;
  }

  input[type="text"],
  input[type="password"] {
    width: 100%;
    padding: 1rem 1rem 1rem 3rem;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    color: #fff;
    font-size: 0.9375rem;
    font-family: inherit;
    transition: all 0.2s;
  }

  input[type="text"]::placeholder,
  input[type="password"]::placeholder {
    color: rgba(255, 255, 255, 0.3);
  }

  input[type="text"]:focus,
  input[type="password"]:focus {
    outline: none;
    background: rgba(255, 255, 255, 0.08);
    border-color: var(--verdigris);
    box-shadow: 0 0 0 3px rgba(42, 157, 143, 0.1);
  }

  input[type="text"]:disabled,
  input[type="password"]:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .error-message {
    display: flex;
    align-items: center;
    gap: 0.625rem;
    padding: 0.875rem 1rem;
    background: rgba(231, 111, 81, 0.1);
    border: 1px solid rgba(231, 111, 81, 0.3);
    border-radius: 12px;
    color: var(--burnt-peach);
    font-size: 0.875rem;
    animation: slideIn 0.3s ease-out;
  }

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .login-btn {
    padding: 1rem;
    background: linear-gradient(135deg, var(--verdigris) 0%, #248d82 100%);
    border: none;
    border-radius: 12px;
    color: #fff;
    font-size: 1rem;
    font-weight: 600;
    font-family: inherit;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.625rem;
    transition: all 0.2s;
    margin-top: 0.5rem;
  }

  .login-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(42, 157, 143, 0.3);
  }

  .login-btn:active:not(:disabled) {
    transform: translateY(0);
  }

  .login-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .spinner {
    width: 1.25rem;
    height: 1.25rem;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .footer-links {
    display: flex;
    justify-content: space-between;
    margin-top: 2rem;
    padding-top: 2rem;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }

  .link-btn {
    background: none;
    border: none;
    color: var(--verdigris);
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    font-family: inherit;
    transition: color 0.2s;
  }

  .link-btn:hover {
    color: var(--tuscan-sun);
  }

  /* Responsive */
  @media (max-width: 480px) {
    .login-card {
      padding: 2rem 1.5rem;
    }

    .logo-section h1 {
      font-size: 1.5rem;
    }
  }
</style>

```
