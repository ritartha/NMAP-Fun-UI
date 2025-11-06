// App State
const state = {
  lastXml: null,
  lastArgs: null,
  scanning: false,
  scanHistory: [],
  ports: [],
  currentHost: null,
  theme: localStorage.getItem('theme') || 'light'
};

// DOM Elements
const elements = {
  targetInput: document.getElementById('targetInput'),
  scanBtns: document.querySelectorAll('.scan-btn'),
  portsTable: document.getElementById('portsTable'),
  portsBody: document.getElementById('portsBody'),
  portFilterInput: document.getElementById('portFilterInput'),
  hostLabel: document.getElementById('hostLabel'),
  macLabel: document.getElementById('macLabel'),
  osLabel: document.getElementById('osLabel'),
  statusLed: document.getElementById('statusLed'),
  logContainer: document.getElementById('logContainer'),
  statusText: document.getElementById('statusText'),
  progressBar: document.getElementById('progressBar'),
  historyList: document.getElementById('historyList'),
  themeToggle: document.getElementById('themeToggle'),
  settingsBtn: document.getElementById('settingsBtn'),
  helpBtn: document.getElementById('helpBtn'),
  saveXmlBtn: document.getElementById('saveXmlBtn'),
  exportCsvBtn: document.getElementById('exportCsvBtn'),
  copyResultsBtn: document.getElementById('copyResultsBtn'),
  openFolderBtn: document.getElementById('openFolderBtn'),
  rerunBtn: document.getElementById('rerunBtn'),
  clearHistoryBtn: document.getElementById('clearHistoryBtn'),
  settingsModal: document.getElementById('settingsModal'),
  helpModal: document.getElementById('helpModal'),
  closeSettingsBtn: document.getElementById('closeSettingsBtn'),
  closeHelpBtn: document.getElementById('closeHelpBtn'),
  saveSettingsBtn: document.getElementById('saveSettingsBtn'),
  cancelSettingsBtn: document.getElementById('cancelSettingsBtn'),
  defaultTargetInput: document.getElementById('defaultTargetInput')
};

// Initialize app
function init() {
  applyTheme(state.theme);
  loadSettings();
  setupEventListeners();
  loadScanHistory();
  checkNmapStatus();
}

// Event Listeners
function setupEventListeners() {
  // Scan buttons
  elements.scanBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = btn.dataset.mode;
      startScan(mode);
    });
  });

  // Quick actions
  elements.saveXmlBtn.addEventListener('click', saveLastXml);
  elements.exportCsvBtn.addEventListener('click', exportPortsCsv);
  elements.copyResultsBtn.addEventListener('click', copyResults);
  elements.openFolderBtn.addEventListener('click', openOutputFolder);
  elements.rerunBtn.addEventListener('click', rerunLastScan);
  elements.clearHistoryBtn.addEventListener('click', clearHistory);

  // Port filter
  elements.portFilterInput.addEventListener('input', filterPorts);

  // Theme
  elements.themeToggle.addEventListener('click', toggleTheme);

  // Settings
  elements.settingsBtn.addEventListener('click', openSettings);
  elements.closeSettingsBtn.addEventListener('click', closeSettings);
  elements.cancelSettingsBtn.addEventListener('click', closeSettings);
  elements.saveSettingsBtn.addEventListener('click', saveSettings);

  // Help
  elements.helpBtn.addEventListener('click', openHelp);
  elements.closeHelpBtn.addEventListener('click', closeHelp);

  // Modal background click
  elements.settingsModal.addEventListener('click', (e) => {
    if (e.target === elements.settingsModal) closeSettings();
  });

  elements.helpModal.addEventListener('click', (e) => {
    if (e.target === elements.helpModal) closeHelp();
  });

  // Table sorting
  document.querySelectorAll('.ports-table th.sortable').forEach(th => {
    th.addEventListener('click', () => {
      sortTable(th.dataset.column);
    });
  });
}

// API Functions
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
      downloadFile(data.csv, `ports_${Date.now()}.csv`, 'text/csv');
    }
    return data;
  } catch (error) {
    console.error('Export error:', error);
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
    return data;
  } catch (error) {
    console.error('Export error:', error);
  }
}

