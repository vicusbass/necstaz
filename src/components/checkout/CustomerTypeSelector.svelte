<script lang="ts">
  import type { CustomerType } from '../../types/cart';

  interface Props {
    value: CustomerType;
    onchange: (type: CustomerType) => void;
  }

  let { value, onchange }: Props = $props();

  function select(type: CustomerType) {
    onchange(type);
  }
</script>

<div class="customer-type-selector">
  <p class="selector-label">Tip client</p>
  <div class="selector-buttons">
    <button
      type="button"
      class="selector-btn"
      class:active={value === 'person'}
      onclick={() => select('person')}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
      </svg>
      <span>Persoană fizică</span>
    </button>
    <button
      type="button"
      class="selector-btn"
      class:active={value === 'company'}
      onclick={() => select('company')}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
      </svg>
      <span>Persoană juridică</span>
    </button>
  </div>
</div>

<style>
  .customer-type-selector {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .selector-label {
    font-size: 0.875rem;
    font-weight: 500;
    color: #000;
    margin: 0;
  }

  .selector-buttons {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
  }

  .selector-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    padding: 1.25rem 1rem;
    background: #fff;
    border: 2px solid #e5e5e5;
    cursor: pointer;
    transition: all 0.2s;
  }

  .selector-btn:hover {
    border-color: #000;
  }

  .selector-btn.active {
    border-color: #000;
    background: #f8f8f8;
  }

  .selector-btn svg {
    width: 1.5rem;
    height: 1.5rem;
    color: #6e6e6e;
  }

  .selector-btn.active svg {
    color: #000;
  }

  .selector-btn span {
    font-size: 0.875rem;
    font-weight: 500;
    color: #6e6e6e;
  }

  .selector-btn.active span {
    color: #000;
  }

  @media (min-width: 1024px) {
    .selector-btn {
      flex-direction: row;
      padding: 1rem 1.5rem;
    }

    .selector-btn svg {
      width: 1.25rem;
      height: 1.25rem;
    }
  }
</style>
