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
    formatPrice,
    initializeCart,
    subscribeToCartChanges,
  } from '../../stores/cart';
  import CustomerTypeSelector from './CustomerTypeSelector.svelte';
  import PersonForm from './PersonForm.svelte';
  import CompanyForm from './CompanyForm.svelte';

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
  let isSubmitting = $state(false);
  let error = $state<string | null>(null);

  onMount(() => {
    initializeCart();
    subscribeToCartChanges();

    const unsubItems = cartItems.subscribe((value) => {
      items = value;
    });

    const unsubTotal = cartTotal.subscribe((value) => {
      total = value;
    });

    return () => {
      unsubItems();
      unsubTotal();
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
      <div class="summary-row">
        <span>Total comandă:</span>
        <span class="summary-total">{formatPrice(total)}</span>
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
    padding: 1rem 0;
    border-bottom: 1px solid #e5e5e5;
  }

  .summary-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 1rem;
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

  @media (min-width: 1024px) {
    .form-footer {
      padding: 2rem;
    }

    .summary-total {
      font-size: 1.5rem;
    }
  }
</style>
