<script lang="ts">
  import { onMount } from 'svelte';
  import {
    cartTotal,
    cartCount,
    isCartEmpty,
    formatPrice,
    initializeCart,
    subscribeToCartChanges,
  } from '../../stores/cart';

  let total = $state(0);
  let count = $state(0);
  let empty = $state(true);

  onMount(() => {
    initializeCart();
    subscribeToCartChanges();

    const unsubTotal = cartTotal.subscribe((value) => {
      total = value;
    });

    const unsubCount = cartCount.subscribe((value) => {
      count = value;
    });

    const unsubEmpty = isCartEmpty.subscribe((value) => {
      empty = value;
    });

    return () => {
      unsubTotal();
      unsubCount();
      unsubEmpty();
    };
  });
</script>

<div class="cart-summary">
  <div class="summary-row">
    <span class="summary-label">Subtotal ({count} {count === 1 ? 'produs' : 'produse'})</span>
    <span class="summary-value">{formatPrice(total)}</span>
  </div>

  <div class="summary-row summary-row-total">
    <span class="summary-label">Total</span>
    <span class="summary-value">{formatPrice(total)}</span>
  </div>

  <a
    href="/checkout"
    class="checkout-button"
    class:disabled={empty}
    aria-disabled={empty}
  >
    Cumpără
  </a>

  <p class="summary-note">
    Costul livrării va fi confirmat prin email
  </p>
</div>

<style>
  .cart-summary {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1.5rem;
    background: #f8f8f8;
  }

  .summary-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .summary-label {
    font-size: 0.875rem;
    color: #6e6e6e;
  }

  .summary-value {
    font-size: 0.875rem;
    font-weight: 500;
    color: #000;
  }

  .summary-row-total {
    padding-top: 1rem;
    border-top: 1px solid #e5e5e5;
  }

  .summary-row-total .summary-label {
    font-size: 1rem;
    font-weight: 600;
    color: #000;
  }

  .summary-row-total .summary-value {
    font-size: 1.25rem;
    font-weight: 700;
  }

  .checkout-button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    padding: 1rem;
    background: #000;
    color: #fff;
    font-size: 1rem;
    font-weight: 500;
    text-decoration: none;
    transition: background 0.2s;
    margin-top: 0.5rem;
  }

  .checkout-button:hover:not(.disabled) {
    background: #262626;
  }

  .checkout-button.disabled {
    background: #909090;
    cursor: not-allowed;
    pointer-events: none;
  }

  .summary-note {
    font-size: 0.75rem;
    color: #909090;
    text-align: center;
    margin: 0;
  }

  @media (min-width: 1024px) {
    .cart-summary {
      padding: 2rem;
    }

    .summary-label {
      font-size: 1rem;
    }

    .summary-value {
      font-size: 1rem;
    }

    .summary-row-total .summary-label {
      font-size: 1.125rem;
    }

    .summary-row-total .summary-value {
      font-size: 1.5rem;
    }
  }
</style>
