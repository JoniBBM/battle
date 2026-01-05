import { Router } from 'express';
import { PrismaClient, OccupationAction, GameStatus } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Helper function to validate that a game is currently running
async function validateGameRunning(gameId: string): Promise<void> {
  const game = await prisma.game.findUnique({
    where: { id: gameId },
    select: { status: true, endedAt: true },
  });

  if (!game) {
    throw new Error('Game not found');
  }

  if (game.status !== GameStatus.running) {
    throw new Error(`Game is not running (status: ${game.status})`);
  }

  if (game.endedAt) {
    throw new Error('Game has already ended');
  }
}

// Authenticate station (zone or band station)
router.post('/auth', async (req, res) => {
  try {
    const { pin } = req.body;

    if (!pin) {
      return res.status(400).json({ error: 'PIN is required' });
    }

    // Check if it's a zone
    const zone = await prisma.zone.findFirst({
      where: { pin },
      include: { game: { include: { teams: true } } },
    });

    if (zone) {
      return res.json({
        type: 'zone',
        station: zone,
        game: zone.game,
      });
    }

    // Check if it's a band station
    const bandStation = await prisma.bandStation.findFirst({
      where: { pin },
      include: { game: { include: { teams: true } } },
    });

    if (bandStation) {
      return res.json({
        type: 'band',
        station: bandStation,
        game: bandStation.game,
      });
    }

    res.status(404).json({ error: 'Invalid PIN' });
  } catch (error) {
    console.error('Error authenticating station:', error);
    res.status(500).json({ error: 'Failed to authenticate' });
  }
});

// Team enters zone
router.post('/zones/:zoneId/enter', async (req, res) => {
  try {
    const { zoneId } = req.params;
    const { teamId, createdBy } = req.body;

    if (!teamId || !createdBy) {
      return res.status(400).json({ error: 'teamId and createdBy are required' });
    }

    // Get zone to retrieve gameId
    const zone = await prisma.zone.findUnique({
      where: { id: zoneId },
      select: { id: true, gameId: true },
    });

    if (!zone) {
      return res.status(404).json({ error: 'Zone not found' });
    }

    // Validate that the game is currently running
    try {
      await validateGameRunning(zone.gameId);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }

    await prisma.$transaction(async (tx) => {
      // 1. Create event (audit log)
      await tx.zoneOccupationEvent.create({
        data: {
          zoneId,
          teamId,
          action: OccupationAction.enter,
          createdBy,
        },
      });

      // 2. Upsert current occupation (idempotent)
      await tx.zoneOccupation.upsert({
        where: {
          zoneId_teamId: { zoneId, teamId },
        },
        update: {
          enteredAt: new Date(), // Re-entry: update timestamp
        },
        create: {
          zoneId,
          teamId,
          enteredAt: new Date(),
        },
      });
    });

    // Emit socket event
    const io = (req.app as any).get('io');
    io.to(`game:${zone.gameId}`).emit('zone:update', {
      zoneId,
      teamId,
      action: 'enter',
      timestamp: new Date().toISOString(),
    });

    res.status(201).json({ success: true });
  } catch (error) {
    console.error('Error recording zone entry:', error);
    res.status(500).json({ error: 'Failed to record zone entry' });
  }
});

