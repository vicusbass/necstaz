const MAILERLITE_API_KEY = import.meta.env.MAILERLITE_API_KEY;
const MAILERLITE_API_URL = 'https://connect.mailerlite.com/api';

interface SubscribeEmailResponse {
  success: boolean;
  message?: string;
  data?: any;
}
export async function subscribeEmail(email: string): Promise<SubscribeEmailResponse> {
  try {
    const response = await fetch(`${MAILERLITE_API_URL}/subscribers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${MAILERLITE_API_KEY}`,
        Accept: 'application/json',
      },
      body: JSON.stringify({
        email: email,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.message || 'Failed to subscribe email',
        data,
      };
    }

    return {
      success: true,
      message: 'Email successfully subscribed',
      data,
    };
  } catch (error) {
    console.error('MailerLite subscription error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}
