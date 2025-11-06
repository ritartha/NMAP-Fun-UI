const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = process.env.OUTPUT_DIR || './nmap_outputs';

// POST /api/export/csv
router.post('/csv', (req, res) => {
  try {
    const { ports } = req.body;

    if (!ports || ports.length === 0) {
      return res.status(400).json({ error: 'No ports to export' });
    }

    const headers = ['protocol', 'port', 'state', 'service', 'version'];
    const rows = ports.map(p => [
      p.protocol,
      p.port,
      p.state,
      p.service,
      p.version
    ]);

    // Create CSV manually without external library
    const csvContent = [
      headers.map(h => `"${h}"`).join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const filename = `ports_export_${Date.now()}.csv`;
    const filepath = path.join(OUTPUT_DIR, filename);

    fs.writeFileSync(filepath, csvContent);

    res.json({
      success: true,
      filename,
      path: filepath,
      csv: csvContent
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/export/xml
router.post('/xml', (req, res) => {
  try {
    const { xml } = req.body;

    if (!xml) {
      return res.status(400).json({ error: 'No XML to export' });
    }

    const filename = `nmap_export_${Date.now()}.xml`;
    const filepath = path.join(OUTPUT_DIR, filename);

    fs.writeFileSync(filepath, xml);

    res.json({
      success: true,
      filename,
      path: filepath
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/export/list
router.get('/list', (req, res) => {
  try {
    if (!fs.existsSync(OUTPUT_DIR)) {
      return res.json({ success: true, exports: [] });
    }

    const files = fs.readdirSync(OUTPUT_DIR);
    const exports = files
      .filter(f => f.startsWith('nmap_') || f.startsWith('ports_'))
      .map(f => ({
        name: f,
        path: path.join(OUTPUT_DIR, f),
        size: fs.statSync(path.join(OUTPUT_DIR, f)).size,
        mtime: fs.statSync(path.join(OUTPUT_DIR, f)).mtime
      }));

    res.json({ success: true, exports });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;