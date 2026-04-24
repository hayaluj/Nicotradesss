const PRICES = {
  course: 'price_1TH2G3GmYFXIEfvk4XmrWMGV',       // €99 one-time
  vip: 'price_1TH2GMGmYFXIEfvkdBvNE2a4',            // €29/month
  session: 'price_1TH2GhGmYFXIEfvkuHo7ZAdC',        // €199 one-time
  templates: 'price_1TH2H3GmYFXIEfvk9PD28dII',      // €19 one-time
};

const MODES = {
  course: 'payment',
  vip: 'subscription',
  session: 'payment',
  templates: 'payment',
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { product, userId, email, successUrl, cancelUrl } = req.body;

    if (!product || !PRICES[product]) {
      return res.status(400).json({ error: 'Invalid product. Use: course, vip, session, or templates' });
    }

    const origin = req.headers.origin || 'https://nicotradesss.com';
    const params = new URLSearchParams();
    params.append('mode', MODES[product]);
    params.append('line_items[0][price]', PRICES[product]);
    params.append('line_items[0][quantity]', '1');
    params.append('success_url', successUrl || `${origin}/dashboard?payment=success`);
    params.append('cancel_url', cancelUrl || `${origin}/?payment=cancelled`);
    params.append('allow_promotion_codes', 'true');
    params.append('metadata[product]', product);
    params.append('metadata[userId]', userId || '');
    params.append('metadata[tier]', product === 'vip' ? 'vip' : product === 'course' ? 'course' : '');

    if (email) {
      params.append('customer_email', email);
    }

    const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const data = await stripeRes.json();

    if (!stripeRes.ok) {
      console.error('Stripe error:', data);
      return res.status(500).json({ error: data?.error?.message || 'Stripe error' });
    }

    res.status(200).json({ url: data.url, sessionId: data.id });
  } catch (err) {
    console.error('Checkout error:', err);
    res.status(500).json({ error: err.message });
  }
}
