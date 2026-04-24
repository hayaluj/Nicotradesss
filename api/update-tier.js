// Lemon Squeezy webhook handler
// Called after successful payment to upgrade user tier
// 
// Setup:
// 1. In Lemon Squeezy dashboard → Webhooks → Add endpoint
// 2. URL: https://your-domain.com/api/update-tier
// 3. Events: order_created, subscription_created
//
// This requires Vercel serverless function setup

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  
  // TODO: Verify Lemon Squeezy webhook signature
  const { meta, data } = req.body;
  const userEmail = data?.attributes?.user_email;
  const productId = data?.attributes?.first_order_item?.product_id;
  
  // TODO: Map product IDs to tiers
  // const tier = productId === 'COURSE_PRODUCT_ID' ? 'course' : 'vip';
  
  // TODO: Update Supabase profile tier
  // await supabase.from('profiles').update({ tier }).eq('email', userEmail);
  
  res.status(200).json({ received: true });
}
