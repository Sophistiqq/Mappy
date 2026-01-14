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
