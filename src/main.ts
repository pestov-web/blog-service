import dotenv from 'dotenv';
import postsRouter from './routes/posts';
import express from 'express';

dotenv.config();

const app = express();

// Для парсинга JSON-тела запроса
app.use(express.json());

// Маршруты для постов
app.use('/posts', postsRouter);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
