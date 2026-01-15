<script lang="ts">
  import type { CompanyCustomer, Address } from '../../types/cart';
  import AddressForm from './AddressForm.svelte';

  interface Props {
    customer: CompanyCustomer;
    onchange: (customer: CompanyCustomer) => void;
  }

  let { customer, onchange }: Props = $props();

  function updateField<K extends keyof CompanyCustomer>(field: K, value: CompanyCustomer[K]) {
    onchange({ ...customer, [field]: value });
  }

  function updateDeliveryAddress(address: Address) {
    const updated = { ...customer, deliveryAddress: address };
    if (customer.sameAddress) {
      updated.billingAddress = address;
    }
    onchange(updated);
  }

  function updateBillingAddress(address: Address) {
    onchange({ ...customer, billingAddress: address });
  }

  function toggleSameAddress() {
    const newSameAddress = !customer.sameAddress;
    onchange({
      ...customer,
      sameAddress: newSameAddress,
      billingAddress: newSameAddress ? customer.deliveryAddress : customer.billingAddress,
    });
  }
</script>

<div class="company-form">
  <div class="form-section">
    <h3 class="section-title">Date firmă</h3>

    <div class="form-row">
      <div class="form-group">
        <label for="companyName" class="form-label">
          Denumire firmă <span class="required">*</span>
        </label>
        <input
          type="text"
          id="companyName"
          class="form-input"
          value={customer.companyName}
          oninput={(e) => updateField('companyName', e.currentTarget.value)}
          placeholder="Ex: SC Exemplu SRL"
          required
        />
      </div>

      <div class="form-group">
        <label for="cui" class="form-label">
          CUI <span class="required">*</span>
        </label>
        <input
          type="text"
          id="cui"
          class="form-input"
          value={customer.cui}
          oninput={(e) => updateField('cui', e.currentTarget.value)}
          placeholder="Ex: RO12345678"
          required
        />
      </div>
    </div>

    <div class="form-group">
      <label for="contactPerson" class="form-label">
        Persoană de contact <span class="required">*</span>
      </label>
      <input
        type="text"
        id="contactPerson"
        class="form-input"
        value={customer.contactPerson}
        oninput={(e) => updateField('contactPerson', e.currentTarget.value)}
        placeholder="Ex: Ion Popescu"
        required
      />
    </div>
  </div>

  <div class="form-section">
    <h3 class="section-title">Date de contact</h3>

    <div class="form-row">
      <div class="form-group">
        <label for="email" class="form-label">
          Email <span class="required">*</span>
        </label>
        <input
          type="email"
          id="email"
          class="form-input"
          value={customer.email}
          oninput={(e) => updateField('email', e.currentTarget.value)}
          placeholder="Ex: contact@firma.ro"
          required
        />
      </div>

      <div class="form-group">
        <label for="phone" class="form-label">
          Telefon <span class="required">*</span>
        </label>
        <input
          type="tel"
          id="phone"
          class="form-input"
          value={customer.phone}
          oninput={(e) => updateField('phone', e.currentTarget.value)}
          placeholder="Ex: 0722 123 456"
          required
        />
      </div>
    </div>
  </div>

  <div class="form-section">
    <AddressForm
      label="Adresa de livrare"
      address={customer.deliveryAddress}
      onchange={updateDeliveryAddress}
    />
  </div>

  <div class="form-section">
    <label class="checkbox-label">
      <input
        type="checkbox"
        checked={customer.sameAddress}
        onchange={toggleSameAddress}
      />
      <span>Folosește aceeași adresă pentru facturare</span>
    </label>

    <AddressForm
      label="Adresa de facturare"
      address={customer.billingAddress}
      disabled={customer.sameAddress}
      onchange={updateBillingAddress}
    />
  </div>
</div>

<style>
  .company-form {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  .form-section {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .section-title {
    font-size: 1rem;
    font-weight: 600;
    color: #000;
    margin: 0 0 0.5rem 0;
  }

  .form-row {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
  }

  .form-label {
    font-size: 0.875rem;
    font-weight: 500;
    color: #000;
  }

  .required {
    color: #dc2626;
  }

  .form-input {
    width: 100%;
    padding: 0.75rem 1rem;
    font-size: 1rem;
    border: 1px solid #e5e5e5;
    background: #fff;
    color: #000;
    transition: border-color 0.2s;
  }

  .form-input:focus {
    outline: none;
    border-color: #000;
  }

  .form-input::placeholder {
    color: #909090;
  }

  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    font-size: 0.875rem;
    color: #000;
    margin-bottom: 0.5rem;
  }

  .checkbox-label input {
    width: 1.125rem;
    height: 1.125rem;
    accent-color: #000;
  }

  @media (min-width: 1024px) {
    .form-row {
      grid-template-columns: 1fr 1fr;
    }
  }
</style>
