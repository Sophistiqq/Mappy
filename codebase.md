# .gemini/settings.json

```json
{
	"$schema": "https://raw.githubusercontent.com/google-gemini/gemini-cli/main/schemas/settings.schema.json",
	"mcpServers": {
		"svelte": {
			"command": "npx",
			"args": [
				"-y",
				"@sveltejs/mcp"
			]
		}
	}
}

```

# GEMINI.md

```md
You are able to use the Svelte MCP server, where you have access to comprehensive Svelte 5 and SvelteKit documentation. Here's how to use the available tools effectively:

## Available MCP Tools:

### 1. list-sections

Use this FIRST to discover all available documentation sections. Returns a structured list with titles, use_cases, and paths.
When asked about Svelte or SvelteKit topics, ALWAYS use this tool at the start of the chat to find relevant sections.

### 2. get-documentation

Retrieves full documentation content for specific sections. Accepts single or multiple sections.
After calling the list-sections tool, you MUST analyze the returned documentation sections (especially the use_cases field) and then use the get-documentation tool to fetch ALL documentation sections that are relevant for the user's task.

### 3. svelte-autofixer

Analyzes Svelte code and returns issues and suggestions.
You MUST use this tool whenever writing Svelte code before sending it to the user. Keep calling it until no issues or suggestions are returned.

### 4. playground-link

Generates a Svelte Playground link with the provided code.
After completing the code, ask the user if they want a playground link. Only call this tool after user confirmation and NEVER if code was written to files in their project.

```

# README.md

