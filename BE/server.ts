import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import route from './routes/route.js';

dotenv.config();
const app = express();

// Configure CORS allowed origins and metods
app.use(
  cors({
    origin: [
      'http://localhost:3000',
    ],
    methods: ['GET', 'POST', 'OPTIONS', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

// app.options('*', cors());
app.use(express.json());

// Start the server
const PORT = Number(process.env.PORT) || 3003;
if (!process.env.OPENAI_API_KEY) {
  console.error('Error: OPENAI_API_KEY is not set in environment variables.');
  process.exit(1);
}

app.use('/api', route);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server körs på port ${PORT}`);
  console.log(`OpenAI API key status: ${process.env.OPENAI_API_KEY ? 'Konfigurerad' : 'SAKNAS'}`);
});