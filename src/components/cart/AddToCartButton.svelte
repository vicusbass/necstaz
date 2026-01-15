<script lang="ts">
  import { onMount } from 'svelte';
  import type { CartItemType } from '../../types/cart';
  import {
    addToCart,
    showToast,
    initializeCart,
    subscribeToCartChanges,
  } from '../../stores/cart';

  interface Props {
    productId: string;
    productName: string;
    productPrice: number;
    itemType: CartItemType;
    image?: string;
    buttonText?: string;
    class?: string;
  }

  let {
    productId,
    productName,
    productPrice,
    itemType,
    image,
    buttonText = 'Adaugă în coș',
    class: className = '',
  }: Props = $props();

  let isAdding = $state(false);

  onMount(() => {
    initializeCart();
    subscribeToCartChanges();
  });

  function handleClick() {
    if (isAdding) return;

    isAdding = true;

    addToCart({
      id: productId,
      type: itemType,
      name: productName,
      price: productPrice,
      image,
    });

    showToast(`${productName} a fost adăugat în coș`);

    // Reset after brief delay for visual feedback
    setTimeout(() => {
      isAdding = false;
    }, 300);
  }
</script>

<button
  class="btn-add-to-cart {className}"
  class:adding={isAdding}
  onclick={handleClick}
  disabled={isAdding}
  aria-label="Adaugă {productName} în coș"
>
  {#if isAdding}
    <span class="loading-text">Se adaugă...</span>
  {:else}
    {buttonText}
  {/if}
</button>

<style>
  .btn-add-to-cart {
    position: relative;
    width: max-content;
    cursor: pointer;
    border: none;
    background: #000;
    padding: 0.75rem 3rem;
    font-size: 1rem;
    font-weight: 500;
    color: #fff;
    transition: all 0.2s;
  }

  .btn-add-to-cart:hover:not(:disabled) {
    background: #262626;
  }

  .btn-add-to-cart:active:not(:disabled) {
    transform: scale(0.98);
  }

  .btn-add-to-cart:disabled {
    cursor: not-allowed;
  }

  .btn-add-to-cart.adding {
    background: #262626;
  }

  .loading-text {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
  }

  @media (min-width: 1024px) {
    .btn-add-to-cart {
      padding: 0.875rem 3.5rem;
    }
  }
</style>
