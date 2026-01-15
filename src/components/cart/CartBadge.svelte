<script lang="ts">
  import { onMount } from 'svelte';
  import { cartCount, initializeCart, subscribeToCartChanges } from '../../stores/cart';

  let count = $state(0);

  onMount(() => {
    initializeCart();
    subscribeToCartChanges();

    const unsub = cartCount.subscribe((value) => {
      count = value;
    });

    return unsub;
  });
</script>

{#if count > 0}
  <span class="badge" aria-label="{count} produse în coș"></span>
{/if}

<style>
  .badge {
    position: absolute;
    top: -0.25rem;
    right: -0.25rem;
    width: 0.625rem;
    height: 0.625rem;
    background: #dc2626;
    border-radius: 9999px;
  }
</style>
