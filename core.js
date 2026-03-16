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

const DAYS  = ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'];
const MEALS = ['Petit-déjeuner','Déjeuner','Dîner'];
const MKEYS = ['pdj','dej','din'];

const MENUS = {
  pdj: [
    { label:'Bleu — Yaourt + Fruit',        color:'blue',   items:[{f:'Yaourt',q:190,u:'g'},{f:'Fruit',q:1,u:'fruit'}] },
    { label:'Vert — Volaille + Légumes',     color:'green',  items:[{f:'Volaille',q:75,u:'g'},{f:'Légumes',q:95,u:'g'},{f:'Fruit',q:1,u:'fruit'},{f:'Pain',q:1,u:'portion'}] },
    { label:'Orange — Lait + Féculents',     color:'orange', items:[{f:'Lait',q:190,u:'ml'},{f:'Féculents',q:45,u:'g'},{f:'Fruit',q:1,u:'fruit'}] },
  ],
  dej: [
    { label:'Bleu — Légumes secs',           color:'blue',   items:[{f:'Légumes secs',q:65,u:'g'},{f:'Légumes',q:140,u:'g'},{f:'Fruit',q:1,u:'fruit'},{f:'Pain',q:1,u:'portion'}] },
    { label:'Vert — Fromage + Légumes',      color:'green',  items:[{f:'Fromage',q:75,u:'g'},{f:'Légumes',q:140,u:'g'},{f:'Fruit',q:1,u:'fruit'},{f:'Pain',q:1,u:'portion'}] },
    { label:'Orange — Viande + Salade',      color:'orange', items:[{f:'Viande',q:120,u:'g'},{f:'Salade',q:140,u:'g'},{f:'Fruit',q:1,u:'fruit'},{f:'Pain',q:1,u:'portion'}] },
  ],
  din: [
    { label:'Bleu — Viande + Légumes',       color:'blue',   items:[{f:'Viande',q:130,u:'g'},{f:'Légumes',q:150,u:'g'},{f:'Fruit',q:1,u:'fruit'},{f:'Pain',q:1,u:'portion'}] },
    { label:'Vert — Oeufs + Salade',         color:'green',  items:[{f:'Oeufs',q:2,u:'oeufs'},{f:'Salade',q:150,u:'g'},{f:'Fruit',q:1,u:'fruit'},{f:'Pain',q:1,u:'portion'}] },
    { label:'Orange — Poisson + Légumes',    color:'orange', items:[{f:'Poisson',q:130,u:'g'},{f:'Légumes',q:150,u:'g'},{f:'Fruit',q:1,u:'fruit'},{f:'Pain',q:1,u:'portion'}] },
  ],
};

