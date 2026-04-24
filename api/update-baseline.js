// Vercel serverless function — called by cron once daily at market open
// Updates the previous close prices stored in Supabase
// Cron: 0 8 * * 1-5 (8am UTC, weekdays only)

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://bpiobqgmllygolbizgde.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY; // set in Vercel env vars
const TWELVE_KEY = '5fbd7291f7b24fa4bb398f8ba29311d9';
const SYMBOLS = ['EUR/USD', 'GBP/USD', 'XAU/USD', 'BTC/USD', 'USD/JPY'];

export default async function handler(req, res) {
  // Allow GET for manual trigger, POST for cron
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).end();
  }

  try {
    const response = await fetch(
      `https://api.twelvedata.com/price?symbol=${SYMBOLS.join(',')}&apikey=${TWELVE_KEY}`
    );
    const prices = await response.json();

    // Store in Supabase as a simple key-value config row
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    const { error } = await supabase
      .from('app_config')
      .upsert({ key: 'ticker_baseline', value: prices, updated_at: new Date().toISOString() });

    if (error) throw error;

    return res.status(200).json({ ok: true, prices });
  } catch (err) {
    console.error('Baseline update error:', err);
    return res.status(500).json({ error: err.message });
  }
}
