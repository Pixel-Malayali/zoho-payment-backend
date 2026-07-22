import express from 'express';
import { exchangeCodeForTokens } from '../services/zoho.js';

const router = express.Router();

router.get('/oauth/start', (req, res) => {
  const scope = 'ZohoPay.fullaccess.ALL';
  
  const authUrl = `https://accounts.zoho.in/oauth/v2/auth?response_type=code&client_id=${process.env.ZOHO_CLIENT_ID}&scope=${scope}&redirect_uri=${encodeURIComponent(process.env.BASE_URL + '/oauth/callback')}&access_type=offline&prompt=consent`;
  
  res.redirect(authUrl);
});

router.get('/oauth/callback', async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.status(400).send('Authorization code missing from Zoho redirect.');
  }

  try {
    const tokenData = await exchangeCodeForTokens(code);
    
    console.log('--- OAUTH SUCCESS ---');
    console.log('Refresh Token received:', tokenData.refresh_token);

    res.send(`
      <html>
        <body style="font-family: Arial; text-align: center; padding-top: 50px; background: #111; color: #fff;">
          <h1 style="color: #00cc44;">OAuth Connection Successful!</h1>
          <p>Check your Render console logs to retrieve your refresh token.</p>
        </body>
      </html>
    `);
  } catch (error) {
    res.status(500).send(`OAuth Token Exchange Failed: ${error.message}`);
  }
});

export default router;
