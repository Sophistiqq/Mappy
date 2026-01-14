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
