import express from 'express';
import cors from 'cors';
import { apiRouter } from './routes';
import { errorHandler } from './middlewares/errorHandler';

export const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/v1', apiRouter);

// 404 uniforme
app.use((_req, res) => {
  res.status(404).json({ error: { codigo: 'NO_ENCONTRADO', mensaje: 'Recurso inexistente' } });
});

// Manejo central de errores (siempre al final)
app.use(errorHandler);
