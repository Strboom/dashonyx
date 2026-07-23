# Onyx Dashboard

Full-featured web dashboard for the **Onyx Discord Bot** with Discord OAuth2 authentication.

---

## Your Setup at a Glance

| Thing | Value |
|-------|-------|
| **Dashboard URL** | `https://dashboard.onyxai.site` |
| **Discord OAuth Redirect** | `https://dashboard.onyxai.site/api/auth/discord/callback` |
| **`DASHBOARD_URL` in main.py** | `https://dashboard.onyxai.site/api` |
| **Backend port** | `4000` (internal — Nginx/Caddy proxies to it) |

---

## Discord Developer Portal Setup

1. Go to **https://discord.com/developers/applications**
2. Click your bot's application → **OAuth2** tab
3. Under **Redirects**, click **Add Redirect** and paste exactly:
   ```
   https://dashboard.onyxai.site/api/auth/discord/callback
   ```
4. Hit **Save Changes**
5. Copy your **Client ID** and **Client Secret** — you'll need them in `.env`

> ⚠️ The redirect URL must match **character-for-character** what's in your `.env` file (`DISCORD_REDIRECT_URI`). One wrong slash or typo = OAuth error.

---

## Hosting: Where to Host This

Since your bot is on **Wispbyte**, the dashboard needs to run separately. The best options for your domain `dashboard.onyxai.site`:

### Option A — Cheap VPS (Recommended for full control)
Providers like **Hetzner** (€4/mo), **DigitalOcean** ($6/mo), or **Contabo** are great.
- Install Node.js 20+ on the VPS
- Use **Nginx** or **Caddy** as a reverse proxy to port 4000
- Point `dashboard.onyxai.site` DNS A record to the VPS IP
- Use **Certbot** (Let's Encrypt) for free HTTPS

### Option B — Railway (Easiest, free tier available)
1. Go to **railway.app** → New Project → Deploy from GitHub
2. Push the `backend/` folder to a GitHub repo
3. Set all environment variables in Railway's dashboard
4. Add a custom domain → `dashboard.onyxai.site`
5. Railway handles HTTPS automatically

### Option C — Render (Free tier, slight cold starts)
1. Go to **render.com** → New Web Service
2. Connect your GitHub repo (the `backend/` folder)
3. Build command: `npm install && npm run build`
4. Start command: `npm start`
5. Add environment variables + custom domain `dashboard.onyxai.site`

> **For all options:** Build the frontend first (`cd frontend && npm run build`), then the backend serves it automatically when `NODE_ENV=production`.

---

## Setup Steps

### 1. Configure the backend

```bash
cd backend
cp .env.example .env
nano .env   # fill in your values
```

Your `.env` should look like:
```env
DISCORD_CLIENT_ID=123456789012345678
DISCORD_CLIENT_SECRET=abcdef1234567890abcdef
DISCORD_REDIRECT_URI=https://dashboard.onyxai.site/api/auth/discord/callback
SESSION_SECRET=a_very_long_random_string_at_least_32_chars
BOT_WEBHOOK_KEY=onyx-bot-key-change-me
DASHBOARD_DATA_FILE=./dashboard_data.json
PORT=4000
NODE_ENV=production
FRONTEND_URL=https://dashboard.onyxai.site
```

### 2. Update `main.py` on Wispbyte

Change these two lines in `main.py`:
```python
DASHBOARD_URL   = "https://dashboard.onyxai.site/api"
BOT_WEBHOOK_KEY = "onyx-bot-key-change-me"   # change this to something secret!
```

The bot on Wispbyte will push its guild list to your dashboard and fetch settings from it via these URLs.

### 3. Build & deploy

```bash
# Build frontend
cd frontend
npm install
npm run build
# This creates frontend/dist/ — the backend serves it automatically

# Start backend
cd ../backend
npm install
npm run build
npm start
# Runs on port 4000
```

### 4. Nginx reverse proxy (if using a VPS)

```nginx
server {
    server_name dashboard.onyxai.site;

    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }

    listen 443 ssl; # managed by Certbot
    ssl_certificate /etc/letsencrypt/live/dashboard.onyxai.site/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/dashboard.onyxai.site/privkey.pem;
}

server {
    if ($host = dashboard.onyxai.site) {
        return 301 https://$host$request_uri;
    }
    listen 80;
    server_name dashboard.onyxai.site;
    return 404;
}
```

### 5. DNS

In your domain registrar (wherever `onyxai.site` is managed), add an **A record**:
```
Type:  A
Name:  dashboard
Value: <your VPS or hosting IP>
TTL:   300
```

---

## How It All Connects

```
Discord User
    │
    ▼
dashboard.onyxai.site  ──────────────────────────────────────┐
    │  (Express serves React frontend + API on port 4000)     │
    │                                                          │
    ├── GET  /api/auth/discord       → redirect to Discord    │
    ├── GET  /api/auth/discord/callback → OAuth handshake     │
    ├── GET  /api/guilds             → user's servers         │
    └── PATCH /api/guilds/:id/settings → save settings        │
                                                              │
Wispbyte (your bot / main.py)                                 │
    │                                                          │
    ├── POST /api/bot/heartbeat      → bot status push  (not displayed) │
    ├── POST /api/bot/guilds         → guild list push         │
    ├── GET  /api/bot/settings/:id   → bot reads dashboard settings │
    └── POST /api/bot/guild-event    → join/leave events       │
```

---

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `DISCORD_CLIENT_ID` | ✅ | From Discord Developer Portal |
| `DISCORD_CLIENT_SECRET` | ✅ | From Discord Developer Portal |
| `DISCORD_REDIRECT_URI` | ✅ | Must match exactly in Discord Portal |
| `SESSION_SECRET` | ✅ | Any long random string |
| `BOT_WEBHOOK_KEY` | ✅ | Must match `BOT_WEBHOOK_KEY` in `main.py` |
| `DASHBOARD_DATA_FILE` | ⬜ | Storage path (default: `./dashboard_data.json`) |
| `BOT_TOKEN` | ⬜ | Enables live channel/role fetching |
| `PORT` | ⬜ | Default: `4000` |
| `NODE_ENV` | ⬜ | Set to `production` to serve frontend |
| `FRONTEND_URL` | ⬜ | Your domain (for CORS) |

---

## Support

Join the Onyx Support Server: **https://discord.gg/GGa4QCq4km**
