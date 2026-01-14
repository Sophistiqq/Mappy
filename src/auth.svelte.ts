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
