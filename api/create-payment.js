export default async (request) => {
  const headers = { 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': '*' };
  if (request.method === 'OPTIONS') return new Response('', { status: 204, headers });
  if (request.method !== 'POST') return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers });

  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  const env = (process.env.MIDTRANS_ENV || 'sandbox').toLowerCase();
  if (!serverKey) return new Response(JSON.stringify({ error: 'Payment gateway belum dikonfigurasi di server.' }), { status: 500, headers });

  let body = {};
  try { body = await request.json(); } catch {}
  const amount = Number(body.amount || 15000);
  if (!Number.isFinite(amount) || amount !== 15000) {
    return new Response(JSON.stringify({ error: 'Nominal pembayaran tidak valid.' }), { status: 400, headers });
  }

  const orderId = `ARV-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  const endpoint = env === 'production'
    ? 'https://api.midtrans.com/v1/payment-links'
    : 'https://api.sandbox.midtrans.com/v1/payment-links';
  const auth = Buffer.from(`${serverKey}:`).toString('base64');

  const payload = {
    transaction_details: { order_id: orderId, gross_amount: amount },
    item_details: [{ id: 'ARVILO-PORTFOLIO', price: amount, quantity: 1, name: 'Arvilo Portfolio Builder' }],
    usage_limit: 1
  };

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'Authorization': `Basic ${auth}` },
      body: JSON.stringify(payload)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.payment_url) {
      return new Response(JSON.stringify({ error: data.error_messages?.join(' ') || data.message || 'Midtrans gagal membuat payment link.' }), { status: 502, headers });
    }
    return new Response(JSON.stringify({ payment_url: data.payment_url, order_id: orderId, payment_id: data.id || null }), { status: 200, headers });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Server tidak dapat terhubung ke Midtrans.' }), { status: 502, headers });
  }
};
