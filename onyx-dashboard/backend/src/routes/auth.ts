import { Router, Request, Response } from 'express';
import axios from 'axios';

const router = Router();

const DISCORD_API = 'https://discord.com/api/v10';

function getOAuthUrl(): string {
  const params = new URLSearchParams({
    client_id: process.env.DISCORD_CLIENT_ID!,
    redirect_uri: process.env.DISCORD_REDIRECT_URI!,
    response_type: 'code',
    scope: 'identify guilds',
  });
  return `https://discord.com/oauth2/authorize?${params.toString()}`;
}

// GET /api/auth/discord  — redirect to Discord
router.get('/discord', (_req: Request, res: Response) => {
  res.redirect(getOAuthUrl());
});

// GET /api/auth/discord/callback
router.get('/discord/callback', async (req: Request, res: Response) => {
  const code = req.query.code as string;
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  if (!code) {
    return res.redirect(`${frontendUrl}/?error=no_code`);
  }

  try {
    // Exchange code for token
    const tokenRes = await axios.post(
      `${DISCORD_API}/oauth2/token`,
      new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID!,
        client_secret: process.env.DISCORD_CLIENT_SECRET!,
        grant_type: 'authorization_code',
        code,
        redirect_uri: process.env.DISCORD_REDIRECT_URI!,
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const { access_token, refresh_token } = tokenRes.data;

    // Fetch user info
    const userRes = await axios.get(`${DISCORD_API}/users/@me`, {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    req.session.user = userRes.data;
    req.session.access_token = access_token;
    req.session.refresh_token = refresh_token;

    res.redirect(`${frontendUrl}/dashboard`);
  } catch (e: any) {
    console.error('[Auth] OAuth error:', e?.response?.data || e);
    res.redirect(`${frontendUrl}/?error=oauth_failed`);
  }
});

// GET /api/auth/me
router.get('/me', (req: Request, res: Response) => {
  if (!req.session?.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  res.json(req.session.user);
});

// POST /api/auth/logout
router.post('/logout', (req: Request, res: Response) => {
  req.session.destroy(() => {
    res.json({ ok: true });
  });
});

export default router;
