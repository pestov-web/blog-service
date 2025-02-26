import { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const ALLOWED_USERS = process.env.ALLOWED_USERS
  ? process.env.ALLOWED_USERS.split(',')
  : [];

// Функция для проверки токена через API Яндекса
const validateYandexToken = async (token: string) => {
  try {
    const response = await fetch('https://login.yandex.ru/info', {
      method: 'GET',
      headers: {
        Authorization: `OAuth ${token}`,
      },
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Ошибка проверки токена:', error);
    return null;
  }
};

// Middleware для проверки токена
export const verifyToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({ error: 'Токен не предоставлен' });
      return;
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      res.status(401).json({ error: 'Неверный формат токена' });
      return;
    }

    const userData = await validateYandexToken(token);
    if (!userData) {
      res.status(401).json({ error: 'Неверный или просроченный токен' });
      return;
    }

    req.user = userData; // @ts-ignore можно убрать, если расширить Request
    await next(); // Дождёмся выполнения next(), чтобы TypeScript не жаловался
  } catch (error) {
    console.error('Ошибка верификации токена:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

// Middleware для проверки разрешённых пользователей
export const checkAllowedUser = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const user = req.user;
  if (!user || !user.default_email) {
    res.status(403).json({ error: 'Доступ запрещён' });
    return;
  }

  if (!ALLOWED_USERS.includes(user.default_email)) {
    res
      .status(403)
      .json({ error: 'У вас нет прав для выполнения данного действия' });
    return;
  }

  next();
};
