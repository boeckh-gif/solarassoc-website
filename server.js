const express = require('express');
const path = require('path');

const app = express();
const PORT = 3002;

app.use(express.json({ limit: '20kb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Contact-form email goes out through Resend (resend.com), an email API that
// works over normal HTTPS. We don't use Gmail/SMTP because Railway's Hobby
// plan blocks outbound SMTP entirely.
//
// Railway variables (Variables tab):
//   RESEND_API_KEY  — required. Created in the Resend dashboard.
//   CONTACT_TO      — optional. Where submissions go. Default: juan@solarassoc.com
//   CONTACT_FROM    — optional. Sender address only (e.g. website@solarassoc.com);
//                     the "Solara Website" name is added automatically. Default uses Resend's
//                     shared test sender, which only delivers to the email the
//                     Resend account was created with. solarassoc.com is
//                     verified in Resend, so this is set to website@solarassoc.com.
const CONTACT_TO = process.env.CONTACT_TO || 'juan@solarassoc.com';
// CONTACT_FROM can be a plain address ("website@solarassoc.com") or a full
// "Name <address>". Either way the email goes out as "Solara Website <address>".
function buildFrom(raw) {
  const match = (raw || '').match(/[^\s<>"]+@[^\s<>"]+/);
  const address = match ? match[0] : 'onboarding@resend.dev';
  return `Solara Website <${address}>`;
}
const CONTACT_FROM = buildFrom(process.env.CONTACT_FROM);

if (!process.env.RESEND_API_KEY) {
  console.warn('RESEND_API_KEY not set — contact-form emails will NOT send.');
}

async function sendContactEmail({ name, email, message, lang }) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: CONTACT_FROM,
      to: [CONTACT_TO],
      reply_to: email,
      subject: `New website inquiry from ${name}`,
      text: `Name: ${name}\nEmail: ${email}\nLanguage: ${lang}\n\nMessage:\n${message}\n\n— Sent from the contact form on solarassoc.com. Hit reply to answer ${name} directly.`
    })
  });
  if (!res.ok) {
    throw new Error(`Resend responded ${res.status}: ${await res.text()}`);
  }
}

const clean = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

app.post('/api/contact', async (req, res) => {
  const body = req.body || {};

  // Hidden "website" field: people never see it, spam bots fill it in.
  // Pretend success so the bot moves on, but send nothing.
  if (body.website) {
    return res.json({ ok: true });
  }

  const name = clean(body.name, 200);
  const email = clean(body.email, 200);
  const message = clean(body.message, 5000);
  const lang = body.lang === 'es' ? 'es' : 'en';

  if (!name || !email || !message || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Missing or invalid fields' });
  }

  // Backup copy in Railway's logs, so a lead is never fully lost even if
  // the email step fails.
  console.log('CONTACT FORM SUBMISSION:', JSON.stringify({ date: new Date().toISOString(), name, email, lang, message }));

  if (!process.env.RESEND_API_KEY) {
    console.error('Contact form: RESEND_API_KEY missing, email not sent.');
    return res.status(503).json({ error: 'Email not configured' });
  }

  try {
    await sendContactEmail({ name, email, message, lang });
    res.json({ ok: true });
  } catch (err) {
    console.error('Contact form: email failed —', err.message);
    // Tell the visitor it didn't go through, so they can email directly
    // instead of thinking they were heard.
    res.status(502).json({ error: 'Email failed' });
  }
});

// Internal field launcher for the sales side — not linked from the site,
// not indexed. Declared explicitly so the catch-all below doesn't swallow it.
app.get(['/field', '/field/'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'field', 'index.html'));
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Solara website running at http://localhost:${PORT}`);
});
