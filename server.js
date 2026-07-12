const express = require('express');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');

const app = express();
const PORT = 3002;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Email transport — reads credentials from Railway environment variables.
// SMTP_USER / SMTP_PASS must be set to juan@solarassoc.com and a Google
// Workspace "app password" (not the account password) in Railway's
// Variables tab. If they're missing, form submissions still get logged
// locally below, but no email will send — check Railway logs for the
// "SMTP not configured" warning if that happens.
let transporter = null;
if (process.env.SMTP_USER && process.env.SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
} else {
  console.warn('SMTP not configured — set SMTP_USER and SMTP_PASS in Railway to enable contact-form emails.');
}

// Contact form endpoint
app.post('/api/contact', async (req, res) => {
  const { name, email, message, lang } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Missing fields' });
  }
  const entry = {
    date: new Date().toISOString(),
    name, email, message, lang: lang || 'en'
  };

  // Always log locally first, regardless of whether email sending works.
  const logPath = path.join(__dirname, 'data', 'contacts.json');
  if (!fs.existsSync(path.join(__dirname, 'data'))) {
    fs.mkdirSync(path.join(__dirname, 'data'));
  }
  const existing = fs.existsSync(logPath)
    ? JSON.parse(fs.readFileSync(logPath, 'utf8'))
    : [];
  existing.push(entry);
  fs.writeFileSync(logPath, JSON.stringify(existing, null, 2));
  console.log(`New contact from ${name} <${email}>`);

  // Try to email it. If this fails, still tell the visitor it worked
  // (their message was logged) but log the error server-side for Juan.
  if (transporter) {
    try {
      await transporter.sendMail({
        from: `"Solara Website" <${process.env.SMTP_USER}>`,
        to: 'juan@solarassoc.com',
        replyTo: email,
        subject: `New contact form submission from ${name}`,
        text: `Name: ${name}\nEmail: ${email}\nLanguage: ${lang || 'en'}\n\nMessage:\n${message}`
      });
    } catch (err) {
      console.error('Failed to send contact-form email:', err.message);
    }
  }

  res.json({ ok: true });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Solara website running at http://localhost:${PORT}`);
});
