import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import gamesRouter from './routes/games';
import authRouter from './routes/auth';
import teamsRouter from './routes/teams';
import zonesRouter from './routes/zones';
import stationsRouter from './routes/stations';
import { startScoreUpdates } from './services/scoring.service';

const app = express();
const httpServer = createServer(app);
const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';
const io = new Server(httpServer, {
  cors: {
    origin: corsOrigin === '*' ? '*' : corsOrigin,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

// Make io accessible to routes
app.set('io', io);

// Middleware
app.use(cors({
  origin: corsOrigin === '*' ? '*' : corsOrigin,
  credentials: corsOrigin !== '*',
}));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/games', gamesRouter);
app.use('/api/teams', teamsRouter);  // For individual team operations (update, delete)
app.use('/api/zones', zonesRouter);  // For individual zone operations (update, delete)
app.use('/api/stations', stationsRouter);

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  socket.on('subscribe:game', (gameId: string) => {
    socket.join(`game:${gameId}`);
    console.log(`Client ${socket.id} subscribed to game ${gameId}`);
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing server...');
  await prisma.$disconnect();
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

// Start server
httpServer.listen(PORT, () => {
  console.log(`🚀 Backend server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);

  // Start automatic score updates
  startScoreUpdates(io);
});

// Export for use in other modules
export { prisma, io };
