import { Request, Response } from 'express';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDb } from '../config/db';

const JWT_SECRET = process.env.JWT_SECRET || 'bhusetu_secret_key_for_hackathon_2026';

export async function login(req: Request, res: Response) {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required.' });
    }

    const db = await getDb();
    const user = await db.get('SELECT * FROM users WHERE username = ?', username);

    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    const match = bcryptjs.compareSync(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    // Sign JWT
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        name: user.name
      }
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export function getCurrentUser(req: Request, res: Response) {
  // User is injected by authMiddleware
  const user = (req as any).user;
  if (!user) {
    return res.status(401).json({ error: 'Not authenticated.' });
  }
  return res.json({ user });
}
