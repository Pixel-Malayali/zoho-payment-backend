import axios from 'axios';
import qs from 'qs';

const ZOHO_ACCOUNTS_URL = 'https://accounts.zoho.in';
const ZOHO_API_BASE_URL = 'https://payments.zoho.in/api/v1';

/**
 * Exchanges the authorization code for Access and Refresh tokens.
 */
export async function exchangeCodeForTokens(code) {
  try {
    const response = await axios.post(`${ZOHO_ACCOUNTS_URL}/oauth/v2/token`, qs.stringify({
      code,
      client_id: process.env.ZOHO_CLIENT_ID,
      client_secret: process.env.ZOHO_CLIENT_SECRET,
      redirect_uri: `${process.env.BASE_URL}/oauth/callback`,
      grant_type: 'authorization_code'
    }), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    return response.data;
  } catch (error) {
    console.error('Error exchanging code for tokens:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Refreshes and returns a valid OAuth Access Token.
 */
export async function getValidAccessToken() {
  try {
    const response = await axios.post(`${ZOHO_ACCOUNTS_URL}/oauth/v2/token`, qs.stringify({
      refresh_token: process.env.ZOHO_REFRESH_TOKEN,
      client_id: process.env.ZOHO_CLIENT_ID,
      client_secret: process.env.ZOHO_CLIENT_SECRET,
      grant_type: 'refresh_token'
    }), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    return response.data.access_token;
  } catch (error) {
    console.error('Error refreshing access token:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Creates an Online Payment Session structured for Hosted Checkout.
 * Endpoint: POST /api/v1/online-payment-sessions?account_id={account_id}
 */
export async function createPaymentSession(amount = 99.00, itemName = '100 Ultimate LUTs Pack') {
  const accessToken = await getValidAccessToken();
  const accountId = process.env.ZOHO_ACCOUNT_ID;

  const payload = {
    amount: amount,
    currency: 'INR',
    description: itemName,
    configurations: {
      hosted_checkout_parameters: {
        success_url: `${process.env.BASE_URL}/payment-success`,
        failure_url: `${process.env.BASE_URL}/payment-failed`
      }
    }
  };

  try {
    const response = await axios.post(
      `${ZOHO_API_BASE_URL}/online-payment-sessions?account_id=${accountId}`,
      payload,
      {
        headers: {
          'Authorization': `Zoho-oauthtoken ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error creating Zoho payment session:', error.response?.data || error.message);
    throw error;
  }
}
