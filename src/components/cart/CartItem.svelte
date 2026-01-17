<script lang="ts">
  import type { CartItem } from '../../types/cart';
  import { updateQuantity, removeFromCart, formatPrice } from '../../stores/cart';
  import { SGR_DEPOSIT, PACKAGE_BOTTLE_COUNT } from '../../config';

  interface Props {
    item: CartItem;
  }

  let { item }: Props = $props();

  function increment() {
    updateQuantity(item.id, item.type, item.quantity + 1);
  }

  function decrement() {
    if (item.quantity > 1) {
      updateQuantity(item.id, item.type, item.quantity - 1);
    } else {
      removeFromCart(item.id, item.type);
    }
  }

  function remove() {
    removeFromCart(item.id, item.type);
  }

  const lineTotal = $derived(item.price * item.quantity);
  const isProduct = $derived(item.type === 'product');
  const isPackage = $derived(item.type === 'package');
  const hasBottles = $derived(isProduct || isPackage);
  // Products have 1 bottle, packages have 4 bottles
  const bottleMultiplier = $derived(isPackage ? PACKAGE_BOTTLE_COUNT : 1);
  const sgrAmount = $derived(hasBottles ? SGR_DEPOSIT * item.quantity * bottleMultiplier : 0);
</script>

<article class="cart-item">
  <div class="cart-item-image">
    {#if item.image}
      <img src={item.image} alt={item.name} />
    {:else}
      <div class="cart-item-placeholder">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
    {/if}
  </div>

  <div class="cart-item-details">
    <div class="cart-item-info">
      <h3 class="cart-item-name">{item.name}</h3>
    </div>

    <div class="cart-item-controls">
      <div class="quantity-control">
        <button
          class="quantity-btn"
          onclick={decrement}
          aria-label="Scade cantitatea"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M5 12h14" />
          </svg>
        </button>
        <span class="quantity-value">{item.quantity}</span>
        <button
          class="quantity-btn"
          onclick={increment}
          aria-label="Crește cantitatea"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      </div>

      <div class="cart-item-price">
        <span class="price-value">{formatPrice(lineTotal)}</span>
        <span class="price-unit">{formatPrice(item.price)} / buc</span>
        {#if hasBottles}
          <span class="price-sgr">Garanție: {formatPrice(sgrAmount)}</span>
        {/if}
      </div>
    </div>
  </div>

  <button
    class="cart-item-remove"
    onclick={remove}
    aria-label="Elimină {item.name} din coș"
  >
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M6 18L18 6M6 6l12 12" />
    </svg>
  </button>
</article>

<style>
  /* Styles are in global.css for SSR compatibility */
</style>
