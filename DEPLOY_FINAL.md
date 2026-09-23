# Arvilo Final

Versi final berbasis Arvilo V4 Scroll Fix dengan:
- Arvilo branding
- 1.000 template
- editor + live preview
- export HTML/PDF
- payment gateway Midtrans via Netlify Functions
- API routes `/api/create-payment` dan `/api/check-payment`

Environment variables di Netlify:
- MIDTRANS_SERVER_KEY = Server Key Midtrans (jangan taruh di frontend)
- MIDTRANS_ENV = sandbox
- SITE_URL = https://arvilo.netlify.app

Deploy seluruh isi ZIP ini dengan `index.html` di root. Setelah mengubah environment variables, trigger deploy ulang.
