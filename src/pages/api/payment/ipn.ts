import type { APIRoute } from 'astro';

export const prerender = false;

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

function mapNetopiaStatusToOrderStatus(netopiaStatus: number): string {
  switch (netopiaStatus) {
    case NETOPIA_STATUS.PAID:
    case NETOPIA_STATUS.PAID_PENDING:
    case NETOPIA_STATUS.CREDIT:
      return 'paid';
    case NETOPIA_STATUS.DECLINED:
    case NETOPIA_STATUS.ERROR:
      return 'failed';
    case NETOPIA_STATUS.CANCELED:
      return 'cancelled';
    default:
      return 'pending';
  }
}

// TODO: Replace with actual Supabase order update
// import { createClient } from '@supabase/supabase-js';
// const supabase = createClient(
//   import.meta.env.SUPABASE_URL,
//   import.meta.env.SUPABASE_ANON_KEY
// );
async function updateOrderStatus(
  orderId: string,
  status: string,
  netopiaId?: string
): Promise<void> {
  // TODO: Implement Supabase order update
  // const { error } = await supabase
  //   .from('orders')
  //   .update({ status, netopia_id: netopiaId, updated_at: new Date().toISOString() })
  //   .eq('order_id', orderId);
  // if (error) throw error;

  // For now, just log the update
  console.log(`Order ${orderId} updated (mock):`, { status, netopiaId });
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
    const orderId = payload.order?.orderID;
    const netopiaId = payload.payment?.ntpID;
    const paymentStatus = payload.payment?.status;

    if (!orderId) {
      console.error('IPN missing orderId');
      return new Response(
        JSON.stringify({ errorType: 0, errorCode: '', errorMessage: 'Missing orderId' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Map Netopia status to our order status
    const orderStatus = mapNetopiaStatusToOrderStatus(paymentStatus);

    // Update order in database (Supabase)
    try {
      await updateOrderStatus(orderId, orderStatus, netopiaId);
      console.log(`Order ${orderId} updated to status: ${orderStatus}`);
    } catch (dbError) {
      console.error('Failed to update order in database:', dbError);
      // Don't fail the IPN response - Netopia needs confirmation
    }

    // TODO: Send confirmation email if payment succeeded
    // if (orderStatus === 'paid') {
    //   await sendOrderConfirmationEmail(orderId);
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
