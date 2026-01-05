import { Router } from 'express';

const router = Router();
const ADMIN_PASSWORD = '1234qwer!';

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { password } = req.body;

    if (!password || password !== ADMIN_PASSWORD) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    res.json({ success: true, token: ADMIN_PASSWORD });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// Verify token endpoint
router.post('/verify', async (req, res) => {
  const { token } = req.body;
  res.json({ valid: token === ADMIN_PASSWORD });
});

export default router;
