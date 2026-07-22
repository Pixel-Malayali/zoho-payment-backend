import express from 'express';
import { exchangeCodeForTokens } from '../services/zoho.js';

const router = express.Router();

/**
 * Step 1: Initiate Organization OAuth Flow using correct Org endpoint and 'soid' parameter format.
 * Fixed: Added missing template literal quotes around the URL string.
 */
router.get('/oauth/start', (req, res) => {
  const scope = 'ZohoPay.payments.CREATE,ZohoPay.payments.READ,ZohoPay.payments.UPDATE';
  const accountId = process.env.ZOHO_ACCOUNT_ID;
  const soid = `zohopay.${accountId}`;

  const authUrl = `https://accounts.zoho.in/oauth/v2/org/auth?response_type=code&client_id=${process.env.ZOHO_CLIENT_ID}&soid=${soid}&scope=${encodeURIComponent(scope)}&redirect_uri=${encodeURIComponent(process.env.BASE_URL + '/oauth/callback')}&access_type=offline&prompt=consent`;
  
  res.redirect(authUrl);
});

/**
 * Step 2: Handle OAuth callback, exchange code, and output refresh token.
 */
router.get('/oauth/callback', async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.status(400).send('Authorization code missing from Zoho redirect.');
  }

  try {
    const tokenData = await exchangeCodeForTokens(code);
    
    console.log('--- OAUTH SUCCESS ---');
    console.log('Refresh Token received:', tokenData.refresh_token);
    console.log('Copy this refresh token and save it to your Render Environment Variables as ZOHO_REFRESH_TOKEN');

    res.send(`
      <html>
        <body style="font-family: Arial; text-align: center; padding-top: 50px; background: #111; color: #fff;">
          <h1 style="color: #00cc44;">OAuth Connection Successful!</h1>
          <p>Your refresh token has been successfully generated and printed to the Render server logs.</p>
          <p>Please check your Render console logs to retrieve the token and store it securely under <b>ZOHO_REFRESH_TOKEN</b>.</p>
        </body>
      </html>
    `);
  } catch (error) {
    res.status(500).send(`OAuth Token Exchange Failed: ${error.message}`);
  }
});

export default router;
