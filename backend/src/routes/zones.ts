import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Create zone
router.post('/', async (req, res) => {
  try {
    const { gameId, name, pin } = req.body;

    if (!gameId || !name || !pin) {
      return res.status(400).json({ error: 'gameId, name and pin are required' });
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

// Update zone
router.put('/:id', async (req, res) => {
  try {
    const { name, pin } = req.body;
    const updates: any = {};

    if (name) updates.name = name;
    if (pin) updates.pin = pin;

    const zone = await prisma.zone.update({
      where: { id: req.params.id },
      data: updates,
    });

    res.json(zone);
  } catch (error) {
    console.error('Error updating zone:', error);
    res.status(500).json({ error: 'Failed to update zone' });
  }
});

// Delete zone
router.delete('/:id', async (req, res) => {
  try {
    await prisma.zone.delete({
      where: { id: req.params.id },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting zone:', error);
    res.status(500).json({ error: 'Failed to delete zone' });
  }
});

export default router;
