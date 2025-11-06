// ============================================
// NMAP GUI - Professional App.js
// Complete Frontend Application Logic
// ============================================

// App State Management
const state = {
  lastXml: null,
  lastArgs: null,
  scanning: false,
  scanHistory: [],
  ports: [],
  currentHost: null,
  theme: localStorage.getItem('theme') || 'light',
  scanCount: parseInt(localStorage.getItem('scanCount')) || 0
};

// DOM Elements Cache
const elements = {
  // Input/Control
  targetInput: document.getElementById('targetInput'),
  portFilterInput: document.getElementById('portFilterInput'),
  
  // Buttons - Scan Modes
  scanBtns: document.querySelectorAll('.scan-btn'),
  
  // Buttons - Actions
  saveXmlBtn: document.getElementById('saveXmlBtn'),
  exportCsvBtn: document.getElementById('exportCsvBtn'),
  copyResultsBtn: document.getElementById('copyResultsBtn'),
  openFolderBtn: document.getElementById('openFolderBtn'),
  rerunBtn: document.getElementById('rerunBtn'),
  clearHistoryBtn: document.getElementById('clearAllHistoryBtn'),
  
  // Display Elements
  portsTable: document.getElementById('portsTable'),
  portsBody: document.getElementById('portsBody'),
  portCountBadge: document.getElementById('portCountBadge'),
  
  // Summary Elements
  hostLabel: document.getElementById('hostLabel'),
  macLabel: document.getElementById('macLabel'),
  osLabel: document.getElementById('osLabel'),
  statusLed: document.getElementById('statusLed'),
  
  // Status/Logs
  logContainer: document.getElementById('logContainer'),
  statusText: document.getElementById('statusText'),
  progressBar: document.getElementById('progressBar'),
  
  // History
  historyList: document.getElementById('historyList'),
  
  // Header
  themeToggle: document.getElementById('themeToggle'),
  settingsBtn: document.getElementById('settingsBtn'),
  helpBtn: document.getElementById('helpBtn'),
  scanCount: document.getElementById('scanCount'),
  portCount: document.getElementById('portCount'),
  
  // Settings Modal
  settingsModal: document.getElementById('settingsModal'),
  closeSettingsBtn: document.getElementById('closeSettingsBtn'),
  cancelSettingsBtn: document.getElementById('cancelSettingsBtn'),
  saveSettingsBtn: document.getElementById('saveSettingsBtn'),
  defaultTargetInput: document.getElementById('defaultTargetInput'),
  
  // Help Modal
  helpModal: document.getElementById('helpModal'),
  closeHelpBtn: document.getElementById('closeHelpBtn'),
  closeHelpBtnFooter: document.getElementById('closeHelpBtnFooter')
};

// ============================================
// INITIALIZATION
// ============================================

function init() {
  console.log('🚀 Initializing Nmap GUI...');
  
  applyTheme(state.theme);
  loadSettings();
  setupEventListeners();
  loadScanHistory();
  checkServerStatus();
  updateStats();
  
  console.log('✅ App initialized successfully');
}

// ============================================
// EVENT LISTENERS
// ============================================

function setupEventListeners() {
  // Scan Mode Buttons
  elements.scanBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = btn.dataset.mode;
      startScan(mode);
    });
  });

  // Quick Action Buttons
  elements.saveXmlBtn.addEventListener('click', saveLastXml);
  elements.exportCsvBtn.addEventListener('click', exportPortsCsv);
  elements.copyResultsBtn.addEventListener('click', copyResults);
  elements.openFolderBtn.addEventListener('click', openOutputFolder);
  elements.rerunBtn.addEventListener('click', rerunLastScan);
  elements.clearHistoryBtn.addEventListener('click', clearHistory);

  // Port Filter
  elements.portFilterInput.addEventListener('input', filterPorts);

  // Header Controls
  elements.themeToggle.addEventListener('click', toggleTheme);
  elements.settingsBtn.addEventListener('click', openSettings);
  elements.helpBtn.addEventListener('click', openHelp);

  // Settings Modal
  elements.closeSettingsBtn.addEventListener('click', closeSettings);
  elements.cancelSettingsBtn.addEventListener('click', closeSettings);
  elements.saveSettingsBtn.addEventListener('click', saveSettings);
  elements.settingsModal.addEventListener('click', (e) => {
    if (e.target === elements.settingsModal) closeSettings();
  });

  // Help Modal
  elements.closeHelpBtn.addEventListener('click', closeHelp);
  elements.closeHelpBtnFooter.addEventListener('click', closeHelp);
  elements.helpModal.addEventListener('click', (e) => {
    if (e.target === elements.helpModal) closeHelp();
  });

  // Table Column Sorting
  document.querySelectorAll('.ports-table th.sortable').forEach(th => {
    th.addEventListener('click', () => {
      sortTable(th.dataset.column);
    });
  });
}

