/**
 * core.js — Week Plans shared data & pure functions
 * Loaded by index.html via <script src="core.js">
 * Imported by tests.js via require('./core.js')
 *
 * Rules for this file:
 *   - No DOM access, no localStorage, no window references
 *   - No side effects on import/load
 *   - Every function is pure (takes all its inputs as parameters)
 *   - buildTotals takes (state) explicitly — index.html passes its own state
 */

let DAYS, MEALS;
const MKEYS = ['pdj','dej','din'];

/**
 * Families that support multi-ingredient selection per meal.
 * m.ingr[fam] may be [{name, qty}, ...] instead of a plain string.
 */
const MULTI_FAM = ['Légumes', 'Salade'];

// Data — populated via _initData() (loaded from ingredients.json + menus.json)
let INGR, P3_NEW, FRUIT_DATA, INGR_QTY, MENUS;

/**
 * Initialise data from external JSON payloads.
 * Called automatically in Node.js (tests); called by index.html after fetch().
 * @param {object} ingredientsData - parsed contents of ingredients.json
 * @param {object} menusData       - parsed contents of menus.json
 */
function _initData(ingredientsData, menusData, localeData) {
  DAYS       = localeData.days;
  MEALS      = localeData.meals;
  INGR       = ingredientsData.INGR;
  P3_NEW     = new Set(ingredientsData.P3_NEW);
  FRUIT_DATA = ingredientsData.FRUIT_DATA;
  INGR_QTY   = ingredientsData.INGR_QTY;
  MENUS      = menusData.MENUS;
  DAYS       = localeData.days;
  MEALS      = localeData.meals;
}

/**
 * Resolve quantity + unit for any ingredient per person per serving.
 * @param {string} fam    - ingredient family name
 * @param {string} name   - ingredient name
 * @param {object} menuItem - MENUS item {f, q, u}
 * @returns {{q: number, u: string, note?: string}}
 */
function resolveQty(fam, name, menuItem) {
  if (fam === 'Fruit') return FRUIT_DATA[name] || {q:1, u:'pièce'};
  if (INGR_QTY[name]) { const d = INGR_QTY[name]; return {q:d.q, u:d.u, note:d.note||''}; }
  const u = (menuItem.u === 'fruit' || menuItem.u === 'portion') ? 'unité' : menuItem.u;
  return {q:menuItem.q, u};
}

/**
 * Format a quantity+unit for display.
 * @param {number} q
 * @param {string} u
 * @returns {string}
 */
function fmtQty(q, u) {
  const v  = Math.round(q * 10) / 10;
  const vd = Number.isInteger(v) ? v : v.toFixed(1);
  if (u === 'g')       return `${vd}\u202fg`;
  if (u === 'ml')      return `${vd}\u202fml`;
  if (u === 'oeufs')   return `${vd} oeuf${v > 1 ? 's' : ''}`;
  if (u === 'pièce')   return `${vd} pièce${v > 1 ? 's' : ''}`;
  if (u === 'portion') return `${vd} portion${v > 1 ? 's' : ''}`;
  if (u === 'unité')   return `${vd} unité${v > 1 ? 's' : ''}`;
  return `${vd} ${u}`;
}

/**
 * Build the ingredient key used for disable/enable tracking.
 */
function ingrKey(fam, ing) { return fam + '|' + ing; }

/**
 * Return the list of active (non-disabled) ingredients for a family.
 * @param {string|number} phase
 * @param {string} fam
 * @param {Set<string>} disabled
 * @returns {string[]}
 */
function activeList(phase, fam, disabled) {
  return (INGR[phase][fam] || []).filter(ing => !disabled.has(ingrKey(fam, ing)));
}

/**
 * Build the shopping list totals from the full application state.
 * Pure function — receives state explicitly.
 *
 * @param {object} state - { phase, activeDays, disabled, days }
 * @returns {Array<{fam,name,qty,unit,count,meals,note}>}
 */
function buildTotals(state) {
  const phase = state.phase;
  const totals = {};
  state.activeDays.forEach(di => {
    const d = state.days[di];
    MKEYS.forEach(mk => {
      const m = d.meals[mk];
      if (m.skipped) return;
      const p = m.persons;
      const cur = MENUS[mk][m.menu];
      cur.items.forEach(item => {
        const fam  = item.f;
        const list = activeList(phase, fam, state.disabled);

        if (MULTI_FAM.includes(fam)) {
          // Multi-select: m.ingr[fam] may be [{name,qty},...] or a legacy string
          const raw = m.ingr[fam];
          let sels;
          if (Array.isArray(raw) && raw.length > 0) {
            sels = raw.filter(s => list.includes(s.name));
            if (!sels.length) sels = list.length ? [{name: list[0], qty: item.q}] : [];
          } else {
            const name = (typeof raw === 'string' && list.includes(raw)) ? raw : (list[0] || '');
            sels = name ? [{name, qty: item.q}] : [];
          }
          sels.forEach(sel => {
            const key = fam + '|' + sel.name;
            const r   = resolveQty(fam, sel.name, item);
            if (!totals[key]) totals[key] = {fam, name:sel.name, qty:0, unit:r.u, count:0, meals:0, note:''};
            totals[key].qty   += sel.qty * p;
            totals[key].count += p;
            totals[key].meals += 1;
          });
        } else {
          const chosen = (m.ingr[fam] && list.includes(m.ingr[fam]))
            ? m.ingr[fam]
            : (list[0] || fam);
          const key = fam + '|' + chosen;
          const r   = resolveQty(fam, chosen, item);
          if (!totals[key]) totals[key] = {fam, name:chosen, qty:0, unit:r.u, count:0, meals:0, note:r.note||''};
          totals[key].qty   += r.q * p;
          totals[key].count += p;
          totals[key].meals += 1;
        }
      });
    });
  });
  // Snapshot gross quantities before pantry deduction
  Object.values(totals).forEach(e => { e.rawQty = e.qty; });

  // Subtract available pantry stock
  (state.pantry || []).forEach(p => {
    if (!p.name || !p.fam || !(p.qty > 0)) return;
    const key = p.fam + '|' + p.name;
    if (totals[key]) {
      totals[key].qty -= p.qty;
      if (totals[key].qty <= 0) { delete totals[key]; return; }
    }
  });

  return Object.values(totals).sort((a,b) => a.fam.localeCompare(b.fam) || a.name.localeCompare(b.name));
}

// ─── Export for Node.js (tests) / expose as globals in browser ───────────────
const _core = { DAYS, MEALS, MKEYS, MULTI_FAM,
                _initData, resolveQty, fmtQty, ingrKey, activeList, buildTotals };

if (typeof module !== 'undefined' && module.exports) {
  _initData(require('./ingredients.json'), require('./menus.json'), require('./locales/fr.json'));
  module.exports = _core;
}
