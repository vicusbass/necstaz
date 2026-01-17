<script lang="ts">
  import { incrementWineQuantity, decrementWineQuantity, setWineQuantity } from '../../stores/bundleConfigurator';
  import { formatPrice } from '../../stores/cart';

  interface Props {
    productId: string;
    productName: string;
    basePrice: number;
    discountPercent: number;
    quantity: number;
    image?: string;
  }

  let { productId, productName, basePrice, discountPercent, quantity, image }: Props = $props();

  const discountedPrice = $derived(basePrice * (1 - discountPercent / 100));
  const lineTotal = $derived(discountedPrice * quantity);

  function increment() {
    incrementWineQuantity(productId);
  }

  function decrement() {
    decrementWineQuantity(productId);
  }

  function handleInputChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const value = parseInt(input.value, 10);
    if (!isNaN(value) && value >= 0) {
      setWineQuantity(productId, value);
    } else if (input.value === '') {
      setWineQuantity(productId, 0);
    }
  }

  function handleInputBlur(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.value === '' || isNaN(parseInt(input.value, 10))) {
      setWineQuantity(productId, 0);
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    // Allow: backspace, delete, tab, escape, enter, arrows
    if (
      event.key === 'Backspace' ||
      event.key === 'Delete' ||
      event.key === 'Tab' ||
      event.key === 'Escape' ||
      event.key === 'Enter' ||
      event.key === 'ArrowLeft' ||
      event.key === 'ArrowRight'
    ) {
      return;
    }
    // Block non-numeric keys
    if (!/^\d$/.test(event.key)) {
      event.preventDefault();
    }
  }
</script>

<article class="bundle-wine-item">
  <div class="bundle-wine-image">
    {#if image}
      <img src={image} alt={productName} />
    {:else}
      <div class="bundle-wine-placeholder">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
    {/if}
  </div>

  <div class="bundle-wine-details">
    <div class="bundle-wine-info">
      <h3 class="bundle-wine-name">{productName}</h3>
      <div class="bundle-wine-pricing">
        <span class="bundle-wine-original-price">{formatPrice(basePrice)}</span>
        <span class="bundle-wine-discount-badge">-{discountPercent}%</span>
        <span class="bundle-wine-discounted-price">{formatPrice(discountedPrice)}</span>
      </div>
    </div>

    <div class="bundle-wine-controls">
      <div class="quantity-control">
        <button
          class="quantity-btn"
          onclick={decrement}
          disabled={quantity === 0}
          aria-label="Scade cantitatea"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M5 12h14" />
          </svg>
        </button>
        <input
          type="text"
          inputmode="numeric"
          class="quantity-input"
          value={quantity}
          oninput={handleInputChange}
          onblur={handleInputBlur}
          onkeydown={handleKeydown}
          aria-label="Cantitate"
        />
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

      {#if quantity > 0}
        <div class="bundle-wine-line-total">
          {formatPrice(lineTotal)}
        </div>
      {/if}
    </div>
  </div>
</article>

<style>
  .bundle-wine-item {
    display: flex;
    gap: 1rem;
    padding: 1rem 0;
    border-bottom: 1px solid #f2f2f2;
  }

  .bundle-wine-item:last-child {
    border-bottom: none;
  }

  .bundle-wine-image {
    width: 50px;
    height: 75px;
    flex-shrink: 0;
    background: #f8f8f8;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }

  .bundle-wine-image img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  .bundle-wine-placeholder {
    width: 1.5rem;
    height: 1.5rem;
    color: #909090;
  }

  .bundle-wine-placeholder svg {
    width: 100%;
    height: 100%;
  }

  .bundle-wine-details {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .bundle-wine-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .bundle-wine-name {
    font-size: 0.9375rem;
    font-weight: 600;
    color: #000;
    margin: 0;
  }

  .bundle-wine-pricing {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .bundle-wine-original-price {
    font-size: 0.75rem;
    color: #909090;
    text-decoration: line-through;
  }

  .bundle-wine-discount-badge {
    font-size: 0.6875rem;
    font-weight: 600;
    color: #059669;
    background: #d1fae5;
    padding: 0.125rem 0.375rem;
    border-radius: 2px;
  }

  .bundle-wine-discounted-price {
    font-size: 0.875rem;
    font-weight: 600;
    color: #000;
  }

  .bundle-wine-controls {
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

  .quantity-btn:hover:not(:disabled) {
    background: #f2f2f2;
  }

  .quantity-btn:disabled {
    color: #d1d5db;
    cursor: not-allowed;
  }

  .quantity-btn svg {
    width: 0.875rem;
    height: 0.875rem;
  }

  .quantity-input {
    width: 3rem;
    text-align: center;
    font-size: 0.875rem;
    font-weight: 500;
    border: none;
    background: transparent;
    padding: 0;
    margin: 0;
    -moz-appearance: textfield;
  }

  .quantity-input::-webkit-outer-spin-button,
  .quantity-input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  .quantity-input:focus {
    outline: none;
    background: #f8f8f8;
  }

  .bundle-wine-line-total {
    font-size: 0.875rem;
    font-weight: 600;
    color: #000;
  }

  @media (min-width: 1024px) {
    .bundle-wine-item {
      gap: 1.25rem;
      padding: 1.25rem 0;
    }

    .bundle-wine-image {
      width: 60px;
      height: 90px;
    }

    .bundle-wine-name {
      font-size: 1rem;
    }

    .bundle-wine-discounted-price {
      font-size: 1rem;
    }

    .quantity-btn {
      width: 2.25rem;
      height: 2.25rem;
    }

    .quantity-input {
      width: 3.5rem;
      font-size: 1rem;
    }

    .bundle-wine-line-total {
      font-size: 1rem;
    }
  }
</style>
