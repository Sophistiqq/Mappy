import { createRouter } from 'sv-router';
import GettingStarted from "./routes/GettingStarted.svelte"
import Home from './routes/Home.svelte';
import { AuthManager } from './auth';
import Login from './routes/Login.svelte';

const setupState: string | null = localStorage.getItem('setupState')

const auth = new AuthManager

export const { p, navigate, isActive, route } = createRouter({
  '/': {
    '/': GettingStarted,
    hooks: {
      async beforeLoad() {
        if (setupState === 'done') {
          throw navigate('/home')
        }
      }
    }
  },
  '/home': {
    '/': Home,
    hooks: {
      async beforeLoad() {
        const status = await auth.checkAuth()
      }
    }
  },
  '/login': {
    '/': Login
  },

});
