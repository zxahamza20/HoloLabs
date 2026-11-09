import { useMemo, useState } from 'react';
import HologramCanvas from './engine/HologramCanvas.jsx';
import { MACHINES } from './data/machines.js';

function App() {
  const [selectedId, setSelectedId] = useState('car');
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState('hologram');
  const [autoRotate, setAutoRotate] = useState(true);
  const [resetToken, setResetToken] = useState(0);
  const [fps, setFps] = useState(null);

  const selected = MACHINES.find((machine) => machine.id === selectedId);
  const filtered = useMemo(() => MACHINES.filter((machine) =>
    `${machine.name} ${machine.category}`.toLowerCase().includes(query.toLowerCase())
  ), [query]);

  return (
    <main className="app-layout">
      <aside className="sidebar">
        <div className="brand"><div className="brand-symbol">⌬</div><div><strong>HOLOLAB</strong><small>ENGINEERING EXPLORER</small></div></div>
        <div className="sidebar-heading">MACHINE LIBRARY <span>DAY 01 DEMO</span></div>
        <label className="search-label" htmlFor="machine-search">SEARCH MACHINES</label>
        <input id="machine-search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Car, computer, phone..." />
        <div className="machine-list">
          {filtered.length === 0 && <p className="muted">No matching machines.</p>}
          {filtered.map((machine) => (
            <button key={machine.id} type="button" className={`machine-button ${selectedId === machine.id ? 'active' : ''}`} onClick={() => { setSelectedId(machine.id); setFps(null); }}>
              <span className="machine-symbol">{machine.id === 'car' ? '◈' : machine.id === 'desktop' ? '▣' : '▯'}</span>
              <span><strong>{machine.name}</strong><small>{machine.category} · PROTOTYPE</small></span>
              <span className="machine-arrow">›</span>
            </button>
          ))}
        </div>
        <div className="sidebar-bottom">
          <span className="status-dot" /> RUNNING LOCALLY
          <p>Procedural geometry only. Real GLB assets, hand tracking, component isolation and lessons are coming later in the plan.</p>
        </div>
      </aside>
      <section className="workspace">
        <header className="topbar"><span>EXPLORE <span className="crumb">/</span> {selected.name.toUpperCase()}</span><span className="topbar-right">WEEK 01 <span>·</span> DAY 01</span></header>
        <div className="scene-wrap">
          <HologramCanvas machineId={selectedId} mode={mode} autoRotate={autoRotate} resetToken={resetToken} onFps={setFps} />
          <div className="scene-heading"><div className="eyebrow">HOLOGRAPHIC OBJECT SCAN / DEMO</div><h1>{selected.name}</h1><p>{selected.description}</p></div>
          <div className="scene-side"><div className="hud-block"><small>RENDER STATUS</small><b>{fps === null ? '—' : `${fps} FPS`}</b></div><div className="hud-block"><small>ASSET STATUS</small><b>PLACEHOLDER</b></div><div className="hud-block"><small>CAMERA TRACKING</small><b>NOT ACTIVE</b></div></div>
          <div className="control-bar">
            <button type="button" onClick={() => setMode(mode === 'wireframe' ? 'hologram' : 'wireframe')}>{mode === 'wireframe' ? '◉ HOLOGRAM' : '▱ WIREFRAME'}</button>
            <button type="button" onClick={() => setAutoRotate((enabled) => !enabled)}>{autoRotate ? 'Ⅱ STOP SPIN' : '↻ AUTO SPIN'}</button>
            <button type="button" onClick={() => setResetToken((x) => x + 1)}>⌖ RESET VIEW</button>
          </div>
          <div className="scene-footer">DRAG TO ROTATE <span>•</span> SCROLL TO ZOOM <span>•</span> RIGHT-DRAG TO PAN</div>
        </div>
        <footer className="info-panel"><div><span className="panel-kicker">PLANNED LEARNING MODULES</span><h2>Available assembly definitions</h2></div><div className="assembly-list">{selected.assemblies.map((a) => <div key={a.id} className="assembly"><span>＋</span><div><strong>{a.name}</strong><small>{a.children.length} planned subcomponents</small></div></div>)}</div><div className="notice">Day 1 only: these definitions are metadata. Isolation and disassembly are scheduled for later weeks.</div></footer>
      </section>
    </main>
  );
}

export default App;
