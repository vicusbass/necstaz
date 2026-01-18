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
