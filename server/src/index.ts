import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import genaiRouter from './routes/genai.js';
import githubRouter from './routes/github.js';

const app = express();
const PORT = process.env.PORT || 3001;

dotenv.config();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Routes
app.use('/api/genai', genaiRouter);
app.use('/api/github', githubRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`Rule Generator Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});
