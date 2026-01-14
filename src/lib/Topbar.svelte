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
