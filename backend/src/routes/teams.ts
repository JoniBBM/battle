import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Create team
router.post('/', async (req, res) => {
  try {
    const { gameId, name, color } = req.body;

    if (!gameId || !name || !color) {
      return res.status(400).json({ error: 'gameId, name and color are required' });
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

// Update team
router.put('/:id', async (req, res) => {
  try {
    const { name, color } = req.body;
    const updates: any = {};

    if (name) updates.name = name;
    if (color) updates.color = color;

    const team = await prisma.team.update({
      where: { id: req.params.id },
      data: updates,
    });

    res.json(team);
  } catch (error) {
    console.error('Error updating team:', error);
    res.status(500).json({ error: 'Failed to update team' });
  }
});

// Delete team
router.delete('/:id', async (req, res) => {
  try {
    await prisma.team.delete({
      where: { id: req.params.id },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting team:', error);
    res.status(500).json({ error: 'Failed to delete team' });
  }
});

export default router;
