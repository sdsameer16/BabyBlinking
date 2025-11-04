import express from 'express';
import ParentInfo from '../models/ParentInfo.js';
import { authenticateAndCheckBlock } from '../middleware/authBlockCheck.js';

const router = express.Router();

// Upsert parent emergency info (protected)
router.post('/parent-info/:parentId', authenticateAndCheckBlock, async (req, res) => {
  try {
    const { parentId } = req.params;
    const { pediatrician, emergencyNumber, poisonControl } = req.body;

    if (!parentId) return res.status(400).json({ success: false, error: 'parentId required' });

    const updated = await ParentInfo.findOneAndUpdate(
      { parentId },
      { pediatrician, emergencyNumber, poisonControl, updatedAt: new Date() },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.json({ success: true, data: updated });
  } catch (err) {
    console.error('Failed to upsert parent info', err);
    return res.status(500).json({ success: false, error: 'Failed to save parent info' });
  }
});

// Get parent info (protected)
router.get('/parent-info/:parentId', authenticateAndCheckBlock, async (req, res) => {
  try {
    const { parentId } = req.params;
    if (!parentId) return res.status(400).json({ success: false, error: 'parentId required' });

    const doc = await ParentInfo.findOne({ parentId });
    if (!doc) return res.json({ success: true, data: null });
    return res.json({ success: true, data: doc });
  } catch (err) {
    console.error('Failed to fetch parent info', err);
    return res.status(500).json({ success: false, error: 'Failed to fetch parent info' });
  }
});

export default router;
