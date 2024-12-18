<script lang="ts">
  let { children } = $props();
</script>

<div class="auth-layout">
  <header>Auth Header</header>
  <main>{@render children()}</main>
  <footer>Auth Footer</footer>
</div> 