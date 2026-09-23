export default async function handler(req, res) {
    if (req.method !== 'POST') {
      return res.status(405).json({ message: 'Method Not Allowed' });
    }
    try {
      const serverKey = process.env.MIDTRANS_SERVER_KEY;
      const env = process.env.MIDTRANS_ENV || 'sandbox';
      const siteUrl = process.env.SITE_URL;
      if (!serverKey) {
        return res.status(500).json({ error: 'Payment gateway belum dikonfigurasi' });
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
            payment_link_name: 'Pembayaran Arvilo',
            payment_link_expiry: 7,
            payment_link_url: siteUrl,
            payment_link_amount: { value: 15000, currency: 'IDR' }
          }
        }),
      });
      const data = await response.json();
      if (data.payment_link && data.payment_link.payment_link_url) {
        return res.status(200).json({ success: true, url: data.payment_link.payment_link_url });
      } else {
        throw new Error(data.message || 'Gagal membuat link pembayaran');
      }
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }
