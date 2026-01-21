import { createClient } from '@supabase/supabase-js';
import type { Database, OrderInsert, OrderUpdate, OrderItem } from './database.types';

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseServiceRoleKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.warn('Supabase credentials not configured. Database operations will fail.');
}

// Use service role key for server-side operations (bypasses RLS)
// This client should ONLY be used in server-side API routes, never exposed to the client
export const supabase = createClient<Database>(supabaseUrl || '', supabaseServiceRoleKey || '', {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export interface CreateOrderParams {
  customer: {
    email: string;
    phone?: string;
    name: string;
    type: 'person' | 'company';
    firstName?: string;
    lastName?: string;
    companyName?: string;
    cui?: string;
    contactPerson?: string;
  };
  billingAddress: {
    name: string;
    street: string;
    city: string;
    county?: string;
    postalCode: string;
    country?: string;
    companyName?: string;
    vatNumber?: string;
    registrationNumber?: string;
  };
  shippingAddress: {
    name: string;
    street: string;
    city: string;
    county?: string;
    postalCode: string;
    country?: string;
    phone?: string;
    notes?: string;
  };
  items: OrderItem[];
  pricing: {
    subtotal: number;
    shippingCost?: number;
    discountAmount?: number;
    discountCode?: string;
    taxAmount?: number;
    total: number;
  };
  paymentMethod?: string;
}

export async function createOrder(params: CreateOrderParams): Promise<{ orderId: string; orderNumber: string } | null> {
  const { customer, billingAddress, shippingAddress, items, pricing, paymentMethod } = params;

  const orderData: OrderInsert = {
    // Customer info
    customer_email: customer.email,
    customer_phone: customer.phone || null,
    customer_name: customer.name,

    // Billing address
    billing_name: billingAddress.name,
    billing_street: billingAddress.street,
    billing_city: billingAddress.city,
    billing_county: billingAddress.county || null,
    billing_postal_code: billingAddress.postalCode,
    billing_country: billingAddress.country || 'Romania',
    billing_company_name: billingAddress.companyName || null,
    billing_vat_number: billingAddress.vatNumber || null,
    billing_registration_number: billingAddress.registrationNumber || null,

    // Shipping address
    shipping_name: shippingAddress.name,
    shipping_street: shippingAddress.street,
    shipping_city: shippingAddress.city,
    shipping_county: shippingAddress.county || null,
    shipping_postal_code: shippingAddress.postalCode,
    shipping_country: shippingAddress.country || 'Romania',
    shipping_phone: shippingAddress.phone || null,
    shipping_notes: shippingAddress.notes || null,

    // Items (JSONB)
    items: items as unknown as Database['public']['Tables']['orders']['Insert']['items'],

    // Pricing
    subtotal: pricing.subtotal,
    shipping_cost: pricing.shippingCost || 0,
    discount_amount: pricing.discountAmount || 0,
    discount_code: pricing.discountCode || null,
    tax_amount: pricing.taxAmount || 0,
    total_amount: pricing.total,

    // Status
    status: 'pending',
    payment_method: paymentMethod || null,
    payment_status: 'pending',
  };

  const { data, error } = await supabase
    .from('orders')
    .insert(orderData)
    .select('id, order_number')
    .single();

  if (error) {
    console.error('Failed to create order:', error);
    throw new Error(`Failed to create order: ${error.message}`);
  }

  return data ? { orderId: data.id, orderNumber: data.order_number } : null;
}

export async function updateOrderPaymentStatus(
  orderNumber: string,
  status: 'pending' | 'confirmed' | 'processing' | 'sent' | 'delivered' | 'cancelled' | 'refunded',
  paymentDetails?: {
    paymentStatus?: string;
    paymentReference?: string;
    paidAt?: string;
  }
): Promise<boolean> {
  const updateData: OrderUpdate = {
    status,
    ...(paymentDetails?.paymentStatus && { payment_status: paymentDetails.paymentStatus }),
    ...(paymentDetails?.paymentReference && { payment_reference: paymentDetails.paymentReference }),
    ...(paymentDetails?.paidAt && { paid_at: paymentDetails.paidAt }),
  };

  const { error } = await supabase
    .from('orders')
    .update(updateData)
    .eq('order_number', orderNumber);

  if (error) {
    console.error('Failed to update order status:', error);
    throw new Error(`Failed to update order: ${error.message}`);
  }

  return true;
}

export async function updateOrderShipping(
  orderNumber: string,
  shippingDetails: {
    awbNumber: string;
    courierName?: string;
    trackingUrl?: string;
  }
): Promise<boolean> {
  const updateData: OrderUpdate = {
    status: 'sent',
    awb_number: shippingDetails.awbNumber,
    courier_name: shippingDetails.courierName || null,
    tracking_url: shippingDetails.trackingUrl || null,
    shipped_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from('orders')
    .update(updateData)
    .eq('order_number', orderNumber);

  if (error) {
    console.error('Failed to update shipping info:', error);
    throw new Error(`Failed to update shipping: ${error.message}`);
  }

  return true;
}

export async function updateOrderPaymentReference(
  orderNumber: string,
  paymentReference: string
): Promise<boolean> {
  const updateData: OrderUpdate = {
    payment_reference: paymentReference,
  };

  const { error } = await supabase
    .from('orders')
    .update(updateData)
    .eq('order_number', orderNumber);

  if (error) {
    console.error('Failed to update payment reference:', error);
    throw new Error(`Failed to update payment reference: ${error.message}`);
  }

  return true;
}

export async function getOrderByNumber(orderNumber: string) {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('order_number', orderNumber)
    .single();

  if (error) {
    console.error('Failed to get order:', error);
    return null;
  }

  return data;
}

export async function getOrderById(orderId: string) {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single();

  if (error) {
    console.error('Failed to get order:', error);
    return null;
  }

  return data;
}
