# Netopia Payment Integration - API v2 Redirect Flow

## Overview

Integrate Netopia payment gateway using **API v2 with redirect flow**. Users are redirected to Netopia's hosted payment page - **no PCI compliance needed**.

This approach uses the modern JSON API but still redirects users to Netopia's page for card entry.

Based on official sample: [netopiapayments/sample-app-js](https://github.com/netopiapayments/sample-app-js)

## How It Works

1. Your server calls `netopia.createOrder(configData, paymentData, orderData)`
2. Netopia returns `response.code: 200` + `response.data.payment.paymentURL`
3. You redirect the user to `paymentURL`
4. User enters card on Netopia's secure page
5. Netopia sends IPN webhook with verification token in header
6. Your server verifies IPN using `ipn.verify(verifyToken, ipnData)`
7. User is redirected back to your `redirectUrl`

## Credentials Needed

- **API Key** - from Netopia admin: Profile → Security
- **POS Signature** - from Netopia admin: Point of sale → Technical settings
- **Public Key** - for IPN verification (RSA public key string)

## Environment Variables

```env
# Netopia API v2
NETOPIA_API_KEY=your-api-key-here
NETOPIA_POS_SIGNATURE=XXXX-XXXX-XXXX-XXXX-XXXX
NETOPIA_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\nYOUR_KEY_HERE\n-----END PUBLIC KEY-----"
NETOPIA_SANDBOX=true
```

## API Endpoints

| Environment | Base URL                                     |
| ----------- | -------------------------------------------- |
| Sandbox     | `https://secure.sandbox.netopia-payments.com` |
| Production  | `https://secure.netopia-payments.com`        |

## Dependencies

```bash
npm install netopia-payment2
```

This is the official Netopia v2 SDK.

## Files to Modify/Create

| File                                | Action | Purpose                          |
| ----------------------------------- | ------ | -------------------------------- |
| `src/lib/netopia.ts`                | CREATE | Netopia v2 API client            |
| `src/pages/api/payment/initiate.ts` | MODIFY | Call v2 API, return paymentURL   |
| `src/pages/api/payment/ipn.ts`      | MODIFY | Handle JSON IPN with verification |
| `src/env.d.ts`                      | MODIFY | Add env var types                |

## Implementation

### Step 1: Create Netopia v2 Client (`src/lib/netopia.ts`)

Based on official sample app:

```typescript
import { Netopia, Ipn } from 'netopia-payment2';

// Initialize Netopia for creating orders
export function createNetopiaClient() {
  return new Netopia({
    apiKey: import.meta.env.NETOPIA_API_KEY!,
    posSignature: import.meta.env.NETOPIA_POS_SIGNATURE!,
    isLive: import.meta.env.NETOPIA_SANDBOX !== 'true',
  });
}

// Initialize IPN verifier
export function createIpnVerifier() {
  return new Ipn({
    posSignature: import.meta.env.NETOPIA_POS_SIGNATURE!,
    posSignatureSet: [import.meta.env.NETOPIA_POS_SIGNATURE!],
    publicKeyStr: import.meta.env.NETOPIA_PUBLIC_KEY!,
    hashMethod: 'sha512',
    alg: 'RS512',
  });
}

// Types for order creation
export interface ConfigData {
  emailTemplate?: string;
  emailSubject?: string;
  notifyUrl: string;
  redirectUrl: string;
  language: string;
}

export interface PaymentData {
  options: {
    installments: number;
    bonus: number;
  };
  instrument: {
    type: 'card';  // Only type needed for redirect flow
  };
}

export interface OrderData {
  ntpID: string | null;
  orderID: string;
  description: string;
  amount: number;
  currency: string;
  dateTime: Date;
  billing: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    details?: string;
    city: string;
    country: number; // Country code (642 = Romania)
    countryName: string;
    state: string;
    postalCode: string;
  };
  installments?: {
    selected: number;
  };
}

export interface NetopiaResponse {
  code: number;
  data?: {
    payment: {
      ntpID: string;
      paymentURL: string;
      status: number;
    };
  };
  message?: string;
}
```

### Step 2: Update Payment Initiation (`src/pages/api/payment/initiate.ts`)

Replace mock implementation with:

```typescript
import { createNetopiaClient, type ConfigData, type PaymentData, type OrderData } from '../../lib/netopia';

// After order is created in Supabase...

const netopia = createNetopiaClient();
const origin = new URL(request.url).origin;

const configData: ConfigData = {
  emailTemplate: 'Confirmare plată',
  emailSubject: `Plată comandă ${orderNumber}`,
  notifyUrl: `${origin}/api/payment/ipn`,
  redirectUrl: `${origin}/payment/success?orderNumber=${orderNumber}`,
  language: 'ro',
};

const paymentData: PaymentData = {
  options: { installments: 0, bonus: 0 },
  instrument: {
    type: 'card',     // Only type is needed - triggers redirect to hosted payment page
  },
};

const orderData: OrderData = {
  ntpID: null,
  orderID: orderNumber,
  description: `Comandă ${orderNumber}`,
  amount: total,
  currency: 'RON',
  dateTime: new Date(),
  billing: {
    firstName: customerName.split(' ')[0],
    lastName: customerName.split(' ').slice(1).join(' ') || customerName,
    email: customer.email,
    phone: customer.phone,
    details: customer.deliveryAddress.street,
    city: customer.deliveryAddress.city,
    country: 642, // Romania
    countryName: 'Romania',
    state: customer.deliveryAddress.county || 'State',
    postalCode: customer.deliveryAddress.postalCode || '000000',
  },
  installments: { selected: 0 },
};

const response = await netopia.createOrder(configData, paymentData, orderData);

if (response.code === 200 && response.data?.payment?.paymentURL) {
  // Store ntpID for later verification
  await updateOrderPaymentReference(orderNumber, response.data.payment.ntpID);

  return new Response(
    JSON.stringify({
      success: true,
      orderNumber,
      paymentUrl: response.data.payment.paymentURL,
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}

// Handle errors
console.error('Netopia error:', response);
return new Response(
  JSON.stringify({
    success: false,
    error: `Eroare plată: ${response.message || 'Unknown error'}`,
  }),
  { status: 400, headers: { 'Content-Type': 'application/json' } }
);
```

### Step 3: Update IPN Handler (`src/pages/api/payment/ipn.ts`)

v2 IPN requires verification using public key:

```typescript
import type { APIRoute } from 'astro';
import { createIpnVerifier } from '../../lib/netopia';
import { updateOrderPaymentStatus } from '../../lib/supabase';

// Status mapping
const NETOPIA_STATUS_MAP: Record<number, { orderStatus: string; paymentStatus: string }> = {
  3: { orderStatus: 'confirmed', paymentStatus: 'paid' },
  5: { orderStatus: 'confirmed', paymentStatus: 'confirmed' },
  6: { orderStatus: 'cancelled', paymentStatus: 'declined' },
  7: { orderStatus: 'cancelled', paymentStatus: 'error' },
  12: { orderStatus: 'cancelled', paymentStatus: 'declined' },
};

export const POST: APIRoute = async ({ request }) => {
  try {
    // Get verification token from header
    const verifyToken = request.headers.get('verification-token');

    if (!verifyToken) {
      console.error('IPN: Missing verification token');
      return jsonResponse({ errorType: 1, errorCode: 'MISSING_TOKEN', errorMessage: 'Missing verification token' }, 400);
    }

    // Parse IPN data
    const ipnData = await request.json();
    console.log('Received IPN:', JSON.stringify(ipnData, null, 2));

    // Verify IPN signature
    const ipn = createIpnVerifier();
    const isValid = ipn.verify(verifyToken, ipnData);

    if (!isValid) {
      console.error('IPN: Invalid signature');
      return jsonResponse({ errorType: 1, errorCode: 'INVALID_SIGNATURE', errorMessage: 'Invalid signature' }, 400);
    }

    // Extract payment info
    const orderNumber = ipnData.order?.orderID;
    const ntpID = ipnData.payment?.ntpID;
    const status = ipnData.payment?.status;

    if (!orderNumber) {
      console.error('IPN: Missing orderID');
      return jsonResponse({ errorType: 1, errorCode: 'MISSING_ORDER', errorMessage: 'Missing orderID' }, 400);
    }

    // Map status
    const statusMapping = NETOPIA_STATUS_MAP[status] || { orderStatus: 'pending', paymentStatus: 'unknown' };

    // Update order in Supabase
    await updateOrderPaymentStatus(orderNumber, statusMapping.orderStatus, {
      paymentStatus: statusMapping.paymentStatus,
      paymentReference: ntpID,
      paidAt: statusMapping.orderStatus === 'confirmed' ? new Date().toISOString() : undefined,
    });

    console.log(`IPN: Order ${orderNumber} updated to ${statusMapping.orderStatus}`);

    // Return success response to Netopia
    return jsonResponse({ errorType: 0, errorCode: '', errorMessage: 'OK' });

  } catch (error) {
    console.error('IPN Error:', error);
    return jsonResponse({ errorType: 1, errorCode: 'SERVER_ERROR', errorMessage: 'Server error' }, 500);
  }
};

function jsonResponse(data: object, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// Health check
export const GET: APIRoute = async () => {
  return jsonResponse({ status: 'ok', message: 'IPN endpoint ready' });
};
```

### Step 4: Update Environment Types (`src/env.d.ts`)

```typescript
interface ImportMetaEnv {
  // ... existing vars
  readonly NETOPIA_API_KEY?: string;
  readonly NETOPIA_POS_SIGNATURE?: string;
  readonly NETOPIA_PUBLIC_KEY?: string;
  readonly NETOPIA_SANDBOX?: string;
}
```

## Status Codes

| Code | Status       | Order Action |
| ---- | ------------ | ------------ |
| 3    | Paid         | confirmed    |
| 5    | Confirmed    | confirmed    |
| 6    | Declined     | cancelled    |
| 7    | Error        | cancelled    |
| 12   | Rejected     | cancelled    |
| 15   | 3DS Required | (automatic)  |

## Payment Flow

```text
1. User clicks "Finalizează comanda"
2. POST /api/payment/initiate
3. Server creates order in Supabase (status: pending)
4. Server calls netopia.createOrder() with instrument: { type: 'card' } only
5. Netopia returns code 200 + paymentURL
6. Server stores ntpID, returns paymentURL to frontend
7. Frontend redirects to paymentURL
8. User enters card on Netopia's secure page
9. Netopia sends IPN to /api/payment/ipn with verification-token header
10. Server verifies signature using ipn.verify()
11. Server updates order status in Supabase
12. Netopia redirects user to redirectUrl (success page)
```

## Changes from Current Architecture

| Aspect               | Current (Mock)              | New (Netopia v2)                      |
| -------------------- | --------------------------- | ------------------------------------- |
| Order creation       | ✅ Same                      | ✅ Same                                |
| Payment initiation   | Returns mock URL            | Calls `netopia.createOrder()`         |
| Response             | `paymentUrl: /payment/success` | `paymentUrl: netopia-payments.com/...` |
| IPN handling         | JSON (no verification)      | JSON + signature verification         |
| IPN response         | JSON                        | JSON (same format)                    |
| Dependencies         | None                        | `netopia-payment2`                    |
| Env vars             | None                        | API_KEY, SIGNATURE, PUBLIC_KEY        |

## Verification

### Sandbox Testing

1. Set `NETOPIA_SANDBOX=true` in your environment
2. Use sandbox admin: <https://sandbox.netopia-payments.com/>

### Test Cards

| Card Number        | Result   | Notes                  |
| ------------------ | -------- | ---------------------- |
| `9900004810225098` | Approved | Primary test card      |
| `9900004810225099` | Declined | Test failure scenarios |

### Card Entry Details

- **Card Number**: `9900004810225098`
- **Expiry Date**: Any future date (e.g., `12/28`)
- **CVV**: `111` or `123` (3 digits)
- **Cardholder Name**: Any name

### Local Testing with ngrok

To test IPN callbacks locally:

1. Install ngrok: `brew install ngrok` (macOS) or download from ngrok.com

2. Start ngrok tunnel:

   ```bash
   ngrok http 4321
   ```

3. Add ngrok host to `astro.config.mjs`:

   ```javascript
   vite: {
     server: {
       allowedHosts: ['your-subdomain.ngrok-free.app'],
     },
   },
   ```

4. Start dev server: `npm run dev`
5. Test payment using the ngrok HTTPS URL

**Important**: Netopia requires HTTPS for callback URLs. The `initiate.ts` automatically converts HTTP origins to HTTPS for non-localhost URLs.

### IPN Verification Notes

**Sandbox Limitation**: IPN signature verification may fail in sandbox mode because:

- The public key from sandbox may differ from production
- The SDK's `verify()` method expects a properly formatted RSA public key

**Current Implementation** (in `src/lib/netopia.ts`):

- IPN verification errors are logged but don't block processing in sandbox mode
- This allows testing the full flow without valid signature verification
- **For production**: Ensure `NETOPIA_PUBLIC_KEY` is properly configured

### IPN Payload Example

Successful payment IPN from Netopia:

```json
{
  "order": {
    "orderID": "2026-000008"
  },
  "payment": {
    "amount": 40.5,
    "code": "00",
    "currency": "RON",
    "data": {
      "AuthCode": "x0jo",
      "RRN": "zSQXYDnJPyux"
    },
    "message": "Approved",
    "ntpID": "2621502",
    "status": 3
  }
}
```

Status codes:

- `status: 3` = Paid (confirmed)
- `status: 6` = Declined
- `status: 7` = Error

### Troubleshooting

| Issue | Solution |
| ----- | -------- |
| "Host not allowed" error | Add ngrok domain to `astro.config.mjs` allowedHosts |
| "CVV nu este valid" error | Use CVV `111` or `123` with test card |
| IPN not received | Check notifyUrl is HTTPS; verify ngrok is running |
| Signature verification failed | Expected in sandbox; ensure public key is correct for production |
| Cart not cleared after payment | Check success page reads `orderNumber` param correctly |

### Checklist

- [ ] Install `netopia-payment2` package
- [ ] Get API Key from Netopia admin: Profile → Security
- [ ] Get POS Signature from: Point of sale → Technical settings
- [ ] Get Public Key for IPN verification (production)
- [ ] Add env vars to `.env` and Vercel
- [ ] Test with sandbox card `9900004810225098`
- [ ] Verify IPN updates order in Supabase
- [ ] Test declined card scenario with `9900004810225099`
- [ ] Verify cart clears after successful payment

## Resources

- [Official Sample App](https://github.com/netopiapayments/sample-app-js)
- [Netopia Payments API](https://netopia-system.stoplight.io/docs/payments-api)
- [netopia-payment2 npm](https://www.npmjs.com/package/netopia-payment2)
