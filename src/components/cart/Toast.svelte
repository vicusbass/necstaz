<script lang="ts">
  import { onMount } from 'svelte';
  import {
    toastMessage,
    toastVisible,
    hideToast,
    initializeCart,
    subscribeToCartChanges,
  } from '../../stores/cart';

  let message = $state<string | null>(null);
  let visible = $state(false);

  onMount(() => {
    initializeCart();
    subscribeToCartChanges();

    const unsubMessage = toastMessage.subscribe((value) => {
      message = value;
    });

    const unsubVisible = toastVisible.subscribe((value) => {
      visible = value;
    });

    return () => {
      unsubMessage();
      unsubVisible();
    };
  });
</script>

{#if message}
  <div
    class="toast-container"
    class:visible
    role="alert"
    aria-live="polite"
  >
    <div class="toast-content">
      <svg
        class="toast-icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <path d="M9 12l2 2 4-4" />
        <circle cx="12" cy="12" r="10" />
      </svg>
      <span class="toast-message">{message}</span>
      <button
        class="toast-close"
        onclick={hideToast}
        aria-label="Închide notificarea"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  </div>
{/if}

<style>
  .toast-container {
    position: fixed;
    bottom: 1.5rem;
    right: 1.5rem;
    z-index: 100;
    opacity: 0;
    transform: translateY(1rem);
    transition: all 0.3s ease-out;
    pointer-events: none;
  }

  .toast-container.visible {
    opacity: 1;
    transform: translateY(0);
    pointer-events: auto;
  }

  .toast-content {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem 1.25rem;
    background: #63fd82;
    color: #000;
    border-radius: 0;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    min-width: 280px;
    max-width: 400px;
  }

  .toast-icon {
    width: 1.25rem;
    height: 1.25rem;
    flex-shrink: 0;
    color: #e6c46c;
  }

  .toast-message {
    flex: 1;
    font-size: 0.9375rem;
    line-height: 1.4;
  }

  .toast-close {
    flex-shrink: 0;
    width: 1.5rem;
    height: 1.5rem;
    padding: 0.25rem;
    background: transparent;
    border: none;
    color: #909090;
    cursor: pointer;
    transition: color 0.2s;
  }

  .toast-close:hover {
    color: #fff;
  }

  .toast-close svg {
    width: 100%;
    height: 100%;
  }

  @media (max-width: 480px) {
    .toast-container {
      left: 1rem;
      right: 1rem;
      bottom: 1rem;
    }

    .toast-content {
      min-width: 0;
      max-width: none;
    }
  }
</style>
