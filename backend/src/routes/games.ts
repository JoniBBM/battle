import { Router } from 'express';
import { PrismaClient, GameStatus } from '@prisma/client';
import { requireAuth } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Create team for a game
router.post('/:gameId/teams', async (req, res) => {
  try {
    const { gameId } = req.params;
    const { name, color } = req.body;

    if (!name || !color) {
      return res.status(400).json({ error: 'name and color are required' });
    }

    // Get current team count for order index
    const teamCount = await prisma.team.count({ where: { gameId } });

    const team = await prisma.team.create({
      data: {
        gameId,
        name,
        color,
        orderIndex: teamCount,
      },
    });

    res.status(201).json(team);
  } catch (error) {
    console.error('Error creating team:', error);
    res.status(500).json({ error: 'Failed to create team' });
  }
});

// Create zone for a game
router.post('/:gameId/zones', async (req, res) => {
  try {
    const { gameId } = req.params;
    const { name, pin } = req.body;

    if (!name || !pin) {
      return res.status(400).json({ error: 'name and pin are required' });
    }

    // Get current zone count for order index
    const zoneCount = await prisma.zone.count({ where: { gameId } });

    const zone = await prisma.zone.create({
      data: {
        gameId,
        name,
        pin,
        orderIndex: zoneCount,
      },
    });

    res.status(201).json(zone);
  } catch (error) {
    console.error('Error creating zone:', error);
    res.status(500).json({ error: 'Failed to create zone' });
  }
});

// Get all games
router.get('/', async (req, res) => {
  try {
    const games = await prisma.game.findMany({
      include: {
        teams: { orderBy: { orderIndex: 'asc' } },
        zones: { orderBy: { orderIndex: 'asc' } },
        settings: true,
        bandStation: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(games);
  } catch (error) {
    console.error('Error fetching games:', error);
    res.status(500).json({ error: 'Failed to fetch games' });
  }
});

// Get single game
router.get('/:id', async (req, res) => {
  try {
    const game = await prisma.game.findUnique({
      where: { id: req.params.id },
      include: {
        teams: { orderBy: { orderIndex: 'asc' } },
        zones: { orderBy: { orderIndex: 'asc' } },
        settings: true,
        bandStation: true,
      },
    });

    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    res.json(game);
  } catch (error) {
    console.error('Error fetching game:', error);
    res.status(500).json({ error: 'Failed to fetch game' });
  }
});

// Create new game
router.post('/', async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const game = await prisma.game.create({
      data: {
        name,
        status: GameStatus.setup,
        settings: {
          create: {
            pointsPerSecond: 1.0,
            bandCapturePoints: 10,
          },
        },
      },
      include: {
        teams: true,
        zones: true,
        settings: true,
        bandStation: true,
      },
    });

    res.status(201).json(game);
  } catch (error) {
    console.error('Error creating game:', error);
    res.status(500).json({ error: 'Failed to create game' });
  }
});

// Update game
router.put('/:id', async (req, res) => {
  try {
    const { name, pointsPerSecond, bandCapturePoints, durationMinutes } = req.body;
    const gameId = req.params.id;

    const updates: any = {};
    if (name) updates.name = name;

    const game = await prisma.game.update({
      where: { id: gameId },
      data: updates,
      include: {
        teams: true,
        zones: true,
        settings: true,
        bandStation: true,
      },
    });

    // Update settings if provided
    if (pointsPerSecond !== undefined || bandCapturePoints !== undefined || durationMinutes !== undefined) {
      const settingsUpdate: any = {};
      if (pointsPerSecond !== undefined) settingsUpdate.pointsPerSecond = pointsPerSecond;
      if (bandCapturePoints !== undefined) settingsUpdate.bandCapturePoints = bandCapturePoints;
      if (durationMinutes !== undefined) settingsUpdate.durationMinutes = durationMinutes;

      // Use upsert to handle cases where settings don't exist yet
      await prisma.gameSettings.upsert({
        where: { gameId },
        update: settingsUpdate,
        create: {
          gameId,
          pointsPerSecond: pointsPerSecond ?? 1.0,
          bandCapturePoints: bandCapturePoints ?? 10,
          durationMinutes: durationMinutes,
        },
      });

      // Fetch updated game with new settings
      const updatedGame = await prisma.game.findUnique({
        where: { id: gameId },
        include: {
          teams: { orderBy: { orderIndex: 'asc' } },
          zones: { orderBy: { orderIndex: 'asc' } },
          settings: true,
          bandStation: true,
        },
      });

      return res.json(updatedGame);
    }

    res.json(game);
  } catch (error) {
    console.error('Error updating game:', error);
    res.status(500).json({ error: 'Failed to update game' });
  }
});

// Delete game (protected)
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const gameId = req.params.id;

    const game = await prisma.game.findUnique({
      where: { id: gameId },
    });

    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    // Delete game (cascade deletes all related data)
    await prisma.game.delete({
      where: { id: gameId },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting game:', error);
    res.status(500).json({ error: 'Failed to delete game' });
  }
});

