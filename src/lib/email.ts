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
 * Use these variable names in your Resend templates with {{variable_name}} syntax
 *
 * Note: Variable keys may only contain ASCII letters (a–z, A–Z), numbers (0–9), and underscores
 * String values have a maximum of 2,000 characters
 */
export interface OrderTemplateVariables {
  // Order info
  order_number: string;
  order_date: string;

  // Customer info
  customer_name: string;
  customer_email: string;
  customer_phone: string;

  // Company info (for B2B orders)
  is_company: string; // "true" or "false"
  company_name: string;
  company_vat: string; // CUI
  company_reg: string; // Nr. Reg. Com.

  // Items as pre-formatted HTML table
  items_html: string;
  items_count: number;

  // Pricing
  subtotal: string;
  shipping_cost: string;
  discount_amount: string;
  has_discount: string; // "true" or "false" as string for template conditionals
  is_free_shipping: string;
  total: string;

  // Shipping address
  shipping_full_address: string;

  // Billing address
  billing_full_address: string;
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

function formatAddress(address: {
  name: string;
  street: string;
  city: string;
  county: string;
  postalCode: string;
  country: string;
  companyName?: string;
}): string {
  const parts = [address.name];
  if (address.companyName) parts.unshift(address.companyName);
  parts.push(address.street);
  parts.push(`${address.city}${address.county ? `, ${address.county}` : ''}`);
  parts.push(address.postalCode);
  parts.push(address.country);
  return parts.join('\n');
}

function formatItemsHtml(items: OrderItem[]): string {
  const rows = items
    .map(
      (item) => `
      <tr>
        <td style="padding: 12px 8px; border-bottom: 1px solid #e5e7eb; vertical-align: top;">
          <strong style="color: #111827;">${item.product_name}</strong>
          ${item.variant ? `<br><span style="color: #6b7280; font-size: 13px;">${item.variant}</span>` : ''}
        </td>
        <td style="padding: 12px 8px; border-bottom: 1px solid #e5e7eb; text-align: center; color: #374151;">${item.quantity}</td>
        <td style="padding: 12px 8px; border-bottom: 1px solid #e5e7eb; text-align: right; color: #374151;">${formatCurrency(item.unit_price)}</td>
        <td style="padding: 12px 8px; border-bottom: 1px solid #e5e7eb; text-align: right; color: #111827; font-weight: 500;">${formatCurrency(item.total_price)}</td>
      </tr>`
    )
    .join('');

  return `
    <table style="width: 100%; border-collapse: collapse;">
      <thead>
        <tr style="background-color: #f9fafb;">
          <th style="padding: 12px 8px; text-align: left; color: #6b7280; font-size: 12px; text-transform: uppercase; font-weight: 600;">Produs</th>
          <th style="padding: 12px 8px; text-align: center; color: #6b7280; font-size: 12px; text-transform: uppercase; font-weight: 600;">Cant.</th>
          <th style="padding: 12px 8px; text-align: right; color: #6b7280; font-size: 12px; text-transform: uppercase; font-weight: 600;">Preț</th>
          <th style="padding: 12px 8px; text-align: right; color: #6b7280; font-size: 12px; text-transform: uppercase; font-weight: 600;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  `;
}

function orderToTemplateVariables(order: Order): OrderTemplateVariables {
  const items = order.items as unknown as OrderItem[];

  return {
    // Order info
    order_number: order.order_number,
    order_date: formatDate(order.created_at),

    // Customer info
    customer_name: order.customer_name,
    customer_email: order.customer_email,
    customer_phone: order.customer_phone || 'N/A',

    // Company info (for B2B orders)
    is_company: order.billing_company_name ? 'true' : 'false',
    company_name: order.billing_company_name || '',
    company_vat: order.billing_vat_number || '',
    company_reg: order.billing_registration_number || '',

    // Items as HTML table
    items_html: formatItemsHtml(items),
    items_count: items.length,

    // Pricing
    subtotal: formatCurrency(order.subtotal),
    shipping_cost: formatCurrency(order.shipping_cost),
    discount_amount: formatCurrency(order.discount_amount),
    has_discount: order.discount_amount > 0 ? 'true' : 'false',
    is_free_shipping: order.shipping_cost === 0 ? 'true' : 'false',
    total: formatCurrency(order.total_amount),

    // Shipping address
    shipping_full_address: formatAddress({
      name: order.shipping_name,
      street: order.shipping_street,
      city: order.shipping_city,
      county: order.shipping_county || '',
      postalCode: order.shipping_postal_code,
      country: order.shipping_country,
    }),

    // Billing address
    billing_full_address: formatAddress({
      name: order.billing_name,
      street: order.billing_street,
      city: order.billing_city,
      county: order.billing_county || '',
      postalCode: order.billing_postal_code,
      country: order.billing_country,
      companyName: order.billing_company_name || undefined,
    }),
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
    const variables = orderToTemplateVariables(order);

    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [order.customer_email],
      subject: `Confirmare comandă #${order.order_number} - Nextaz`,
      template: {
        id: TEMPLATES.CUSTOMER_ORDER_CONFIRMATION,
        variables: variables as unknown as Record<string, string | number>,
      },
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
    const variables = orderToTemplateVariables(order);

    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [ADMIN_EMAIL],
      replyTo: order.customer_email,
      subject: `[Comandă nouă] #${order.order_number} - ${order.customer_name} - ${formatCurrency(order.total_amount)}`,
      template: {
        id: TEMPLATES.ADMIN_ORDER_NOTIFICATION,
        variables: variables as unknown as Record<string, string | number>,
      },
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
