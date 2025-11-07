const { useState, useEffect, useRef } = React;
const root = document.getElementById('root');

/* ---------- Helper Icon Component ---------- */
function Icon({ name, size = 18 }) {
  const icons = {
    moon: (<svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>),
    sun: (<svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M12 3v2M12 19v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4M12 7a5 5 0 100 10 5 5 0 000-10z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>),
    settings: (<svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M12 15.5a3.5 3.5 0 100-7 3.5 3.5 0 000 7z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82A1.65 1.65 0 003 12c0-.55.22-1.05.58-1.41L3.64 10a1.65 1.65 0 00-.33-1.82L3.25 7.9A2 2 0 015.08 5.07l.06.06a1.65 1.65 0 001.82.33c.43-.2.9-.2 1.33 0 .34.19.72.27 1.1.22V6a2 2 0 014 0v.09c.38.05.76-.03 1.1-.22.43-.2.9-.2 1.33 0 .7.33 1.52.21 1.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82c.12.36.12.75 0 1.11z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>),
  };
  return <span style={{display:'inline-flex', alignItems:'center'}}>{icons[name] || null}</span>;
}

/* ---------- Presentational Components ---------- */
function Header({ theme, onToggleTheme, onOpenSettings, onOpenHelp }) {
  return (
    <header className="header">
      <div className="title">
        <h1>Nmap GUI — Professional</h1>
        <p>Fast, friendly network scanning — quick scans, service detection, OS fingerprinting</p>
      </div>
      <div className="header-actions" role="toolbar" aria-label="Global actions">
        <button className="icon-btn" onClick={onToggleTheme} title="Toggle theme (T)" aria-label="Toggle theme">
          {theme === 'dark' ? <Icon name="sun" /> : <Icon name="moon" />}
        </button>
        <button className="icon-btn" onClick={onOpenSettings} title="Settings" aria-label="Settings"><Icon name="settings" /></button>
        <button className="icon-btn" onClick={onOpenHelp} title="Help" aria-label="Help">❓</button>
      </div>
    </header>
  );
}

function Controls({ target, setTarget, onSaveXml, onExportCsv, onCopy, onOpenFolder, onRerun }) {
  return (
    <div style={{display:'flex',flexDirection:'column',gap:12}}>
      <div className="controls">
        <input id="targetInput" className="target-input" value={target} onChange={e=>setTarget(e.target.value)} />
        <div className="control-actions">
          <button className="btn" title="Save XML" onClick={onSaveXml}>💾 Save</button>
          <button className="btn" title="Export CSV" onClick={onExportCsv}>📊 CSV</button>
          <button className="btn" title="Copy Results" onClick={onCopy}>📋 Copy</button>
          <button className="btn" title="Open output folder" onClick={onOpenFolder}>📁</button>
          <button className="btn" title="Re-run" onClick={onRerun}>🔄</button>
        </div>
      </div>
    </div>
  );
}

function ScanButtons({ onScan }) {
  const modes = [
    {key:'ping', label:'📡 Ping'},
    {key:'quick', label:'⚡ Quick'},
    {key:'fulltcp', label:'🔍 Full TCP'},
    {key:'svcdetect', label:'🔧 SvcDetect'},
    {key:'os', label:'🖥️ OS Detect'},
    {key:'nse', label:'🎯 NSE'}
  ];
  return (
    <div className="scan-grid" role="group" aria-label="Scan modes">
      {modes.map(m => (
        <button key={m.key} className="scan-btn" onClick={()=>onScan(m.key)}>{m.label}</button>
      ))}
    </div>
  );
}

function HostSummary({ host }) {
  return (
    <div className="summary">
      <div className="summary-left">
        <div className={`led ${host?.state==='up' ? 'up' : host?.state==='down' ? 'down' : ''}`} />
        <div style={{minWidth:0}}>
          <div style={{fontWeight:800, fontSize:'1rem', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}} id="hostLabel">
            Host: {host?.address || '-'} {host?.state ? `(${host.state})` : ''}
          </div>
          <div style={{fontSize:'0.95rem', color:'var(--muted)'}} id="osLabel">OS: {host?.osGuess || '-'}</div>
        </div>
      </div>
      <div style={{display:'flex',gap:12,alignItems:'center'}}>
        <div style={{textAlign:'right'}}>
          <div style={{fontWeight:900}} id="portsFound">{host?.ports?.length ?? '—'}</div>
          <div style={{fontSize:'0.95rem',color:'var(--muted)'}}>Ports</div>
        </div>
        <div style={{textAlign:'right'}}>
          <div style={{fontWeight:700}} id="lastScanTime">{host? new Date().toLocaleTimeString() : '—'}</div>
          <div style={{fontSize:'0.95rem',color:'var(--muted)'}}>Last</div>
        </div>
      </div>
    </div>
  );
}

