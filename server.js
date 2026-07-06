const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3002;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Contact form endpoint
app.post('/api/contact', (req, res) => {
  const { name, email, message, lang } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Missing fields' });
  }
  const entry = {
    date: new Date().toISOString(),
    name, email, message, lang: lang || 'en'
  };
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
  res.json({ ok: true });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Solara website running at http://localhost:${PORT}`);
});
