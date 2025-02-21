import { Router } from 'express';
import {
  getAllPosts,
  createPost,
  updatePost,
  deletePost,
} from '../controllers/postController';
import { verifyToken, checkAllowedUser } from '../middleware/authMiddleware';

const router = Router();

// Публичный маршрут: получение всех постов
router.get('/', getAllPosts);

// Защищённые маршруты: создание, обновление, удаление постов
router.post('/', verifyToken, checkAllowedUser, createPost);
router.put('/:id', verifyToken, checkAllowedUser, updatePost);
router.delete('/:id', verifyToken, checkAllowedUser, deletePost);

export default router;
