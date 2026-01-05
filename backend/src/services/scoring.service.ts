import { PrismaClient, GameStatus } from '@prisma/client';
import { Server } from 'socket.io';

const prisma = new PrismaClient();

export interface TeamScore {
  teamId: string;
  teamName: string;
  teamColor: string;
  zonePoints: number;
  bandPoints: number;
  totalPoints: number;
}

export interface ZoneStatus {
  zoneId: string;
  zoneName: string;
  teamsInZone: string[]; // team IDs
}

// Get current scores (simple DB read, no calculation needed)
export async function getScores(gameId: string): Promise<TeamScore[]> {
  const teams = await prisma.team.findMany({
    where: { gameId },
    orderBy: { orderIndex: 'asc' }
  });

  return teams.map(team => ({
    teamId: team.id,
    teamName: team.name,
    teamColor: team.color,
    zonePoints: team.zonePoints,
    bandPoints: team.bandPoints,
    totalPoints: team.zonePoints + team.bandPoints
  }));
}

// Get current zone statuses (simple DB read from ZoneOccupation table)
export async function calculateZoneStatuses(gameId: string): Promise<ZoneStatus[]> {
  const zones = await prisma.zone.findMany({
    where: { gameId },
    include: {
      currentOccupations: {
        include: { team: true }
      }
    }
  });

  return zones.map(zone => ({
    zoneId: zone.id,
    zoneName: zone.name,
    teamsInZone: zone.currentOccupations.map(occ => occ.teamId)
  }));
}

// Start periodic score updates - NEW SIMPLIFIED VERSION
export function startScoreUpdates(io: Server) {
  // Wait 3 seconds before starting the interval to ensure DB is ready
  setTimeout(() => {
    setInterval(async () => {
      try {
        // Get ONLY RUNNING games - paused games are automatically excluded
        const runningGames = await prisma.game.findMany({
          where: { status: GameStatus.running },
          include: {
            settings: true,
            zones: {
              include: {
                currentOccupations: true
              }
            }
          }
        });

        for (const game of runningGames) {
          const pointsPerSecond = game.settings?.pointsPerSecond || 1.0;

          // Collect which teams should get points this second
          const teamPointsToAdd: Record<string, number> = {};

          for (const zone of game.zones) {
            for (const occupation of zone.currentOccupations) {
              // Each team in a zone gets pointsPerSecond points
              teamPointsToAdd[occupation.teamId] =
                (teamPointsToAdd[occupation.teamId] || 0) + pointsPerSecond;
            }
          }

          // Batch update: Atomic increments for all teams with points
          const updatePromises = Object.entries(teamPointsToAdd).map(
            ([teamId, points]) =>
              prisma.team.update({
                where: { id: teamId },
                data: {
                  zonePoints: { increment: points }
                }
              })
          );

          await Promise.all(updatePromises);

          // Emit updated scores via WebSocket
          const scores = await getScores(game.id);
          const zoneStatuses = await calculateZoneStatuses(game.id);

          io.to(`game:${game.id}`).emit('scores:update', {
            scores,
            zoneStatuses,
            timestamp: new Date().toISOString()
          });
        }
      } catch (error) {
        console.error('Error in score update job:', error);
      }
    }, 1000); // Every 1 second

    console.log('📊 Score update job started (1s interval)');
  }, 3000); // Wait 3 seconds before starting
}