const INGR = {
  2: {
    Poisson:         ['Colin','Hareng','Morue','Pangas','Perche du Nil','Saumon','Saumon sauvage','Sole','Thon frais','Truite','Turbot'],
    'Fruits de mer': ['Coquille St. Jacques','Gambas','Praires','Seiche'],
    Volaille:        ['Blanc de poulet','Magret de canard'],
    Viande:          ["Côtelette d'agneau","Filet de porc","Filet mignon de boeuf","Jambon cuit","Viande d'autruche","Viande de veau"],
    Fromage:         ['Feta (brebis)','Fromage de brebis frais','Fromage de chèvre frais'],
    'Légumes secs':  ['Haricots de soja','Haricots mungo','Haricots noirs','Lentilles corail','Pois chiches'],
    Légumes:         ['Artichaut','Asperge verte','Avocat','Brocoli','Carottes','Champignons','Courgettes','Épinards','Fenouil','Haricots verts','Poireau','Poivron rouge','Potiron'],
    Salade:          ['Concombre','Mâche','Roquette','Salade feuilles de chêne','Salade iceberg','Scarole'],
    Yaourt:          ['Yaourt de brebis'],
    Lait:            ['Lait de chèvre','Lait de soja'],
    Féculents:       ["Flocons d'avoine"],
    Pain:            ['Biscottes de seigle','Pain de seigle complet'],
    Oeufs:           ['Oeufs'],
    Fruit:           ['Abricot frais','Framboises','Kiwi','Mangue','Melon','Mûres','Nectarine','Papaye','Pomme','Quetsches'],
  },
  3: {
    Poisson:          ['Colin','Hareng','Morue','Pangas','Perche du Nil','Saumon','Saumon sauvage','Sole','Thon frais','Truite','Turbot'],
    'Fruits de mer':  ['Coquille St. Jacques','Crabes','Gambas','Praires','Seiche'],
    Volaille:         ['Blanc de poulet','Cuisse de poulet','Magret de canard'],
    Viande:           ["Côtelette d'agneau","Escalope de veau","Filet de porc","Filet mignon de boeuf","Jambon cuit","Poitrine de boeuf","Rosbif","Viande d'autruche","Viande de veau"],
    Fromage:          ['Feta (brebis)','Fromage de brebis frais','Fromage de Chèvre','Fromage de chèvre frais'],
    'Légumes secs':   ['Haricots blancs','Haricots de soja','Haricots mungo','Haricots noirs','Lentilles corail','Pois chiches'],
    'Jeunes pousses': ['Pousse de graine de soja'],
    Légumes:          ['Artichaut','Asperge verte','Avocat','Brocoli','Carottes','Champignons','Chou-fleur','Courgettes','Épinards','Fenouil','Haricots verts','Poireau','Poivron rouge','Potiron','Pousses de bambous'],
    Salade:           ['Mâche','Roquette','Salade feuilles de chêne','Salade iceberg','Scarole'],
    Yaourt:           ['Yaourt au soja','Yaourt de brebis','Yaourt de chèvre'],
    Lait:             ['Lait de chèvre','Lait de soja'],
    Féculents:        ["Flocons d'avoine"],
    Pain:             ['Biscottes de seigle','Pain de seigle complet'],
    Oeufs:            ['Oeufs'],
    Fruit:            ['Abricot frais','Framboises','Kiwi','Mangue','Mûres','Nectarine','Papaye','Pomme','Quetsches'],
  }
};

const P3_NEW = new Set([
  'Crabes','Cuisse de poulet','Escalope de veau','Poitrine de boeuf','Rosbif',
  'Fromage de Chèvre','Haricots blancs','Pousse de graine de soja','Chou-fleur',
  'Pousses de bambous','Yaourt au soja','Yaourt de chèvre',
]);

const FRUIT_DATA = {
  'Abricot frais': {q:120, u:'g'},
  'Framboises':    {q:100, u:'g'},
  'Kiwi':          {q:1,   u:'pièce'},
  'Mangue':        {q:160, u:'g'},
  'Melon':         {q:120, u:'g'},
  'Mûres':         {q:100, u:'g'},
  'Nectarine':     {q:1,   u:'pièce'},
  'Papaye':        {q:170, u:'g'},
  'Pomme':         {q:1,   u:'pièce'},
  'Quetsches':     {q:100, u:'g'},
};

const INGR_QTY = {
  'Biscottes de seigle':    {q:30,  u:'g',    note:'~2 biscottes'},
  'Pain de seigle complet': {q:50,  u:'g',    note:'~1 tranche'},
  "Flocons d'avoine":       {q:45,  u:'g'},
  'Yaourt de brebis':       {q:190, u:'g'},
  'Yaourt au soja':         {q:190, u:'g'},
  'Yaourt de chèvre':       {q:190, u:'g'},
  'Lait de chèvre':         {q:190, u:'ml'},
  'Lait de soja':           {q:190, u:'ml'},
  'Oeufs':                  {q:2,   u:'oeufs', note:'min. 2 / max. 6 par semaine'},
};

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
        const chosen = (m.ingr[fam] && list.includes(m.ingr[fam]))
          ? m.ingr[fam]
          : (list[0] || fam);
        const key = fam + '|' + chosen;
        const r   = resolveQty(fam, chosen, item);
        if (!totals[key]) totals[key] = {fam, name:chosen, qty:0, unit:r.u, count:0, meals:0, note:r.note||''};
        totals[key].qty   += r.q * p;
        totals[key].count += p;
        totals[key].meals += 1;
      });
    });
  });
  return Object.values(totals).sort((a,b) => a.fam.localeCompare(b.fam) || a.name.localeCompare(b.name));
}

// ─── Export for Node.js (tests) / expose as globals in browser ───────────────
const _core = { DAYS, MEALS, MKEYS, MENUS, INGR, P3_NEW, FRUIT_DATA, INGR_QTY,
                resolveQty, fmtQty, ingrKey, activeList, buildTotals };

if (typeof module !== 'undefined' && module.exports) {
  module.exports = _core;
}

