import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL || 'https://bpiobqgmllygolbizgde.supabase.co',
  process.env.SUPABASE_SERVICE_KEY
);

const ADMIN_EMAILS = ['hayaluj@gmail.com', 'nico@nicotradesss.com'];

export const config = {
  api: { bodyParser: false },
};

async function parseMultipart(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const contentType = req.headers['content-type'] || '';

    if (!contentType.includes('multipart/form-data')) {
      return res.status(400).json({ error: 'Must be multipart/form-data' });
    }

    // Parse boundary
    const boundary = contentType.split('boundary=')[1];
    if (!boundary) return res.status(400).json({ error: 'No boundary found' });

    const body = await parseMultipart(req);
    const bodyStr = body.toString('binary');

    // Extract fields from multipart
    const getField = (name) => {
      const regex = new RegExp(`name="${name}"\\r\\n\\r\\n([^\\r\\n]+)`);
      const match = bodyStr.match(regex);
      return match ? match[1] : null;
    };

    const requestingEmail = getField('requestingEmail');
    const userId = getField('userId');
    const documentKey = getField('documentKey');
    const language = getField('language');
    const title = getField('title');
    const fileName = getField('fileName');

    // Verify admin
    if (!requestingEmail || !ADMIN_EMAILS.includes(requestingEmail)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    if (!userId || !documentKey || !title || !fileName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Extract file binary
    const fileHeader = `name="file"; filename="${fileName}"`;
    const fileStart = body.indexOf(Buffer.from(fileHeader)) + fileHeader.length;
    const contentStart = body.indexOf(Buffer.from('\r\n\r\n'), fileStart) + 4;
    const boundaryEnd = body.indexOf(Buffer.from(`\r\n--${boundary}`), contentStart);
    const fileBuffer = body.slice(contentStart, boundaryEnd);

    // Upload to Supabase Storage
    const ext = fileName.split('.').pop();
    const storagePath = `custom/${userId}/${documentKey}-${language}-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from('documents')
      .upload(storagePath, fileBuffer, {
        upsert: true,
        contentType: 'application/octet-stream',
      });

    if (uploadError) throw uploadError;

    // Insert into purchase_documents
    const { error: dbError } = await supabaseAdmin
      .from('purchase_documents')
      .upsert({
        user_id: userId,
        document_key: documentKey,
        language: language || 'en',
        title,
        storage_path: storagePath,
        purchased_at: new Date().toISOString(),
      }, { onConflict: 'user_id,document_key,language' });

    if (dbError) throw dbError;

    res.status(200).json({ success: true, path: storagePath });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: err.message });
  }
}
