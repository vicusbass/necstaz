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

  let state = $state({
    isOpen: false,
    bundleConfig: null,
    selections: {},
    editingBundleId: null,
  } as BundleConfiguratorState);
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
