<script lang="ts">
  import { onMount } from 'svelte';
  import {
    cartTotal,
    cartSubtotal,
    cartCount,
    sgrTotal,
    bottleCount,
    isCartEmpty,
    formatPrice,
    initializeCart,
    subscribeToCartChanges,
  } from '../../stores/cart';

  interface Props {
    shippingPrice: number;
    freeShippingThreshold: number;
  }

  let { shippingPrice, freeShippingThreshold }: Props = $props();

  let total = $state(0);
  let subtotal = $state(0);
  let sgr = $state(0);
  let bottles = $state(0);
  let count = $state(0);
  let empty = $state(true);

  // Determine if free shipping applies (based on subtotal without SGR)
  const hasFreeShipping = $derived(subtotal >= freeShippingThreshold && freeShippingThreshold > 0);

  onMount(() => {
    initializeCart();
    subscribeToCartChanges();

    const unsubTotal = cartTotal.subscribe((value) => {
      total = value;
    });

    const unsubSubtotal = cartSubtotal.subscribe((value) => {
      subtotal = value;
    });

    const unsubSgr = sgrTotal.subscribe((value) => {
      sgr = value;
    });

    const unsubBottles = bottleCount.subscribe((value) => {
      bottles = value;
    });

    const unsubCount = cartCount.subscribe((value) => {
      count = value;
    });

    const unsubEmpty = isCartEmpty.subscribe((value) => {
      empty = value;
    });

    return () => {
      unsubTotal();
      unsubSubtotal();
      unsubSgr();
      unsubBottles();
      unsubCount();
      unsubEmpty();
    };
  });
</script>

<div class="cart-summary">
  <div class="summary-row">
    <span class="summary-label">Subtotal ({count} {count === 1 ? 'produs' : 'produse'})</span>
    <span class="summary-value">{formatPrice(subtotal)}</span>
  </div>

  {#if bottles > 0}
    <div class="summary-row">
      <span class="summary-label">Garanție SGR ({bottles} {bottles === 1 ? 'sticlă' : 'sticle'})</span>
      <span class="summary-value">{formatPrice(sgr)}</span>
    </div>
  {/if}

  <div class="summary-row">
    <span class="summary-label">Transport</span>
    {#if hasFreeShipping}
      <span class="summary-value shipping-free-inline">Gratuit</span>
    {:else}
      <span class="summary-value">{formatPrice(shippingPrice)}</span>
    {/if}
  </div>

  <div class="summary-row summary-row-total">
    <span class="summary-label">{bottles > 0 ? 'Total (incl. SGR)' : 'Total'}</span>
    <span class="summary-value">{formatPrice(total + (hasFreeShipping ? 0 : shippingPrice))}</span>
  </div>

  <div class="shipping-info">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <path d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
    </svg>
    <div class="shipping-text">
      {#if freeShippingThreshold > 0 && !hasFreeShipping}
        <span class="shipping-threshold">Livrare gratuită pentru comenzi de peste {formatPrice(freeShippingThreshold)}</span>
      {:else if hasFreeShipping}
        <span class="shipping-free">Ai livrare gratuită!</span>
      {/if}
    </div>
  </div>

  <a
    href="/checkout"
    class="checkout-button"
    class:disabled={empty}
    aria-disabled={empty}
  >
    Cumpără
  </a>
</div>

<style>
  /* Styles are in global.css for SSR compatibility */
</style>
