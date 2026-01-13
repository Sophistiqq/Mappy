const url = import.meta.env.VITE_URL
export class AuthManager {
  async login(username: string, password: string) {
    const res = await fetch(`${url}/auth/login`, {
      method: "POST",
      body: JSON.stringify({ username, password }),
      headers: {
        'Content-Type': "application/json"
      },
      credentials: 'include'
    })
    console.log(res)
  }
  async checkAuth() {
    const res = await fetch(`${url}/auth/me`, {
      method: 'POST',
      credentials: 'include'
    })
    console.table(res)
  }
}
