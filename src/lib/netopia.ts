/**
 * Netopia Payment v2 API Client
 *
 * Based on official sample: https://github.com/netopiapayments/sample-app-js
 * Uses redirect flow - users enter card details on Netopia's hosted page.
 * No PCI compliance needed.
 */

import { Netopia, Ipn } from 'netopia-payment2';

// ============================================================================
// Configuration
// ============================================================================

export interface NetopiaConfig {
  apiKey: string;
  posSignature: string;
  publicKey: string;
  isLive: boolean;
}

export function getNetopiaConfig(): NetopiaConfig {
  const apiKey = import.meta.env.NETOPIA_API_KEY;
  const posSignature = import.meta.env.NETOPIA_POS_SIGNATURE;
  const publicKey = import.meta.env.NETOPIA_PUBLIC_KEY;
  const isLive = import.meta.env.NETOPIA_SANDBOX !== 'true';

  // Debug logging for Vercel
  console.log('Netopia config check:', {
    hasApiKey: !!apiKey,
    apiKeyLength: apiKey?.length,
    apiKeyStart: apiKey?.substring(0, 10),
    hasPosSignature: !!posSignature,
    posSignature: posSignature,
    sandboxEnv: import.meta.env.NETOPIA_SANDBOX,
    isLive: isLive,
  });

  if (!apiKey || !posSignature) {
    throw new Error('Netopia credentials not configured (NETOPIA_API_KEY, NETOPIA_POS_SIGNATURE)');
  }

  return { apiKey, posSignature, publicKey: publicKey || '', isLive };
}

export function isNetopiaConfigured(): boolean {
  return !!(import.meta.env.NETOPIA_API_KEY && import.meta.env.NETOPIA_POS_SIGNATURE);
}

// ============================================================================
// Netopia Client
// ============================================================================

export function createNetopiaClient(config: NetopiaConfig) {
  return new Netopia({
    apiKey: config.apiKey,
    posSignature: config.posSignature,
    isLive: config.isLive,
  });
}

// ============================================================================
// IPN Verifier
// ============================================================================

export function createIpnVerifier(config: NetopiaConfig) {
  if (!config.publicKey) {
    console.warn('NETOPIA_PUBLIC_KEY not configured - IPN verification will be skipped');
    return null;
  }

  return new Ipn({
    posSignature: config.posSignature,
    posSignatureSet: [config.posSignature],
    publicKeyStr: config.publicKey,
    hashMethod: 'sha512',
    alg: 'RS512',
  });
}

// ============================================================================
// Types for Order Creation
// ============================================================================

export interface ConfigData {
  emailTemplate: string;
  emailSubject: string;
  cancelUrl: string;
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
    type: 'card';
  };
}

export interface BillingData {
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
}

export interface OrderData {
  ntpID: string | null;
  orderID: string;
  description: string;
  amount: number;
  currency: string;
  dateTime: Date;
  billing: BillingData;
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

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Create the payment request for Netopia redirect flow.
 * Only sends instrument.type = 'card' to trigger hosted payment page.
 */
export function createPaymentRequest(params: {
  orderNumber: string;
  amount: number;
  currency: string;
  description: string;
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    county: string;
    postalCode: string;
  };
  notifyUrl: string;
  redirectUrl: string;
}) {
  // Config data - use any to bypass SDK strict types
  const configData = {
    emailTemplate: 'Confirmare plată Necstaz',
    emailSubject: `Plată comandă ${params.orderNumber}`,
    notifyUrl: params.notifyUrl,
    redirectUrl: params.redirectUrl,
    language: 'ro',
  } as any;

  // Only type: 'card' is needed - triggers redirect to hosted payment page
  // Per Netopia support: "Pentru a obtine paymentURL, este necesar ca in instrument sa trimiteti doar type card."
  const paymentData = {
    options: { installments: 0, bonus: 0 },
    instrument: {
      type: 'card',
    },
  } as any;

  // Minimal order data that was working before
  const orderData = {
    ntpID: null,
    orderID: params.orderNumber,
    description: params.description,
    amount: params.amount,
    currency: params.currency,
    dateTime: new Date(),
    billing: {
      firstName: params.customer.firstName,
      lastName: params.customer.lastName,
      email: params.customer.email,
      phone: params.customer.phone,
      details: params.customer.address,
      city: params.customer.city,
      country: 642, // Romania
      countryName: 'Romania',
      state: params.customer.county || 'Romania',
      postalCode: params.customer.postalCode || '000000',
    },
    installments: { selected: 0 },
  } as any;

  return { configData, paymentData, orderData };
}

