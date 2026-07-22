import express from 'express';
import { exchangeCodeForTokens } from '../services/zoho.js';

const router = express.Router();

router.get('/oauth/start', (req, res) => {
  const scope = 'ZohoPay.payments.CREATE,ZohoPay.payments.READ';
  const soid = `zohopay.${process.env.ZOHO_ACCOUNT_ID}`;
  const redirectUri = `${process.env.BASE_URL}/oauth/callback`;

  const authUrl =
    `https://accounts.zoho.in/oauth/v2/org/auth` +
    `?response_type=code` +
    `&client_id=${process.env.ZOHO_CLIENT_ID}` +
    `&soid=${soid}` +
    `&scope=${encodeURIComponent(scope)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&access_type=offline` +
    `&prompt=consent`;

  console.log('========== OAuth Debug ==========');
  console.log('BASE_URL:', process.env.BASE_URL);
  console.log('Redirect URI:', redirectUri);
  console.log('Generated URL:', authUrl);
  console.log('=================================');

  res.setHeader('Content-Type', 'text/plain');
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
    console.log('Access Token:', tokenData.access_token);
    console.log('Refresh Token:', tokenData.refresh_token);
    console.log('==============================');

    res.send(`
<h2>OAuth Success</h2>
<p>Access Token generated successfully.</p>
<p>Refresh Token: ${tokenData.refresh_token || 'Not returned'}</p>
`);
  } catch (err) {
    console.error(err.response?.data || err.message);

    res.status(500).send(`
<h2>OAuth Failed</h2>
<pre>${JSON.stringify(err.response?.data || err.message, null, 2)}</pre>
`);
  }
});

export default router;
