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
