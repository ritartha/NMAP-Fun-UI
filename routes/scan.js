const express = require('express');
const router = express.Router();
const { spawn } = require('child_process');
const which = require('which');
const xml2js = require('xml2js');
const fs = require('fs');
const path = require('path');
const os = require('os');

const NMAP_PATH = process.env.NMAP_PATH || 'nmap';
const OUTPUT_DIR = process.env.OUTPUT_DIR || './nmap_outputs';

// Utility: Get timestamp
function getTimestamp() {
  return new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
}

// Utility: Validate targets
function validateTargets(targetsText) {
  const targets = [];
  const entries = targetsText.split(/[,\s]+/);
  
  const ipv4Regex = /^([0-9]{1,3}\.){3}[0-9]{1,3}$/;
  const ipv6Regex = /^[0-9a-fA-F:]{3,}$/;
  const domainRegex = /^([a-zA-Z0-9\-\.]+)$/;

  for (const entry of entries) {
    const t = entry.trim();
    if (!t) continue;
    if (ipv4Regex.test(t) || ipv6Regex.test(t) || domainRegex.test(t)) {
      targets.push(t);
    }
  }
  return targets;
}

// Utility: Check if running as root
function isRoot() {
  return process.getuid && process.getuid() === 0;
}

// POST /api/scan/run
router.post('/run', async (req, res) => {
  try {
    const { targets, mode } = req.body;

    if (!targets || targets.trim().length === 0) {
      return res.status(400).json({ error: 'No targets provided' });
    }

    const validTargets = validateTargets(targets);
    if (validTargets.length === 0) {
      return res.status(400).json({ error: 'No valid targets found' });
    }

    // Check if nmap is available
    try {
      which.sync(NMAP_PATH);
    } catch (e) {
      return res.status(500).json({ error: 'nmap not found in PATH. Please install nmap.' });
    }

    // Build nmap arguments
    const args = ['-oX', '-', '-n'];
    const hasRoot = isRoot();

    switch (mode) {
      case 'ping':
        args.unshift('-sn');
        break;
      case 'quick':
        args.push('--top-ports', '200', '-T4');
        break;
      case 'fulltcp':
        args.push('-p-', '-T4');
        break;
      case 'svcdetect':
        if (hasRoot) {
          args.push('-sS', '-sV', '-T4');
        } else {
          args.push('-sT', '-sV', '-T4');
        }
        break;
      case 'os':
        if (hasRoot) {
          args.push('-O', '-sS', '-sV', '--osscan-guess', '--traceroute', '-T4');
        } else {
          args.push('-O', '-sT', '-sV', '--osscan-guess', '--traceroute', '-T4');
        }
        break;
      case 'nse':
        args.push('-sC', '-sV', '-T4');
        break;
      default:
        args.push('-sV', '-T4');
    }

    args.push(...validTargets);

    // Run nmap
    const nmapProcess = spawn(NMAP_PATH, args);
    let stdout = '';
    let stderr = '';

    nmapProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    nmapProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    nmapProcess.on('close', (code) => {
      if (stderr) {
        return res.status(500).json({ error: stderr, code });
      }

      if (!stdout || stdout.indexOf('<nmaprun') === -1) {
        return res.json({ error: stdout || 'No XML output captured', xml: stdout });
      }

      // Save XML to file
      const filename = `nmap_scan_${getTimestamp()}.xml`;
      const filepath = path.join(OUTPUT_DIR, filename);

      fs.writeFile(filepath, stdout, (err) => {
        if (err) {
          console.error('Failed to save XML:', err);
        }
      });

      res.json({
        success: true,
        xml: stdout,
        file: filepath,
        timestamp: new Date().toISOString()
      });
    });

    nmapProcess.on('error', (err) => {
      res.status(500).json({ error: err.message });
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/scan/parse
router.post('/parse', async (req, res) => {
  try {
    const { xml } = req.body;

    if (!xml) {
      return res.status(400).json({ error: 'No XML provided' });
    }

    const parser = new xml2js.Parser();
    const result = await parser.parseStringPromise(xml);

    const nmaprun = result.nmaprun;
    if (!nmaprun || !nmaprun.host) {
      return res.json({
        hosts: [],
        summary: { total: 0, up: 0, down: 0 }
      });
    }

    const hosts = Array.isArray(nmaprun.host) ? nmaprun.host : [nmaprun.host];
    const parsedHosts = [];

    for (const host of hosts) {
      const status = host.status ? host.status[0] : {};
      const state = status.$ ? status.$.state : 'unknown';

      let ipAddr = null;
      let macAddr = null;
      let macVendor = null;

      if (host.address) {
        const addresses = Array.isArray(host.address) ? host.address : [host.address];
        for (const addr of addresses) {
          const addrType = addr.$.addrtype;
          if (addrType === 'ipv4' || addrType === 'ipv6') {
            ipAddr = addr.$.addr;
          } else if (addrType === 'mac') {
            macAddr = addr.$.addr;
            macVendor = addr.$.vendor || null;
          }
        }
      }

      let osGuess = null;
      if (host.os && host.os[0] && host.os[0].osmatch) {
        const osmatch = Array.isArray(host.os[0].osmatch) ? host.os[0].osmatch[0] : host.os[0].osmatch;
        osGuess = osmatch.$.name;
      }

      const ports = [];
      if (host.ports && host.ports[0] && host.ports[0].port) {
        const portsList = Array.isArray(host.ports[0].port) ? host.ports[0].port : [host.ports[0].port];
        for (const port of portsList) {
          const protocol = port.$.protocol;
          const portid = port.$.portid;
          const portState = port.state ? port.state[0].$ : {};
          const portStatus = portState.state || 'unknown';
          const reason = portState.reason || '';

          let service = { name: '-', product: '', version: '', extrainfo: '' };
          if (port.service && port.service[0]) {
            service = {
              name: port.service[0].$.name || '-',
              product: port.service[0].$.product || '',
              version: port.service[0].$.version || '',
              extrainfo: port.service[0].$.extrainfo || ''
            };
          }

          const versionStr = [service.product, service.version, service.extrainfo]
            .filter(x => x)
            .join(' ')
            .trim() || '-';

          ports.push({
            protocol,
            port: portid,
            state: portStatus,
            reason,
            service: service.name,
            version: versionStr
          });
        }
      }

      parsedHosts.push({
        address: ipAddr,
        mac: macAddr,
        macVendor: macVendor,
        state: state,
        osGuess: osGuess,
        ports: ports,
        starttime: host.$.starttime,
        endtime: host.$.endtime
      });
    }

    const summary = {
      total: parsedHosts.length,
      up: parsedHosts.filter(h => h.state === 'up').length,
      down: parsedHosts.filter(h => h.state === 'down').length
    };

    res.json({
      success: true,
      hosts: parsedHosts,
      summary: summary
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;