// Scan Functions
function startScan(mode) {
  const targets = elements.targetInput.value.trim();

  if (!targets) {
    showMessage('Please enter targets to scan', 'warning');
    return;
  }

  if (state.scanning) {
    showMessage('A scan is already running', 'warning');
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
        showMessage(`Error: ${result.error}`, 'error');
        appendLog(`ERROR: ${result.error}`, 'error');
        setLed('red');
      } else if (result.xml) {
        state.lastXml = result.xml;
        appendLog(`Scan completed: ${result.file}`, 'success');

        // Parse the XML
        const parsed = await parseNmapXml(result.xml);
        if (parsed.error) {
          appendLog(`Parse error: ${parsed.error}`, 'error');
        } else {
          displayResults(parsed, targets, mode);
          await addToHistory(targets, mode, result.file, generateSummary(parsed));
        }
      }
    })
    .catch((error) => {
      showMessage(`Scan failed: ${error.message}`, 'error');
      appendLog(`EXCEPTION: ${error.message}`, 'error');
      setLed('red');
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
    appendLog('No hosts found', 'warning');
    setLed('red');
    return;
  }

  const host = parsed.hosts[0];
  state.currentHost = host;

  // Update LED
  setLed(host.state === 'up' ? 'up' : 'down');

  // Update labels
  elements.hostLabel.textContent = `Host: ${host.address || '-'} (${host.state})`;
  elements.macLabel.textContent = `MAC: ${host.mac || '-'}${host.macVendor ? ` (${host.macVendor})` : ''}`;
  elements.osLabel.textContent = `OS: ${host.osGuess || '-'}`;

  // Display ports
  state.ports = host.ports || [];
  displayPorts(state.ports);

  // Log summary
  appendLog('--- Scan Summary ---', 'success');
  appendLog(`Host: ${host.address} is ${host.state}`, 'success');
  if (host.mac) {
    appendLog(`MAC: ${host.mac}`, 'success');
  }
  if (host.osGuess) {
    appendLog(`OS: ${host.osGuess}`, 'success');
  }
  appendLog(`Ports found: ${host.ports ? host.ports.length : 0}`, 'success');
}

