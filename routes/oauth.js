import express from 'express';
import { exchangeCodeForTokens } from '../services/zoho.js';

const router = express.Router();

router.get('/oauth/start', (req, res) => {
  const scope = 'ZohoPay.payments.CREATE,ZohoPay.payments.READ';
  const soid = `zohopay.${process.env.ZOHO_ACCOUNT_ID}`;

  const authUrl =
    `https://accounts.zoho.in/oauth/v2/org/auth` +
    `?response_type=code` +
    `&client_id=${process.env.ZOHO_CLIENT_ID}` +
    `&soid=${soid}` +
    `&scope=${encodeURIComponent(scope)}` +
    `&redirect_uri=${encodeURIComponent(process.env.BASE_URL + '/oauth/callback')}` +
    `&access_type=offline` +
    `&prompt=consent`;

  res.redirect(authUrl);
});

router.get('/oauth/callback', async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.status(400).send('Authorization code missing from Zoho redirect.');
  }

  try {
    const tokenData = await exchangeCodeForTokens(code);

    console.log('==============================');
    console.log('OAuth Success');
    console.log('Refresh Token:', tokenData.refresh_token);
    console.log('==============================');

    res.send(`
      <h2>OAuth Success</h2>
      <p>Check your Render logs for the refresh token.</p>
    `);

  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).send('OAuth failed.');
  }
});

export default router;
