import { Resend } from 'resend';
import type { Order, OrderItem } from './database.types';

const resend = new Resend(import.meta.env.RESEND_API_KEY);

// Email addresses
const ADMIN_EMAIL = 'contact@nextaz.ro';
const FROM_EMAIL = 'Nextaz <comenzi@nextaz.ro>';

// Resend Template IDs - create these templates in your Resend dashboard
// https://resend.com/templates
const TEMPLATES = {
  // Template for customer order confirmation
  CUSTOMER_ORDER_CONFIRMATION: import.meta.env.RESEND_TEMPLATE_CUSTOMER_CONFIRMATION || '',
  // Template for admin new order notification
  ADMIN_ORDER_NOTIFICATION: import.meta.env.RESEND_TEMPLATE_ADMIN_NOTIFICATION || '',
};

/**
 * Order data structure passed to Resend templates
 * Use these variable names in your Resend templates
 */
export interface OrderTemplateData {
  // Order info
  order_number: string;
  order_date: string;

  // Customer info
  customer_name: string;
  customer_email: string;
  customer_phone: string;

  // Items - as a formatted HTML string for simplicity, or individual item data
  items: Array<{
    name: string;
    quantity: number;
    unit_price: string;
    total_price: string;
    variant?: string;
    image_url?: string;
  }>;

  // Pricing
  subtotal: string;
  shipping_cost: string;
  discount_amount: string;
  has_discount: boolean;
  is_free_shipping: boolean;
  total: string;

  // Shipping address
  shipping_name: string;
  shipping_street: string;
  shipping_city: string;
  shipping_county: string;
  shipping_postal_code: string;
  shipping_country: string;

  // Billing address
  billing_name: string;
  billing_street: string;
  billing_city: string;
  billing_county: string;
  billing_postal_code: string;
  billing_country: string;
  billing_company_name: string;
  billing_vat_number: string;
  is_company: boolean;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ro-RO', {
    style: 'currency',
    currency: 'RON',
  }).format(amount);
}

function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('ro-RO', {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(new Date(dateString));
}

function orderToTemplateData(order: Order): OrderTemplateData {
  const items = order.items as OrderItem[];

  return {
    // Order info
    order_number: order.order_number,
    order_date: formatDate(order.created_at),

    // Customer info
    customer_name: order.customer_name,
    customer_email: order.customer_email,
    customer_phone: order.customer_phone || 'N/A',

    // Items
    items: items.map((item) => ({
      name: item.product_name,
      quantity: item.quantity,
      unit_price: formatCurrency(item.unit_price),
      total_price: formatCurrency(item.total_price),
      variant: item.variant,
      image_url: item.image_url,
    })),

    // Pricing
    subtotal: formatCurrency(order.subtotal),
    shipping_cost: formatCurrency(order.shipping_cost),
    discount_amount: formatCurrency(order.discount_amount),
    has_discount: order.discount_amount > 0,
    is_free_shipping: order.shipping_cost === 0,
    total: formatCurrency(order.total_amount),

    // Shipping address
    shipping_name: order.shipping_name,
    shipping_street: order.shipping_street,
    shipping_city: order.shipping_city,
    shipping_county: order.shipping_county || '',
    shipping_postal_code: order.shipping_postal_code,
    shipping_country: order.shipping_country,

    // Billing address
    billing_name: order.billing_name,
    billing_street: order.billing_street,
    billing_city: order.billing_city,
    billing_county: order.billing_county || '',
    billing_postal_code: order.billing_postal_code,
    billing_country: order.billing_country,
    billing_company_name: order.billing_company_name || '',
    billing_vat_number: order.billing_vat_number || '',
    is_company: !!order.billing_company_name,
  };
}

/**
 * Send order confirmation email to the customer using Resend template
 */
export async function sendCustomerOrderConfirmation(order: Order): Promise<{ success: boolean; error?: string }> {
  if (!TEMPLATES.CUSTOMER_ORDER_CONFIRMATION) {
    console.error('Customer confirmation template ID not configured (RESEND_TEMPLATE_CUSTOMER_CONFIRMATION)');
    return { success: false, error: 'Template not configured' };
  }

  try {
    const templateData = orderToTemplateData(order);

    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: order.customer_email,
      subject: `Confirmare comanda #${order.order_number} - Nextaz`,
      react: undefined, // Using template instead
      // @ts-expect-error - Resend SDK types don't include template support yet
      template_id: TEMPLATES.CUSTOMER_ORDER_CONFIRMATION,
      data: templateData,
    });

    if (error) {
      console.error('Failed to send customer confirmation email:', error);
      return { success: false, error: error.message };
    }

    console.log(`Customer confirmation email sent to ${order.customer_email} for order ${order.order_number}`);
    return { success: true };
  } catch (error) {
    console.error('Error sending customer confirmation email:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Send order notification email to admin using Resend template
 */
export async function sendAdminOrderNotification(order: Order): Promise<{ success: boolean; error?: string }> {
  if (!TEMPLATES.ADMIN_ORDER_NOTIFICATION) {
    console.error('Admin notification template ID not configured (RESEND_TEMPLATE_ADMIN_NOTIFICATION)');
    return { success: false, error: 'Template not configured' };
  }

  try {
    const templateData = orderToTemplateData(order);

    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_EMAIL,
      replyTo: order.customer_email,
      subject: `[Comanda noua] #${order.order_number} - ${order.customer_name} - ${formatCurrency(order.total_amount)}`,
      react: undefined, // Using template instead
      // @ts-expect-error - Resend SDK types don't include template support yet
      template_id: TEMPLATES.ADMIN_ORDER_NOTIFICATION,
      data: templateData,
    });

    if (error) {
      console.error('Failed to send admin notification email:', error);
      return { success: false, error: error.message };
    }

    console.log(`Admin notification email sent for order ${order.order_number}`);
    return { success: true };
  } catch (error) {
    console.error('Error sending admin notification email:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Send both customer confirmation and admin notification emails
 */
export async function sendOrderConfirmationEmails(order: Order): Promise<{
  customerEmail: { success: boolean; error?: string };
  adminEmail: { success: boolean; error?: string };
}> {
  // Send both emails in parallel
  const [customerResult, adminResult] = await Promise.all([
    sendCustomerOrderConfirmation(order),
    sendAdminOrderNotification(order),
  ]);

  return {
    customerEmail: customerResult,
    adminEmail: adminResult,
  };
}
