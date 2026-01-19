# Shopping Cart & Checkout Implementation

This document describes the shopping cart and checkout system implemented for Nextaz.

## Architecture Overview

The cart system uses **Svelte + nanostores** for state management, following Astro's recommended approach for sharing state between islands. Cart data persists in localStorage and syncs across browser tabs.

## File Structure

```
src/
├── config.ts                        # Global constants (SGR_DEPOSIT)
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
- `cartSubtotal` - Price without SGR (computed)
- `bottleCount` - Number of wine bottles for SGR (computed)
- `sgrTotal` - Total SGR deposit (computed)
- `cartTotal` - Total price including SGR (computed)
- `isCartEmpty` - Boolean check (computed)
- `addToCart(item)` - Add item with toast notification
- `removeFromCart(id, type)` - Remove item
- `updateQuantity(id, type, quantity)` - Update quantity
- `clearCart()` - Clear all items

Cart persists to localStorage and syncs across tabs via `storage` event.

### SGR Deposit (Garanție SGR)

The SGR (Sistem de Garanție-Returnare) is a Romanian bottle recycling deposit of **0.50 lei per bottle**. This deposit:

- Is displayed under each product price on product cards
- Is shown as a line item in the cart summary
- Is shown per product in cart items (for wine bottles only)
- Is included in the checkout total
- Is calculated server-side during payment initiation
- Is stored separately in the order (`subtotal`, `sgrDeposit`, `total`)

The SGR constant is defined in `src/config.ts` and imported wherever needed.

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

## Bundle System

Bundles allow customers to create custom wine packages with discounted prices. The system consists of a configurator modal for selecting wines and specialized cart components for displaying bundle items.

### Bundle File Structure

```
src/
├── stores/
│   └── bundleConfigurator.ts    # Bundle configurator state management
├── components/
│   ├── bundle/
│   │   ├── BundleConfigurator.svelte  # Modal for selecting wines
│   │   └── BundleWineItem.svelte      # Individual wine in configurator
│   └── cart/
│       └── BundleCartItem.svelte      # Bundle display in cart
└── types/
    └── cart.ts                        # BundleCartItem, BundleConfig types
```

### Bundle Configurator Store (`src/stores/bundleConfigurator.ts`)

Central state management for the bundle configuration flow:

**State:**
- `configuratorState` - Main state containing:
  - `isOpen` - Whether the modal is visible
  - `bundleConfig` - Current bundle configuration (from Sanity)
  - `selections` - Map of productId → quantity
  - `editingBundleId` - ID of bundle being edited (null for new)

**Derived Values:**
- `totalBottlesSelected` - Sum of all selected quantities
- `isConfigurationValid` - Whether selection matches required bottle count
- `bottlesRemaining` - How many more bottles needed
- `selectionTotalPrice` - Total price of current selection

**Actions:**
- `openConfigurator(bundleConfig)` - Open modal with bundle config
- `editBundle(bundleId, bundleConfig, selections)` - Edit existing bundle
- `closeConfigurator()` - Close modal and reset state
- `incrementWineQuantity(productId)` - Add one bottle
- `decrementWineQuantity(productId)` - Remove one bottle
- `setWineQuantity(productId, quantity)` - Set specific quantity
- `buildBundleCartItem()` - Create cart item from current selection

### Bundle Configuration Flow

1. **Opening**: User clicks "Configure" on a bundle card → `openConfigurator(bundleConfig)`
2. **Selection**: User selects wines using quantity controls
3. **Validation**: System tracks `totalBottlesSelected` vs `bundleConfig.bottleCount`
4. **Completion**: When valid, user clicks "Continue" → `buildBundleCartItem()` creates cart item
5. **Cart**: Bundle added via `addBundleToCart(bundleCartItem)`

### Editing Bundles

Bundles can be edited from the cart:

1. User clicks "Edit" on bundle cart item
2. `editBundle(bundleId, bundleConfig, currentSelections)` is called
3. Configurator opens with existing selections pre-populated
4. On continue, `updateBundleInCart(bundleId, newSelections)` updates the item

### Bundle Types

```typescript
interface BundleConfig {
  slug: string;
  name: string;
  description: string;
  bottleCount: number;
  wineDiscounts: WineDiscount[];
}

interface WineDiscount {
  productId: string;
  productName: string;
  basePrice: number;
  discountPercent: number;
  image?: string;
}

interface BundleCartItem {
  id: string;
  type: 'bundle';
  bundleSlug: string;
  name: string;
  bottleCount: number;
  selections: BundleSelection[];
  totalPrice: number;
}

