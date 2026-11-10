import Icon from './Icon.jsx';
import { CATEGORIES, MACHINES } from '../data/machines.js';
import { searchableNames } from '../data/hierarchy.js';

export default function MachineLibrary({ selectedId, onSelect, favorites, onToggleFavorite, query, onQueryChange, category, onCategoryChange, searchRef }) {
  const normalized = query.trim().toLowerCase();
  const filtered = MACHINES.filter((machine) => {
    const haystack = searchableNames(machine);
    return (category === 'All' || machine.category === category) && haystack.includes(normalized);
  });

  return <aside className="library-panel" aria-label="Machine library">
    <div className="library-top">
      <div className="overline">YOUR WORKSPACE</div>
      <div className="section-head"><h2>Machine library</h2><span className="count">{MACHINES.length.toString().padStart(2, '0')}</span></div>
      <label className="search-field" htmlFor="machine-search">
        <Icon name="search" size={17}/>
        <input ref={searchRef} id="machine-search" type="search" value={query} onChange={e => onQueryChange(e.target.value)} placeholder="Search parts or machines..." autoComplete="off"/>
        <kbd>/</kbd>
      </label>
      <div className="category-row" role="group" aria-label="Filter machines by category">
        {CATEGORIES.map(cat => <button key={cat} type="button" aria-pressed={category === cat} onClick={() => onCategoryChange(cat)} className={`chip ${category === cat ? 'chip-active' : ''}`}>{cat}</button>)}
      </div>
      <div className="list-section-title"><span>CATALOG</span><span>{filtered.length} RESULTS</span></div>
    </div>
    <div className="library-items">
      {filtered.length === 0 && <div className="empty-results"><Icon name="search" size={26}/><strong>No matches</strong><p>Try a machine name, category or component like “brake”.</p><button type="button" onClick={() => { onCategoryChange('All'); onQueryChange(''); }}>Clear filters</button></div>}
      {filtered.map(machine => <div key={machine.id} className={`machine-card ${selectedId === machine.id ? 'machine-card-active' : ''}`}>
        <button className="machine-select" type="button" aria-current={selectedId === machine.id ? 'page' : undefined} onClick={() => onSelect(machine.id)}>
          <span className={`machine-tile tile-${machine.id}`}><Icon name={machine.icon} size={27}/></span>
          <span className="machine-copy"><strong>{machine.name}</strong><small>{machine.category} <span>·</span> {machine.assemblies.length} systems</small></span>
          <Icon name="chevron" size={17} className="machine-chevron"/>
        </button>
        <button className={`favorite-btn ${favorites.includes(machine.id) ? 'is-favorite' : ''}`} type="button" aria-label={`${favorites.includes(machine.id) ? 'Remove' : 'Add'} ${machine.name} ${favorites.includes(machine.id) ? 'from' : 'to'} favorites`} aria-pressed={favorites.includes(machine.id)} title="Save favorite" onClick={() => onToggleFavorite(machine.id)}><Icon name="star" size={15}/></button>
      </div>)}
    </div>
    <div className="library-footer">
      <div className="footer-eyebrow"><span className="live-dot"/> LOCAL PROTOTYPE <span className="tiny-version">V0.6</span></div>
      <p>Procedural overviews plus a multipart wheel GLB. Live gesture recognition is available in Hand lab.</p>
    </div>
  </aside>;
}
