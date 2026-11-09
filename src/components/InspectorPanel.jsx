import Icon from './Icon.jsx';

export default function InspectorPanel({ machine, selectedAssemblyId, onSelectAssembly, onClose }) {
  const assembly = machine.assemblies.find(a => a.id === selectedAssemblyId) || machine.assemblies[0];
  return <aside className="inspector" aria-label="Machine information">
    <div className="inspector-top">
      <div className="section-head"><div><span className="overline">MACHINE BLUEPRINT</span><h2>Inspector</h2></div><button type="button" className="icon-button" aria-label="Close inspector" title="Close inspector" onClick={onClose}><Icon name="close"/></button></div>
      <div className="inspector-machine"><div className="inspector-glyph"><Icon name={machine.icon} size={27}/></div><div><strong>{machine.name}</strong><small>{machine.category} / {machine.difficulty}</small></div></div>
      <div className="description-card"><span className="micro-label">OBJECTIVE</span><p>{machine.description}</p></div>
      <div className="section-head assembly-heading"><h3>Systems in this machine</h3><span className="count">{machine.assemblies.length}</span></div>
      <div className="inspector-assemblies">
        {machine.assemblies.map((a, index) => <button key={a.id} type="button" onClick={() => onSelectAssembly(a.id)} aria-pressed={assembly.id === a.id} className={`inspector-assembly ${assembly.id === a.id ? 'chosen' : ''}`}>
          <span className="assembly-index">{String(index + 1).padStart(2, '0')}</span><span className="assembly-name">{a.name}<small>{a.children.length} listed parts</small></span><Icon name="chevron" size={15}/>
        </button>)}
      </div>
    </div>
    <div className="assembly-detail">
      <div className="detail-meta"><span>SELECTED SYSTEM</span><span className="planned-tag">BLUEPRINT ONLY</span></div>
      <h3>{assembly.name}</h3>
      <p>{assembly.summary}</p>
      <div className="micro-label part-label">COMPONENTS TO IMPLEMENT</div>
      <div className="part-tags">{assembly.children.map(p => <span key={p}>{p}</span>)}</div>
      <div className="future-note"><Icon name="info" size={16}/><span>System selection currently previews the learning outline. Zoom-to-isolate arrives in Week 2.</span></div>
    </div>
  </aside>;
}
