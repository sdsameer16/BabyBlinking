import express from 'express';
import Doctor from '../models/Doctor.js';
import Hospital from '../models/Hospital.js';
import EmergencyPhone from '../models/EmergencyPhone.js';
import { authenticateAndCheckBlock } from '../middleware/authBlockCheck.js';

const router = express.Router();

// Save/Update Doctor Info
router.post('/doctor/:parentId', authenticateAndCheckBlock, async (req, res) => {
  try {
    const { parentId } = req.params;
    const { doctorName } = req.body;

    if (!parentId) return res.status(400).json({ success: false, error: 'parentId required' });
    if (!doctorName) return res.status(400).json({ success: false, error: 'doctorName required' });

    const doctor = await Doctor.findOneAndUpdate(
      { parentId },
      { doctorName, updatedAt: new Date() },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.json({ success: true, data: doctor });
  } catch (err) {
    console.error('Failed to save doctor info', err);
    return res.status(500).json({ success: false, error: 'Failed to save doctor info' });
  }
});

// Get Doctor Info
router.get('/doctor/:parentId', authenticateAndCheckBlock, async (req, res) => {
  try {
    const { parentId } = req.params;
    if (!parentId) return res.status(400).json({ success: false, error: 'parentId required' });

    const doctor = await Doctor.findOne({ parentId });
    if (!doctor) return res.json({ success: true, data: null });
    return res.json({ success: true, data: doctor });
  } catch (err) {
    console.error('Failed to fetch doctor info', err);
    return res.status(500).json({ success: false, error: 'Failed to fetch doctor info' });
  }
});

// Save/Update Hospital Info
router.post('/hospital/:parentId', authenticateAndCheckBlock, async (req, res) => {
  try {
    const { parentId } = req.params;
    const { hospitalName } = req.body;

    if (!parentId) return res.status(400).json({ success: false, error: 'parentId required' });
    if (!hospitalName) return res.status(400).json({ success: false, error: 'hospitalName required' });

    const hospital = await Hospital.findOneAndUpdate(
      { parentId },
      { hospitalName, updatedAt: new Date() },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.json({ success: true, data: hospital });
  } catch (err) {
    console.error('Failed to save hospital info', err);
    return res.status(500).json({ success: false, error: 'Failed to save hospital info' });
  }
});

// Get Hospital Info
router.get('/hospital/:parentId', authenticateAndCheckBlock, async (req, res) => {
  try {
    const { parentId } = req.params;
    if (!parentId) return res.status(400).json({ success: false, error: 'parentId required' });

    const hospital = await Hospital.findOne({ parentId });
    if (!hospital) return res.json({ success: true, data: null });
    return res.json({ success: true, data: hospital });
  } catch (err) {
    console.error('Failed to fetch hospital info', err);
    return res.status(500).json({ success: false, error: 'Failed to fetch hospital info' });
  }
});

// Save/Update Emergency Phone Info
router.post('/phone/:parentId', authenticateAndCheckBlock, async (req, res) => {
  try {
    const { parentId } = req.params;
    const { phoneNumber } = req.body;

    if (!parentId) return res.status(400).json({ success: false, error: 'parentId required' });
    if (!phoneNumber) return res.status(400).json({ success: false, error: 'phoneNumber required' });

    const phone = await EmergencyPhone.findOneAndUpdate(
      { parentId },
      { phoneNumber, updatedAt: new Date() },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.json({ success: true, data: phone });
  } catch (err) {
    console.error('Failed to save phone info', err);
    return res.status(500).json({ success: false, error: 'Failed to save phone info' });
  }
});

// Get Emergency Phone Info
router.get('/phone/:parentId', authenticateAndCheckBlock, async (req, res) => {
  try {
    const { parentId } = req.params;
    if (!parentId) return res.status(400).json({ success: false, error: 'parentId required' });

    const phone = await EmergencyPhone.findOne({ parentId });
    if (!phone) return res.json({ success: true, data: null });
    return res.json({ success: true, data: phone });
  } catch (err) {
    console.error('Failed to fetch phone info', err);
    return res.status(500).json({ success: false, error: 'Failed to fetch phone info' });
  }
});

// Get All Emergency Info for a Parent
router.get('/all/:parentId', authenticateAndCheckBlock, async (req, res) => {
  try {
    const { parentId } = req.params;
    if (!parentId) return res.status(400).json({ success: false, error: 'parentId required' });

    const [doctor, hospital, phone] = await Promise.all([
      Doctor.findOne({ parentId }),
      Hospital.findOne({ parentId }),
      EmergencyPhone.findOne({ parentId })
    ]);

    return res.json({ 
      success: true, 
      data: {
        doctor: doctor || null,
        hospital: hospital || null,
        phone: phone || null
      }
    });
  } catch (err) {
    console.error('Failed to fetch all emergency info', err);
    return res.status(500).json({ success: false, error: 'Failed to fetch all emergency info' });
  }
});

export default router;
