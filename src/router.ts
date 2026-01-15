import { createRouter } from 'sv-router';
import GettingStarted from "./routes/GettingStarted.svelte"
import Home from './routes/Home.svelte';
import { auth } from './auth.svelte';
import Login from './routes/Login.svelte';
import CreateAccount from './routes/CreateAccount.svelte';

// Helper to check setup state dynamically
function isSetupComplete(): boolean {
  if (typeof window === 'undefined') return false;
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