function displayPorts(ports) {
  elements.portsBody.innerHTML = '';

  if (!ports || ports.length === 0) {
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
}

function generateSummary(parsed) {
  if (!parsed.hosts || parsed.hosts.length === 0) {
    return 'No hosts';
  }

  const host = parsed.hosts[0];
  const ports = host.ports ? host.ports.length : 0;
  return `${host.address || 'unknown'} - ${host.state} - ${ports} ports`;
}

// UI Functions
function clearResults() {
  elements.portsBody.innerHTML = '';
  elements.logContainer.innerHTML = '<p class="log-empty">Logs will appear here...</p>';
  setLed('gray');
  elements.hostLabel.textContent = 'Host: -';
  elements.macLabel.textContent = 'MAC: -';
  elements.osLabel.textContent = 'OS: -';
  state.lastXml = null;
  state.ports = [];
  state.currentHost = null;
}

function appendLog(text, type = 'info') {
  let entry = document.querySelector('.log-empty');
  if (entry) {
    elements.logContainer.innerHTML = '';
  }

  const logEntry = document.createElement('div');
  logEntry.className = `log-entry ${type}`;
  logEntry.textContent = `[${new Date().toLocaleTimeString()}] ${text}`;
  elements.logContainer.appendChild(logEntry);
  elements.logContainer.scrollTop = elements.logContainer.scrollHeight;
}

function setLed(color) {
  elements.statusLed.className = `led ${color}`;
}

function updateStatus(text) {
  elements.statusText.textContent = text;
}

function disableAllButtons(disabled) {
  elements.scanBtns.forEach(btn => btn.disabled = disabled);
  if (disabled) {
    elements.saveXmlBtn.disabled = true;
    elements.exportCsvBtn.disabled = true;
    elements.copyResultsBtn.disabled = true;
    elements.rerunBtn.disabled = true;
  } else {
    elements.saveXmlBtn.disabled = !state.lastXml;
    elements.exportCsvBtn.disabled = state.ports.length === 0;
    elements.copyResultsBtn.disabled = state.ports.length === 0;
    elements.rerunBtn.disabled = !state.lastXml;
  }
}

function filterPorts() {
  const filter = elements.portFilterInput.value.toLowerCase();
  const rows = elements.portsBody.querySelectorAll('tr');

  rows.forEach((row) => {
    const text = row.textContent.toLowerCase();
    row.style.display = text.includes(filter) ? '' : 'none';
  });
}

function sortTable(column) {
  const rows = Array.from(elements.portsBody.querySelectorAll('tr'));
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

// Quick Actions
function saveLastXml() {
  if (!state.lastXml) {
    showMessage('No XML to save', 'warning');
    return;
  }

  exportXml(state.lastXml).then((result) => {
    if (result.success) {
      showMessage(`XML saved: ${result.filename}`, 'success');
      appendLog(`Saved XML to ${result.path}`, 'success');
    }
  });
}

function exportPortsCsv() {
  if (state.ports.length === 0) {
    showMessage('No ports to export', 'warning');
    return;
  }

  exportCsv(state.ports).then((result) => {
    if (result.success) {
      showMessage(`CSV exported: ${result.filename}`, 'success');
    }
  });
}

function copyResults() {
  if (state.ports.length === 0) {
    showMessage('No ports to copy', 'warning');
    return;
  }

  const text = state.ports
    .map(p => `${p.protocol}\t${p.port}\t${p.state}\t${p.service}\t${p.version}`)
    .join('\n');

  navigator.clipboard.writeText(text).then(() => {
    showMessage('Results copied to clipboard', 'success');
  });
}

function openOutputFolder() {
  showMessage('Output files are saved in ./nmap_outputs directory on the server', 'info');
  appendLog('Check the output folder on the server: ./nmap_outputs', 'info');
}

function rerunLastScan() {
  if (!state.lastXml) {
    showMessage('No previous scan to re-run', 'warning');
    return;
  }

  showMessage('Re-running last scan...', 'info');
  const targets = elements.targetInput.value;
  // Re-run with same mode (we can detect from history or UI)
  startScan('quick');
}

function clearHistory() {
  if (confirm('Are you sure you want to clear all scan history?')) {
    fetch('/api/history/clear', { method: 'POST' })
      .then(() => {
        state.scanHistory = [];
        refreshHistoryList();
        showMessage('History cleared', 'success');
      });
  }
}

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
    elements.historyList.innerHTML = '<p class="history-empty">No scans yet</p>';
    return;
  }

  state.scanHistory.forEach((entry) => {
    const item = document.createElement('div');
    item.className = 'history-item';
    item.innerHTML = `
      <div class="history-time">${new Date(entry.timestamp).toLocaleString()}</div>
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
      });
    }
  });
}

// Theme Functions
function toggleTheme() {
  const newTheme = state.theme === 'light' ? 'dark' : 'light';
  state.theme = newTheme;
  localStorage.setItem('theme', newTheme);
  applyTheme(newTheme);
}

function applyTheme(theme) {
  if (theme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    elements.themeToggle.querySelector('#themeIcon').textContent = '☀️';
  } else {
    document.documentElement.removeAttribute('data-theme');
    elements.themeToggle.querySelector('#themeIcon').textContent = '🌙';
  }
  state.theme = theme;
}

// Settings Functions
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
    showMessage('Settings saved', 'success');
    closeSettings();
  }
}

function loadSettings() {
  const saved = localStorage.getItem('defaultTarget');
  if (saved) {
    elements.targetInput.value = saved;
  }
}

// Help Functions
function openHelp() {
  elements.helpModal.classList.add('active');
}

function closeHelp() {
  elements.helpModal.classList.remove('active');
}

// Utility Functions
function showMessage(text, type = 'info') {
  const alertDiv = document.createElement('div');
  alertDiv.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 16px;
    background-color: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#3b82f6'};
    color: white;
    border-radius: 6px;
    font-weight: 600;
    z-index: 2000;
    animation: slideIn 0.3s ease-out;
    box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1);
  `;
  alertDiv.textContent = text;
  document.body.appendChild(alertDiv);

  setTimeout(() => {
    alertDiv.style.animation = 'slideOut 0.3s ease-out';
    setTimeout(() => alertDiv.remove(), 300);
  }, 3000);
}

function downloadFile(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  window.URL.revokeObjectURL(url);
}

function checkNmapStatus() {
  fetch('/api/health')
    .then(res => res.json())
    .then(data => {
      if (data.status === 'ok') {
        appendLog('✓ Server is running and ready', 'success');
      }
    })
    .catch(() => {
      appendLog('✗ Cannot connect to server', 'error');
    });
}

// Add CSS animation
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from { transform: translateX(400px); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  @keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(400px); opacity: 0; }
  }
`;
document.head.appendChild(style);

// Initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}