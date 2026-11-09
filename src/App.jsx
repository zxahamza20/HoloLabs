import { useCallback, useEffect, useRef, useState } from 'react';
import HologramCanvas from './engine/HologramCanvas.jsx';
import { MACHINES } from './data/machines.js';
import MachineLibrary from './components/MachineLibrary.jsx';
import InspectorPanel from './components/InspectorPanel.jsx';
import { Dialog, HelpContent, SettingsContent } from './components/Overlays.jsx';
import Icon from './components/Icon.jsx';
import { usePreference } from './utils/preferences.js';

export default function App() {
  const [storedId, setStoredId] = usePreference('machine', 'car');
  const machine = MACHINES.find(entry => entry.id === storedId) || MACHINES[0];
  const [mode, setMode] = usePreference('displayMode', 'hologram');
  const [autoRotate, setAutoRotate] = usePreference('autoRotate', true);
  const [quality, setQuality] = usePreference('quality', 'balanced');
  const [favorites, setFavorites] = usePreference('favorites', []);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [assemblyId, setAssemblyId] = useState(null);
  const [inspectorOpen, setInspectorOpen] = useState(true);
  const [modal, setModal] = useState(null);
  const [resetToken, setResetToken] = useState(0);
  const [fps, setFps] = useState(null);
  const [sceneLoaded, setSceneLoaded] = useState(false);
  const [sceneError, setSceneError] = useState(null);
  const searchRef = useRef(null);

  const selectedAssemblyId = machine.assemblies.some(a => a.id === assemblyId) ? assemblyId : machine.assemblies[0].id;
  const favoriteIds = Array.isArray(favorites) ? favorites : [];

  const selectMachine = useCallback((id) => {
    if (!MACHINES.some(m => m.id === id)) return;
    if (id === machine.id) { setResetToken(t => t + 1); return; }
    setSceneLoaded(false);
    setSceneError(null);
    setFps(null);
    setAssemblyId(null);
    setStoredId(id);
    setResetToken(t => t + 1);
  }, [machine.id, setStoredId]);

  const onSceneReady = useCallback((readyId) => {
    if (readyId === machine.id) setSceneLoaded(true);
  }, [machine.id]);

  const toggleFavorite = useCallback((id) => {
    setFavorites(prev => {
      const safe = Array.isArray(prev) ? prev : [];
      return safe.includes(id) ? safe.filter(item => item !== id) : [...safe, id];
    });
  }, [setFavorites]);

  useEffect(() => {
    function shortcut(event) {
      if (event.key === 'Escape') { setModal(null); return; }
      if (modal || event.metaKey || event.ctrlKey || event.altKey) return;
      const el = document.activeElement;
      const tag = el?.tagName;
      const isEditing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(tag) || el?.isContentEditable;
      if (event.key === '/' && !isEditing) { event.preventDefault(); searchRef.current?.focus(); return; }
      if (isEditing || tag === 'BUTTON') return;
      if (event.key === 'h' || event.key === 'H') setModal('help');
      if (event.key === 'w' || event.key === 'W') setMode(v => v === 'wireframe' ? 'hologram' : 'wireframe');
      if (event.key === 'r' || event.key === 'R') setResetToken(t => t + 1);
      if (event.code === 'Space') { event.preventDefault(); setAutoRotate(v => !v); }
      if (['1', '2', '3'].includes(event.key)) selectMachine(MACHINES[Number(event.key) - 1].id);
    }
    window.addEventListener('keydown', shortcut);
    return () => window.removeEventListener('keydown', shortcut);
  }, [modal, setMode, setAutoRotate, selectMachine]);

  return <div className="shell">
    <div className="global-rail">
      <div className="rail-brand" aria-label="HOLOLAB"><Icon name="scan" size={25}/></div>
      <div className="rail-nav"><div className="rail-btn selected" title="Explore machines" aria-label="Explore machines"><Icon name="library" size={21}/><span>Explore</span></div></div>
      <div className="rail-bottom"><button className="rail-btn" type="button" onClick={() => setModal('help')} title="Help / shortcuts" aria-label="Help"><Icon name="info" size={21}/></button><button className="rail-btn" type="button" onClick={() => setModal('settings')} title="Settings" aria-label="Settings"><Icon name="sliders" size={21}/></button></div>
    </div>

    <MachineLibrary selectedId={machine.id} onSelect={selectMachine} favorites={favoriteIds} onToggleFavorite={toggleFavorite} query={query} onQueryChange={setQuery} category={category} onCategoryChange={setCategory} searchRef={searchRef}/>

    <main className="main-area">
      <header className="app-topbar">
        <div className="breadcrumbs"><Icon name="layers" size={17}/><span>EXPLORER</span><span className="crumb-separator">/</span><strong>{machine.name.toUpperCase()}</strong></div>
        <div className="topbar-actions"><span className="build-pill"><span className="build-dot"/> WEEK 01 / DAY 02</span><button type="button" className="top-action" onClick={() => setModal('help')}><Icon name="keyboard" size={17}/><span>Controls</span></button></div>
      </header>

      <div className={`workbench ${inspectorOpen ? '' : 'inspector-hidden'}`}>
        <div className="viewer-column">
          <section className="viewer" aria-label="3D machine viewer">
            <HologramCanvas machineId={machine.id} mode={mode} autoRotate={autoRotate} resetToken={resetToken} quality={quality} onFps={setFps} onReady={onSceneReady} onError={setSceneError}/>
            <div className="viewport-scanner" aria-hidden="true"><span className="scanner-corner tl"/><span className="scanner-corner tr"/><span className="scanner-corner bl"/><span className="scanner-corner br"/></div>
            <div className="viewer-info"><span className="eyebrow"><span className="crosshair">⊹</span> INTERACTIVE MODEL / PROTOTYPE</span><h1>{machine.name}</h1><p>{machine.tagLine}</p><span className="preview-badge"><Icon name="info" size={14}/> PROCEDURAL PREVIEW</span></div>
            <div className="telemetry"><div className="telemetry-item"><small>RENDERING</small><strong className="teal">{fps === null ? '—' : `${fps} FPS`}</strong></div><div className="telemetry-item"><small>MODEL DATA</small><strong>DEMO GEOMETRY</strong></div><div className="telemetry-item"><small>HAND TRACKING</small><strong className="dim">DAY 05</strong></div></div>
            {!sceneLoaded && !sceneError && <div className="loading-overlay" role="status"><div className="loading-emblem"><Icon name="scan" size={35}/></div><strong>Preparing model</strong><span>Building procedural geometry...</span></div>}
            {sceneError && <div className="error-overlay" role="alert"><Icon name="info" size={25}/><strong>3D viewer unavailable</strong><p>{sceneError}</p><span>Try an updated desktop browser with WebGL enabled.</span></div>}
            <div className="viewport-bottom"><div className="toolbar" aria-label="Viewer controls">
              <button type="button" title="Toggle hologram or wireframe (W)" aria-pressed={mode === 'wireframe'} className={mode === 'wireframe' ? 'active' : ''} onClick={() => setMode(value => value === 'wireframe' ? 'hologram' : 'wireframe')}><Icon name="wire" size={17}/><span>{mode === 'wireframe' ? 'Hologram' : 'Wireframe'}</span></button>
              <span className="toolbar-divider"/>
              <button type="button" title="Toggle automatic rotation (Space)" aria-pressed={autoRotate} onClick={() => setAutoRotate(value => !value)}><Icon name={autoRotate ? 'pause' : 'rotate'} size={17}/><span>{autoRotate ? 'Pause spin' : 'Auto spin'}</span></button>
              <span className="toolbar-divider"/>
              <button type="button" title="Reset camera (R)" onClick={() => setResetToken(x => x + 1)}><Icon name="reset" size={17}/><span>Reset view</span></button>
              <span className="toolbar-divider"/>
              <button type="button" title="Toggle machine inspector" aria-expanded={inspectorOpen} onClick={() => setInspectorOpen(value => !value)} className={inspectorOpen ? 'active' : ''}><Icon name="layers" size={17}/><span>Inspector</span></button>
            </div><div className="mouse-hint">DRAG TO ORBIT <span>•</span> SCROLL TO ZOOM <span>•</span> RIGHT-DRAG TO PAN</div></div>
          </section>

          <section className="below-viewer"><div className="below-header"><div><span className="overline">UNDER THE HOOD</span><h2>Exploration roadmap</h2></div><span className="small-outline">DAY 02 / SHELL</span></div><div className="roadmap-strip"><div className="roadmap-step current"><span className="roadmap-icon"><Icon name="check" size={16}/></span><div><strong>Browse</strong><small>Working now</small></div></div><div className="roadmap-connector"/><div className="roadmap-step"><span className="roadmap-icon"><Icon name="scan" size={16}/></span><div><strong>Discover</strong><small>Week 2</small></div></div><div className="roadmap-connector"/><div className="roadmap-step"><span className="roadmap-icon"><Icon name="box" size={16}/></span><div><strong>Disassemble</strong><small>Week 3</small></div></div><div className="roadmap-connector"/><div className="roadmap-step"><span className="roadmap-icon"><Icon name="info" size={16}/></span><div><strong>Learn</strong><small>Week 3</small></div></div></div></section>
        </div>

        {inspectorOpen && <InspectorPanel machine={machine} selectedAssemblyId={selectedAssemblyId} onSelectAssembly={setAssemblyId} onClose={() => setInspectorOpen(false)}/>}
      </div>
    </main>

    {modal === 'help' && <Dialog title="Viewer controls" description="Keyboard and pointer navigation for the current prototype." onClose={() => setModal(null)}><HelpContent/></Dialog>}
    {modal === 'settings' && <Dialog title="Preferences" description="Tune the viewer for your MacBook. Changes apply immediately." onClose={() => setModal(null)}><SettingsContent quality={quality} onQualityChange={setQuality} autoRotate={autoRotate} onAutoRotateChange={setAutoRotate}/></Dialog>}
  </div>;
}
