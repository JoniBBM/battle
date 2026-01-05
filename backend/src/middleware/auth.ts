import { Request, Response, NextFunction } from 'express';

const ADMIN_PASSWORD = '1234qwer!';

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.substring(7);

  if (token !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  next();
}
