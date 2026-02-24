const { Router } = require('express');
const domainService = require('../../services/domainService');
const { spaceship } = require('../../config/spaceship');

const router = Router();

// GET /api/domains/search?name=janedoe
router.get('/search', async (req, res, next) => {
  try {
    if (!spaceship) {
      return res.status(503).json({ error: 'Domain search is not available at this time' });
    }

    const { name } = req.query;
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'name query parameter is required' });
    }

    const clean = domainService.sanitizeBaseName(name);
    if (!clean || clean.length < 2) {
      return res.status(400).json({ error: 'Name must be at least 2 characters (letters, numbers, hyphens)' });
    }

    const { results, alternatives } = await domainService.searchDomains(clean);
    res.json({ results, alternatives });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
