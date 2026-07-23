import { Request, Response, NextFunction } from 'express';

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session?.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  next();
}

export function requireBotKey(req: Request, res: Response, next: NextFunction) {
  const key = req.headers['x-bot-key'];
  const expected = process.env.BOT_WEBHOOK_KEY || 'onyx-bot-key-change-me';
  if (key !== expected) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
}
