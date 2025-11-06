const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const scanRoutes = require('./routes/scan');
const historyRoutes = require('./routes/history');
const exportRoutes = require('./routes/export');

const app = express();

// Middleware
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Ensure output directory exists
const outputDir = process.env.OUTPUT_DIR || './nmap_outputs';
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Routes
app.use('/api/scan', scanRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/export', exportRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Nmap GUI Server is running' });
});

// Serve index.html for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`🚀 Nmap GUI Server running on http://${HOST}:${PORT}`);
  console.log(`📂 Output directory: ${outputDir}`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV}`);
});