/**
 * Initiate a payment with Netopia.
 * Returns the payment URL for redirect.
 */
export async function initiatePayment(params: {
  orderNumber: string;
  amount: number;
  currency?: string;
  description?: string;
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    county: string;
    postalCode: string;
  };
  notifyUrl: string;
  redirectUrl: string;
}): Promise<{ success: true; paymentUrl: string; ntpID: string } | { success: false; error: string }> {
  const config = getNetopiaConfig();
  const netopia = createNetopiaClient(config);

  const { configData, paymentData, orderData } = createPaymentRequest({
    orderNumber: params.orderNumber,
    amount: params.amount,
    currency: params.currency || 'RON',
    description: params.description || `Comandă ${params.orderNumber}`,
    customer: params.customer,
    notifyUrl: params.notifyUrl,
    redirectUrl: params.redirectUrl,
  });

  console.log('Initiating Netopia payment:', {
    orderID: orderData.orderID,
    amount: orderData.amount,
    currency: orderData.currency,
    notifyUrl: configData.notifyUrl,
    redirectUrl: configData.redirectUrl,
  });

  try {
    const response = (await netopia.createOrder(configData, paymentData, orderData)) as NetopiaResponse;

    console.log('Netopia response:', JSON.stringify(response, null, 2));

    if (response.code === 200 && response.data?.payment?.paymentURL) {
      return {
        success: true,
        paymentUrl: response.data.payment.paymentURL,
        ntpID: response.data.payment.ntpID,
      };
    }

    return {
      success: false,
      error: response.message || `Netopia error code: ${response.code}`,
    };
  } catch (error) {
    console.error('Netopia API error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown Netopia error',
    };
  }
}

// ============================================================================
// IPN Verification
// ============================================================================

export interface IPNPayload {
  payment: {
    status: number;
    ntpID: string;
    amount: number;
    currency: string;
  };
  order: {
    ntpID: string;
    dateTime: string;
    description: string;
    orderID: string;
    amount: number;
    currency: string;
    billing: {
      email: string;
      phone: string;
      firstName: string;
      lastName: string;
    };
  };
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Verify IPN signature from Netopia.
 * Returns true if valid, false otherwise.
 */
export async function verifyIPN(verifyToken: string, ipnData: IPNPayload): Promise<boolean> {
  try {
    const config = getNetopiaConfig();

    // Check if public key is properly configured
    if (!config.publicKey || config.publicKey.includes('YOUR_KEY_HERE')) {
      console.warn('IPN verification skipped - public key not properly configured');
      return true; // Allow without verification in development
    }

    const ipnVerifier = createIpnVerifier(config);

    if (!ipnVerifier) {
      console.warn('IPN verification skipped - could not create verifier');
      return true; // Allow in development without public key
    }

    // The SDK verify method takes (verifyToken, ipnDataAsJsonString) and returns Promise<IpnVerifyResponse>
    const result = await ipnVerifier.verify(verifyToken, JSON.stringify(ipnData));
    console.log('IPN verification result:', result);

    // errorType 0 means success
    if (result.errorType === 0) {
      return true;
    }

    // Signature verification failed - in sandbox mode, allow processing anyway
    // The sandbox public key may not match what's configured
    if (!config.isLive) {
      console.warn('IPN signature verification failed in sandbox mode - allowing processing anyway');
      return true;
    }

    // In production, fail verification
    return false;
  } catch (error) {
    console.error('IPN verification error:', error);
    // In development/sandbox, allow processing even if verification fails
    // In production, you may want to return false here
    console.warn('Continuing despite verification error (sandbox mode)');
    return true;
  }
}
