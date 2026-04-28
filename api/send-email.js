export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, language } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email required' });
  }

  const subjects = {
    en: 'Your free Forex Risk Calculator is ready',
    no: 'Din gratis Forex-risikokalkulator er klar',
    es: 'Tu calculadora gratuita de riesgo en Forex está lista',
  };

  const bodies = {
    en: `<p>Hi,</p>
<p>Here's your free Forex Risk Calculator: <a href="https://nicotradesss.com/calculator">nicotradesss.com/calculator</a></p>
<p>You can use it before every trade to know your exact position size and never risk more than you're comfortable with.</p>
<p>— Nico</p>`,
    no: `<p>Hei,</p>
<p>Her er din gratis Forex-risikokalkulator: <a href="https://nicotradesss.com/calculator">nicotradesss.com/calculator</a></p>
<p>Du kan bruke den før hver handel for å vite nøyaktig posisjonsstørrelse og aldri risikere mer enn du er komfortabel med.</p>
<p>— Nico</p>`,
    es: `<p>Hola,</p>
<p>Aquí está tu calculadora gratuita de riesgo en Forex: <a href="https://nicotradesss.com/calculator">nicotradesss.com/calculator</a></p>
<p>Puedes usarla antes de cada operación para conocer el tamaño exacto de tu posición y nunca arriesgar más de lo que estás cómodo/a.</p>
<p>— Nico</p>`,
  };

  const lang = ['en', 'no', 'es'].includes(language) ? language : 'en';

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Nico <nico@nicotradesss.com>',
        to: email,
        subject: subjects[lang],
        html: bodies[lang],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Resend error:', data);
      return res.status(500).json({ error: data.message || 'Failed to send email' });
    }

    res.status(200).json({ success: true });
  } catch (err) {
    console.error('Email error:', err);
    res.status(500).json({ error: err.message });
  }
}
