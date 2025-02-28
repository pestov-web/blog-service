import { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import Redis from 'ioredis';

dotenv.config();
const redis = new Redis();

interface ProviderConfig {
  name: string;
  apiUrl: string;
  headerName: string;
}

const PROVIDERS: { [key: string]: ProviderConfig } = {
  yandex: {
    name: 'yandex',
    apiUrl: 'https://login.yandex.ru/info',
    headerName: 'OAuth',
  },
  github: {
    name: 'github',
    apiUrl: 'https://api.github.com/user',
    headerName: 'token',
  },
};

const validateToken = async (provider: string, token: string) => {
  try {
    const cachedUser = await redis.get(`${provider}_token:${token}`);
    if (cachedUser) {
      console.log(`Используем кэшированные данные (${provider})`);
      return JSON.parse(cachedUser);
    }

    const providerConfig = PROVIDERS[provider];
    if (!providerConfig) return null;

    const response = await fetch(providerConfig.apiUrl, {
      method: 'GET',
      headers: {
        Authorization: `${providerConfig.headerName} ${token}`,
        Accept: 'application/json',
      },
    });

    if (!response.ok) return null;
    const userData = await response.json();

    await redis.setex(
      `${provider}_token:${token}`,
      600,
      JSON.stringify(userData)
    );

    return userData;
  } catch (error) {
    console.error(`Ошибка валидации токена (${provider}):`, error);
    return null;
  }
};

export const verifyToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    const provider = req.headers['x-auth-provider'] as string; // Например, 'yandex' или 'github'

    if (!authHeader || !provider) {
      return res
        .status(401)
        .json({ error: 'Токен или провайдер не предоставлен' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Неверный формат токена' });
    }

    if (!PROVIDERS[provider]) {
      return res.status(400).json({ error: 'Неизвестный провайдер' });
    }

    const userData = await validateToken(provider, token);
    if (!userData) {
      return res.status(401).json({ error: 'Неверный или просроченный токен' });
    }

    req.user = { provider, ...userData };
    next();
  } catch (error) {
    console.error('Ошибка верификации токена:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};
