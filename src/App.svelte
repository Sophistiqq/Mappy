<script lang="ts">
  import { Router } from "sv-router";
  import "./router.ts";
  import { route } from "./router";
  import Topbar from "./lib/Topbar.svelte";

  // Read setup state directly - no need for onMount
  let setupState = $state(
    typeof window !== 'undefined' ? localStorage.getItem("setupState") : null
  );

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
