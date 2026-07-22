import express from 'express';
import crypto from 'crypto';
import { createPaymentSession } from '../services/zoho.js';

const router = express.Router();

/**
 * Endpoint called when the user clicks "Buy Now" on Blogger.
 */
router.get('/create-payment', async (req, res) => {
  try {
    const sessionData = await createPaymentSession(99.00, 'Pixel Malayali LUTs Pack');
    
    // Parse official response attributes for Hosted Checkout
    const accessKey = sessionData.online_payment_session?.configurations?.hosted_checkout_parameters?.access_key || sessionData.access_key;
    const checkoutUrl = sessionData.online_payment_session?.url || sessionData.url || (accessKey ? `https://payments.zoho.in/hostedcheckout/${accessKey}` : null);

    if (checkoutUrl) {
      return res.redirect(checkoutUrl);
    } else {
      console.error('Invalid payment session structure returned from Zoho:', sessionData);
      return res.status(500).send('Failed to parse checkout redirect URL from Zoho response.');
    }
  } catch (error) {
    res.status(500).send(`Payment Initialization Error: ${error.response?.data?.message || error.message}`);
  }
});

/**
 * Success Route: Generates a secure, expiring token instead of exposing a raw static URL.
 */
router.get('/payment-success', (req, res) => {
  const { payment_id, payments_session_id } = req.query;
  const transactionId = payment_id || payments_session_id || 'VERIFIED';

  // Generate a cryptographically signed secure token valid for 15 minutes
  const expiryTime = Date.now() + 15 * 60 * 1000; 
  const dataToSign = `${transactionId}:${expiryTime}`;
  const secureToken = crypto
    .createHmac('sha256', process.env.SECRET_DOWNLOAD_KEY || 'fallback_secret')
    .update(dataToSign)
    .digest('hex');

  const secureDownloadUrl = `${process.env.BASE_URL}/download-file?tx=${transactionId}&exp=${expiryTime}&token=${secureToken}`;

  res.send(`
    <html>
      <body style="font-family: Arial; text-align: center; background: #0f0f0f; color: #fff; padding-top: 50px;">
        <div style="max-width: 500px; margin: auto; background: #1a1a1a; padding: 40px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,204,68,0.2);">
          <h1 style="color: #00cc44;">Payment Successful! 🎉</h1>
          <p>Thank you for purchasing from Pixel Malayali.</p>
          <p style="color: #888; font-size: 14px;">Transaction Reference: ${transactionId}</p>
          <p style="color: #ffcc00; font-size: 12px;">⚠️ Your secure download link expires in 15 minutes.</p>
          <br/>
          <a href="${secureDownloadUrl}" style="display: inline-block; background: #00cc44; color: #fff; padding: 14px 28px; text-decoration: none; border-radius: 30px; font-weight: bold; text-transform: uppercase;">
            Download Your Files Securely
          </a>
          <br/><br/><br/>
          <a href="${process.env.FRONTEND_URL}" style="color: #aaa; text-decoration: none; font-size: 14px;">Return to Pixel Malayali Home</a>
        </div>
      </body>
    </html>
  `);
});

/**
 * Secure Download Endpoint: Validates token signature and expiration before serving the file or redirecting.
 */
router.get('/download-file', (req, res) => {
  const { tx, exp, token } = req.query;

  if (!tx || !exp || !token) {
    return res.status(403).send('Invalid or missing download parameters.');
  }

  // Check if token has expired (15-minute window)
  if (Date.now() > parseInt(exp, 10)) {
    return res.status(403).send(`
      <html>
        <body style="font-family: Arial; text-align: center; background: #111; color: #ff3333; padding-top: 50px;">
          <h1>Download Link Expired ❌</h1>
          <p>For security reasons, this download link has expired after 15 minutes.</p>
          <a href="${process.env.FRONTEND_URL}" style="color: #fff;">Return to Store</a>
        </body>
      </html>
    `);
  }

  // Verify HMAC signature
  const dataToSign = `${tx}:${exp}`;
  const expectedToken = crypto
    .createHmac('sha256', process.env.SECRET_DOWNLOAD_KEY || 'fallback_secret')
    .update(dataToSign)
    .digest('hex');

  if (token !== expectedToken) {
    return res.status(403).send('Security signature verification failed.');
  }

  // Signature valid & unexpired: Redirect securely to your actual cloud file storage (e.g., Mega / Google Drive)
  const actualProtectedFileUrl = 'https://mega.nz/your-actual-protected-file-link-here';
  return res.redirect(actualProtectedFileUrl);
});

// Failure Route
router.get('/payment-failed', (req, res) => {
  res.send(`
    <html>
      <body style="font-family: Arial; text-align: center; background: #0f0f0f; color: #fff; padding-top: 50px;">
        <div style="max-width: 500px; margin: auto; background: #1a1a1a; padding: 40px; border-radius: 12px; box-shadow: 0 4px 20px rgba(255,0,0,0.2);">
          <h1 style="color: #ff3333;">Payment Failed ❌</h1>
          <p>The transaction was canceled or unsuccessful.</p>
          <br/>
          <a href="${process.env.FRONTEND_URL}" style="display: inline-block; background: #ff3333; color: #fff; padding: 14px 28px; text-decoration: none; border-radius: 30px; font-weight: bold; text-transform: uppercase;">
            Try Again
          </a>
        </div>
      </body>
    </html>
  `);
});

export default router;
