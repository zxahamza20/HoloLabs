import Icon from './Icon.jsx';
import { findPart, flattenParts } from '../data/hierarchy.js';

export default function InspectorPanel({ machine, selectedAssemblyId, activeAssemblyId,
  selectedPartId, onSelectPart, onSelectAssembly, onOpenAssembly, onReturnOverview,
  assetInfo, onClose }) {
  const assembly = machine.assemblies.find(a => a.id === selectedAssemblyId) || machine.assemblies[0];
  const active = activeAssemblyId === assembly.id;
  const parts = flattenParts(assembly.children);
  const part = findPart(assembly, selectedPartId);
  return <aside className="inspector" aria-label="Machine information">
    <div className="inspector-top">
      <div className="section-head"><div><span className="overline">MACHINE BLUEPRINT</span><h2>Inspector</h2></div><button type="button" className="icon-button" aria-label="Close inspector" title="Close inspector" onClick={onClose}><Icon name="close"/></button></div>
      <div className="inspector-machine"><div className="inspector-glyph"><Icon name={machine.icon} size={27}/></div><div><strong>{machine.name}</strong><small>{machine.category} / {machine.difficulty}</small></div></div>
      <div className="description-card"><span className="micro-label">OBJECTIVE</span><p>{machine.description}</p></div>
      <div className="section-head assembly-heading"><h3>Systems in this machine</h3><span className="count">{machine.assemblies.length}</span></div>
      <div className="inspector-assemblies">
        {machine.assemblies.map((a, index) => <button key={a.id} type="button" onClick={() => onSelectAssembly(a.id)} aria-pressed={assembly.id === a.id} className={`inspector-assembly ${assembly.id === a.id ? 'chosen' : ''}`}>
          <span className="assembly-index">{String(index + 1).padStart(2, '0')}</span><span className="assembly-name">{a.name}<small>{flattenParts(a.children).length} mapped components · {a.asset?.src ? '3D GLB ready' : 'outline only'}</small></span><Icon name="chevron" size={15}/>
        </button>)}
      </div>
    </div>
    <div className="assembly-detail">
      <div className="detail-meta"><span>{active ? 'LOADED ASSEMBLY' : 'SELECTED SYSTEM'}</span><span className="planned-tag">{assembly.asset?.src ? 'DAY 4 GLB' : 'OUTLINE ONLY'}</span></div>
      <h3>{assembly.name}</h3>
      <p>{assembly.summary}</p>
      {assembly.asset?.src && <div className="asset-actions">
        {!active ? <button className="primary-button" type="button" onClick={() => onOpenAssembly(assembly.id)}>Load 3D test assembly</button>
          : <button className="secondary-button" type="button" onClick={onReturnOverview}>← Return to whole machine</button>}
      </div>}
      <div className="micro-label part-label">{active ? 'CLICK A 3D PART OR A NAME' : 'MAPPED COMPONENTS'}</div>
      <div className="part-tags">
        {parts.map(p => <button type="button" key={p.id} disabled={!active || !assetInfo?.nodeNames?.includes(p.name)}
          className={`part-tag-button ${selectedPartId === p.id ? 'part-selected' : ''}`}
          style={{ marginLeft: `${(p.path.length - 1) * 8}px` }}
          title={!active ? 'Open the assembly to select individual 3D parts' : (p.description || p.name)}
          aria-pressed={selectedPartId === p.id}
          onClick={() => onSelectPart(selectedPartId === p.id ? null : p.id)}>{p.name}</button>)}
      </div>
      {active && part && <div className="selected-part-detail"><span className="micro-label">SELECTED COMPONENT</span><strong>{part.name}</strong><p>{part.description}</p></div>}
      {active && assetInfo && <div className="model-stats"><span>{assetInfo.nodeNames.length} named parts</span><span>{assetInfo.triangleCount?.toLocaleString() ?? '—'} triangles</span><span>{Math.round(assetInfo.bytes / 1024)} KB</span></div>}
      {active && assetInfo?.missingParts?.length > 0 && <p className="asset-warning">Not found in GLB: {assetInfo.missingParts.join(', ')}</p>}
      <div className="future-note"><Icon name="info" size={16}/><span>{assembly.asset?.src ? 'Original, simplified engineering test asset—not a mechanically accurate production wheel. Zoom-to-isolate arrives in Week 2; disassembly in Week 3.' : 'This subsystem is described in the manifest but has no detailed GLB model yet. More assets are scheduled for later weeks.'}</span></div>
    </div>
  </aside>;
}
