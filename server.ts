import 'dotenv/config';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'refill-plus-api' });
  });

  // Razorpay configuration check (never exposes secret)
  app.get('/api/payments/razorpay/status', (_req, res) => {
    const keyId = process.env.RAZORPAY_KEY_ID?.trim() || '';
    const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim() || '';
    const configured = Boolean(keyId && keySecret);
    res.json({
      configured,
      keyId: configured ? keyId : null,
    });
  });

  // Create real Razorpay Order via Razorpay Orders API when credentials are present
  app.post('/api/payments/razorpay/create-order', async (req, res) => {
    const keyId = process.env.RAZORPAY_KEY_ID?.trim() || '';
    const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim() || '';

    if (!keyId || !keySecret) {
      res.status(503).json({
        error: 'Razorpay API credentials are not configured on this server.',
        configured: false,
      });
      return;
    }

    const amountInr = Number(req.body?.amountInr);
    const receipt = String(req.body?.receipt || `rfl_${Date.now()}`).slice(0, 40);

    if (!Number.isFinite(amountInr) || amountInr <= 0) {
      res.status(400).json({ error: 'Valid positive INR amount is required.' });
      return;
    }

    try {
      const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
      const rzpResponse = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: Math.round(amountInr * 100),
          currency: 'INR',
          receipt,
        }),
      });

      const payload = await rzpResponse.json();
      if (!rzpResponse.ok) {
        res.status(rzpResponse.status).json({
          error: payload?.error?.description || 'Failed to create Razorpay order.',
        });
        return;
      }

      res.json({
        orderId: payload.id,
        amount: payload.amount,
        currency: payload.currency,
        keyId,
      });
    } catch (err) {
      console.error('Razorpay order creation failed:', err);
      res.status(500).json({ error: 'Unable to reach Razorpay payment gateway.' });
    }
  });

  // Verify Razorpay HMAC-SHA256 signature server-side
  app.post('/api/payments/razorpay/verify', (req, res) => {
    const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim() || '';
    if (!keySecret) {
      res.status(503).json({ verified: false, error: 'Razorpay credentials not configured.' });
      return;
    }

    const orderId = String(req.body?.razorpay_order_id || '');
    const paymentId = String(req.body?.razorpay_payment_id || '');
    const signature = String(req.body?.razorpay_signature || '');

    if (!orderId || !paymentId || !signature) {
      res.status(400).json({ verified: false, error: 'Missing payment verification fields.' });
      return;
    }

    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    const verified =
      expectedSignature.length === signature.length &&
      crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(signature));

    if (!verified) {
      res.status(400).json({ verified: false, error: 'Invalid payment signature.' });
      return;
    }

    res.json({ verified: true, paymentId, orderId });
  });

  if (!IS_PRODUCTION) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      const indexFile = path.join(distDir, 'index.html');
      if (fs.existsSync(indexFile)) {
        res.sendFile(indexFile);
      } else {
        res.status(404).send('Build artifacts not found. Run npm run build first.');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`REFILL+ server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start REFILL+ server:', err);
  process.exit(1);
});