// Start game
router.post('/:id/start', async (req, res) => {
  try {
    const game = await prisma.game.update({
      where: { id: req.params.id },
      data: {
        status: GameStatus.running,
        startedAt: new Date(),
      },
      include: {
        teams: true,
        zones: true,
        settings: true,
      },
    });

    // Emit socket event
    const io = (req.app as any).get('io');
    io.to(`game:${game.id}`).emit('game:update', game);

    res.json(game);
  } catch (error) {
    console.error('Error starting game:', error);
    res.status(500).json({ error: 'Failed to start game' });
  }
});

// Pause game
router.post('/:id/pause', async (req, res) => {
  try {
    const currentGame = await prisma.game.findUnique({
      where: { id: req.params.id },
    });

    if (!currentGame || !currentGame.startedAt) {
      return res.status(400).json({ error: 'Game not started' });
    }

    const game = await prisma.game.update({
      where: { id: req.params.id },
      data: {
        status: GameStatus.paused,
        pausedAt: new Date(),
      },
      include: {
        teams: true,
        zones: true,
        settings: true,
        bandStation: true,
      },
    });

    console.log(`[PAUSE] Game ${req.params.id} paused`);

    // Emit socket event
    const io = (req.app as any).get('io');
    io.to(`game:${game.id}`).emit('game:update', game);

    res.json(game);
  } catch (error) {
    console.error('Error pausing game:', error);
    res.status(500).json({ error: 'Failed to pause game' });
  }
});

// Resume game
router.post('/:id/resume', async (req, res) => {
  try {
    const currentGame = await prisma.game.findUnique({
      where: { id: req.params.id },
    });

    if (!currentGame) {
      return res.status(404).json({ error: 'Game not found' });
    }

    if (!currentGame.pausedAt) {
      return res.status(400).json({ error: 'Game is not paused' });
    }

    // Berechne Pause-Dauer (nur für Timer-Zwecke)
    const now = new Date();
    const pauseDurationSeconds = Math.floor((now.getTime() - new Date(currentGame.pausedAt).getTime()) / 1000);
    const newTotalPausedSeconds = (currentGame.totalPausedSeconds || 0) + pauseDurationSeconds;

    const game = await prisma.game.update({
      where: { id: req.params.id },
      data: {
        status: GameStatus.running,
        pausedAt: null,
        totalPausedSeconds: newTotalPausedSeconds,
      },
      include: {
        teams: true,
        zones: true,
        settings: true,
        bandStation: true,
      },
    });

    console.log(`[RESUME] Game ${req.params.id} resumed, pause duration: ${pauseDurationSeconds}s, total paused: ${newTotalPausedSeconds}s`);

    // Emit socket event
    const io = (req.app as any).get('io');
    io.to(`game:${game.id}`).emit('game:update', game);

    res.json(game);
  } catch (error) {
    console.error('Error resuming game:', error);
    res.status(500).json({ error: 'Failed to resume game' });
  }
});

// End game
router.post('/:id/end', async (req, res) => {
  try {
    const game = await prisma.game.update({
      where: { id: req.params.id },
      data: {
        status: GameStatus.finished,
        endedAt: new Date(),
      },
      include: {
        teams: true,
        zones: true,
        settings: true,
      },
    });

    // Emit socket event
    const io = (req.app as any).get('io');
    io.to(`game:${game.id}`).emit('game:update', game);

    res.json(game);
  } catch (error) {
    console.error('Error ending game:', error);
    res.status(500).json({ error: 'Failed to end game' });
  }
});

