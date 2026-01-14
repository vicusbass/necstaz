# Shopping Cart & Checkout Implementation

This document describes the shopping cart and checkout system implemented for Nextaz.

## Architecture Overview

The cart system uses **Svelte + nanostores** for state management, following Astro's recommended approach for sharing state between islands. Cart data persists in localStorage and syncs across browser tabs.

## File Structure

```
src/
├── stores/
│   └── cart.ts                      # Nanostores cart state + localStorage
├── components/
│   ├── cart/
│   │   ├── AddToCartButton.svelte   # Interactive add-to-cart button
│   │   ├── CartBadge.svelte         # Red dot indicator on cart icon
│   │   ├── Toast.svelte             # Auto-disappearing notification
│   │   ├── CartItem.svelte          # Single item with quantity controls
│   │   ├── CartList.svelte          # Cart items container
│   │   └── CartSummary.svelte       # Totals + checkout button
│   └── checkout/
│       ├── CheckoutForm.svelte      # Main checkout orchestrator
│       ├── CustomerTypeSelector.svelte
│       ├── PersonForm.svelte        # Individual customer form
│       ├── CompanyForm.svelte       # Business customer form
│       └── AddressForm.svelte       # Reusable address fields
├── pages/
│   ├── cart.astro                   # Cart page
│   ├── checkout.astro               # Checkout page
│   ├── payment/
│   │   ├── success.astro            # Payment success (clears cart)
│   │   └── failure.astro            # Payment failure
│   └── api/
│       ├── cart/
│       │   └── validate.ts          # Validate items + fetch Sanity prices
│       └── payment/
│           ├── initiate.ts          # Start payment, create order
│           └── ipn.ts               # Netopia webhook callback
├── queries/
│   └── cart.ts                      # GROQ query for price validation
└── types/
    └── cart.ts                      # TypeScript interfaces
```

## Key Components

### Cart Store (`src/stores/cart.ts`)

Central state management using nanostores:

- `cartItems` - Array of cart items
- `cartCount` - Total item count (computed)
- `cartTotal` - Total price (computed)
- `isCartEmpty` - Boolean check (computed)
- `addToCart(item)` - Add item with toast notification
- `removeFromCart(id, type)` - Remove item
- `updateQuantity(id, type, quantity)` - Update quantity
- `clearCart()` - Clear all items

Cart persists to localStorage and syncs across tabs via `storage` event.

### Toast Notifications

Auto-disappearing notifications (bottom-right) when items are added. Uses:
- `toastMessage` - Current message
- `toastVisible` - Visibility state
- `showToast(message)` - Show for 3 seconds
- `hideToast()` - Manual hide

### Product Types

The cart supports three product types:

1. **product** - Individual wines (uses Sanity `_id`)
2. **bundle** - Wine bundles/packages (uses `slug`)
3. **subscription** - Monthly subscription

## Checkout Flow

### Customer Types

1. **Persoană fizică (Person)**
   - First name, Last name
   - Email, Phone
   - Delivery address
   - Billing address (optional, with "same address" checkbox)

2. **Persoană juridică (Company)**
   - Company name, CUI (tax ID)
   - Contact person name
   - Email, Phone
   - Delivery address
   - Billing address

### Address Fields

- Street and number
- City
- County (dropdown with all Romanian counties)
- Postal code (6 digits)
- Country (fixed: România)

## API Endpoints

### POST `/api/cart/validate`

Validates cart items against current Sanity prices.

**Request:**
```json
{
  "items": [
    { "id": "product-id", "type": "product", "name": "...", "price": 50, "quantity": 2 }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "validatedItems": [...],
  "total": 100,
  "errors": []
}
```

### POST `/api/payment/initiate`

Initiates payment flow:
1. Validates customer data (email, phone)
2. Fetches current prices from Sanity (security critical)
3. Creates order in Sanity with status "pending"
4. Returns payment URL

**Request:**
```json
{
  "customer": { "type": "person", "email": "...", ... },
  "cartItems": [...]
}
```

**Response:**
```json
{
  "success": true,
  "orderId": "NX-XXXXX-XXXX",
  "paymentUrl": "/payment/success?orderId=..."
}
```

### POST `/api/payment/ipn`

Netopia IPN (Instant Payment Notification) webhook:
- Receives payment status updates from Netopia
- Updates order status in Sanity
- Returns confirmation to Netopia

## Sanity Integration

