<script lang="ts">
  import { navigating } from '$app/stores';
  let { class: className } = $props();
</script>

<div class="fixed top-0 left-0 right-0 z-50">
  {#if $navigating}
    <div class="h-1 w-full bg-gray-200">
      <div class="h-1 animate-loading-bar bg-primary" />
    </div>
  {/if}
</div>

<style>
  @keyframes loading-bar {
    0% {
      width: 0;
    }
    50% {
      width: 70%;
    }
    100% {
      width: 100%;
    }
  }

  .animate-loading-bar {
    animation: loading-bar 1s ease-in-out infinite;
  }
</style> 