interface BundleSelection {
  productId: string;
  productName: string;
  quantity: number;
  basePrice: number;
  discountedPrice: number;
}
```

### Bundle Pricing

- Each wine in a bundle has a `discountPercent` (e.g., 15%)
- `discountedPrice = basePrice * (1 - discountPercent / 100)`
- Bundle total = sum of (discountedPrice × quantity) for all selections
- SGR deposit is calculated separately: `bottleCount × SGR_DEPOSIT`

### CSS Architecture Note

**Important**: Bundle components use global CSS instead of Svelte scoped styles.

Due to a known issue with Svelte 5 + Astro + Vercel SSR builds, scoped `<style>` blocks in Svelte components may not be properly extracted during production builds. This causes styles to work locally but appear broken in production.

**Solution**: All bundle component styles are defined in `src/styles/global.css` within `@layer components`:

- `.bundle-configurator-*` - Modal overlay, header, content, footer
- `.bundle-wine-*` - Wine item in configurator (image, details, pricing, controls)
- `.bundle-cart-*` - Bundle item in cart (header, wines list, totals)
- `.quantity-control` - Shared quantity input component

This pattern matches other cart components and ensures reliable CSS bundling across all deployment environments.

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
3. Saves order to database (Supabase - currently mock)
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
- Updates order status in database (Supabase - currently mock)
- Returns confirmation to Netopia

## Database Integration (Supabase)

Order persistence is handled via Supabase with Row Level Security (RLS).

### Setup Complete

The Supabase integration is fully configured:

- **Client**: `src/lib/supabase.ts` - Uses service role key for server-side operations
- **Types**: `src/lib/database.types.ts` - TypeScript types matching the database schema
- **API Integration**: Orders are created in `/api/payment/initiate.ts` and updated in `/api/payment/ipn.ts`

### Environment Variables

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**Important**: The service role key bypasses RLS and should only be used server-side.

### Orders Table Schema

```sql
CREATE TYPE order_status AS ENUM (
  'pending',
  'confirmed',
  'processing',
  'sent',
  'delivered',
  'cancelled',
  'refunded'
);

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,

  -- Customer info
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,

  -- Billing address
  billing_name TEXT NOT NULL,
  billing_street TEXT NOT NULL,
  billing_city TEXT NOT NULL,
  billing_county TEXT,
  billing_postal_code TEXT NOT NULL,
  billing_country TEXT NOT NULL DEFAULT 'Romania',
  billing_company_name TEXT,
  billing_vat_number TEXT,
  billing_registration_number TEXT,

  -- Shipping address
  shipping_name TEXT NOT NULL,
  shipping_street TEXT NOT NULL,
  shipping_city TEXT NOT NULL,
  shipping_county TEXT,
  shipping_postal_code TEXT NOT NULL,
  shipping_country TEXT NOT NULL DEFAULT 'Romania',
  shipping_phone TEXT,
  shipping_notes TEXT,

  -- Order details
  items JSONB NOT NULL DEFAULT '[]',
  subtotal NUMERIC(10,2) NOT NULL,
  shipping_cost NUMERIC(10,2) NOT NULL DEFAULT 0,
  discount_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  discount_code TEXT,
  tax_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'RON',

  -- Status & payment
  status order_status NOT NULL DEFAULT 'pending',
  payment_method TEXT,
  payment_status TEXT,
  payment_reference TEXT,
  paid_at TIMESTAMPTZ,

  -- Shipping tracking
  courier_name TEXT,
  awb_number TEXT,
  tracking_url TEXT,
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,

  -- Admin
  internal_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### Order Number Generation

Auto-generated order numbers (e.g., "2026-000001") via database trigger:

```sql
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.order_number := to_char(now(), 'YYYY') || '-' ||
    lpad(nextval('order_number_seq')::text, 6, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER set_order_number
  BEFORE INSERT ON orders
  FOR EACH ROW
  WHEN (NEW.order_number IS NULL)
  EXECUTE FUNCTION generate_order_number();
```

### Row Level Security (RLS)

RLS is enabled with these policies:

```sql
-- Enable RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Service role has full access (for API routes)
CREATE POLICY "Service role full access"
  ON orders FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Authenticated users can view orders (for admin dashboard)
CREATE POLICY "Authenticated users can view orders"
  ON orders FOR SELECT
  TO authenticated
  USING (true);
```

**Note**: Public/anonymous users cannot read or write orders. All order operations go through server-side API routes using the service role key.

### Order Items Structure (JSONB)

```typescript
interface OrderItem {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  sku?: string;
  variant?: string;
  image_url?: string;
}
```

### Helper Functions

Located in `src/lib/supabase.ts`:

- `createOrder(params)` - Create a new order, returns order ID and order number
- `updateOrderPaymentStatus(orderNumber, status, details)` - Update payment status (called by IPN)
- `updateOrderShipping(orderNumber, details)` - Add AWB/tracking info
- `getOrderByNumber(orderNumber)` - Fetch order by order number

### Viewing Orders

Access orders in the Supabase dashboard:
1. Go to **Table Editor** → **orders**
2. Or use **SQL Editor** to run queries

## Sanity Integration (Read-Only)

Sanity is used only for **reading product data** (prices, descriptions). Orders are NOT stored in Sanity.

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
# Supabase (for order persistence) - CONFIGURED
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Netopia Payment Gateway
# Get from: Netopia admin panel
NETOPIA_API_KEY=your-api-key
NETOPIA_POS_SIGNATURE=your-pos-signature
NETOPIA_IS_LIVE=false  # Set to true for production

# Payment URLs (update domain for production)
NETOPIA_RETURN_URL=https://your-domain.com/payment/success
NETOPIA_CONFIRM_URL=https://your-domain.com/api/payment/ipn
```

### Supabase Setup - COMPLETE

- [x] Create a Supabase project
- [x] Create `orders` table with appropriate columns
- [x] Set up Row Level Security (RLS) policies
- [x] Add environment variables
- [x] Install the Supabase client: `npm install @supabase/supabase-js`
- [x] Integrate Supabase in API endpoints

See the "Database Integration (Supabase)" section above for full details.

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
