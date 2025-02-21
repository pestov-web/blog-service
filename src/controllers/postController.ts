import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getAllPosts = async (req: Request, res: Response) => {
  try {
    const posts = await prisma.post.findMany();
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при получении постов' });
  }
};

export const createPost = async (req: Request, res: Response) => {
  const { title, content, published } = req.body;
  // Если необходимо, можно использовать req.user для привязки автора
  const authorId = req.user?.id || null;
  try {
    const newPost = await prisma.post.create({
      data: { title, content, published, authorId },
    });
    res.status(201).json(newPost);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при создании поста' });
  }
};

export const updatePost = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, content, published } = req.body;
  try {
    const updatedPost = await prisma.post.update({
      where: { id },
      data: { title, content, published },
    });
    res.json(updatedPost);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при обновлении поста' });
  }
};

export const deletePost = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await prisma.post.delete({ where: { id } });
    res.json({ message: 'Пост успешно удалён' });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при удалении поста' });
  }
};
