<script lang="ts">
  import type { Address } from '../../types/cart';
  import { ROMANIAN_COUNTIES } from '../../types/cart';

  interface Props {
    label: string;
    address: Address;
    disabled?: boolean;
    onchange: (address: Address) => void;
  }

  let { label, address, disabled = false, onchange }: Props = $props();

  function updateField(field: keyof Address, value: string) {
    onchange({ ...address, [field]: value });
  }
</script>

<fieldset class="address-form" disabled={disabled}>
  <legend class="address-legend">{label}</legend>

  <div class="form-group">
    <label for="street-{label}" class="form-label">
      Strada și numărul <span class="required">*</span>
    </label>
    <input
      type="text"
      id="street-{label}"
      class="form-input"
      value={address.street}
      oninput={(e) => updateField('street', e.currentTarget.value)}
      placeholder="Ex: Strada Victoriei 123, Ap. 5"
      required
    />
  </div>

  <div class="form-row">
    <div class="form-group">
      <label for="city-{label}" class="form-label">
        Oraș <span class="required">*</span>
      </label>
      <input
        type="text"
        id="city-{label}"
        class="form-input"
        value={address.city}
        oninput={(e) => updateField('city', e.currentTarget.value)}
        placeholder="Ex: București"
        required
      />
    </div>

    <div class="form-group">
      <label for="county-{label}" class="form-label">
        Județ <span class="required">*</span>
      </label>
      <select
        id="county-{label}"
        class="form-input form-select"
        value={address.county}
        onchange={(e) => updateField('county', e.currentTarget.value)}
        required
      >
        <option value="">Selectează județul</option>
        {#each ROMANIAN_COUNTIES as county}
          <option value={county}>{county}</option>
        {/each}
      </select>
    </div>
  </div>

  <div class="form-row">
    <div class="form-group">
      <label for="postalCode-{label}" class="form-label">
        Cod poștal <span class="required">*</span>
      </label>
      <input
        type="text"
        id="postalCode-{label}"
        class="form-input"
        value={address.postalCode}
        oninput={(e) => updateField('postalCode', e.currentTarget.value)}
        placeholder="Ex: 010101"
        pattern="[0-9][0-9][0-9][0-9][0-9][0-9]"
        title="Codul poștal trebuie să conțină exact 6 cifre"
        inputmode="numeric"
        maxlength="6"
        required
      />
    </div>

    <div class="form-group">
      <label for="country-{label}" class="form-label">
        Țară
      </label>
      <input
        type="text"
        id="country-{label}"
        class="form-input"
        value={address.country}
        readonly
      />
    </div>
  </div>
</fieldset>

<style>
  .address-form {
    border: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .address-form:disabled {
    opacity: 0.5;
    pointer-events: none;
  }

  .address-legend {
    font-size: 1rem;
    font-weight: 600;
    color: #000;
    margin-bottom: 0.5rem;
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

  .form-input:read-only {
    background: #f8f8f8;
    color: #6e6e6e;
  }

  .form-select {
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23909090' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 0.75rem center;
    background-size: 1rem;
    padding-right: 2.5rem;
  }

  @media (min-width: 1024px) {
    .form-row {
      grid-template-columns: 1fr 1fr;
    }
  }
</style>
