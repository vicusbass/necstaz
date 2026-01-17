<script lang="ts">
  import type { BundleCartItem, BundleConfig } from '../../types/cart';
  import { removeFromCart, formatPrice } from '../../stores/cart';
  import { editBundle } from '../../stores/bundleConfigurator';
  import { SGR_DEPOSIT } from '../../config';

  interface Props {
    item: BundleCartItem;
    bundleConfigs: BundleConfig[];
  }

  let { item, bundleConfigs }: Props = $props();

  function handleRemove() {
    removeFromCart(item.id, 'bundle');
  }

  function handleEdit() {
    // Find the matching bundle config
    const bundleConfig = bundleConfigs.find((b) => b.slug === item.bundleSlug);
    if (bundleConfig) {
      editBundle(item.id, bundleConfig, item.selections);
    }
  }

  // Calculate total SGR for all bottles in the bundle
  const totalSgr = $derived(item.bottleCount * SGR_DEPOSIT);
</script>

<article class="bundle-cart-item">
  <div class="bundle-cart-header">
    <div class="bundle-cart-info">
      <h3 class="bundle-cart-name">{item.name}</h3>
      <span class="bundle-cart-bottles">{item.bottleCount} sticle</span>
    </div>
    <button
      class="bundle-cart-remove"
      onclick={handleRemove}
      aria-label="Elimină {item.name} din coș"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  </div>

  <div class="bundle-cart-wines">
    {#each item.selections as wine (wine.productId)}
      <div class="bundle-cart-wine">
        <div class="bundle-cart-wine-info">
          <span class="bundle-cart-wine-name">{wine.productName}</span>
          <span class="bundle-cart-wine-qty">x{wine.quantity}</span>
        </div>
        <div class="bundle-cart-wine-pricing">
          <span class="bundle-cart-wine-price">
            {formatPrice(wine.discountedPrice * wine.quantity)}
          </span>
          <span class="bundle-cart-wine-sgr">
            SGR: {formatPrice(wine.quantity * SGR_DEPOSIT)}
          </span>
        </div>
      </div>
    {/each}
  </div>

  <div class="bundle-cart-footer">
    <div class="bundle-cart-totals">
      <div class="bundle-cart-subtotal">
        <span>Subtotal:</span>
        <span>{formatPrice(item.totalPrice)}</span>
      </div>
      <div class="bundle-cart-sgr">
        <span>Garanție SGR ({item.bottleCount} sticle):</span>
        <span>{formatPrice(totalSgr)}</span>
      </div>
      <div class="bundle-cart-total">
        <span>Total pachet:</span>
        <span>{formatPrice(item.totalPrice + totalSgr)}</span>
      </div>
    </div>
    <button class="bundle-cart-edit" onclick={handleEdit}>
      Editează
    </button>
  </div>
</article>

<style>
  .bundle-cart-item {
    display: flex;
    flex-direction: column;
    padding: 1.5rem 0;
    border-bottom: 1px solid #f2f2f2;
  }

  .bundle-cart-item:last-child {
    border-bottom: none;
  }

  .bundle-cart-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1rem;
  }

  .bundle-cart-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .bundle-cart-name {
    font-size: 1rem;
    font-weight: 600;
    color: #000;
    margin: 0;
  }

  .bundle-cart-bottles {
    font-size: 0.75rem;
    color: #909090;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .bundle-cart-remove {
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
  }

  .bundle-cart-remove:hover {
    color: #dc2626;
  }

  .bundle-cart-remove svg {
    width: 1.25rem;
    height: 1.25rem;
  }

  .bundle-cart-wines {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 0.75rem;
    background: #f8f8f8;
    margin-bottom: 1rem;
  }

  .bundle-cart-wine {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1rem;
  }

  .bundle-cart-wine-info {
    display: flex;
    gap: 0.5rem;
    align-items: baseline;
  }

  .bundle-cart-wine-name {
    font-size: 0.875rem;
    color: #000;
  }

  .bundle-cart-wine-qty {
    font-size: 0.75rem;
    color: #909090;
  }

  .bundle-cart-wine-pricing {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.125rem;
  }

  .bundle-cart-wine-price {
    font-size: 0.875rem;
    font-weight: 500;
    color: #000;
  }

  .bundle-cart-wine-sgr {
    font-size: 0.6875rem;
    color: #909090;
  }

  .bundle-cart-footer {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .bundle-cart-totals {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .bundle-cart-subtotal,
  .bundle-cart-sgr {
    display: flex;
    justify-content: space-between;
    font-size: 0.75rem;
    color: #6e6e6e;
  }

  .bundle-cart-total {
    display: flex;
    justify-content: space-between;
    font-size: 1rem;
    font-weight: 600;
    color: #000;
    padding-top: 0.5rem;
    border-top: 1px solid #e5e5e5;
    margin-top: 0.25rem;
  }

  .bundle-cart-edit {
    align-self: flex-start;
    padding: 0.5rem 1rem;
    background: transparent;
    border: 1px solid #e5e5e5;
    color: #6e6e6e;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .bundle-cart-edit:hover {
    background: #f2f2f2;
    color: #000;
    border-color: #000;
  }

  @media (min-width: 1024px) {
    .bundle-cart-item {
      padding: 2rem 0;
    }

    .bundle-cart-name {
      font-size: 1.125rem;
    }

    .bundle-cart-wines {
      padding: 1rem;
    }

    .bundle-cart-wine-name {
      font-size: 1rem;
    }

    .bundle-cart-wine-price {
      font-size: 1rem;
    }

    .bundle-cart-total {
      font-size: 1.125rem;
    }
  }
</style>