### Order Schema (`studio-nextaz/schemaTypes/order.ts`)

```typescript
{
  name: 'order',
  type: 'document',
  fields: [
    { name: 'orderId', type: 'string' },
    { name: 'status', type: 'string' }, // pending, paid, failed, cancelled
    { name: 'customerType', type: 'string' }, // person, company
    { name: 'customer', type: 'object' }, // nested customer data
    { name: 'items', type: 'array' }, // order items
    { name: 'total', type: 'number' },
    { name: 'netopiaId', type: 'string' },
    { name: 'createdAt', type: 'datetime' },
    { name: 'notes', type: 'text' }
  ]
}
```

### Price Validation Query

```groq
{
  "products": *[_type == "product" && _id in $productIds]{ _id, name, price },
  "shop": *[_type == "shop" && _id == "shop"][0]{
    "bundles": bundles[slug.current in $bundleSlugs]{ "id": slug.current, name, price },
    subscriptionPrice
  }
}
```

## Security Considerations

**CRITICAL**: Client-side prices are for display only. The `/api/payment/initiate` endpoint:
1. Receives only item IDs and quantities from the client
2. Fetches current prices from Sanity server-side
3. Calculates total server-side
4. Never trusts client-provided prices

---

## TODO

### Environment Variables Required

Add these to your `.env` file:

```env
# Sanity write token (for creating orders)
# Get from: https://www.sanity.io/manage/project/vrxix2id/api#tokens
SANITY_WRITE_TOKEN=sk...

# Netopia Payment Gateway
# Get from: Netopia admin panel
NETOPIA_API_KEY=your-api-key
NETOPIA_POS_SIGNATURE=your-pos-signature
NETOPIA_IS_LIVE=false  # Set to true for production

# Payment URLs (update domain for production)
NETOPIA_RETURN_URL=https://your-domain.com/payment/success
NETOPIA_CONFIRM_URL=https://your-domain.com/api/payment/ipn
```

### Deploy Sanity Schema

Run this command in the `studio-nextaz` directory to deploy the order schema:

```bash
cd studio-nextaz
npx sanity@latest schema deploy
```

### Netopia Integration

The payment initiation endpoint (`/api/payment/initiate.ts`) currently uses a **mock implementation** that redirects directly to the success page. To enable real payments:

1. Install Netopia SDK or implement their API v2
2. Configure environment variables
3. Implement `initiateNetopiaPayment()` function
4. Handle Netopia's redirect response
5. Test with Netopia sandbox credentials

Reference: [Netopia Payment API Documentation](https://doc.netopia-payments.com/)

### Order Confirmation Email

The IPN endpoint has a TODO for sending confirmation emails:

```typescript
// In /api/payment/ipn.ts
// TODO: Send confirmation email if payment succeeded
// if (orderStatus === 'paid') {
//   await sendOrderConfirmationEmail(orderId);
// }
```

Implement using the existing Resend integration:
1. Create email template for order confirmation
2. Fetch order details from Sanity
3. Send email via Resend API

### Additional Improvements

- [ ] Add order history page for logged-in users
- [ ] Implement inventory tracking (reduce stock on purchase)
- [ ] Add shipping cost calculation
- [ ] Implement discount/coupon codes
- [ ] Add Google Analytics e-commerce tracking
- [ ] Implement abandoned cart recovery emails

---

## Testing

### Manual Testing Checklist

1. **Cart functionality**
   - [ ] Add items from shop page
   - [ ] Verify toast notifications appear
   - [ ] Check cart badge updates
   - [ ] Verify localStorage persistence (refresh page)
   - [ ] Test cross-tab synchronization

2. **Cart page**
   - [ ] View cart items
   - [ ] Change quantities (+/-)
   - [ ] Remove items
   - [ ] Verify totals update correctly

3. **Checkout form**
   - [ ] Test person form validation
   - [ ] Test company form validation
   - [ ] Test "same address" checkbox
   - [ ] Test county dropdown
   - [ ] Test postal code validation (6 digits)

4. **Payment flow** (mock mode)
   - [ ] Submit checkout form
   - [ ] Verify redirect to success page
   - [ ] Verify cart is cleared on success
   - [ ] Check order created in Sanity Studio

5. **Payment flow** (with Netopia - when configured)
   - [ ] Complete test payment
   - [ ] Verify IPN webhook updates order
   - [ ] Test payment failure scenario
   - [ ] Verify confirmation email sent
