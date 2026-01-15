<script lang="ts">
  import type { CartItem } from '../../types/cart';
  import { updateQuantity, removeFromCart, formatPrice } from '../../stores/cart';
  import { SGR_DEPOSIT } from '../../config';

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
  const sgrAmount = $derived(isProduct ? SGR_DEPOSIT * item.quantity : 0);
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
      <p class="cart-item-type">
        {#if item.type === 'product'}
          Produs
        {:else if item.type === 'bundle'}
          Pachet
        {:else}
          Abonament
        {/if}
      </p>
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
        {#if item.quantity > 1}
          <span class="price-unit">{formatPrice(item.price)} / buc</span>
        {/if}
        {#if isProduct}
          <span class="price-sgr">Garanție SGR: {formatPrice(sgrAmount)}</span>
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
  .cart-item {
    display: flex;
    gap: 1rem;
    padding: 1.5rem 0;
    border-bottom: 1px solid #f2f2f2;
  }

  .cart-item:last-child {
    border-bottom: none;
  }

  .cart-item-image {
    width: 80px;
    height: 80px;
    flex-shrink: 0;
    background: #f8f8f8;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }

  .cart-item-image img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  .cart-item-placeholder {
    width: 2rem;
    height: 2rem;
    color: #909090;
  }

  .cart-item-placeholder svg {
    width: 100%;
    height: 100%;
  }

  .cart-item-details {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .cart-item-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .cart-item-name {
    font-size: 1rem;
    font-weight: 600;
    color: #000;
    margin: 0;
  }

  .cart-item-type {
    font-size: 0.75rem;
    color: #909090;
    margin: 0;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .cart-item-controls {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
  }

  .quantity-control {
    display: flex;
    align-items: center;
    gap: 0;
    border: 1px solid #e5e5e5;
  }

  .quantity-btn {
    width: 2rem;
    height: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    cursor: pointer;
    color: #000;
    transition: background 0.2s;
  }

  .quantity-btn:hover {
    background: #f2f2f2;
  }

  .quantity-btn svg {
    width: 0.875rem;
    height: 0.875rem;
  }

  .quantity-value {
    min-width: 2.5rem;
    text-align: center;
    font-size: 0.875rem;
    font-weight: 500;
  }

  .cart-item-price {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.125rem;
  }

  .price-value {
    font-size: 1rem;
    font-weight: 600;
    color: #000;
  }

  .price-unit {
    font-size: 0.75rem;
    color: #909090;
  }

  .price-sgr {
    font-size: 0.75rem;
    color: #909090;
  }

  .cart-item-remove {
    width: 2rem;
    height: 2rem;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    cursor: pointer;
    color: #909090;
    transition: color 0.2s;
    align-self: flex-start;
  }

  .cart-item-remove:hover {
    color: #dc2626;
  }

  .cart-item-remove svg {
    width: 1.25rem;
    height: 1.25rem;
  }

  @media (min-width: 1024px) {
    .cart-item {
      gap: 1.5rem;
      padding: 2rem 0;
    }

    .cart-item-image {
      width: 120px;
      height: 120px;
    }

    .cart-item-name {
      font-size: 1.125rem;
    }

    .cart-item-controls {
      flex-direction: row;
    }

    .quantity-btn {
      width: 2.5rem;
      height: 2.5rem;
    }

    .quantity-value {
      min-width: 3rem;
      font-size: 1rem;
    }

    .price-value {
      font-size: 1.125rem;
    }
  }
</style>