// ============================================
// API CALLS
// ============================================

async function runScan(targets, mode) {
  try {
    const response = await fetch('/api/scan/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targets, mode })
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Scan error:', error);
    return { error: error.message };
  }
}

async function parseNmapXml(xml) {
  try {
    const response = await fetch('/api/scan/parse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ xml })
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Parse error:', error);
    return { error: error.message };
  }
}

async function addToHistory(targets, mode, file, summary) {
  try {
    const response = await fetch('/api/history/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targets, mode, file, summary })
    });

    const data = await response.json();
    state.scanHistory = data.history;
    refreshHistoryList();
  } catch (error) {
    console.error('History error:', error);
  }
}

async function getHistoryScan(id) {
  try {
    const response = await fetch(`/api/history/get/${id}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Get history error:', error);
    return { error: error.message };
  }
}

async function exportCsv(ports) {
  try {
    const response = await fetch('/api/export/csv', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ports })
    });

    const data = await response.json();
    if (data.csv) {
      downloadFile(data.csv, `nmap_ports_${Date.now()}.csv`, 'text/csv');
      showNotification(`CSV exported: ${data.filename}`, 'success');
    }
    return data;
  } catch (error) {
    console.error('Export error:', error);
    showNotification('Export failed', 'error');
  }
}

async function exportXml(xml) {
  try {
    const response = await fetch('/api/export/xml', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ xml })
    });

    const data = await response.json();
    if (data.success) {
      downloadFile(xml, data.filename, 'application/xml');
      showNotification(`XML exported: ${data.filename}`, 'success');
    }
    return data;
  } catch (error) {
    console.error('Export error:', error);
    showNotification('Export failed', 'error');
  }
}

// ============================================
// SCANNING
// ============================================

function startScan(mode) {
  const targets = elements.targetInput.value.trim();

  if (!targets) {
    showNotification('Please enter targets to scan', 'warning');
    return;
  }

  if (state.scanning) {
    showNotification('A scan is already running', 'warning');
    return;
  }

  clearResults();
  state.scanning = true;
  disableAllButtons(true);
  updateStatus('Scanning...');
  elements.progressBar.classList.add('active');

  runScan(targets, mode)
    .then(async (result) => {
      if (result.error) {
        showNotification(`Error: ${result.error}`, 'error');
        appendLog(`ERROR: ${result.error}`, 'error');
        setLed('down');
      } else if (result.xml) {
        state.lastXml = result.xml;
        appendLog(`✓ Scan completed successfully`, 'success');
        appendLog(`📁 File: ${result.file}`, 'info');

        // Parse the XML
        const parsed = await parseNmapXml(result.xml);
        if (parsed.error) {
          appendLog(`Parse error: ${parsed.error}`, 'error');
        } else {
          displayResults(parsed, targets, mode);
          
          // Increment scan counter
          state.scanCount++;
          localStorage.setItem('scanCount', state.scanCount);
          elements.scanCount.textContent = state.scanCount;
          
          // Add to history
          await addToHistory(targets, mode, result.file, generateSummary(parsed));
        }
      }
    })
    .catch((error) => {
      showNotification(`Scan failed: ${error.message}`, 'error');
      appendLog(`EXCEPTION: ${error.message}`, 'error');
      setLed('down');
    })
    .finally(() => {
      state.scanning = false;
      disableAllButtons(false);
      updateStatus('Ready');
      elements.progressBar.classList.remove('active');
    });
}

function displayResults(parsed, targets, mode) {
  if (!parsed.hosts || parsed.hosts.length === 0) {
    appendLog('⚠️ No hosts found in scan results', 'warning');
    setLed('down');
    return;
  }

  const host = parsed.hosts[0];
  state.currentHost = host;

  // Update LED
  setLed(host.state === 'up' ? 'up' : 'down');

  // Update labels
  elements.hostLabel.textContent = host.address || '-';
  elements.macLabel.textContent = (host.mac || '-') + (host.macVendor ? ` (${host.macVendor})` : '');
  elements.osLabel.textContent = host.osGuess || '-';

  // Display ports
  state.ports = host.ports || [];
  displayPorts(state.ports);
  updateStats();

  // Log summary
  appendLog('--- Scan Summary ---', 'success');
  appendLog(`🎯 Host: ${host.address} is ${host.state.toUpperCase()}`, 'success');
  if (host.mac) {
    appendLog(`📍 MAC: ${host.mac}`, 'info');
  }
  if (host.osGuess) {
    appendLog(`🖥️ OS: ${host.osGuess}`, 'info');
  }
  appendLog(`📊 Ports found: ${state.ports.length}`, 'success');
}

function displayPorts(ports) {
  elements.portsBody.innerHTML = '';

  if (!ports || ports.length === 0) {
    elements.portsBody.innerHTML = '<tr class="empty-row"><td colspan="5">No ports found</td></tr>';
    return;
  }

  ports.forEach((port) => {
    const row = document.createElement('tr');
    const stateClass = port.state === 'open' ? 'port-open' : 
                       port.state === 'filtered' ? 'port-filtered' : 'port-closed';

    row.innerHTML = `
      <td>${port.protocol}</td>
      <td class="${stateClass}">${port.port}</td>
      <td>${port.state}</td>
      <td>${port.service}</td>
      <td>${port.version}</td>
    `;

    elements.portsBody.appendChild(row);
  });

  elements.portCountBadge.textContent = ports.length;
}

function generateSummary(parsed) {
  if (!parsed.hosts || parsed.hosts.length === 0) {
    return 'No hosts found';
  }

  const host = parsed.hosts[0];
  const ports = host.ports ? host.ports.length : 0;
  return `${host.address} • ${host.state} • ${ports} ports`;
}

// ============================================
// UI UPDATES
// ============================================

function clearResults() {
  elements.portsBody.innerHTML = '<tr class="empty-row"><td colspan="5">No ports scanned yet. Select a target and scan mode to begin.</td></tr>';
  elements.logContainer.innerHTML = '<p class="log-message">Logs will appear here...</p>';
  setLed('gray');
  elements.hostLabel.textContent = '-';
  elements.macLabel.textContent = '-';
  elements.osLabel.textContent = '-';
  elements.portCountBadge.textContent = '0';
  state.lastXml = null;
  state.ports = [];
  state.currentHost = null;
  updateStats();
}

function appendLog(text, type = 'info') {
  const existing = document.querySelector('.log-message');
  if (existing) {
    elements.logContainer.innerHTML = '';
  }

  const logEntry = document.createElement('div');
  logEntry.className = `log-entry ${type}`;
  const time = new Date().toLocaleTimeString();
  logEntry.textContent = `[${time}] ${text}`;
  elements.logContainer.appendChild(logEntry);
  elements.logContainer.scrollTop = elements.logContainer.scrollHeight;
}

function setLed(color) {
  elements.statusLed.className = `led ${color}`;
}

function updateStatus(text) {
  elements.statusText.textContent = text;
}

function updateStats() {
  elements.portCount.textContent = state.ports.length;
  elements.scanCount.textContent = state.scanCount;
}

function disableAllButtons(disabled) {
  elements.scanBtns.forEach(btn => btn.disabled = disabled);
  elements.saveXmlBtn.disabled = disabled || !state.lastXml;
  elements.exportCsvBtn.disabled = disabled || state.ports.length === 0;
  elements.copyResultsBtn.disabled = disabled || state.ports.length === 0;
  elements.rerunBtn.disabled = disabled || !state.lastXml;
}

function filterPorts() {
  const filter = elements.portFilterInput.value.toLowerCase();
  const rows = elements.portsBody.querySelectorAll('tr');

  rows.forEach((row) => {
    if (row.classList.contains('empty-row')) return;
    const text = row.textContent.toLowerCase();
    row.style.display = text.includes(filter) ? '' : 'none';
  });
}

function sortTable(column) {
  const rows = Array.from(elements.portsBody.querySelectorAll('tr:not(.empty-row)'));
  const columnIndex = {
    'protocol': 0,
    'port': 1,
    'state': 2,
    'service': 3,
    'version': 4
  }[column];

  rows.sort((a, b) => {
    const aVal = a.children[columnIndex].textContent.trim();
    const bVal = b.children[columnIndex].textContent.trim();

    if (!isNaN(aVal) && !isNaN(bVal)) {
      return parseInt(aVal) - parseInt(bVal);
    }
    return aVal.localeCompare(bVal);
  });

  rows.forEach(row => elements.portsBody.appendChild(row));
}

// ============================================
// QUICK ACTIONS
// ============================================

function saveLastXml() {
  if (!state.lastXml) {
    showNotification('No XML to save', 'warning');
    return;
  }

  exportXml(state.lastXml).then((result) => {
    if (result.success) {
      appendLog(`💾 Saved XML to ${result.filename}`, 'success');
    }
  });
}

function exportPortsCsv() {
  if (state.ports.length === 0) {
    showNotification('No ports to export', 'warning');
    return;
  }

  exportCsv(state.ports);
}

function copyResults() {
  if (state.ports.length === 0) {
    showNotification('No ports to copy', 'warning');
    return;
  }

  const text = state.ports
    .map(p => `${p.protocol}\t${p.port}\t${p.state}\t${p.service}\t${p.version}`)
    .join('\n');

  navigator.clipboard.writeText(text).then(() => {
    showNotification('Results copied to clipboard', 'success');
    appendLog('📋 Results copied to clipboard', 'success');
  }).catch(() => {
    showNotification('Failed to copy', 'error');
  });
}

function openOutputFolder() {
  showNotification('Output folder: ./nmap_outputs on the server', 'info');
  appendLog('📁 Scan outputs saved in ./nmap_outputs directory', 'info');
}

function rerunLastScan() {
  if (!state.lastXml) {
    showNotification('No previous scan to re-run', 'warning');
    return;
  }

  showNotification('Re-running last scan...', 'info');
  startScan('quick');
}

function clearHistory() {
  if (confirm('Are you sure you want to clear all scan history? This cannot be undone.')) {
    fetch('/api/history/clear', { method: 'POST' })
      .then(() => {
        state.scanHistory = [];
        refreshHistoryList();
        showNotification('History cleared', 'success');
        appendLog('🗑️ Scan history cleared', 'info');
      })
      .catch(() => {
        showNotification('Failed to clear history', 'error');
      });
  }
}

// ============================================
// HISTORY MANAGEMENT
// ============================================

function loadScanHistory() {
  fetch('/api/history')
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        state.scanHistory = data.history;
        refreshHistoryList();
      }
    })
    .catch(err => console.error('Load history error:', err));
}

function refreshHistoryList() {
  elements.historyList.innerHTML = '';

  if (state.scanHistory.length === 0) {
    elements.historyList.innerHTML = `
      <p class="history-empty">
        <i class="fas fa-inbox"></i><br>
        No scans yet
      </p>
    `;
    return;
  }

  state.scanHistory.forEach((entry) => {
    const item = document.createElement('div');
    item.className = 'history-item';
    const date = new Date(entry.timestamp).toLocaleString();
    
    item.innerHTML = `
      <div class="history-time">${date}</div>
      <div class="history-targets"><strong>${entry.targets}</strong></div>
      <div class="history-summary">${entry.summary}</div>
    `;
    
    item.addEventListener('click', () => loadHistoryScan(entry.id));
    elements.historyList.appendChild(item);
  });
}

function loadHistoryScan(id) {
  getHistoryScan(id).then((result) => {
    if (result.success) {
      state.lastXml = result.xml;
      clearResults();
      parseNmapXml(result.xml).then((parsed) => {
        displayResults(parsed, result.entry.targets, 'history');
        elements.targetInput.value = result.entry.targets;
        appendLog('📂 Loaded scan from history', 'info');
        updateStats();
      });
    }
  });
}

// ============================================
// THEME MANAGEMENT
// ============================================

function toggleTheme() {
  const newTheme = state.theme === 'light' ? 'dark' : 'light';
  state.theme = newTheme;
  localStorage.setItem('theme', newTheme);
  applyTheme(newTheme);
  showNotification(`Theme switched to ${newTheme}`, 'info');
}

function applyTheme(theme) {
  if (theme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    const icon = elements.themeToggle.querySelector('i');
    if (icon) icon.className = 'fas fa-sun';
  } else {
    document.documentElement.removeAttribute('data-theme');
    const icon = elements.themeToggle.querySelector('i');
    if (icon) icon.className = 'fas fa-moon';
  }
  state.theme = theme;
}

// ============================================
// SETTINGS MANAGEMENT
// ============================================

function openSettings() {
  elements.defaultTargetInput.value = elements.targetInput.value;
  elements.settingsModal.classList.add('active');
}

function closeSettings() {
  elements.settingsModal.classList.remove('active');
}

function saveSettings() {
  const newDefault = elements.defaultTargetInput.value.trim();
  if (newDefault) {
    localStorage.setItem('defaultTarget', newDefault);
    elements.targetInput.value = newDefault;
    showNotification('Settings saved', 'success');
    appendLog('⚙️ Settings updated', 'info');
    closeSettings();
  } else {
    showNotification('Please enter a valid target', 'warning');
  }
}

function loadSettings() {
  const saved = localStorage.getItem('defaultTarget');
  if (saved) {
    elements.targetInput.value = saved;
  }
}

// ============================================
// HELP MANAGEMENT
// ============================================

function openHelp() {
  elements.helpModal.classList.add('active');
}

function closeHelp() {
  elements.helpModal.classList.remove('active');
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function showNotification(text, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = text;
  
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = 'slideOutNotif 0.3s ease-out';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

function downloadFile(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

function checkServerStatus() {
  fetch('/api/health')
    .then(res => res.json())
    .then(data => {
      if (data.status === 'ok') {
        appendLog('✓ Server connected and ready', 'success');
      }
    })
    .catch(() => {
      appendLog('✗ Cannot connect to server', 'error');
      showNotification('Server connection failed', 'error');
    });
}

// ============================================
// INITIALIZATION TRIGGER
// ============================================

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}