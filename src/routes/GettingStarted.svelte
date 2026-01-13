<script lang="ts">
    import { navigate } from "../router";

     function setup() {
        localStorage.setItem('setupState', 'done')
        navigate('/')
    }
</script>

<button type="button" onclick={setup}>
    Continue
</button>