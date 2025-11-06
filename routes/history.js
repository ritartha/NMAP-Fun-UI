const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = process.env.OUTPUT_DIR || './nmap_outputs';
const HISTORY_LIMIT = parseInt(process.env.SCAN_HISTORY_LIMIT) || 10;

let scanHistory = [];

// GET /api/history
router.get('/', (req, res) => {
  res.json({
    success: true,
    history: scanHistory.slice(0, HISTORY_LIMIT)
  });
});

// POST /api/history/add
router.post('/add', (req, res) => {
  try {
    const { targets, mode, file, summary } = req.body;

    const entry = {
      id: Date.now(),
      targets,
      mode,
      file,
      summary,
      timestamp: new Date().toISOString()
    };

    scanHistory.unshift(entry);

    if (scanHistory.length > HISTORY_LIMIT) {
      scanHistory = scanHistory.slice(0, HISTORY_LIMIT);
    }

    res.json({ success: true, history: scanHistory });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/history/get/:id
router.get('/get/:id', (req, res) => {
  try {
    const entry = scanHistory.find(h => h.id == req.params.id);

    if (!entry) {
      return res.status(404).json({ error: 'History entry not found' });
    }

    const xml = fs.readFileSync(entry.file, 'utf-8');
    res.json({ success: true, xml, entry });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/history/clear
router.post('/clear', (req, res) => {
  scanHistory = [];
  res.json({ success: true, message: 'History cleared' });
});

module.exports = router;