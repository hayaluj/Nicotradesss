import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL || 'https://bpiobqgmllygolbizgde.supabase.co',
  process.env.SUPABASE_SERVICE_KEY
);

const ADMIN_EMAILS = ['hayaluj@gmail.com', 'nico@nicotradesss.com'];

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, requestingEmail } = req.body;

  // Verify the requester is an admin
  if (!requestingEmail || !ADMIN_EMAILS.includes(requestingEmail)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  if (!email) {
    return res.status(400).json({ error: 'Email required' });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('id, email, full_name, tier')
      .eq('email', email.trim().toLowerCase())
      .maybeSingle();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'User not found' });

    res.status(200).json({ user: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
