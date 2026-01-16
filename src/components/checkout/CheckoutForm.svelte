<script lang="ts">
  import { onMount } from 'svelte';
  import type {
    CustomerType,
    PersonCustomer,
    CompanyCustomer,
    Address,
    CartItem,
  } from '../../types/cart';
  import {
    cartItems,
    cartTotal,
    cartSubtotal,
    sgrTotal,
    bottleCount,
    formatPrice,
    initializeCart,
    subscribeToCartChanges,
  } from '../../stores/cart';
  import CustomerTypeSelector from './CustomerTypeSelector.svelte';
  import PersonForm from './PersonForm.svelte';
  import CompanyForm from './CompanyForm.svelte';

  interface Props {
    shippingPrice: number;
    freeShippingThreshold: number;
  }

  let { shippingPrice, freeShippingThreshold }: Props = $props();

  const emptyAddress: Address = {
    street: '',
    city: '',
    county: '',
    postalCode: '',
    country: 'România',
  };

  let customerType = $state<CustomerType>('person');
  let personCustomer = $state<PersonCustomer>({
    type: 'person',
    email: '',
    phone: '',
    firstName: '',
    lastName: '',
    deliveryAddress: { ...emptyAddress },
    billingAddress: { ...emptyAddress },
    sameAddress: true,
  });
  let companyCustomer = $state<CompanyCustomer>({
    type: 'company',
    email: '',
    phone: '',
    companyName: '',
    cui: '',
    contactPerson: '',
    deliveryAddress: { ...emptyAddress },
    billingAddress: { ...emptyAddress },
    sameAddress: true,
  });

  let items = $state<CartItem[]>([]);
  let total = $state(0);
  let subtotal = $state(0);
  let sgr = $state(0);
  let bottles = $state(0);
  let isSubmitting = $state(false);
  let error = $state<string | null>(null);

  // Determine if free shipping applies (based on subtotal without SGR)
  const hasFreeShipping = $derived(subtotal >= freeShippingThreshold && freeShippingThreshold > 0);

  onMount(() => {
    initializeCart();
    subscribeToCartChanges();

    const unsubItems = cartItems.subscribe((value) => {
      items = [...value];
    });

    const unsubTotal = cartTotal.subscribe((value) => {
      total = value;
    });

    const unsubSubtotal = cartSubtotal.subscribe((value) => {
      subtotal = value;
    });

    const unsubSgr = sgrTotal.subscribe((value) => {
      sgr = value;
    });

    const unsubBottles = bottleCount.subscribe((value) => {
      bottles = value;
    });

    return () => {
      unsubItems();
      unsubTotal();
      unsubSubtotal();
      unsubSgr();
      unsubBottles();
    };
  });

  function isAddressValid(address: Address): boolean {
    return (
      address.street.trim() !== '' &&
      address.city.trim() !== '' &&
      address.county.trim() !== '' &&
      address.postalCode.trim() !== ''
    );
  }

  function isPersonFormValid(): boolean {
    const c = personCustomer;
    return (
      c.firstName.trim() !== '' &&
      c.lastName.trim() !== '' &&
      c.email.trim() !== '' &&
      c.phone.trim() !== '' &&
      isAddressValid(c.deliveryAddress) &&
      (c.sameAddress || isAddressValid(c.billingAddress))
    );
  }

  function isCompanyFormValid(): boolean {
    const c = companyCustomer;
    return (
      c.companyName.trim() !== '' &&
      c.cui.trim() !== '' &&
      c.contactPerson.trim() !== '' &&
      c.email.trim() !== '' &&
      c.phone.trim() !== '' &&
      isAddressValid(c.deliveryAddress) &&
      (c.sameAddress || isAddressValid(c.billingAddress))
    );
  }

  const isFormValid = $derived(
    items.length > 0 &&
      (customerType === 'person' ? isPersonFormValid() : isCompanyFormValid())
  );

  async function handleSubmit(e: Event) {
    e.preventDefault();

    if (!isFormValid || isSubmitting) return;

    isSubmitting = true;
    error = null;

    const customer = customerType === 'person' ? personCustomer : companyCustomer;

    try {
      const response = await fetch('/api/payment/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customer,
          cartItems: items,
        }),
      });

      const data = await response.json();

      if (data.success && data.paymentUrl) {
        // Redirect to Netopia payment page
        window.location.href = data.paymentUrl;
      } else {
        error = data.error || 'A apărut o eroare. Te rugăm să încerci din nou.';
      }
    } catch (err) {
      error = 'A apărut o eroare de rețea. Te rugăm să încerci din nou.';
    } finally {
      isSubmitting = false;
    }
  }

  function handleCustomerTypeChange(type: CustomerType) {
    customerType = type;
  }

  function handlePersonChange(customer: PersonCustomer) {
    personCustomer = customer;
  }

  function handleCompanyChange(customer: CompanyCustomer) {
    companyCustomer = customer;
  }
