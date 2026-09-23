export default async (request) => {
  const headers = { 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': '*' };
  if (request.method === 'OPTIONS') return new Response('', { status: 204, headers });
  if (request.method !== 'GET') return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers });

  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  const env = (process.env.MIDTRANS_ENV || 'sandbox').toLowerCase();
  const orderId = new URL(request.url).searchParams.get('order_id');
  if (!serverKey) return new Response(JSON.stringify({ error: 'Payment gateway belum dikonfigurasi di server.' }), { status: 500, headers });
  if (!orderId || !/^ARV-[A-Z0-9-]+$/i.test(orderId)) return new Response(JSON.stringify({ error: 'Order ID tidak valid.' }), { status: 400, headers });

  const endpoint = env === 'production'
    ? `https://api.midtrans.com/v2/${encodeURIComponent(orderId)}/status`
    : `https://api.sandbox.midtrans.com/v2/${encodeURIComponent(orderId)}/status`;
  const auth = Buffer.from(`${serverKey}:`).toString('base64');
  try {
    const res = await fetch(endpoint, { headers: { 'Accept': 'application/json', 'Authorization': `Basic ${auth}` } });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return new Response(JSON.stringify({ paid: false, status: data.status_message || 'unknown' }), { status: 200, headers });
    const paid = ['settlement', 'capture'].includes(String(data.transaction_status || '').toLowerCase()) &&
      String(data.fraud_status || 'accept').toLowerCase() !== 'deny';
    return new Response(JSON.stringify({ paid, status: data.transaction_status || 'unknown', order_id: orderId }), { status: 200, headers });
  } catch {
    return new Response(JSON.stringify({ error: 'Status pembayaran belum bisa diperiksa.' }), { status: 502, headers });
  }
};
