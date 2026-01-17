<script lang="ts">
  import { onMount } from 'svelte';
  import {
    configuratorState,
    closeConfigurator,
    totalBottlesSelected,
    isConfigurationValid,
    bottlesRemaining,
    selectionTotalPrice,
    buildBundleCartItem,
    type BundleConfiguratorState,
  } from '../../stores/bundleConfigurator';
  import { addBundleToCart, updateBundleInCart, showToast, formatPrice } from '../../stores/cart';
  import BundleWineItem from './BundleWineItem.svelte';

  let state = $state<BundleConfiguratorState>({
    isOpen: false,
    bundleConfig: null,
    selections: {},
    editingBundleId: null,
  });
  let totalBottles = $state(0);
  let isValid = $state(false);
  let remaining = $state(0);
  let totalPrice = $state(0);

  onMount(() => {
    const unsubState = configuratorState.subscribe((value) => {
      state = value;
    });
    const unsubTotal = totalBottlesSelected.subscribe((value) => {
      totalBottles = value;
    });
    const unsubValid = isConfigurationValid.subscribe((value) => {
      isValid = value;
    });
    const unsubRemaining = bottlesRemaining.subscribe((value) => {
      remaining = value;
    });
    const unsubPrice = selectionTotalPrice.subscribe((value) => {
      totalPrice = value;
    });

    return () => {
      unsubState();
      unsubTotal();
      unsubValid();
      unsubRemaining();
      unsubPrice();
    };
  });

  function handleCancel() {
    closeConfigurator();
  }

  function handleContinue() {
    const bundleCartItem = buildBundleCartItem();
    if (!bundleCartItem) return;

    if (state.editingBundleId) {
      // Editing existing bundle
      updateBundleInCart(state.editingBundleId, bundleCartItem.selections);
      showToast('Pachetul a fost actualizat');
    } else {
      // Adding new bundle
      addBundleToCart(bundleCartItem);
      showToast(`${bundleCartItem.name} a fost adăugat în coș`);
    }

    closeConfigurator();
  }

  function handleBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      closeConfigurator();
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      closeConfigurator();
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if state.isOpen && state.bundleConfig}
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <div
    class="bundle-configurator-overlay"
    onclick={handleBackdropClick}
    onkeydown={handleKeydown}
    role="dialog"
    aria-modal="true"
    aria-labelledby="configurator-title"
    tabindex="-1"
  >
    <div class="bundle-configurator-modal">
      <header class="bundle-configurator-header">
        <h2 id="configurator-title" class="bundle-configurator-title">
          {state.bundleConfig.name}
        </h2>
        <button
          class="bundle-configurator-close"
          onclick={handleCancel}
          aria-label="Închide"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </header>

      <div class="bundle-configurator-content">
        <p class="bundle-configurator-description">
          {state.bundleConfig.description}
        </p>

        <div class="bundle-configurator-wines">
          {#each state.bundleConfig.wineDiscounts as wine (wine.productId)}
            <BundleWineItem
              productId={wine.productId}
              productName={wine.productName}
              basePrice={wine.basePrice}
              discountPercent={wine.discountPercent}
              quantity={state.selections[wine.productId] || 0}
              image={wine.image}
            />
          {/each}
        </div>
      </div>

      <footer class="bundle-configurator-footer">
        <div class="bundle-configurator-summary">
          <div class="bundle-bottles-counter">
            <span class="bundle-bottles-label">Sticle selectate:</span>
            <span class="bundle-bottles-value" class:complete={isValid} class:incomplete={!isValid}>
              {totalBottles} / {state.bundleConfig.bottleCount}
            </span>
          </div>
          {#if remaining > 0}
            <span class="bundle-bottles-remaining">
              Mai adaugă {remaining} {remaining === 1 ? 'sticlă' : 'sticle'}
            </span>
          {/if}
          {#if totalBottles > 0}
            <div class="bundle-total-price">
              <span class="bundle-total-label">Total:</span>
              <span class="bundle-total-value">{formatPrice(totalPrice)}</span>
            </div>
          {/if}
        </div>

        <div class="bundle-configurator-actions">
          <button
            class="bundle-btn-cancel"
            onclick={handleCancel}
          >
            Anulează
          </button>
          <button
            class="bundle-btn-continue"
            onclick={handleContinue}
            disabled={!isValid}
          >
            Mai Departe
          </button>
        </div>
      </footer>
    </div>
  </div>
{/if}

<style>
  .bundle-configurator-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
    padding: 0;
  }

  .bundle-configurator-modal {
    background: #fff;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .bundle-configurator-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 1.5rem;
    border-bottom: 1px solid #f2f2f2;
    flex-shrink: 0;
  }

  .bundle-configurator-title {
    font-size: 1.25rem;
    font-weight: 700;
    color: #000;
    margin: 0;
  }

  .bundle-configurator-close {
    width: 2.5rem;
    height: 2.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    cursor: pointer;
    color: #6e6e6e;
    transition: color 0.2s;
  }

  .bundle-configurator-close:hover {
    color: #000;
  }

  .bundle-configurator-close svg {
    width: 1.5rem;
    height: 1.5rem;
  }

  .bundle-configurator-content {
    flex: 1;
    overflow-y: auto;
    padding: 1.5rem;
  }

  .bundle-configurator-description {
    font-size: 0.875rem;
    color: #6e6e6e;
    line-height: 1.5;
    margin: 0 0 1.5rem 0;
  }

  .bundle-configurator-wines {
    display: flex;
    flex-direction: column;
  }

  .bundle-configurator-footer {
    padding: 1rem 1.5rem;
    border-top: 1px solid #f2f2f2;
    background: #f8f8f8;
    flex-shrink: 0;
  }

  .bundle-configurator-summary {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .bundle-bottles-counter {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .bundle-bottles-label {
    font-size: 0.875rem;
    color: #6e6e6e;
  }

  .bundle-bottles-value {
    font-size: 1rem;
    font-weight: 700;
  }

  .bundle-bottles-value.complete {
    color: #059669;
  }

  .bundle-bottles-value.incomplete {
    color: #000;
  }

  .bundle-bottles-remaining {
    font-size: 0.75rem;
    color: #dc2626;
  }

  .bundle-total-price {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-top: 0.5rem;
    border-top: 1px solid #e5e5e5;
    margin-top: 0.25rem;
  }

  .bundle-total-label {
    font-size: 1rem;
    font-weight: 600;
    color: #000;
  }

  .bundle-total-value {
    font-size: 1.25rem;
    font-weight: 700;
    color: #000;
  }

  .bundle-configurator-actions {
    display: flex;
    gap: 1rem;
  }

  .bundle-btn-cancel {
    flex: 1;
    padding: 0.875rem 1rem;
    background: transparent;
    border: 1px solid #e5e5e5;
    color: #6e6e6e;
    font-size: 1rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .bundle-btn-cancel:hover {
    background: #f2f2f2;
    color: #000;
  }

  .bundle-btn-continue {
    flex: 1;
    padding: 0.875rem 1rem;
    background: #000;
    border: none;
    color: #fff;
    font-size: 1rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .bundle-btn-continue:hover:not(:disabled) {
    background: #262626;
  }

  .bundle-btn-continue:disabled {
    background: #909090;
    cursor: not-allowed;
  }

  @media (min-width: 1024px) {
    .bundle-configurator-overlay {
      padding: 2rem;
    }

    .bundle-configurator-modal {
      max-width: 600px;
      max-height: 90vh;
      height: auto;
      border-radius: 8px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    }

    .bundle-configurator-header {
      padding: 1.5rem 2rem;
    }

    .bundle-configurator-title {
      font-size: 1.5rem;
    }

    .bundle-configurator-content {
      padding: 2rem;
    }

    .bundle-configurator-description {
      font-size: 1rem;
    }

    .bundle-configurator-footer {
      padding: 1.5rem 2rem;
    }

    .bundle-total-value {
      font-size: 1.5rem;
    }
  }
</style>