// Get scores for a game
router.get('/:gameId/scores', async (req, res) => {
  try {
    const { gameId } = req.params;

    const game = await prisma.game.findUnique({
      where: { id: gameId },
      include: {
        teams: { orderBy: { orderIndex: 'asc' } },
        zones: true,
        settings: true,
      },
    });

    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    // Import scoring service functions
    const { getScores } = await import('../services/scoring.service');
    const scores = await getScores(gameId);

    res.json(scores);
  } catch (error) {
    console.error('Error calculating scores:', error);
    res.status(500).json({ error: 'Failed to calculate scores' });
  }
});

// Get remaining time for a game
router.get('/:gameId/time', async (req, res) => {
  try {
    const { gameId } = req.params;

    const game = await prisma.game.findUnique({
      where: { id: gameId },
      include: { settings: true },
    });

    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    // Wenn keine Duration gesetzt ist
    if (!game.settings?.durationMinutes) {
      return res.json({
        hasTimer: false,
        remainingSeconds: null,
        totalSeconds: null,
        isExpired: false
      });
    }

    // Wenn Spiel noch nicht gestartet
    if (!game.startedAt) {
      const totalSeconds = game.settings.durationMinutes * 60;
      return res.json({
        hasTimer: true,
        remainingSeconds: totalSeconds,
        totalSeconds: totalSeconds,
        isExpired: false
      });
    }

    const totalPausedSeconds = game.totalPausedSeconds || 0;
    const startTime = new Date(game.startedAt);

    // Berechne die effektive verstrichene Zeit (ohne Pausen)
    let effectiveElapsedSeconds: number;

    if (game.endedAt) {
      // Game finished
      const totalElapsed = Math.floor((new Date(game.endedAt).getTime() - startTime.getTime()) / 1000);
      effectiveElapsedSeconds = totalElapsed - totalPausedSeconds;
    } else if (game.status === GameStatus.paused && game.pausedAt) {
      // Game paused - calculate from start to pausedAt, minus total paused time
      const totalElapsed = Math.floor((new Date(game.pausedAt).getTime() - startTime.getTime()) / 1000);
      effectiveElapsedSeconds = totalElapsed - totalPausedSeconds;
    } else {
      // Game running
      const now = new Date();
      const totalElapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);
      effectiveElapsedSeconds = totalElapsed - totalPausedSeconds;
    }

    const totalSeconds = game.settings.durationMinutes * 60;
    const remainingSeconds = Math.max(0, totalSeconds - effectiveElapsedSeconds);

    res.json({
      hasTimer: true,
      remainingSeconds,
      totalSeconds,
      isExpired: remainingSeconds === 0 && game.status !== GameStatus.finished
    });
  } catch (error) {
    console.error('Error calculating remaining time:', error);
    res.status(500).json({ error: 'Failed to calculate remaining time' });
  }
});

// Get timeline for a game
router.get('/:gameId/timeline', async (req, res) => {
  try {
    const { gameId } = req.params;

    const zoneEvents = await prisma.zoneOccupationEvent.findMany({
      where: { zone: { gameId } },
      include: {
        zone: true,
        team: true,
      },
      orderBy: { timestamp: 'desc' },
      take: 100,
    });

    const bandCaptures = await prisma.bandCapture.findMany({
      where: { gameId },
      include: {
        capturingTeam: true,
        capturedTeam: true,
      },
      orderBy: { timestamp: 'desc' },
      take: 100,
    });

    const timeline = [
      ...zoneEvents.map((e) => ({
        type: 'zone',
        action: e.action,
        timestamp: e.timestamp,
        zone: e.zone.name,
        team: e.team.name,
        teamColor: e.team.color,
      })),
      ...bandCaptures.map((c) => ({
        type: 'band',
        timestamp: c.timestamp,
        capturingTeam: c.capturingTeam.name,
        capturedTeam: c.capturedTeam.name,
        points: c.points,
      })),
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    res.json(timeline);
  } catch (error) {
    console.error('Error fetching timeline:', error);
    res.status(500).json({ error: 'Failed to fetch timeline' });
  }
});

export default router;