</script>

<form class="checkout-form" onsubmit={handleSubmit}>
  <div class="form-content">
    <CustomerTypeSelector
      value={customerType}
      onchange={handleCustomerTypeChange}
    />

    <div class="customer-form">
      {#if customerType === 'person'}
        <PersonForm customer={personCustomer} onchange={handlePersonChange} />
      {:else}
        <CompanyForm customer={companyCustomer} onchange={handleCompanyChange} />
      {/if}
    </div>
  </div>

  <div class="form-footer">
    {#if error}
      <div class="error-message">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v4M12 16h.01" />
        </svg>
        <span>{error}</span>
      </div>
    {/if}

    <div class="order-summary">
      <div class="summary-row summary-row-sub">
        <span>Subtotal:</span>
        <span>{formatPrice(subtotal)}</span>
      </div>
      {#if bottles > 0}
        <div class="summary-row summary-row-sub">
          <span>Garanție SGR ({bottles} {bottles === 1 ? 'sticlă' : 'sticle'}):</span>
          <span>{formatPrice(sgr)}</span>
        </div>
      {/if}
      <div class="summary-row summary-row-sub">
        <span>Transport:</span>
        {#if hasFreeShipping}
          <span class="shipping-free-inline">Gratuit</span>
        {:else}
          <span>{formatPrice(shippingPrice)}</span>
        {/if}
      </div>
      <div class="summary-row summary-row-total">
        <span>{bottles > 0 ? 'Total comandă (incl. SGR):' : 'Total comandă:'}</span>
        <span class="summary-total">{formatPrice(total + (hasFreeShipping ? 0 : shippingPrice))}</span>
      </div>
    </div>

    <div class="shipping-info">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
      </svg>
      <div class="shipping-text">
        {#if freeShippingThreshold > 0 && !hasFreeShipping}
          <span class="shipping-threshold">Livrare gratuită pentru comenzi de peste {formatPrice(freeShippingThreshold)}</span>
        {:else if hasFreeShipping}
          <span class="shipping-free">Ai livrare gratuită!</span>
        {/if}
      </div>
    </div>

    <button
      type="submit"
      class="submit-button"
      disabled={!isFormValid || isSubmitting}
    >
      {#if isSubmitting}
        <span class="loading">Se procesează...</span>
      {:else}
        Spre plată
      {/if}
    </button>

    <p class="form-note">
      Vei fi redirecționat către pagina de plată securizată Netopia.
    </p>
  </div>
</form>

<style>
  .checkout-form {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  .form-content {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  .customer-form {
    padding-top: 1rem;
    border-top: 1px solid #e5e5e5;
  }

  .form-footer {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1.5rem;
    background: #f8f8f8;
  }

  .error-message {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    background: #fef2f2;
    color: #dc2626;
    font-size: 0.875rem;
  }

  .error-message svg {
    width: 1.25rem;
    height: 1.25rem;
    flex-shrink: 0;
  }

  .order-summary {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 1rem 0;
    border-bottom: 1px solid #e5e5e5;
  }

  .summary-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 1rem;
  }

  .summary-row-sub {
    font-size: 0.875rem;
    color: #6e6e6e;
  }

  .shipping-free-inline {
    color: #059669;
    font-weight: 600;
  }

  .summary-row-total {
    margin-top: 0.5rem;
    padding-top: 0.5rem;
    border-top: 1px solid #e5e5e5;
  }

  .summary-total {
    font-size: 1.25rem;
    font-weight: 700;
    color: #000;
  }

  .submit-button {
    width: 100%;
    padding: 1rem;
    background: #000;
    color: #fff;
    font-size: 1rem;
    font-weight: 500;
    border: none;
    cursor: pointer;
    transition: background 0.2s;
  }

  .submit-button:hover:not(:disabled) {
    background: #262626;
  }

  .submit-button:disabled {
    background: #909090;
    cursor: not-allowed;
  }

  .loading {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
  }

  .form-note {
    font-size: 0.75rem;
    color: #909090;
    text-align: center;
    margin: 0;
  }

  .shipping-info {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    padding: 1rem;
    background: #f0f9ff;
    border: 1px solid #bae6fd;
  }

  .shipping-info svg {
    width: 1.5rem;
    height: 1.5rem;
    flex-shrink: 0;
    color: #0284c7;
  }

  .shipping-text {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    font-size: 0.875rem;
    color: #0c4a6e;
  }

  .shipping-free {
    font-weight: 600;
    color: #059669;
  }

  .shipping-threshold {
    font-size: 0.75rem;
    color: #6e6e6e;
  }

  @media (min-width: 1024px) {
    .form-footer {
      padding: 2rem;
    }

    .summary-total {
      font-size: 1.5rem;
    }
  }
</style>
