const express = require('express');
const router = express.Router();
const Recording = require('../models/Recording');

// POST /lab/register
// Body: { zip, airQuality }
router.post('/register', async (req, res) => {
  const { zip, airQuality } = req.body;

  // required fields present?
  if (zip === undefined || airQuality === undefined) {
    return res.status(400).json({ error: 'zip and airQuality are required.' });
  }

  // coerce and validate numbers
  const z = Number(zip);
  const aq = Number(airQuality);
  if (Number.isNaN(z) || Number.isNaN(aq)) {
    return res.status(400).json({ error: 'zip and airQuality are required.' });
  }

  try {
    await Recording.create({ zip: z, airQuality: aq });
    return res.status(201).json({ response: 'Data recorded.' });
  } catch (e) {
    return res.status(500).json({ error: 'Database error' });
  }
});

// GET /lab/status?zip=85705
// Return average airQuality for that zip as a bare number JSON, toFixed(2)
router.get('/status', async (req, res) => {
  const { zip } = req.query;
  const z = Number(zip);

  if (!zip || Number.isNaN(z)) {
    return res.status(400).json({ error: 'a zip code is required.' });
  }

  try {
    const docs = await Recording.find({ zip: z }).lean();
    if (docs.length === 0) {
      return res.status(400).json({ error: 'Zip does not exist in the database.' });
    }

    const avg = docs.reduce((s, d) => s + d.airQuality, 0) / docs.length;
    // Spec wants just the number, truncated to 2 decimals
    return res.status(200).json(Number(avg.toFixed(2)));
  } catch (e) {
    return res.status(500).json({ error: 'Database error' });
  }
});

module.exports = router;
