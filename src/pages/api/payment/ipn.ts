import type { APIRoute } from 'astro';

export const prerender = false;

import { updateOrderPaymentStatus } from '../../../lib/supabase';
import type { Database } from '../../../lib/database.types';

type OrderStatus = Database['public']['Enums']['order_status'];

// Netopia payment status codes
const NETOPIA_STATUS = {
  PENDING: 0,
  PENDING_AUTH: 1,
  PAID: 2,
  PAID_PENDING: 3,
  SCHEDULED: 4,
  CREDIT: 5,
  DECLINED: 6,
  ERROR: 7,
  CANCELED: 8,
} as const;

interface NetopiaIPNPayload {
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

function mapNetopiaStatusToOrderStatus(netopiaStatus: number): { orderStatus: OrderStatus; paymentStatus: string } {
  switch (netopiaStatus) {
    case NETOPIA_STATUS.PAID:
    case NETOPIA_STATUS.PAID_PENDING:
    case NETOPIA_STATUS.CREDIT:
      return { orderStatus: 'confirmed', paymentStatus: 'paid' };
    case NETOPIA_STATUS.DECLINED:
    case NETOPIA_STATUS.ERROR:
      return { orderStatus: 'cancelled', paymentStatus: 'failed' };
    case NETOPIA_STATUS.CANCELED:
      return { orderStatus: 'cancelled', paymentStatus: 'cancelled' };
    default:
      return { orderStatus: 'pending', paymentStatus: 'pending' };
  }
}

export const POST: APIRoute = async ({ request }) => {
  try {
    // Parse the IPN payload
    // In production, this should verify the signature from Netopia
    const contentType = request.headers.get('content-type');
    let payload: NetopiaIPNPayload;

    if (contentType?.includes('application/json')) {
      payload = await request.json();
    } else {
      // Handle form-encoded data if needed
      const formData = await request.formData();
      payload = JSON.parse((formData.get('data') as string) || '{}');
    }

    console.log('Received IPN:', JSON.stringify(payload, null, 2));

    // Extract order information
    // orderID from Netopia is our order_number (e.g., "2026-000001")
    const orderNumber = payload.order?.orderID;
    const netopiaId = payload.payment?.ntpID;
    const netopiaStatus = payload.payment?.status;

    if (!orderNumber) {
      console.error('IPN missing orderID (order number)');
      return new Response(
        JSON.stringify({ errorType: 0, errorCode: '', errorMessage: 'Missing orderID' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Map Netopia status to our order status
    const { orderStatus, paymentStatus } = mapNetopiaStatusToOrderStatus(netopiaStatus);

    // Update order in database (Supabase)
    try {
      await updateOrderPaymentStatus(orderNumber, orderStatus, {
        paymentStatus,
        paymentReference: netopiaId,
        paidAt: paymentStatus === 'paid' ? new Date().toISOString() : undefined,
      });
      console.log(`Order ${orderNumber} updated to status: ${orderStatus} (payment: ${paymentStatus})`);
    } catch (dbError) {
      console.error('Failed to update order in database:', dbError);
      // Don't fail the IPN response - Netopia needs confirmation
    }

    // TODO: Send confirmation email if payment succeeded
    // if (paymentStatus === 'paid') {
    //   await sendOrderConfirmationEmail(orderNumber);
    // }

    // Return success response to Netopia
    // Netopia expects a specific response format
    return new Response(
      JSON.stringify({
        errorType: 0,
        errorCode: '',
        errorMessage: 'OK',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('IPN processing error:', error);

    // Return error response to Netopia
    return new Response(
      JSON.stringify({
        errorType: 1,
        errorCode: 'SERVER_ERROR',
        errorMessage: 'Internal server error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

// Also support GET for testing/health check
export const GET: APIRoute = async () => {
  return new Response(JSON.stringify({ status: 'IPN endpoint active' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
