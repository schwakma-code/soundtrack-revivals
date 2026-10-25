// A stand-in for the Claude dashboard's `dash` object, so the same page runs as a plain website.
// It loads the three CSV files beside the page, works out the page's calculations, and keeps the filters.
(() => {
  const FILES = { older_songs: 'data/older_songs.csv', titles: 'data/titles.csv', chart_runs: 'data/chart_runs.csv' };
  const DEFAULTS = { q: '', kind: 'all', biopics: true, song: null, top: 50, genre: null, decade: null, view: 'speaker' };
  const loaded = {};
  const calcs = {};
  const listeners = [];
  let params = { ...DEFAULTS };
  let queued = false;

  const redraw = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; listeners.forEach((fn) => fn()); });
  };

  const rowsOf = (id) => (loaded[id] ? loaded[id] : calcs[id] ? dash.data(id).data : null);

  window.dash = {
    data(id) {
      if (FILES[id]) return loaded[id] ? { status: 'ok', data: loaded[id], columns: loaded[id].columns } : { status: 'loading', data: [] };
      const calc = calcs[id];
      if (!calc) return { status: 'missing', data: [] };
      const inputs = calc.inputs.map(rowsOf);
      if (inputs.some((r) => !r)) return { status: 'loading', data: [] };
      return { status: 'ok', data: calc.fn(...inputs) };
    },
    calc(id, spec) { calcs[id] = spec; },
    onData(fn) { listeners.push(fn); fn(); },
    params: () => ({ ...params }),
    setParams(next) { params = { ...params, ...next }; redraw(); },
    resetParams() { params = { ...DEFAULTS }; redraw(); },
    setLink(id) { try { history.replaceState(null, '', '#' + id); } catch (e) { /* a sandboxed frame may refuse */ } },
  };

  Object.entries(FILES).forEach(([id, url]) => {
    fetch(url).then((r) => r.text()).then((text) => { loaded[id] = d3.csvParse(text); redraw(); });
  });
  let width = window.innerWidth;
  window.addEventListener('resize', () => { if (window.innerWidth !== width) { width = window.innerWidth; redraw(); } });
})();
