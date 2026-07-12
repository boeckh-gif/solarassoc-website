# Project: Solara Business Site — solarassoc.com

**Status:** Live
**Location:** `/Users/jlboeckh/MD/projects/solarassoc-website/`
**Live URL:** https://solarassoc.com (Railway: solarassoc-website-production.up.railway.app, GitHub: boeckh-gif/solarassoc-website)
**Local preview:** http://localhost:3002
**Domain registrar:** Cloudflare

## What It Is
Solara's business/sales site — project management, AI implementation, and cross-border consulting. Built in Node.js + Express, single HTML file with embedded CSS/JS, same visual style as juansoltero.com for brand consistency. Bilingual EN/ES toggle.

## How to Run Locally
```bash
cd /Users/jlboeckh/MD/projects/solarassoc-website
npm install   # first time only
node server.js
```

## Sections
- Hero — value prop, CTA to contact + how-it-works
- Services — The Hand (PM), The Hammer (AI), The Nail (emergency services + real estate) — ported from juansoltero.com
- Who I Serve — restoration, plumbing/HVAC, real estate, cross-border — ported from juansoltero.com
- How It Works — new: free audit → tailored plan → real implementation (the Fares Alhillu value-first model, same approach being used with Angel Bravo)
- Credibility — short bio, links out to juansoltero.com for the full story
- Results — honest placeholder, no fabricated case studies (nothing to show yet)
- Contact — the lead-capture form (moved here from juansoltero.com)

## To Do
- **Contact form doesn't actually notify anyone (found 2026-07-12).** `/api/contact` only writes to `data/contacts.json` on the server — no email is sent, and Railway's filesystem isn't guaranteed to persist that file across redeploys/restarts. Anyone submitting the live form right now has no guarantee Juan ever sees it. Needs wiring to send an email via `juan@solarassoc.com` (nodemailer + Google Workspace SMTP, credentials in Railway env vars, not hardcoded) — flagged to Juan, not yet fixed.
- Add real case study once Angel Bravo (or another engagement) concludes — do not reference specific client details without Juan's sign-off, per client confidentiality rules
