// Vercel Serverless Function (Node) — handler format: (req, res)
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  const env = (process.env.MIDTRANS_ENV || 'sandbox').toLowerCase();
  if (!serverKey) {
    console.error('MIDTRANS_SERVER_KEY belum di-set di Vercel (Production)');
    return res.status(500).json({ error: 'Payment gateway belum dikonfigurasi di server.' });
  }

  let body = req.body || {};
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  const amount = Number(body.amount || 15000);
  if (!Number.isFinite(amount) || amount !== 15000) {
    return res.status(400).json({ error: 'Nominal pembayaran tidak valid.' });
  }

  const orderId = `ARV-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  const endpoint = env === 'production'
    ? 'https://api.midtrans.com/v1/payment-links'
    : 'https://api.sandbox.midtrans.com/v1/payment-links';
  const auth = Buffer.from(`${serverKey}:`).toString('base64');

  // Setelah bayar, pembeli diarahkan balik ke situs; frontend otomatis cek status & buka editor.
  const siteUrl = (process.env.SITE_URL || `https://${req.headers.host}`).replace(/\/+$/, '');

  const payload = {
    transaction_details: { order_id: orderId, gross_amount: amount },
    item_details: [{ id: 'ARVILO-PORTFOLIO', price: amount, quantity: 1, name: 'Arvilo Portfolio Builder' }],
    callbacks: { finish: `${siteUrl}/?payment=finish&order_id=${encodeURIComponent(orderId)}` },
    usage_limit: 1
  };

  try {
    const r = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', Authorization: `Basic ${auth}` },
      body: JSON.stringify(payload)
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok || !data.payment_url) {
      console.error('Midtrans error:', r.status, data);
      return res.status(502).json({
        error: data.error_messages?.join(' ') || data.message || 'Midtrans gagal membuat payment link.'
      });
    }
    return res.status(200).json({ payment_url: data.payment_url, order_id: orderId, payment_id: data.id || null });
  } catch (e) {
    console.error('create-payment gagal:', e);
    return res.status(502).json({ error: 'Server tidak dapat terhubung ke Midtrans.' });
  }
}
