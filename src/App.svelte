<script lang="ts">
  import { Router } from "sv-router";
  import "./router.ts";
  import { onMount } from "svelte";
  import Topbar from "./lib/Topbar.svelte";
  let setupState: string | null;
  onMount(() => {
    setupState = localStorage.getItem("setupState");
    console.log(setupState);
  });
</script>

<main>
  {#if setupState == "done"}
    <Topbar />
  {/if}
  <Router />
</main>