```md
# Svelte + TS + Vite

This template should help get you started developing with Svelte and TypeScript in Vite.

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Svelte](https://marketplace.visualstudio.com/items?itemName=svelte.svelte-vscode).

## Need an official Svelte framework?

Check out [SvelteKit](https://github.com/sveltejs/kit#readme), which is also powered by Vite. Deploy anywhere with its serverless-first approach and adapt to various platforms, with out of the box support for TypeScript, SCSS, and Less, and easily-added support for mdsvex, GraphQL, PostCSS, Tailwind CSS, and more.

## Technical considerations

**Why use this over SvelteKit?**

- It brings its own routing solution which might not be preferable for some users.
- It is first and foremost a framework that just happens to use Vite under the hood, not a Vite app.

This template contains as little as possible to get started with Vite + TypeScript + Svelte, while taking into account the developer experience with regards to HMR and intellisense. It demonstrates capabilities on par with the other `create-vite` templates and is a good starting point for beginners dipping their toes into a Vite + Svelte project.

Should you later need the extended capabilities and extensibility provided by SvelteKit, the template has been structured similarly to SvelteKit so that it is easy to migrate.

**Why `global.d.ts` instead of `compilerOptions.types` inside `jsconfig.json` or `tsconfig.json`?**

Setting `compilerOptions.types` shuts out all other types not explicitly listed in the configuration. Using triple-slash references keeps the default TypeScript setting of accepting type information from the entire workspace, while also adding `svelte` and `vite/client` type information.

**Why include `.vscode/extensions.json`?**

Other templates indirectly recommend extensions via the README, but this file allows VS Code to prompt the user to install the recommended extension upon opening the project.

**Why enable `allowJs` in the TS template?**

While `allowJs: false` would indeed prevent the use of `.js` files in the project, it does not prevent the use of JavaScript syntax in `.svelte` files. In addition, it would force `checkJs: false`, bringing the worst of both worlds: not being able to guarantee the entire codebase is TypeScript, and also having worse typechecking for the existing JavaScript. In addition, there are valid use cases in which a mixed codebase may be relevant.

**Why is HMR not preserving my local component state?**

HMR state preservation comes with a number of gotchas! It has been disabled by default in both `svelte-hmr` and `@sveltejs/vite-plugin-svelte` due to its often surprising behavior. You can read the details [here](https://github.com/rixo/svelte-hmr#svelte-hmr).

If you have state that's important to retain within a component, consider creating an external store which would not be replaced by HMR.

\`\`\`ts
// store.ts
// An extremely simple external store
import { writable } from 'svelte/store'
export default writable(0)
\`\`\`

```

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
  const hideTopbarRoutes = ["/login", "/", "/create-account"];

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

  async register(
    username: string,
    password: string,
    email: string,
    first_name: string,
    last_name: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      this.state.loading = true;

      const res = await fetch(`${url}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username,
          password,
          email,
          first_name,
          last_name
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        this.state.loading = false;
        return { success: false, error: errorData.message || 'Registration failed' };
      }

      // After successful registration, fetch user details
      await this.fetchUser();

      return { success: true };
    } catch (error) {
      console.error('Registration error:', error);
      this.state.loading = false;
      return { success: false, error: 'Network error' };
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

# src/lib/BottomSheet.svelte

```svelte
<script lang="ts">
  import {
    ChevronUp,
    ChevronDown,
    Search,
    Navigation,
    Clock,
    X,
    Check,
  } from "lucide-svelte";

  interface Route {
    id: number;
    name: string;
    code: string;
    color: string | null;
    fare: number;
    vehicleCount?: number;
  }

  interface Props {
    routes: Route[];
    selectedRoute: number | null;
    onRouteSelect: (routeId: number | null) => void;
  }

  let { routes, selectedRoute, onRouteSelect }: Props = $props();

  let isExpanded = $state(false);
  let searchQuery = $state("");

  // Filter routes based on search
  const filteredRoutes = $derived(
    routes.filter(
      (route) =>
        route.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        route.code.toLowerCase().includes(searchQuery.toLowerCase()),
    ),
  );

  function toggleSheet() {
    isExpanded = !isExpanded;
  }

  function selectRoute(routeId: number) {
    if (selectedRoute === routeId) {
      onRouteSelect(null);
    } else {
      onRouteSelect(routeId);
    }
  }

  function clearSearch() {
    searchQuery = "";
  }
</script>

<div class="bottom-sheet" class:expanded={isExpanded}>
  <!-- Handle bar -->
  <button type="button" class="sheet-handle" onclick={toggleSheet}>
    <div class="handle-bar"></div>
    <div class="handle-content">
      {#if isExpanded}
        <ChevronDown size={20} strokeWidth={2.5} />
        <span>Hide Routes</span>
      {:else}
        <ChevronUp size={20} strokeWidth={2.5} />
        <span>View All Routes ({routes.length})</span>
      {/if}
    </div>
  </button>

  <!-- Sheet content -->
  <div class="sheet-content">
    <!-- Header with search -->
    <div class="sheet-header">
      <h3 class="sheet-title">Routes</h3>
      <div class="search-bar">
        <Search size={18} strokeWidth={2} />
        <input
          type="text"
          placeholder="Search by route code or name..."
          bind:value={searchQuery}
        />
        {#if searchQuery}
          <button type="button" class="clear-btn" onclick={clearSearch}>
            <X size={16} strokeWidth={2} />
          </button>
        {/if}
      </div>
    </div>

    <!-- Selected route indicator -->
    {#if selectedRoute !== null}
      {@const route = routes.find((r) => r.id === selectedRoute)}
      {#if route}
        <div class="selected-indicator">
          <div class="selected-content">
            <div
              class="selected-color"
              style:background={route.color || "#2a9d8f"}
            ></div>
            <span class="selected-text"
              >Showing: <strong>{route.code}</strong></span
            >
          </div>
          <button
            type="button"
            class="clear-filter"
            onclick={() => onRouteSelect(null)}
          >
            Clear
          </button>
        </div>
      {/if}
    {/if}

    <!-- Routes list -->
    <div class="routes-list">
      {#each filteredRoutes as route (route.id)}
        <button
          type="button"
          class="route-card"
          class:selected={selectedRoute === route.id}
          onclick={() => selectRoute(route.id)}
        >
          <div
            class="route-indicator"
            style:background={route.color || "#2a9d8f"}
          ></div>

          <div class="route-info">
            <div class="route-header">
              <span class="route-code">{route.code}</span>
              <span class="route-fare">₱{route.fare.toFixed(2)}</span>
            </div>
            <h4 class="route-name">{route.name}</h4>

            <div class="route-stats">
              <div class="stat">
                <Navigation size={14} strokeWidth={2} />
                <span>{route.vehicleCount || 0} active</span>
              </div>
              <div class="stat">
                <Clock size={14} strokeWidth={2} />
                <span>~5-10 min</span>
              </div>
            </div>
          </div>

          {#if selectedRoute === route.id}
            <div class="selected-badge">
              <Check size={14} />
            </div>
          {/if}
        </button>
      {/each}

      {#if filteredRoutes.length === 0}
        <div class="empty-state">
          <Search size={32} strokeWidth={1.5} />
          <p>No routes found</p>
          <span class="empty-hint">Try searching for a different route</span>
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .bottom-sheet {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 50;
    background: linear-gradient(
      180deg,
      rgba(20, 20, 20, 0.98) 0%,
      rgba(10, 10, 10, 0.98) 100%
    );
    border-top-left-radius: 24px;
    border-top-right-radius: 24px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(24px);
    transform: translateY(calc(100% - 5rem));
    transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    max-height: 85vh;
    display: flex;
    flex-direction: column;
  }

  .bottom-sheet.expanded {
    transform: translateY(0);
  }

  .sheet-handle {
    width: 100%;
    padding: 1rem 1.5rem 0.75rem;
    background: transparent;
    border: none;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
    flex-shrink: 0;
    transition: opacity 0.2s;
  }

  .sheet-handle:active {
    opacity: 0.7;
  }

  .handle-bar {
    width: 3rem;
    height: 0.25rem;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 2px;
    transition: all 0.2s;
  }

  .sheet-handle:hover .handle-bar {
    background: rgba(255, 255, 255, 0.35);
    width: 3.5rem;
  }

  .handle-content {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: rgba(255, 255, 255, 0.7);
    font-size: 0.875rem;
    font-weight: 600;
    transition: color 0.2s;
  }

  .sheet-handle:hover .handle-content {
    color: rgba(255, 255, 255, 0.9);
  }

  .sheet-content {
    padding: 1rem 1.5rem 2rem;
    overflow-y: auto;
    overflow-x: hidden;
    flex: 1;
    -webkit-overflow-scrolling: touch;
  }

  .sheet-content::-webkit-scrollbar {
    width: 6px;
  }

  .sheet-content::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 3px;
  }

  .sheet-content::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 3px;
  }

  .sheet-content::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.3);
  }

  .sheet-header {
    margin-bottom: 1rem;
  }

  .sheet-title {
    font-size: 1.5rem;
    font-weight: 700;
    color: #fff;
    margin: 0 0 1rem 0;
  }

  .search-bar {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.875rem 1rem;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    color: rgba(255, 255, 255, 0.5);
    transition: all 0.2s;
  }

  .search-bar:focus-within {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(42, 157, 143, 0.5);
    box-shadow: 0 0 0 3px rgba(42, 157, 143, 0.1);
  }

  .search-bar input {
    flex: 1;
    background: transparent;
    border: none;
    outline: none;
    color: #fff;
    font-size: 0.9375rem;
    font-family: inherit;
  }

  .search-bar input::placeholder {
    color: rgba(255, 255, 255, 0.35);
  }

  .clear-btn {
    background: rgba(255, 255, 255, 0.1);
    border: none;
    border-radius: 6px;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: rgba(255, 255, 255, 0.6);
    transition: all 0.2s;
    flex-shrink: 0;
  }

  .clear-btn:hover {
    background: rgba(255, 255, 255, 0.15);
    color: #fff;
  }

  .selected-indicator {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem 1rem;
    background: rgba(42, 157, 143, 0.1);
    border: 1px solid rgba(42, 157, 143, 0.3);
    border-radius: 12px;
    margin-bottom: 1rem;
  }

  .selected-content {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .selected-color {
    width: 4px;
    height: 24px;
    border-radius: 2px;
  }

  .selected-text {
    font-size: 0.875rem;
    color: rgba(255, 255, 255, 0.7);
  }

  .selected-text strong {
    color: #fff;
    font-weight: 700;
  }

  .clear-filter {
    background: transparent;
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    padding: 0.375rem 0.75rem;
    color: rgba(255, 255, 255, 0.7);
    font-size: 0.8125rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    font-family: inherit;
  }

  .clear-filter:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.3);
    color: #fff;
  }

  .routes-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .route-card {
    width: 100%;
    display: flex;
    align-items: stretch;
    gap: 1rem;
    padding: 1rem;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 16px;
    cursor: pointer;
    transition: all 0.2s;
    text-align: left;
    font-family: inherit;
    position: relative;
  }

  .route-card:hover {
    background: rgba(255, 255, 255, 0.06);
    border-color: rgba(255, 255, 255, 0.15);
    transform: translateY(-1px);
  }

  .route-card:active {
    transform: translateY(0);
  }

  .route-card.selected {
    background: rgba(42, 157, 143, 0.12);
    border-color: rgba(42, 157, 143, 0.4);
  }

  .route-indicator {
    width: 0.375rem;
    border-radius: 4px;
    flex-shrink: 0;
  }

  .route-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .route-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .route-code {
    font-size: 0.75rem;
    font-weight: 800;
    padding: 0.25rem 0.625rem;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 6px;
    color: rgba(255, 255, 255, 0.9);
    letter-spacing: 0.5px;
  }

  .route-fare {
    font-size: 0.875rem;
    font-weight: 700;
    color: #e9c46a;
  }

  .route-name {
    font-size: 1rem;
    font-weight: 600;
    color: #fff;
    margin: 0;
    line-height: 1.4;
  }

  .route-stats {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .stat {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    font-size: 0.8125rem;
    color: rgba(255, 255, 255, 0.5);
  }

  .selected-badge {
    position: absolute;
    top: 3rem;
    right: 1rem;
    width: 24px;
    height: 24px;
    background: #2a9d8f;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
  }

  .empty-state {
    text-align: center;
    padding: 3rem 1rem;
    color: rgba(255, 255, 255, 0.3);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
  }

  .empty-state p {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.5);
  }

  .empty-hint {
    font-size: 0.875rem;
    color: rgba(255, 255, 255, 0.3);
  }
</style>

```

# src/lib/Map.svelte

```svelte
<script lang="ts">
  import {
    MapLibre,
    NavigationControl,
    ScaleControl,
    GeolocateControl,
  } from "svelte-maplibre-gl";
  import maplibregl from "maplibre-gl";
  import { onMount, onDestroy } from "svelte";
  import { vehicleStream } from "./vehicleStream.svelte";
  import BottomSheet from "./BottomSheet.svelte";
  import MarkerPopup from "./MarkerPopup.svelte";

  let map: maplibregl.Map | any = $state(null);

  // Montalban, Rizal coordinates
  const montalbanCenter = { lng: 121.1394, lat: 14.7306 };

  // Use OpenFreeMap's Liberty style (free, no API key needed)
  const mapStyle = "https://tiles.openfreemap.org/styles/dark";

  const url = import.meta.env.VITE_URL;

  // State for routes and terminals
  let routes = $state<any[]>([]);
  let terminals = $state<any[]>([]);
  let selectedRoute = $state<number | null>(null);

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

  function createTerminalMarkerEl(_terminal: any) {
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

  // Terminal markers
  $effect(() => {
    if (map && terminals.length > 0) {
      for (const terminal of terminals) {
        if (terminal.latitude && terminal.longitude) {
          const popup = new maplibregl.Popup({
            offset: [0, -35],
            closeButton: true,
          }).setHTML(`
            <div class="terminal-popup">
              <div class="popup-badge">TERMINAL</div>
              <h3 class="terminal-title">${terminal.name}</h3>
              ${terminal.address ? `<p class="terminal-address">${terminal.address}</p>` : ""}
              ${
                terminal.routeStops && terminal.routeStops.length > 0
                  ? `
                <div class="routes-section">
                  <span class="section-label">ROUTES:</span>
                  <div class="route-pills">
                    ${terminal.routeStops.map((stop: any) => `<span class="route-pill">${stop.route.code}</span>`).join("")}
                  </div>
                </div>
              `
                  : ""
              }
            </div>
          `);

          new maplibregl.Marker({ element: createTerminalMarkerEl(terminal) })
            .setLngLat([terminal.longitude, terminal.latitude])
            .setPopup(popup)
            .addTo(map);
        }
      }
    }
  });
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
    bind:map
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

    {#each displayedVehicles as vehicle (vehicle.id)}
      {#key vehicle.id}
        <MarkerPopup {vehicle} />
      {/key}
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

  :global {
    /* ====== PIN-STYLE VEHICLE MARKERS ====== */
    .custom-vehicle-marker {
      cursor: pointer;
      filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
      transition: all 0.2s ease;
    }

    .custom-vehicle-marker:hover {
      filter: drop-shadow(0 6px 12px rgba(0, 0, 0, 0.4));
      transform: translateY(-2px);
    }

    .pin-marker {
      position: relative;
      width: 36px;
      height: 44px;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .pin-circle {
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

    .pin-circle svg {
      transform: rotate(45deg);
      color: white;
      width: 18px;
      height: 18px;
    }

    .pin-point {
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
    .custom-terminal-marker {
      cursor: pointer;
      transition: all 0.2s ease;
      filter: drop-shadow(0 4px 8px rgba(233, 196, 106, 0.3));
    }

    .custom-terminal-marker:hover {
      transform: translateY(-2px);
      filter: drop-shadow(0 6px 12px rgba(233, 196, 106, 0.4));
    }

    .terminal-pin-marker {
      position: relative;
      width: 36px;
      height: 44px;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .terminal-pulse {
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

    .terminal-circle {
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

    .terminal-circle svg {
      transform: rotate(45deg);
      color: #000;
      width: 18px;
      height: 18px;
    }

    .terminal-point {
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
    .maplibregl-popup-content {
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

    .maplibregl-popup-tip {
      border-top-color: rgba(20, 20, 20, 0.98) !important;
    }

    .maplibregl-popup-close-button {
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

    .maplibregl-popup-close-button:hover {
      background: rgba(255, 255, 255, 0.1) !important;
      color: #fff !important;
      transform: scale(1.1) !important;
    }

    .maplibregl-popup-close-button:active {
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

    .stat-item svg {
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

    .popup-footer svg {
      flex-shrink: 0;
    }
  }
</style>

```

# src/lib/MarkerPopup.svelte

```svelte
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
            <span class="card-label">Home</span>
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
    padding: 1rem;
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
    padding: 1.25rem;
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
import CreateAccount from './routes/CreateAccount.svelte';

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
  '/create-account': {
    '/': CreateAccount,
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

# src/routes/CreateAccount.svelte

```svelte
<script lang="ts">
  import { auth } from "../auth.svelte";
  import { navigate } from "../router";
  import { UserPlus, User, Lock, Mail, CircleAlert } from "lucide-svelte";

  let username = $state("");
  let password = $state("");
  let email = $state("");
  let first_name = $state("");
  let last_name = $state("");
  let error = $state("");

  async function createAccount(e: Event) {
    e.preventDefault();

    if (!username || !password || !email || !first_name || !last_name) {
      error = "Please fill in all fields";
      return;
    }

    error = "";

    const result = await auth.register(
      username,
      password,
      email,
      first_name,
      last_name,
    );

    if (result.success) {
      navigate("/home");
    } else {
      error = result.error || "Failed to create account";
    }
  }
</script>

<div class="login-container">
  <div class="login-card">
    <div class="logo-section">
      <div class="logo-circle">
        <UserPlus size={40} strokeWidth={2} />
      </div>
      <h1>Create Account</h1>
      <p class="subtitle">Join Mappy to start your journey</p>
    </div>

    <form onsubmit={createAccount}>
      <div class="input-group">
        <label for="first_name">First Name</label>
        <div class="input-wrapper">
          <div class="input-icon">
            <User size={20} strokeWidth={2} />
          </div>
          <input
            id="first_name"
            type="text"
            bind:value={first_name}
            placeholder="Enter your first name"
            disabled={auth.isLoading}
          />
        </div>
      </div>
      <div class="input-group">
        <label for="last_name">Last Name</label>
        <div class="input-wrapper">
          <div class="input-icon">
            <User size={20} strokeWidth={2} />
          </div>
          <input
            id="last_name"
            type="text"
            bind:value={last_name}
            placeholder="Enter your last name"
            disabled={auth.isLoading}
          />
        </div>
      </div>
      <div class="input-group">
        <label for="email">Email</label>
        <div class="input-wrapper">
          <div class="input-icon">
            <Mail size={20} strokeWidth={2} />
          </div>
          <input
            id="email"
            type="text"
            bind:value={email}
            placeholder="Enter your email"
            disabled={auth.isLoading}
          />
        </div>
      </div>
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
            autocomplete="new-password"
          />
        </div>
      </div>

      {#if error}
        <div class="error-message">
          <CircleAlert size={18} strokeWidth={2} />
          <span>{error}</span>
        </div>
      {/if}

      <button type="submit" class="login-btn" disabled={auth.isLoading}>
        {#if auth.isLoading}
          <div class="spinner"></div>
          <span>Creating Account...</span>
        {:else}
          <UserPlus size={20} strokeWidth={2} />
          <span>Sign Up</span>
        {/if}
      </button>
    </form>

    <div class="footer-links">
      <span class="link-btn" style="cursor: default;"
        >Already have an account?</span
      >
      <button type="button" class="link-btn" onclick={() => navigate("/login")}
        >Sign in</button
      >
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

  input::placeholder {
    color: rgba(255, 255, 255, 0.3);
  }

  input:focus {
    outline: none;
    background: rgba(255, 255, 255, 0.08);
    border-color: var(--verdigris);
    box-shadow: 0 0 0 3px rgba(42, 157, 143, 0.1);
  }

  input:disabled {
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
    transition: color 0.2s;
  }

  .link-btn:hover {
    color: var(--tuscan-sun);
  }

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
  import { LogIn, User, Lock, CircleAlert } from "lucide-svelte";

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
          <CircleAlert size={18} strokeWidth={2} />
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
      <button
        type="button"
        class="link-btn"
        onclick={() => navigate("/create-account")}>Create account</button
      >
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

# src/vite-env.d.ts

```ts
/// <reference types="svelte" />
/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/svelte" />

```

