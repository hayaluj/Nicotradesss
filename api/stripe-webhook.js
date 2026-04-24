import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.SUPABASE_URL || 'https://bpiobqgmllygolbizgde.supabase.co',
  process.env.SUPABASE_SERVICE_KEY
);

export const config = {
  api: { bodyParser: false },
};

async function buffer(readable) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const buf = await buffer(req);
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const { product, userId, tier } = session.metadata || {};
        const email = session.customer_email || session.customer_details?.email;

        console.log(`Checkout completed: product=${product}, email=${email}, tier=${tier}, userId=${userId}`);

        // Update user tier if we have enough info
        if (tier && (userId || email)) {
          if (userId) {
            await supabase
              .from('profiles')
              .update({ tier })
              .eq('id', userId);
          } else if (email) {
            await supabase
              .from('profiles')
              .update({ tier })
              .eq('email', email);
          }
          console.log(`Updated tier to ${tier} for ${userId || email}`);
        }

        // Store the payment record
        await supabase.from('payments').insert({
          stripe_session_id: session.id,
          stripe_customer_id: session.customer,
          email,
          product,
          amount: session.amount_total,
          currency: session.currency,
          status: 'completed',
          user_id: userId || null,
          metadata: session.metadata,
        }).then(({ error }) => {
          if (error) console.error('Payment insert error:', error);
        });

        break;
      }

      case 'customer.subscription.deleted': {
        // Downgrade VIP users when subscription cancelled
        const subscription = event.data.object;
        const customer = await stripe.customers.retrieve(subscription.customer);
        const email = customer.email;

        if (email) {
          await supabase
            .from('profiles')
            .update({ tier: 'free' })
            .eq('email', email)
            .eq('tier', 'vip');
          console.log(`Downgraded ${email} from VIP (subscription cancelled)`);
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  } catch (err) {
    console.error('Webhook processing error:', err);
  }

  res.status(200).json({ received: true });
}
