<script lang='ts'>
    import { AuthManager } from "../auth";

    const auth = new AuthManager
    let username = $state('')
    let password = $state('')
    async function login(e: Event){ 
        e.preventDefault()
        await auth.login(username, password)
    }
</script>

<form onsubmit={login}>
    <input type="text" bind:value={username} placeholder="Username">
    <input type="password" bind:value={password} placeholder="Password">    
    <input type="submit" value="">
</form>