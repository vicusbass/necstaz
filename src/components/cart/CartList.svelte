<script lang="ts">
  import { onMount } from 'svelte';
  import type { AnyCartItem, BundleConfig } from '../../types/cart';
  import {
    cartItems,
    isCartEmpty,
    initializeCart,
    subscribeToCartChanges,
    isBundleCartItem,
  } from '../../stores/cart';
  import CartItem from './CartItem.svelte';
  import BundleCartItem from './BundleCartItem.svelte';

  interface Props {
    bundleConfigs?: BundleConfig[];
  }

  let { bundleConfigs = [] }: Props = $props();

  let items = $state<AnyCartItem[]>([]);
  let empty = $state(true);

  onMount(() => {
    initializeCart();
    subscribeToCartChanges();

    const unsubItems = cartItems.subscribe((value) => {
      items = [...value];
    });

    const unsubEmpty = isCartEmpty.subscribe((value) => {
      empty = value;
    });

    return () => {
      unsubItems();
      unsubEmpty();
    };
  });
</script>

<div class="cart-list">
  {#if empty}
    <div class="cart-empty">
      <svg class="cart-empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
      </svg>
      <h2 class="cart-empty-title">Coșul tău este gol</h2>
      <p class="cart-empty-text">
        Descoperă selecția noastră de vinuri și adaugă produsele preferate în coș.
      </p>
      <a href="/shop" class="cart-empty-link">
        Explorează produsele
      </a>
    </div>
  {:else}
    <div class="cart-items">
      {#each items as item (item.id + item.type)}
        {#if isBundleCartItem(item)}
          <BundleCartItem {item} {bundleConfigs} />
        {:else}
          <CartItem {item} />
        {/if}
      {/each}
    </div>
  {/if}
</div>

<style>
  /* Styles are in global.css for SSR compatibility */
</style>
