import type { APIRoute } from 'astro';

export const prerender = false;

import { loadQuery } from '../../../utils/loadQuery';
import { cartValidationQuery } from '../../../queries/cart';
import type { CartItem, Customer, PersonCustomer, CompanyCustomer, AnyCartItem, BundleCartItem } from '../../../types/cart';
import { SGR_DEPOSIT, PACKAGE_BOTTLE_COUNT } from '../../../config';
import { createOrder, updateOrderPaymentReference, type CreateOrderParams } from '../../../lib/supabase';
import type { OrderItem } from '../../../lib/database.types';
import { isNetopiaConfigured, initiatePayment } from '../../../lib/netopia';

interface SanityProduct {
  _id: string;
  name: string;
  price: number;
}

interface SanityWineDiscount {
  productId: string;
  productName: string;
  basePrice: number;
  discountPercent: number;
}

interface SanityBundle {
  id: string;
  name: string;
  bottleCount: number;
  wineDiscounts: SanityWineDiscount[];
}

interface CartValidationResult {
  products: SanityProduct[];
  shop: {
    bundles: SanityBundle[];
  };
}

// Type guard for bundle cart items
function isBundleCartItem(item: AnyCartItem): item is BundleCartItem {
  return item.type === 'bundle' && 'selections' in item;
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

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { customer, cartItems } = body as {
      customer: Customer;
      cartItems: AnyCartItem[];
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
    const productIds = cartItems
      .filter((i): i is CartItem => i.type === 'product')
      .map((i) => i.id);

    // For configured bundles, extract the bundleSlug
    const bundleSlugs = cartItems
      .filter((i): i is BundleCartItem => isBundleCartItem(i))
      .map((i) => i.bundleSlug);

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
      bundleDetails?: {
        bundleSlug: string;
        bottleCount: number;
        selections: Array<{
          productId: string;
          productName: string;
          quantity: number;
          discountPercent: number;
          unitPrice: number;
          totalPrice: number;
        }>;
      };
    }> = [];
    let subtotal = 0;
    let bottleCount = 0;
    const errors: string[] = [];

    for (const item of cartItems) {
      if (item.type === 'product') {
        const cartItem = item as CartItem;
        const sanityProduct = data?.products?.find((p) => p._id === cartItem.id);
        if (sanityProduct) {
          validatedItems.push({
            id: cartItem.id,
            type: cartItem.type,
            name: cartItem.name,
            price: sanityProduct.price,
            quantity: cartItem.quantity,
          });
          subtotal += sanityProduct.price * cartItem.quantity;
          bottleCount += cartItem.quantity; // Count bottles for SGR
        } else {
          errors.push(`Produsul "${cartItem.name}" nu a fost găsit`);
        }
      } else if (isBundleCartItem(item)) {
        // Configured bundle - validate selections against server-side prices
        const sanityBundle = data?.shop?.bundles?.find((b) => b.id === item.bundleSlug);
        if (!sanityBundle) {
          errors.push(`Pachetul "${item.name}" nu a fost găsit`);
          continue;
        }

        // Validate total bottles match bundle requirement
        const totalBundleBottles = item.selections.reduce((sum, sel) => sum + sel.quantity, 0);
        if (totalBundleBottles !== sanityBundle.bottleCount) {
          errors.push(
            `Pachetul "${item.name}" necesită ${sanityBundle.bottleCount} sticle, dar are ${totalBundleBottles}`
          );
          continue;
        }

        // Validate each wine selection and recalculate price server-side
        let bundleTotal = 0;
        const validatedSelections: Array<{
          productId: string;
          productName: string;
          quantity: number;
          discountPercent: number;
          unitPrice: number;
          totalPrice: number;
        }> = [];

        for (const selection of item.selections) {
          const wineDiscount = sanityBundle.wineDiscounts.find(
            (w) => w.productId === selection.productId
          );

          if (!wineDiscount) {
            errors.push(
              `Vinul "${selection.productName}" nu este disponibil în pachetul "${item.name}"`
            );
            continue;
          }

          // Server-side price calculation
          const serverDiscountedPrice = wineDiscount.basePrice * (1 - wineDiscount.discountPercent / 100);
          const lineTotal = serverDiscountedPrice * selection.quantity;
          bundleTotal += lineTotal;

          validatedSelections.push({
            productId: selection.productId,
            productName: wineDiscount.productName,
            quantity: selection.quantity,
            discountPercent: wineDiscount.discountPercent,
            unitPrice: serverDiscountedPrice,
            totalPrice: lineTotal,
          });

          // Count bottles for SGR
          bottleCount += selection.quantity;
        }

        validatedItems.push({
          id: item.id,
          type: 'bundle',
          name: item.name,
          price: bundleTotal,
          quantity: 1,
          bundleDetails: {
            bundleSlug: item.bundleSlug,
            bottleCount: totalBundleBottles,
            selections: validatedSelections,
          },
        });
        subtotal += bundleTotal;
      } else if (item.type === 'package') {
        // Package items - count as PACKAGE_BOTTLE_COUNT (4) bottles each
        const cartItem = item as CartItem;
        const sanityProduct = data?.products?.find((p) => p._id === cartItem.id);
        if (sanityProduct) {
          validatedItems.push({
            id: cartItem.id,
            type: cartItem.type,
            name: cartItem.name,
            price: sanityProduct.price,
            quantity: cartItem.quantity,
          });
          subtotal += sanityProduct.price * cartItem.quantity;
          bottleCount += cartItem.quantity * PACKAGE_BOTTLE_COUNT; // 4 bottles per package
        } else {
          errors.push(`Pachetul \"${cartItem.name}\" nu a fost găsit`);
        }
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

    // Prepare order data for Supabase
    const billingAddress = customer.sameAddress ? customer.deliveryAddress : customer.billingAddress;

    // Build customer name based on type
    let customerName: string;
    let billingName: string;

    if (customer.type === 'person') {
      const personCustomer = customer as PersonCustomer;
      customerName = `${personCustomer.firstName} ${personCustomer.lastName}`;
      billingName = customerName;
    } else {
      const companyCustomer = customer as CompanyCustomer;
      customerName = companyCustomer.companyName;
      billingName = companyCustomer.companyName;
    }

    // Build order items for database
    const orderItems: OrderItem[] = validatedItems.map((item) => ({
      product_id: item.id,
      product_name: item.name,
      quantity: item.quantity,
      unit_price: item.price,
      total_price: item.price * item.quantity,
    }));

    // Prepare order params
    const orderParams: CreateOrderParams = {
      customer: {
        email: customer.email,
        phone: customer.phone,
        name: customerName,
        type: customer.type,
        ...(customer.type === 'person'
          ? {
              firstName: (customer as PersonCustomer).firstName,
              lastName: (customer as PersonCustomer).lastName,
            }
          : {
              companyName: (customer as CompanyCustomer).companyName,
              cui: (customer as CompanyCustomer).cui,
              contactPerson: (customer as CompanyCustomer).contactPerson,
            }),
      },
      billingAddress: {
        name: billingName,
        street: billingAddress.street,
        city: billingAddress.city,
        county: billingAddress.county,
        postalCode: billingAddress.postalCode,
        country: billingAddress.country || 'Romania',
        ...(customer.type === 'company'
          ? {
              companyName: (customer as CompanyCustomer).companyName,
              vatNumber: (customer as CompanyCustomer).cui,
            }
          : {}),
      },
      shippingAddress: {
        name: customerName,
        street: customer.deliveryAddress.street,
        city: customer.deliveryAddress.city,
        county: customer.deliveryAddress.county,
        postalCode: customer.deliveryAddress.postalCode,
        country: customer.deliveryAddress.country || 'Romania',
        phone: customer.phone,
      },
      items: orderItems,
      pricing: {
        subtotal,
        taxAmount: sgrTotal, // SGR deposit stored as tax
        total,
      },
      paymentMethod: 'netopia',
    };

    // Save order to database (Supabase)
    let orderNumber: string;
    try {
      const result = await createOrder(orderParams);
      if (!result) {
        throw new Error('Failed to create order - no result returned');
      }
      orderNumber = result.orderNumber;
      console.log('Order created in Supabase:', orderNumber);
    } catch (dbError) {
      console.error('Failed to save order to database:', dbError);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'A apărut o eroare la salvarea comenzii',
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if Netopia is configured
    if (!isNetopiaConfigured()) {
      // Development mode - redirect to success page directly
      console.log('Netopia not configured, using mock payment flow');
      return new Response(
        JSON.stringify({
          success: true,
          orderNumber,
          paymentUrl: `/payment/success?orderNumber=${orderNumber}&mock=true`,
          message: 'Netopia nu este configurat. Folosind flux de plată simulat.',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Build customer data for Netopia
    // Use HTTPS for callback URLs (ngrok and production both require HTTPS)
    let origin = new URL(request.url).origin;
    if (origin.startsWith('http://') && !origin.includes('localhost')) {
      origin = origin.replace('http://', 'https://');
    }
    let firstName: string;
    let lastName: string;

    if (customer.type === 'person') {
      const personCustomer = customer as PersonCustomer;
      firstName = personCustomer.firstName;
      lastName = personCustomer.lastName;
    } else {
      const companyCustomer = customer as CompanyCustomer;
      // For companies, use contact person or company name
      firstName = companyCustomer.contactPerson?.split(' ')[0] || companyCustomer.companyName;
      lastName = companyCustomer.contactPerson?.split(' ').slice(1).join(' ') || '';
    }

    // Initiate Netopia payment
    const netopiaResult = await initiatePayment({
      orderNumber,
      amount: total,
      currency: 'RON',
      description: `Comandă ${orderNumber} - Necstaz`,
      customer: {
        firstName,
        lastName,
        email: customer.email,
        phone: customer.phone,
        address: customer.deliveryAddress.street,
        city: customer.deliveryAddress.city,
        county: customer.deliveryAddress.county,
        postalCode: customer.deliveryAddress.postalCode,
      },
      notifyUrl: `${origin}/api/payment/ipn`,
      redirectUrl: `${origin}/payment/success?orderNumber=${orderNumber}`,
    });

    if (!netopiaResult.success) {
      console.error('Netopia payment initiation failed:', netopiaResult.error);
      return new Response(
        JSON.stringify({
          success: false,
          error: `Eroare la inițierea plății: ${netopiaResult.error}`,
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Store Netopia payment reference (ntpID) for later verification
    try {
      await updateOrderPaymentReference(orderNumber, netopiaResult.ntpID);
    } catch (refError) {
      console.warn('Failed to store payment reference:', refError);
      // Continue anyway - payment can still proceed
    }

    console.log(`Payment initiated for order ${orderNumber}, redirecting to Netopia`);

    return new Response(
      JSON.stringify({
        success: true,
        orderNumber,
        paymentUrl: netopiaResult.paymentUrl,
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
