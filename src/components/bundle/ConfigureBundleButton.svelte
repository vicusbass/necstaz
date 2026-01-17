<script lang="ts">
  import { openConfigurator } from '../../stores/bundleConfigurator';
  import type { BundleConfig } from '../../types/cart';

  interface Props {
    bundleConfig: BundleConfig;
  }

  let { bundleConfig }: Props = $props();

  function handleClick() {
    openConfigurator(bundleConfig);
  }
</script>

<button class="btn-add-to-cart" onclick={handleClick}>
  Configurează
</button>

<style>
  .btn-add-to-cart {
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

  .btn-add-to-cart:hover {
    background: #262626;
  }

  .btn-add-to-cart:active {
    transform: scale(0.98);
  }

  @media (min-width: 1024px) {
    .btn-add-to-cart {
      padding: 0.875rem 3.5rem;
    }
  }
</style>
