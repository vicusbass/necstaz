<script lang="ts">
  import { onMount } from 'svelte';
  import type { CartItem as CartItemType } from '../../types/cart';
  import {
    cartItems,
    isCartEmpty,
    initializeCart,
    subscribeToCartChanges,
  } from '../../stores/cart';
  import CartItem from './CartItem.svelte';

  let items = $state<CartItemType[]>([]);
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
        <CartItem {item} />
      {/each}
    </div>
  {/if}
</div>

<style>
  .cart-list {
    width: 100%;
  }

  .cart-items {
    display: flex;
    flex-direction: column;
  }

  .cart-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 3rem 1.5rem;
    gap: 1rem;
  }

  .cart-empty-icon {
    width: 4rem;
    height: 4rem;
    color: #909090;
  }

  .cart-empty-title {
    font-size: 1.5rem;
    font-weight: 700;
    color: #000;
    margin: 0;
  }

  .cart-empty-text {
    font-size: 1rem;
    color: #6e6e6e;
    max-width: 300px;
    margin: 0;
    line-height: 1.5;
  }

  .cart-empty-link {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.875rem 2rem;
    background: #000;
    color: #fff;
    font-size: 1rem;
    font-weight: 500;
    text-decoration: none;
    transition: background 0.2s;
    margin-top: 0.5rem;
  }

  .cart-empty-link:hover {
    background: #262626;
  }

  @media (min-width: 1024px) {
    .cart-empty {
      padding: 4rem 2rem;
    }

    .cart-empty-icon {
      width: 5rem;
      height: 5rem;
    }

    .cart-empty-title {
      font-size: 2rem;
    }

    .cart-empty-text {
      font-size: 1.125rem;
      max-width: 400px;
    }
  }
</style>
