import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret';
const ALLOWED_USERS = process.env.ALLOWED_USERS
  ? process.env.ALLOWED_USERS.split(',')
  : [];

// Расширяем тип Request, чтобы использовать req.user
export const verifyToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Токен не предоставлен' });
  }

  // Ожидаем формат "Bearer <token>"
  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Неверный формат токена' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    // @ts-expect-error: добавляем поле user в Request
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Неверный или просроченный токен' });
  }
};

export const checkAllowedUser = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // @ts-expect-error: ожидаем, что req.user содержит email
  const user = req.user;
  if (!user || !user.email) {
    return res.status(403).json({ error: 'Доступ запрещён' });
  }

  if (!ALLOWED_USERS.includes(user.email)) {
    return res
      .status(403)
      .json({ error: 'У вас нет прав для выполнения данного действия' });
  }

  next();
};
