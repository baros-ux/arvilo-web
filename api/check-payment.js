// Vercel Serverless Function (Node) — handler format: (req, res)
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  const env = (process.env.MIDTRANS_ENV || 'sandbox').toLowerCase();
  const orderId = req.query?.order_id;
  if (!serverKey) return res.status(500).json({ error: 'Payment gateway belum dikonfigurasi di server.' });
  if (!orderId || !/^ARV-[A-Z0-9-]+$/i.test(orderId)) return res.status(400).json({ error: 'Order ID tidak valid.' });

  const endpoint = env === 'production'
    ? `https://api.midtrans.com/v2/${encodeURIComponent(orderId)}/status`
    : `https://api.sandbox.midtrans.com/v2/${encodeURIComponent(orderId)}/status`;
  const auth = Buffer.from(`${serverKey}:`).toString('base64');

  try {
    const r = await fetch(endpoint, { headers: { Accept: 'application/json', Authorization: `Basic ${auth}` } });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) return res.status(200).json({ paid: false, status: data.status_message || 'unknown' });
    const paid = ['settlement', 'capture'].includes(String(data.transaction_status || '').toLowerCase()) &&
      String(data.fraud_status || 'accept').toLowerCase() !== 'deny';
    return res.status(200).json({ paid, status: data.transaction_status || 'unknown', order_id: orderId });
  } catch (e) {
    console.error('check-payment gagal:', e);
    return res.status(502).json({ error: 'Status pembayaran belum bisa diperiksa.' });
  }
}
