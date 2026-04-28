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

  const { docId, requestingEmail } = req.body;

  if (!requestingEmail || !ADMIN_EMAILS.includes(requestingEmail)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  if (!docId) {
    return res.status(400).json({ error: 'docId required' });
  }

  try {
    const { error } = await supabaseAdmin
      .from('purchase_documents')
      .delete()
      .eq('id', docId);

    if (error) throw error;

    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
