export default async function handler(req, res) {
    // Menghilangkan CORS issue
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
      const serverKey = process.env.MIDTRANS_SERVER_KEY;
      const env = process.env.MIDTRANS_ENV || 'sandbox';
      const siteUrl = process.env.SITE_URL;

      if (!serverKey) {
        return res.status(500).json({ error: 'Konfigurasi missing' });
      }

      const baseUrl = env === 'production'
        ? 'https://app.midtrans.com/snap/v1/payment-links'
        : 'https://app.sandbox.midtrans.com/snap/v1/payment-links';

      const response = await fetch(baseUrl, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': 'Basic ' + Buffer.from(serverKey + ':').toString('base64'),
        },
        body: JSON.stringify({
          payment_link: {
            amount: 15000,
            payment_link_name: 'Arvilo Payment',
            payment_link_expiry: 7,
            payment_link_url: siteUrl,
            payment_link_amount: { value: 15000, currency: 'IDR' }
          }
        }),
      });

      const data = await response.json();
      return res.status(200).json({ success: true, url: data.payment_link?.payment_link_url });

    } catch (e) {
      return res.status(500).json({ success: false, message: e.message });
    }
  }
