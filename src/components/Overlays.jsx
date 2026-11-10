import Icon from './Icon.jsx';

export function Dialog({ title, description, onClose, children }) {
  return <div className="modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <section role="dialog" aria-modal="true" aria-label={title} aria-describedby={description ? 'dialog-description' : undefined} className="modal-card">
      <div className="modal-header"><div><span className="overline">HOLOLAB / CONTROL CENTER</span><h2>{title}</h2></div><button type="button" className="icon-button" onClick={onClose} aria-label="Close dialog"><Icon name="close"/></button></div>
      {description && <p id="dialog-description" className="modal-description">{description}</p>}
      {children}
      <button type="button" className="primary-button modal-close" onClick={onClose}>Done <Icon name="check" size={16}/></button>
    </section>
  </div>;
}

export function HelpContent() {
  return <div className="help-content">
    <div className="help-callout"><Icon name="info"/><span><strong>Day 4:</strong> One genuine six-part wheel/brakes GLB can be previewed from the car Inspector. Click 3D parts to highlight them. Gestures, zoom-to-isolate and disassembly are not yet available.</span></div>
    <div className="shortcut-grid">
      {[
        ['Left-drag', 'Orbit around the object'],
        ['Click 3D part', 'Highlight a named mesh in assembly test mode'],
        ['Inspector', 'Select Front Wheel & Brakes → Load 3D test assembly'],
        ['Scroll', 'Zoom the camera'],
        ['Right-drag', 'Pan the camera'],
        ['/', 'Focus machine search'],
        ['1 / 2 / 3', 'Choose a machine'],
        ['W', 'Toggle wireframe'],
        ['S', 'Toggle holographic scan'],
        ['Space', 'Toggle auto-rotation'],
        ['R', 'Reset camera'],
        ['H', 'Open this help'],
        ['Esc', 'Close a dialog'],
      ].map(([key, text]) => <div className="shortcut-row" key={key}><kbd>{key}</kbd><span>{text}</span></div>)}
    </div>
  </div>;
}

export function SettingsContent({ quality, onQualityChange, effects, onEffectsChange, autoRotate, onAutoRotateChange }) {
  return <div className="settings-content">
    <div className="setting-row"><div><strong>Rendering quality</strong><p>Controls pixel ratio and rendering work, not model detail.</p></div><select value={quality} onChange={e => onQualityChange(e.target.value)} aria-label="Rendering quality"><option value="eco">Eco</option><option value="balanced">Balanced</option><option value="detail">Detail</option></select></div>
    <div className="setting-row"><div><strong>Automatic rotation</strong><p>Slowly spin the model when you aren't interacting.</p></div><label className="switch-control"><input type="checkbox" checked={autoRotate} onChange={e => onAutoRotateChange(e.target.checked)} aria-label="Automatic rotation"/><span/></label></div>
    {[
      ['bloom', 'Soft holographic bloom', 'Subtle in Balanced; stronger in Detail; automatically disabled in Eco.'],
      ['particles', 'Ambient particles', 'Low-cost background depth cues; density follows rendering quality.'],
      ['scan', 'Animated scanner', 'Moving scan slice and fine surface scan bands.'],
    ].map(([key, label, description]) => <div className="setting-row" key={key}>
      <div><strong>{label}</strong><p>{description}</p></div>
      <label className="switch-control"><input type="checkbox" checked={effects[key] !== false} onChange={event => onEffectsChange(previous => ({ ...previous, [key]: event.target.checked }))} aria-label={label}/><span/></label>
    </div>)}
    <p className="settings-note">Preferences are saved in this browser. Webcam sensitivity and calibration settings will be added with hand tracking.</p>
  </div>;
}