function PortsTable({ ports, filter, onSort }) {
  const filtered = ports.filter(p => {
    if(!filter) return true;
    const s = filter.toLowerCase();
    return `${p.protocol} ${p.port} ${p.state} ${p.service} ${p.version}`.toLowerCase().includes(s);
  });
  return (
    <div className="table-wrap">
      <table className="ports-table" id="portsTable">
        <thead>
          <tr>
            <th className="label sortable" onClick={()=>onSort('protocol')}>Protocol</th>
            <th className="label sortable" onClick={()=>onSort('port')}>Port</th>
            <th className="label sortable" onClick={()=>onSort('state')}>State</th>
            <th className="label sortable" onClick={()=>onSort('service')}>Service</th>
            <th className="label">Version</th>
          </tr>
        </thead>
        <tbody id="portsBody">
          {filtered.length===0 ? (
            <tr><td colSpan="5" style={{color:'var(--muted)',padding:14}}>No ports</td></tr>
          ) : filtered.map((p,idx)=>(
            <tr key={idx}>
              <td>{p.protocol}</td>
              <td className={p.state==='open' ? 'port-open' : p.state==='filtered' ? 'port-filtered' : 'port-closed'}>{p.port}</td>
              <td>{p.state}</td>
              <td>{p.service}</td>
              <td>{p.version}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Logs({ logs }) {
  return (
    <div className="logs" id="logContainer">
      {logs.length===0 ? <div style={{color:'var(--muted)'}}>Logs will appear here...</div> : logs.map((l,i)=>(<div key={i} className={`log-entry ${l.type}`}>{l.text}</div>))}
    </div>
  );
}

function History({ items, onLoad }) {
  return (
    <div style={{display:'flex',flexDirection:'column',gap:8, minHeight:0}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <h3 style={{margin:0}}>Scan History</h3>
      </div>
      <div className="history-list" id="historyList" role="list" aria-live="polite">
        {items.length===0 ? <div className="history-empty">No scans yet</div> :
          items.map(entry=>(
            <div key={entry.id} className="history-item" onClick={()=>onLoad(entry.id)}>
              <div style={{fontWeight:800, fontSize:13, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{entry.targets}</div>
              <div style={{fontSize:12,color:'var(--muted)'}}>{entry.summary}</div>
            </div>
          ))
        }
      </div>
    </div>
  );
}

function GithubCard() {
  return (
    <div className="github-card" aria-label="Author">
      <div className="gh-header">
        <div className="gh-avatar"><img src="https://avatars.githubusercontent.com/u/38487432?v=4" alt="Ritartha Chaki" /></div>
        <div>
          <div className="gh-name">Ritartha Chaki</div>
          <div className="gh-sub">@ritartha / NMAP-Fun-UI</div>
        </div>
      </div>
      <div className="gh-desc">Professional Nmap GUI — web edition. Feedback welcome.</div>
      <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
        <a className="btn primary" href="https://github.com/ritartha" target="_blank" rel="noopener">View Profile</a>
        <a className="btn" href="https://github.com/ritartha/NMAP-Fun-UI" target="_blank" rel="noopener">@ritartha/NMAP-Fun-UI</a>
        <a className="btn ghost" href="mailto:ritartha@gmail.com">Email</a>
      </div>
      <div className="gh-footer small-note">Contact: <a href="mailto:ritartha@gmail.com">ritartha@gmail.com</a></div>
    </div>
  );
}

/* ---------- Settings Modal Component ---------- */
function SettingsModal({ open, onClose, theme, setTheme, fontSize, setFontSize }) {
  const [tmpTheme, setTmpTheme] = useState(theme);
  const [tmpFont, setTmpFont] = useState(fontSize);

  useEffect(()=> { setTmpTheme(theme); setTmpFont(fontSize); }, [open, theme, fontSize]);

  function save() {
    setTheme(tmpTheme);
    setFontSize(tmpFont);
    onClose();
  }

  if(!open) return null;
  return (
    <div className="modal active" role="dialog" aria-modal="true">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Settings</h2>
          <button className="close-btn" onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className="modal-body">
          <label style={{display:'block',marginBottom:8}}>Theme</label>
          <select value={tmpTheme} onChange={(e)=>setTmpTheme(e.target.value)} style={{width:'100%',padding:10,borderRadius:8,marginBottom:12}}>
            <option value="system">System</option>
            <option value="dark">Dark</option>
            <option value="light">Light</option>
            <option value="reading">Reading</option>
          </select>

          <label style={{display:'block',marginBottom:8}}>Font Size</label>
          <select value={tmpFont} onChange={(e)=>setTmpFont(e.target.value)} style={{width:'100%',padding:10,borderRadius:8}}>
            <option value="small">Small</option>
            <option value="normal">Normal</option>
            <option value="large">Large</option>
          </select>
        </div>
        <div className="modal-footer">
          <button className="btn secondary" onClick={onClose}>Cancel</button>
          <button className="btn primary" onClick={save}>Save</button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Main App ---------- */
function App() {
  const systemPrefersDark = (typeof window !== 'undefined') && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const storedTheme = localStorage.getItem('theme') || 'system';
  const storedFont = localStorage.getItem('fontSize') || 'normal';

  const [theme, setThemeState] = useState(storedTheme);
  const [appliedTheme, setAppliedTheme] = useState('dark'); // actual theme applied to document (dark/light/reading)
  const [fontSize, setFontSizeState] = useState(storedFont);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const [target, setTarget] = useState(localStorage.getItem('defaultTarget') || '10.1.49.92');
  const [ports, setPorts] = useState([]);
  const [host, setHost] = useState(null);
  const [logs, setLogs] = useState([]);
  const [history, setHistory] = useState([]);
  const [filter, setFilter] = useState('');
  const [scanning, setScanning] = useState(false);

  // Apply theme & font size
  useEffect(() => {
    function apply(themeChoice) {
      let resolved = themeChoice;
      if(themeChoice === 'system') {
        const isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        resolved = isDark ? 'dark' : 'light';
      }
      // For 'reading' we directly use reading
      if(resolved !== 'reading' && resolved !== 'light' && resolved !== 'dark') resolved = 'dark';
      setAppliedTheme(resolved);
      document.documentElement.setAttribute('data-theme', resolved === 'reading' ? 'reading' : (resolved === 'light' ? 'light' : 'dark'));
      localStorage.setItem('theme', themeChoice);
    }

    apply(theme);

    // If system selected, react to changes
    let mq;
    if(theme === 'system' && window.matchMedia) {
      mq = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = (e) => {
        const resolved = e.matches ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', resolved);
      };
      mq.addEventListener ? mq.addEventListener('change', handler) : mq.addListener(handler);
      return () => { mq.removeEventListener ? mq.removeEventListener('change', handler) : mq.removeListener(handler); };
    }
  }, [theme]);

  useEffect(() => {
    let sizePx = '16px';
    if(fontSize === 'small') sizePx = '14px';
    else if(fontSize === 'normal') sizePx = '16px';
    else if(fontSize === 'large') sizePx = '18px';
    document.documentElement.style.setProperty('--base-font-size', sizePx);
    localStorage.setItem('fontSize', fontSize);
  }, [fontSize]);

  useEffect(()=> {
    loadHistory();
    const onKey = (e) => {
      if(e.key.toLowerCase() === 't' && !['INPUT','TEXTAREA'].includes(document.activeElement.tagName)) {
        // toggle between dark and light (explicit)
        const next = (theme === 'dark' || (theme === 'system' && appliedTheme==='dark')) ? 'light' : 'dark';
        setThemeState(next);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [theme, appliedTheme]);

  /* ---------- API / actions ---------- */
  async function runScan(mode) {
    if(!target) { pushLog('Please enter targets to scan', 'error'); return; }
    setScanning(true);
    pushLog(`Starting ${mode} scan for: ${target}`, 'info');
    try {
      const res = await fetch('/api/scan/run', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({targets: target, mode})
      });
      const data = await res.json();
      if(data.error) { pushLog(data.error, 'error'); }
      else if (data.xml) {
        pushLog(`Scan finished, saved to ${data.file || 'server'}`, 'success');
        const parsed = await fetch('/api/scan/parse', {
          method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({xml:data.xml})
        }).then(r=>r.json());
        if(parsed.success) {
          const firstHost = parsed.hosts[0] || null;
          setHost(firstHost);
          setPorts(firstHost?.ports || []);
          const entry = { id: Date.now(), targets: target, mode, file: data.file, summary: `${firstHost?.address||'unknown'} - ${firstHost?.state||'-'} - ${firstHost?.ports?.length||0} ports`, timestamp: new Date().toISOString() };
          await fetch('/api/history/add', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(entry)});
          loadHistory();
        } else {
          pushLog('Failed to parse scan result', 'error');
        }
      } else {
        pushLog('No XML output captured', 'warning');
      }
    } catch (err) {
      pushLog(err.message || String(err), 'error');
    } finally {
      setScanning(false);
    }
  }

  function pushLog(text, type='info') { setLogs(l => [...l, {text, type}]); }

  async function saveXml() { pushLog('Save XML feature invoked (use Export on server)', 'info'); }

  async function exportCsv() {
    if(ports.length===0) { pushLog('No ports to export', 'warning'); return; }
    const res = await fetch('/api/export/csv', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ports})});
    const data = await res.json();
    if(data.success) {
      pushLog(`CSV saved: ${data.filename}`, 'success');
      const blob = new Blob([data.csv], {type:'text/csv'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href=url; a.download=data.filename; a.click(); URL.revokeObjectURL(url);
    } else {
      pushLog(data.error || 'Export failed', 'error');
    }
  }

  function copyResults(){ if(ports.length===0){ pushLog('No ports to copy','warning'); return;} const txt = ports.map(p => `${p.protocol}\t${p.port}\t${p.state}\t${p.service}\t${p.version}`).join('\n'); navigator.clipboard.writeText(txt).then(()=>pushLog('Results copied to clipboard','success')); }
  function openFolder(){ pushLog('Open output folder on server: ./nmap_outputs', 'info'); }
  async function rerun(){ runScan('quick'); }

  async function loadHistory(){
    const res = await fetch('/api/history'); const data = await res.json();
    if(data.success) setHistory(data.history || []);
  }

  async function loadHistoryScan(id) {
    const res = await fetch(`/api/history/get/${id}`);
    const data = await res.json();
    if(data.success) {
      const parsed = await fetch('/api/scan/parse', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({xml: data.xml})}).then(r=>r.json());
      if(parsed.success) {
        const firstHost = parsed.hosts[0] || null;
        setHost(firstHost); setPorts(firstHost?.ports || []);
        setTarget(data.entry.targets);
        pushLog('Loaded history scan', 'success');
      }
    }
  }

  function sortPorts(column){ const sorted = [...ports].sort((a,b)=>{ const av = a[column] || ''; const bv = b[column] || ''; if(!isNaN(av) && !isNaN(bv)) return Number(av)-Number(bv); return String(av).localeCompare(String(bv)); }); setPorts(sorted); }

  /* ---------- Settings helpers ---------- */
  function setTheme(newTheme) { setThemeState(newTheme); }
  function setFontSize(newSize) { setFontSizeState(newSize); }

  return (
    <div className="app">
      <Header theme={appliedTheme} onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')} onOpenSettings={() => setSettingsOpen(true)} onOpenHelp={() => alert('Help modal')} />
      <main className="main">
        <section className="left">
          <Controls target={target} setTarget={setTarget} onSaveXml={saveXml} onExportCsv={exportCsv} onCopy={copyResults} onOpenFolder={openFolder} onRerun={rerun} />
          <ScanButtons onScan={runScan} />
          <HostSummary host={host} />
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <label className="label">Filter Ports</label>
            <input className="target-input" placeholder="Search ports..." value={filter} onChange={e=>setFilter(e.target.value)} />
          </div>
          <PortsTable ports={ports} filter={filter} onSort={sortPorts} />
          <Logs logs={logs} />
        </section>

        <aside className="right">
          <div className="history">
            <History items={history} onLoad={loadHistoryScan} />
            <div style={{display:'flex',marginTop:6}}>
              <button className="btn ghost full" onClick={async ()=>{
                if(!confirm('Clear history?')) return;
                await fetch('/api/history/clear',{method:'POST'}); setHistory([]); pushLog('History cleared','success');
              }}>🗑️ Clear History</button>
            </div>
          </div>

          <div className="github-section">
            <GithubCard />
          </div>
        </aside>
      </main>

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} theme={theme} setTheme={setTheme} fontSize={fontSize} setFontSize={setFontSize} />
    </div>
  );
}

/* Mount */
ReactDOM.createRoot(root).render(<App />);