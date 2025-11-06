// routes/lab.js
const express = require('express');
const router = express.Router();
const Recording = require('../models/Recording');

// GET /lab/status?zip=85705
router.get('/status', async (req, res) => {
  const z = req.query.zip;
  const zipNum = Number(z);

  // zip missing or invalid
  if (!z || Number.isNaN(zipNum)) {
    return res.status(400).json({ error: 'a zip code is required.' });
  }

  // compute average for that zip
  const agg = await Recording.aggregate([
    { $match: { zip: zipNum } },
    { $group: { _id: null, avg: { $avg: '$airQuality' } } }
  ]);

  if (agg.length === 0) {
    return res.status(400).json({ error: 'Zip does not exist in the database.' });
  }

  // must be truncated to 2 decimals via toFixed; send just the number
  const avgStr = agg[0].avg.toFixed(2);    // string like "28.88"
  return res.status(200).json(Number(avgStr));
});

// POST /lab/register  body: { "zip": 85705, "airQuality": 12.3 }
router.post('/register', async (req, res) => {
  const { zip, airQuality } = req.body;

  if (zip === undefined || airQuality === undefined) {
    return res.status(400).json({ error: 'zip and airQuality are required.' });
  }

  const zipNum = Number(zip);
  const aqNum = Number(airQuality);
  if (Number.isNaN(zipNum) || Number.isNaN(aqNum)) {
    return res.status(400).json({ error: 'zip and airQuality are required.' });
  }

  await Recording.create({ zip: zipNum, airQuality: aqNum });
  return res.status(201).json({ response: 'Data recorded.' });
});

module.exports = router;

