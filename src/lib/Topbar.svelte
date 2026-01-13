<script lang="ts">
  import { ArrowLeft, Menu } from "lucide-svelte";
  import { navigate, route } from "../router";
  import logo from "../assets/svelte.svg";
  import { slide } from "svelte/transition";

  let isOpen = $state(true);
</script>

<div class="container">
  <button type="button" onclick={() => navigate("/")}>
    {#if route.pathname === "/"}
      <ArrowLeft />
    {:else}
      <img src={logo} alt="Svelte Logo" />
    {/if}
  </button>
  <h3>Mappy</h3>
  <button type="button" onclick={() => (isOpen = !isOpen)}>
    <Menu />
  </button>

  {#if isOpen}
    <div class="dropdown" transition:slide>
      <a href="/login">Login</a>
      <a href="/home">Home</a>
    </div>
  {/if}
</div>

<style>
  .container {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
    gap: 1rem;
    position: relative;
    z-index: 2;
    button {
      border: none;
      background-color: transparent;
      display: flex;
      place-content: center;
      align-items: center;
      height: 2rem;
    }

    .dropdown {
      position: absolute;
      top: 100%;
      right: 0;
      left: 0;
      padding-block: 1rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
    }
  }
</style>
