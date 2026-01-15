import type { APIRoute } from 'astro';

export const prerender = false;

import { loadQuery } from '../../../utils/loadQuery';
import { cartValidationQuery } from '../../../queries/cart';
import type { CartItem, Customer, PersonCustomer, CompanyCustomer } from '../../../types/cart';
import { SGR_DEPOSIT } from '../../../config';

interface SanityProduct {
  _id: string;
  name: string;
  price: number;
}

interface SanityBundle {
  id: string;
  name: string;
  price: number;
}

interface CartValidationResult {
  products: SanityProduct[];
  shop: {
    bundles: SanityBundle[];
    subscriptionPrice: number;
  };
}

function generateOrderId(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `NX-${timestamp}-${random}`;
}

function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validatePhone(phone: string): boolean {
  // Romanian phone format: +40xxx, 07xx, etc.
  const cleaned = phone.replace(/[\s-]/g, '');
  return /^(\+40|0)[0-9]{9,10}$/.test(cleaned);
}

// TODO: Replace with actual Supabase order persistence
// import { createClient } from '@supabase/supabase-js';
// const supabase = createClient(
//   import.meta.env.SUPABASE_URL,
//   import.meta.env.SUPABASE_ANON_KEY
// );
async function saveOrderToDatabase(orderData: {
  orderId: string;
  status: string;
  customerType: string;
  customer: Record<string, unknown>;
  items: Array<{ id: string; type: string; name: string; price: number; quantity: number }>;
  subtotal: number;
  sgrDeposit: number;
  total: number;
  createdAt: string;
}): Promise<void> {
  // TODO: Implement Supabase order persistence
  // const { error } = await supabase.from('orders').insert(orderData);
  // if (error) throw error;

  // For now, just log the order
  console.log('Order created (mock):', orderData.orderId, {
    total: orderData.total,
    items: orderData.items.length,
    customer: orderData.customer.email,
  });
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { customer, cartItems } = body as {
      customer: Customer;
      cartItems: CartItem[];
    };

    // Validate request
    if (!customer || !cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Date lipsă sau invalide',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate customer data
    if (!validateEmail(customer.email)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Adresă de email invalidă',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!validatePhone(customer.phone)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Număr de telefon invalid',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Extract IDs for products and slugs for bundles
    const productIds = cartItems.filter((i) => i.type === 'product').map((i) => i.id);
    const bundleSlugs = cartItems.filter((i) => i.type === 'bundle').map((i) => i.id);

    // Fetch current prices from Sanity - CRITICAL SECURITY STEP
    const { data } = await loadQuery<CartValidationResult>({
      query: cartValidationQuery,
      params: {
        productIds: productIds.length > 0 ? productIds : ['__none__'],
        bundleSlugs: bundleSlugs.length > 0 ? bundleSlugs : ['__none__'],
      },
    });

    // Validate each item and calculate total with server-side prices
    const validatedItems: Array<{
      id: string;
      type: string;
      name: string;
      price: number;
      quantity: number;
    }> = [];
    let subtotal = 0;
    let bottleCount = 0;
    const errors: string[] = [];

    for (const item of cartItems) {
      let serverPrice: number | null = null;

      if (item.type === 'product') {
        const sanityProduct = data?.products?.find((p) => p._id === item.id);
        if (sanityProduct) {
          serverPrice = sanityProduct.price;
          bottleCount += item.quantity; // Count bottles for SGR
        } else {
          errors.push(`Produsul "${item.name}" nu a fost găsit`);
          continue;
        }
      } else if (item.type === 'bundle') {
        const sanityBundle = data?.shop?.bundles?.find((b) => b.id === item.id);
        if (sanityBundle) {
          serverPrice = sanityBundle.price;
        } else {
          errors.push(`Pachetul "${item.name}" nu a fost găsit`);
          continue;
        }
      } else if (item.type === 'subscription') {
        if (data?.shop?.subscriptionPrice != null) {
          serverPrice = data.shop.subscriptionPrice;
        } else {
          errors.push('Abonamentul nu este disponibil');
          continue;
        }
      }

      if (serverPrice != null) {
        validatedItems.push({
          id: item.id,
          type: item.type,
          name: item.name,
          price: serverPrice,
          quantity: item.quantity,
        });
        subtotal += serverPrice * item.quantity;
      }
    }

    // Calculate SGR deposit and total
    const sgrTotal = bottleCount * SGR_DEPOSIT;
    const total = subtotal + sgrTotal;

    if (errors.length > 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: errors.join(', '),
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (validatedItems.length === 0 || total <= 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Nu există produse valide în coș',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Generate order ID
    const orderId = generateOrderId();

    // Prepare customer data
    const customerData: Record<string, unknown> = {
      email: customer.email,
      phone: customer.phone,
      deliveryAddress: customer.deliveryAddress,
      billingAddress: customer.sameAddress ? customer.deliveryAddress : customer.billingAddress,
    };

    if (customer.type === 'person') {
      const personCustomer = customer as PersonCustomer;
      customerData.firstName = personCustomer.firstName;
      customerData.lastName = personCustomer.lastName;
    } else {
      const companyCustomer = customer as CompanyCustomer;
      customerData.companyName = companyCustomer.companyName;
      customerData.cui = companyCustomer.cui;
      customerData.contactPerson = companyCustomer.contactPerson;
    }

    // Save order to database (Supabase)
    try {
      await saveOrderToDatabase({
        orderId,
        status: 'pending',
        customerType: customer.type,
        customer: customerData,
        items: validatedItems,
        subtotal,
        sgrDeposit: sgrTotal,
        total,
        createdAt: new Date().toISOString(),
      });
    } catch (dbError) {
      console.error('Failed to save order to database:', dbError);
      // Continue anyway - we can still process the payment
      // The IPN webhook will create/update the order if needed
    }

    // TODO: Integrate with Netopia
    // For now, return a mock success with redirect to a placeholder
    // In production, this would:
    // 1. Call Netopia API to create a payment
    // 2. Return the Netopia payment URL

    // Mock implementation - replace with actual Netopia integration
    const isNetopiaConfigured = !!(
      import.meta.env.NETOPIA_API_KEY && import.meta.env.NETOPIA_POS_SIGNATURE
    );

    if (!isNetopiaConfigured) {
      // Development mode - redirect to success page directly
      console.log('Netopia not configured, using mock payment flow');
      return new Response(
        JSON.stringify({
          success: true,
          orderId,
          paymentUrl: `/payment/success?orderId=${orderId}&mock=true`,
          message: 'Netopia nu este configurat. Folosind flux de plată simulat.',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // TODO: Real Netopia integration here
    // const netopiaResponse = await initiateNetopiaPayment(orderId, total, customer);
    // return netopiaResponse.paymentUrl;

    return new Response(
      JSON.stringify({
        success: true,
        orderId,
        paymentUrl: `/payment/success?orderId=${orderId}`,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Payment initiation error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'A apărut o eroare la procesarea comenzii',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
