import type { APIRoute } from 'astro';

export const prerender = false;

import { updateOrderPaymentStatus } from '../../../lib/supabase';
import { verifyIPN, isNetopiaConfigured, type IPNPayload } from '../../../lib/netopia';
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

function jsonResponse(data: object, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const POST: APIRoute = async ({ request }) => {
  console.log('=== IPN POST RECEIVED ===');
  console.log('Headers:', Object.fromEntries(request.headers.entries()));

  try {
    // Get verification token from header (Netopia v2)
    const verifyToken = request.headers.get('verification-token');

    // Parse the IPN payload
    const contentType = request.headers.get('content-type');
    let payload: IPNPayload;

    // Clone request to read body as text first for debugging
    const bodyText = await request.text();
    console.log('Raw IPN body:', bodyText);

    if (!bodyText) {
      console.error('IPN received with empty body');
      return jsonResponse(
        { errorType: 1, errorCode: 'EMPTY_BODY', errorMessage: 'Empty request body' },
        400
      );
    }

    if (contentType?.includes('application/json')) {
      payload = JSON.parse(bodyText);
    } else {
      // Handle form-encoded data if needed
      const params = new URLSearchParams(bodyText);
      payload = JSON.parse(params.get('data') || '{}');
    }

    console.log('Parsed IPN payload:', JSON.stringify(payload, null, 2));
    console.log('Verification token present:', !!verifyToken);

    // Verify IPN signature if Netopia is configured and token is present
    if (isNetopiaConfigured() && verifyToken) {
      const isValid = await verifyIPN(verifyToken, payload);
      if (!isValid) {
        console.error('IPN signature verification failed');
        return jsonResponse(
          { errorType: 1, errorCode: 'INVALID_SIGNATURE', errorMessage: 'Invalid signature' },
          400
        );
      }
      console.log('IPN signature verified successfully');
    } else if (isNetopiaConfigured() && !verifyToken) {
      console.warn('IPN received without verification token');
      // Continue processing - some Netopia configurations may not send token
    }

    // Extract order information
    // orderID from Netopia is our order_number (e.g., "2026-000001")
    const orderNumber = payload.order?.orderID;
    const netopiaId = payload.payment?.ntpID;
    const netopiaStatus = payload.payment?.status;

    if (!orderNumber) {
      console.error('IPN missing orderID (order number)');
      return jsonResponse(
        { errorType: 1, errorCode: 'MISSING_ORDER', errorMessage: 'Missing orderID' },
        400
      );
    }

    // Map Netopia status to our order status
    const { orderStatus, paymentStatus } = mapNetopiaStatusToOrderStatus(netopiaStatus);

    console.log(`IPN for order ${orderNumber}: Netopia status ${netopiaStatus} -> ${orderStatus} (${paymentStatus})`);

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
    // Netopia expects this specific response format
    return jsonResponse({
      errorType: 0,
      errorCode: '',
      errorMessage: 'OK',
    });
  } catch (error) {
    console.error('IPN processing error:', error);

    // Return error response to Netopia
    return jsonResponse(
      { errorType: 1, errorCode: 'SERVER_ERROR', errorMessage: 'Internal server error' },
      500
    );
  }
};

// Also support GET for testing/health check
export const GET: APIRoute = async () => {
  return jsonResponse({
    status: 'IPN endpoint active',
    netopiaConfigured: isNetopiaConfigured(),
  });
};
