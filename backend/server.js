import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/database.js';
import gameRoutes from './routes/gameRoutes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8000;

connectDB();

app.use(cors());
app.use(express.json());

// Serve static files from database folder
app.use('/database', express.static(path.join(__dirname, '../database')));

// Routes
app.use('/api/games', gameRoutes);

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'GameStore API is running' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});