// Team leaves zone
router.post('/zones/:zoneId/leave', async (req, res) => {
  try {
    const { zoneId } = req.params;
    const { teamId, createdBy } = req.body;

    if (!teamId || !createdBy) {
      return res.status(400).json({ error: 'teamId and createdBy are required' });
    }

    // Get zone with game and settings
    const zone = await prisma.zone.findUnique({
      where: { id: zoneId },
      include: {
        game: {
          include: { settings: true },
        },
      },
    });

    if (!zone) {
      return res.status(404).json({ error: 'Zone not found' });
    }

    // Validate that the game is currently running
    try {
      await validateGameRunning(zone.game.id);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }

    await prisma.$transaction(async (tx) => {
      // 1. Create event (audit log)
      await tx.zoneOccupationEvent.create({
        data: {
          zoneId,
          teamId,
          action: OccupationAction.leave,
          createdBy,
        },
      });

      // 2. Get current occupation to calculate final points
      const occupation = await tx.zoneOccupation.findUnique({
        where: {
          zoneId_teamId: { zoneId, teamId },
        },
      });

      if (occupation && zone.game.status === GameStatus.running) {
        // Calculate points for this occupation period
        const durationSeconds =
          (new Date().getTime() - occupation.enteredAt.getTime()) / 1000;
        const points = durationSeconds * (zone.game.settings?.pointsPerSecond || 1.0);

        // Award points
        await tx.team.update({
          where: { id: teamId },
          data: {
            zonePoints: { increment: points },
          },
        });
      }

      // 3. Delete occupation
      if (occupation) {
        await tx.zoneOccupation.delete({
          where: {
            zoneId_teamId: { zoneId, teamId },
          },
        });
      }
    });

    // Emit socket event
    const io = (req.app as any).get('io');
    io.to(`game:${zone.game.id}`).emit('zone:update', {
      zoneId,
      teamId,
      action: 'leave',
      timestamp: new Date().toISOString(),
    });

    res.status(201).json({ success: true });
  } catch (error) {
    console.error('Error recording zone leave:', error);
    res.status(500).json({ error: 'Failed to record zone leave' });
  }
});

// Get current zone status
router.get('/zones/:zoneId/status', async (req, res) => {
  try {
    const { zoneId } = req.params;

    // Simply query current occupations (no event replay needed!)
    const occupations = await prisma.zoneOccupation.findMany({
      where: { zoneId },
      include: { team: true },
    });

    res.json({
      zoneId,
      teamsInZone: occupations.map((occ) => occ.teamId),
    });
  } catch (error) {
    console.error('Error getting zone status:', error);
    res.status(500).json({ error: 'Failed to get zone status' });
  }
});

// Capture band
router.post('/bands/capture', async (req, res) => {
  try {
    const { gameId, capturingTeamId, capturedTeamId, stationName } = req.body;

    if (!gameId || !capturingTeamId || !capturedTeamId || !stationName) {
      return res.status(400).json({
        error: 'gameId, capturingTeamId, capturedTeamId and stationName are required',
      });
    }

    // Validate that the game is currently running
    try {
      await validateGameRunning(gameId);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }

    // Get points from game settings
    const settings = await prisma.gameSettings.findUnique({
      where: { gameId },
    });

    const points = settings?.bandCapturePoints || 10;

    const capture = await prisma.$transaction(async (tx) => {
      // 1. Create capture record
      const c = await tx.bandCapture.create({
        data: {
          gameId,
          capturingTeamId,
          capturedTeamId,
          points,
          stationName,
        },
        include: {
          capturingTeam: true,
          capturedTeam: true,
        },
      });

      // 2. Immediately add points to capturing team
      await tx.team.update({
        where: { id: capturingTeamId },
        data: {
          bandPoints: { increment: points },
        },
      });

      return c;
    });

    // Emit socket event
    const io = (req.app as any).get('io');
    io.to(`game:${gameId}`).emit('band:captured', capture);

    res.status(201).json(capture);
  } catch (error) {
    console.error('Error recording band capture:', error);
    res.status(500).json({ error: 'Failed to record band capture' });
  }
});

// Create band station
router.post('/bands/station', async (req, res) => {
  try {
    const { gameId, name, pin } = req.body;

    if (!gameId || !name || !pin) {
      return res.status(400).json({ error: 'gameId, name and pin are required' });
    }

    const station = await prisma.bandStation.create({
      data: {
        gameId,
        name,
        pin,
      },
    });

    res.status(201).json(station);
  } catch (error) {
    console.error('Error creating band station:', error);
    res.status(500).json({ error: 'Failed to create band station' });
  }
});

export default router;
