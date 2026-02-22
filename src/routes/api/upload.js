const { Router } = require('express');
const multer = require('multer');
const requireAuth = require('../../middleware/requireAuth');
const photoService = require('../../services/photoService');

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// POST /api/upload
router.post('/upload', requireAuth, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No photo file provided' });
    }

    const section = req.body.section || 'general';
    const identifier = req.body.identifier || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const result = await photoService.upload(
      req.family.id,
      section,
      identifier,
      req.file.buffer,
      req.file.mimetype
    );

    res.json(result);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/photos/:storagePath
router.delete('/photos/:storagePath', requireAuth, async (req, res, next) => {
  try {
    const storagePath = decodeURIComponent(req.params.storagePath);
    // Ensure the user can only delete their own photos
    if (!storagePath.startsWith(req.family.id)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    await photoService.remove(storagePath);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
