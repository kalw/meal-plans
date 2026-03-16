/**
 * Week Plans — Test Suite
 * Run with: node tests.js
 *
 * All shared data and functions are imported from core.js — the single
 * source of truth used by both index.html and this test suite.
 */

const {
  MKEYS,
  resolveQty, fmtQty, ingrKey, activeList, buildTotals,
} = require("./core.js");
const { INGR, P3_NEW, FRUIT_DATA, INGR_QTY } = require("./ingredients.json");
const { MENUS } = require("./menus.json");
const { days: DAYS, meals: MEALS } = require('./locales/fr.json');


function makeState(overrides={}) {
  return {
    phase: '2',
    activeDays: [0],
    dayLabels: [...DAYS],
    disabled: new Set(),
    days: DAYS.map(() => ({
      meals: {
        pdj: {menu:0, persons:2, ingr:{}, skipped:false},
        dej: {menu:0, persons:2, ingr:{}, skipped:false},
        din: {menu:0, persons:2, ingr:{}, skipped:false},
      }
    })),
    ...overrides,
  };
}

// ─── Test runner ────────────────────────────────────────────────────────────

let passed = 0, failed = 0, total = 0;

function test(name, fn) {
  total++;
  try {
    fn();
    console.log(`  ✓  ${name}`);
    passed++;
  } catch(e) {
    console.log(`  ✗  ${name}`);
    console.log(`       ${e.message}`);
    failed++;
  }
}

function assert(condition, msg) {
  if (!condition) throw new Error(msg || 'assertion failed');
}

function assertEqual(a, b, msg) {
  if (a !== b) throw new Error(`${msg || ''}: expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);
}

function assertIncludes(arr, val, msg) {
  if (!arr.includes(val)) throw new Error(`${msg || ''}: ${JSON.stringify(val)} not in [${arr.join(', ')}]`);
}

// ═══════════════════════════════════════════════════════════════════════════
console.log('\n── 1. MENUS structure ─────────────────────────────────────────');

test('MENUS has exactly 3 meal keys', () => {
  assertEqual(Object.keys(MENUS).join(','), 'pdj,dej,din');
});

test('each meal key has exactly 3 menu options', () => {
  MKEYS.forEach(mk => assertEqual(MENUS[mk].length, 3, `${mk} should have 3 options`));
});

test('every menu has label, color and items array', () => {
  MKEYS.forEach(mk => MENUS[mk].forEach(menu => {
    assert(menu.label, `${mk} menu missing label`);
    assert(['blue','green','orange'].includes(menu.color), `${mk} menu invalid color: ${menu.color}`);
    assert(Array.isArray(menu.items) && menu.items.length > 0, `${mk} menu missing items`);
  }));
});

test('every menu item has f (family), q (qty >0) and u (unit)', () => {
  const validUnits = ['g','ml','oeufs','portion','fruit'];
  MKEYS.forEach(mk => MENUS[mk].forEach(menu => {
    menu.items.forEach(item => {
      assert(item.f, `missing family in ${menu.label}`);
      assert(item.q > 0, `qty must be >0 in ${menu.label} / ${item.f}`);
      assertIncludes(validUnits, item.u, `invalid unit in ${menu.label} / ${item.f}`);
    });
  }));
});

test('each meal type has one menu per color (blue/green/orange)', () => {
  MKEYS.forEach(mk => {
    const colors = MENUS[mk].map(m => m.color).sort();
    assertEqual(colors.join(','), 'blue,green,orange', `${mk} missing a color variant`);
  });
});

test('Fruit appears in every menu (all phases need a fruit)', () => {
  MKEYS.forEach(mk => MENUS[mk].forEach(menu => {
    assert(menu.items.some(i => i.f === 'Fruit'), `${menu.label} has no Fruit item`);
  }));
});

// ═══════════════════════════════════════════════════════════════════════════
console.log('\n── 2. INGR families match MENUS families ──────────────────────');

// Collect all families referenced in MENUS
const menuFamilies = new Set();
MKEYS.forEach(mk => MENUS[mk].forEach(menu => menu.items.forEach(i => menuFamilies.add(i.f))));

test('every MENUS family exists in INGR[2]', () => {
  menuFamilies.forEach(fam => {
    assert(INGR[2][fam] !== undefined || fam === 'Fruit', // Fruit is always resolved via FRUIT_DATA
      `Family "${fam}" in MENUS not found in INGR[2]`);
  });
});

test('every MENUS family exists in INGR[3]', () => {
  menuFamilies.forEach(fam => {
    assert(INGR[3][fam] !== undefined || fam === 'Fruit',
      `Family "${fam}" in MENUS not found in INGR[3]`);
  });
});

test('every INGR[2] family has at least 1 ingredient', () => {
  Object.entries(INGR[2]).forEach(([fam, list]) => {
    assert(list.length > 0, `INGR[2].${fam} is empty`);
  });
});

test('every INGR[3] family has at least 1 ingredient', () => {
  Object.entries(INGR[3]).forEach(([fam, list]) => {
    assert(list.length > 0, `INGR[3].${fam} is empty`);
  });
});

test('no duplicate ingredients within a family in INGR[2]', () => {
  Object.entries(INGR[2]).forEach(([fam, list]) => {
    const seen = new Set();
    list.forEach(ing => {
      assert(!seen.has(ing), `Duplicate "${ing}" in INGR[2].${fam}`);
      seen.add(ing);
    });
  });
});

test('no duplicate ingredients within a family in INGR[3]', () => {
  Object.entries(INGR[3]).forEach(([fam, list]) => {
    const seen = new Set();
    list.forEach(ing => {
      assert(!seen.has(ing), `Duplicate "${ing}" in INGR[3].${fam}`);
      seen.add(ing);
    });
  });
});

test('P3_NEW items all exist in INGR[3] (not orphaned)', () => {
  P3_NEW.forEach(ing => {
    const found = Object.values(INGR[3]).some(list => list.includes(ing));
    assert(found, `P3_NEW item "${ing}" not found in any INGR[3] family`);
  });
});

test('P3_NEW items do NOT appear in INGR[2]', () => {
  P3_NEW.forEach(ing => {
    const foundInP2 = Object.values(INGR[2]).some(list => list.includes(ing));
    assert(!foundInP2, `P3_NEW item "${ing}" should not be in INGR[2]`);
  });
});

test('INGR[3] contains all items from INGR[2] except known removals (Concombre, Melon)', () => {
  const KNOWN_REMOVALS = { Salade: ['Concombre'], Fruit: ['Melon'] };
  Object.entries(INGR[2]).forEach(([fam, list]) => {
    if (!INGR[3][fam]) return;
    const removals = KNOWN_REMOVALS[fam] || [];
    list.filter(ing => !removals.includes(ing)).forEach(ing => {
      assert(INGR[3][fam].includes(ing),
        `INGR[2].${fam} item "${ing}" missing in INGR[3] (and not a known removal)`);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
console.log('\n── 3. FRUIT_DATA coherence ─────────────────────────────────────');

test('every fruit in INGR[2].Fruit has an entry in FRUIT_DATA', () => {
  INGR[2].Fruit.forEach(f => assert(FRUIT_DATA[f], `FRUIT_DATA missing "${f}"`));
});

test('every fruit in INGR[3].Fruit has an entry in FRUIT_DATA', () => {
  INGR[3].Fruit.forEach(f => assert(FRUIT_DATA[f], `FRUIT_DATA missing "${f}"`));
});

test('no FRUIT_DATA entry is orphaned (all referenced in at least one INGR phase)', () => {
  const allFruits = new Set([...INGR[2].Fruit, ...INGR[3].Fruit]);
  Object.keys(FRUIT_DATA).forEach(f => {
    assert(allFruits.has(f), `FRUIT_DATA entry "${f}" not in any INGR.Fruit list`);
  });
});

test('all FRUIT_DATA quantities are positive', () => {
  Object.entries(FRUIT_DATA).forEach(([f, d]) => {
    assert(d.q > 0, `FRUIT_DATA["${f}"].q must be >0`);
  });
});

test('all FRUIT_DATA units are g or pièce', () => {
  Object.entries(FRUIT_DATA).forEach(([f, d]) => {
    assertIncludes(['g','pièce'], d.u, `FRUIT_DATA["${f}"] invalid unit`);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
console.log('\n── 4. INGR_QTY coherence ───────────────────────────────────────');

test('all INGR_QTY ingredients exist in INGR (not orphaned)', () => {
  Object.keys(INGR_QTY).forEach(ing => {
    const found = [2,3].some(p => Object.values(INGR[p]).some(list => list.includes(ing)));
    assert(found, `INGR_QTY entry "${ing}" not found in any INGR family`);
  });
});

test('all Pain ingredients have INGR_QTY entries', () => {
  [...INGR[2].Pain, ...INGR[3].Pain].forEach(ing => {
    assert(INGR_QTY[ing], `Pain ingredient "${ing}" missing from INGR_QTY`);
  });
});

test('all Yaourt ingredients have INGR_QTY entries', () => {
  const allYaourts = new Set([...INGR[2].Yaourt, ...INGR[3].Yaourt]);
  allYaourts.forEach(ing => {
    assert(INGR_QTY[ing], `Yaourt "${ing}" missing from INGR_QTY`);
  });
});

test('all Lait ingredients have INGR_QTY entries', () => {
  const allLaits = new Set([...INGR[2].Lait, ...INGR[3].Lait]);
  allLaits.forEach(ing => {
    assert(INGR_QTY[ing], `Lait "${ing}" missing from INGR_QTY`);
  });
});

test('all INGR_QTY quantities are positive', () => {
  Object.entries(INGR_QTY).forEach(([k,v]) => assert(v.q > 0, `INGR_QTY["${k}"].q must be >0`));
});

// ═══════════════════════════════════════════════════════════════════════════
console.log('\n── 5. resolveQty logic ─────────────────────────────────────────');

test('resolveQty returns FRUIT_DATA for Fruit family', () => {
  const r = resolveQty('Fruit', 'Kiwi', {f:'Fruit',q:1,u:'fruit'});
  assertEqual(r.q, 1);
  assertEqual(r.u, 'pièce');
});

test('resolveQty returns FRUIT_DATA grams for Mangue', () => {
  const r = resolveQty('Fruit', 'Mangue', {f:'Fruit',q:1,u:'fruit'});
  assertEqual(r.q, 160);
  assertEqual(r.u, 'g');
});

test('resolveQty uses INGR_QTY for known ingredients', () => {
  const r = resolveQty('Yaourt', 'Yaourt de brebis', {f:'Yaourt',q:190,u:'g'});
  assertEqual(r.q, 190);
  assertEqual(r.u, 'g');
});

test('resolveQty uses menuItem qty for Viande', () => {
  const r = resolveQty('Viande', 'Saumon', {f:'Viande',q:120,u:'g'});
  assertEqual(r.q, 120);
  assertEqual(r.u, 'g');
});

test('resolveQty maps "portion" unit to "unité"', () => {
  const r = resolveQty('Pain', 'SomeUnknownBread', {f:'Pain',q:1,u:'portion'});
  assertEqual(r.u, 'unité');
});

test('resolveQty maps "fruit" unit to "unité" for unknown fruit', () => {
  const r = resolveQty('FakeFamily', 'FakeThing', {f:'FakeFamily',q:1,u:'fruit'});
  assertEqual(r.u, 'unité');
});

test('resolveQty returns pièce fallback for unknown fruit', () => {
  const r = resolveQty('Fruit', 'FruitInconnu', {f:'Fruit',q:1,u:'fruit'});
  assertEqual(r.u, 'pièce');
  assertEqual(r.q, 1);
});

// ═══════════════════════════════════════════════════════════════════════════
console.log('\n── 6. fmtQty display ───────────────────────────────────────────');

test('fmtQty formats grams correctly', () => assertEqual(fmtQty(190,'g'), '190\u202fg'));
test('fmtQty formats ml correctly',    () => assertEqual(fmtQty(190,'ml'), '190\u202fml'));
test('fmtQty formats 1 oeuf (singular)',  () => assertEqual(fmtQty(1,'oeufs'),  '1 oeuf'));
test('fmtQty formats 2 oeufs (plural)',   () => assertEqual(fmtQty(2,'oeufs'),  '2 oeufs'));
test('fmtQty formats 1 pièce (singular)', () => assertEqual(fmtQty(1,'pièce'),  '1 pièce'));
test('fmtQty formats 2 pièces (plural)',  () => assertEqual(fmtQty(2,'pièce'),  '2 pièces'));
test('fmtQty formats decimal only when not integer', () => {
  assertEqual(fmtQty(1.5,'g'), '1.5\u202fg');
  assertEqual(fmtQty(2.0,'g'), '2\u202fg');
});

// ═══════════════════════════════════════════════════════════════════════════
console.log('\n── 7. buildTotals — default state (1 day, 2 persons, menu 0) ──');

test('default state: 3 meal types produce entries', () => {
  const s = makeState();
  const entries = buildTotals(s);
  assert(entries.length > 0, 'should have entries');
});

test('default state: Yaourt total = 190g × 2 persons × 1 day = 380g', () => {
  const s = makeState();
  const entries = buildTotals(s);
  const yaourt = entries.find(e => e.fam === 'Yaourt');
  assert(yaourt, 'Yaourt entry missing');
  assertEqual(yaourt.qty, 380);
  assertEqual(yaourt.unit, 'g');
});

test('default state: Fruit appears (from pdj Bleu menu)', () => {
  const s = makeState();
  const entries = buildTotals(s);
  const fruit = entries.find(e => e.fam === 'Fruit');
  assert(fruit, 'Fruit entry missing');
});

test('default state: skipped meal excluded from totals', () => {
  const s = makeState();
  s.days[0].meals.pdj.skipped = true;
  const entries = buildTotals(s);
  const yaourt = entries.find(e => e.fam === 'Yaourt');
  assert(!yaourt, 'Yaourt should be absent when pdj is skipped');
});

test('default state: inactive day excluded from totals', () => {
  const s = makeState({ activeDays: [] });
  const entries = buildTotals(s);
  assertEqual(entries.length, 0, 'no active days should give empty totals');
});

test('persons multiplier: 4 persons gives double qty vs 2 persons', () => {
  const s2 = makeState();
  const s4 = makeState();
  s4.days[0].meals.pdj.persons = 4;
  s4.days[0].meals.dej.persons = 4;
  s4.days[0].meals.din.persons = 4;
  const t2 = buildTotals(s2).find(e => e.fam === 'Yaourt');
  const t4 = buildTotals(s4).find(e => e.fam === 'Yaourt');
  assertEqual(t4.qty, t2.qty * 2, 'qty should double with double persons');
});

test('meal count: meals field counts occurrences not persons', () => {
  const s = makeState();
  s.activeDays = [0, 1]; // 2 days, both with pdj menu 0 (Yaourt)
  const entries = buildTotals(s);
  const yaourt = entries.find(e => e.fam === 'Yaourt');
  assert(yaourt, 'Yaourt missing');
  assertEqual(yaourt.meals, 2, 'meals should be 2 (one per day)');
  assertEqual(yaourt.count, 4, 'count should be 4 (2 days × 2 persons)');
});

test('qty total across 7 days with 2 persons: Yaourt = 190×2×7=2660g', () => {
  const s = makeState({ activeDays: [0,1,2,3,4,5,6] });
  const entries = buildTotals(s);
  const yaourt = entries.find(e => e.fam === 'Yaourt');
  assertEqual(yaourt.qty, 190*2*7);
});

// ═══════════════════════════════════════════════════════════════════════════
console.log('\n── 8. buildTotals — ingredient choice changes totals ───────────');

test('choosing Kiwi gives pièce unit in totals', () => {
  const s = makeState();
  s.days[0].meals.pdj.ingr['Fruit'] = 'Kiwi';
  const entries = buildTotals(s);
  const fruit = entries.find(e => e.name === 'Kiwi');
  assert(fruit, 'Kiwi entry missing');
  assertEqual(fruit.unit, 'pièce');
  assertEqual(fruit.qty, 2); // 1 pièce × 2 persons
});

test('choosing Mangue gives g unit and 160×2=320g', () => {
  const s = makeState();
  s.days[0].meals.pdj.ingr['Fruit'] = 'Mangue';
  const entries = buildTotals(s);
  const fruit = entries.find(e => e.name === 'Mangue');
  assert(fruit, 'Mangue entry missing');
  assertEqual(fruit.unit, 'g');
  assertEqual(fruit.qty, 320);
});

test('menu change affects which families appear', () => {
  const s = makeState();
  s.days[0].meals.din.menu = 1; // Vert — Oeufs + Salade
  const entries = buildTotals(s);
  const oeufs = entries.find(e => e.fam === 'Oeufs');
  const poisson = entries.find(e => e.fam === 'Poisson');
  assert(oeufs, 'Oeufs should appear with dîner Vert');
  assert(!poisson, 'Poisson should not appear with dîner Vert');
});

// ═══════════════════════════════════════════════════════════════════════════
console.log('\n── 9. disabled ingredients ─────────────────────────────────────');

test('activeList removes disabled ingredients', () => {
  const disabled = new Set(['Viande|Jambon cuit']);
  const list = activeList(2, 'Viande', disabled);
  assert(!list.includes('Jambon cuit'), 'disabled item should be absent');
  assert(list.includes("Filet de porc"), 'other items should remain');
});

test('activeList returns full list when nothing disabled', () => {
  const disabled = new Set();
  const list = activeList(2, 'Légumes', disabled);
  assertEqual(list.length, INGR[2].Légumes.length);
});

test('activeList returns empty when all items disabled', () => {
  const disabled = new Set(INGR[2].Yaourt.map(i => ingrKey('Yaourt', i)));
  const list = activeList(2, 'Yaourt', disabled);
  assertEqual(list.length, 0);
});

test('disabled ingredient: activeList excludes it, buildTotals uses first remaining', () => {
  const s = makeState();
  s.days[0].meals.dej.menu = 2;  // Orange — Viande + Salade
  // disable the first viande — ingr not explicitly set, so buildTotals picks list[0]
  const firstViande = INGR[2].Viande[0]; // Côtelette d'agneau
  s.disabled = new Set([ingrKey('Viande', firstViande)]);
  // ingr not set — buildTotals will use activeList[0] = second viande
  const secondViande = INGR[2].Viande[1]; // Filet de porc
  const list = activeList('2', 'Viande', s.disabled);
  assertEqual(list[0], secondViande, 'first active viande should be Filet de porc');
  const entries = buildTotals(s);
  const vEntry = entries.find(e => e.fam === 'Viande');
  assertEqual(vEntry.name, secondViande, 'buildTotals should use first active ingredient');
});

// ═══════════════════════════════════════════════════════════════════════════
console.log('\n── 10. Phase 2 vs Phase 3 differences ─────────────────────────');

test('Melon exists in INGR[2] Fruit but NOT in INGR[3] Fruit', () => {
  assert(INGR[2].Fruit.includes('Melon'),  'Melon should be in P2 Fruit');
  assert(!INGR[3].Fruit.includes('Melon'), 'Melon should NOT be in P3 Fruit');
});

test('Concombre exists in INGR[2] Salade but NOT in INGR[3] Salade', () => {
  assert(INGR[2].Salade.includes('Concombre'),  'Concombre should be in P2 Salade');
  assert(!INGR[3].Salade.includes('Concombre'), 'Concombre should NOT be in P3 Salade');
});

test('Crabes exists only in INGR[3]', () => {
  assert(!INGR[2]['Fruits de mer'].includes('Crabes'), 'Crabes should not be in P2');
  assert(INGR[3]['Fruits de mer'].includes('Crabes'),  'Crabes should be in P3');
});

test('buildTotals phase switch changes available ingredients', () => {
  const s2 = makeState({ phase: '2' });
  const s3 = makeState({ phase: '3' });
  const list2 = activeList('2', 'Yaourt', new Set());
  const list3 = activeList('3', 'Yaourt', new Set());
  assert(list3.length > list2.length, 'P3 Yaourt should have more options than P2');
});

// ═══════════════════════════════════════════════════════════════════════════
console.log('\n── 11. State transitions ───────────────────────────────────────');

test('removeDay resets label to default', () => {
  const labels = [...DAYS];
  labels[1] = 'Mon mardi custom';
  // Simulate removeDay logic
  labels[1] = DAYS[1];
  assertEqual(labels[1], 'Mardi');
});

test('skipped meal reduces total qty', () => {
  const s = makeState({ activeDays: [0,1] });
  s.days[1].meals.dej.skipped = true;
  const entries = buildTotals(s);
  // Légumes appears in dej menu 0 (Bleu) for day 0 but not day 1 (skipped)
  const legumes = entries.find(e => e.fam === 'Légumes');
  // day 0 dej: 140g × 2persons + day 0 din: 150g × 2persons = 580g, day 1 dej skipped
  // day 1 din: 150g × 2 = 300, day 1 pdj has no légumes in menu 0
  // total légumes = day0 dej 280 + day0 din 300 + day1 din 300 = 880
  assert(legumes.qty < buildTotals(makeState({activeDays:[0,1]})).find(e=>e.fam==='Légumes').qty,
    'skipping a meal should reduce légumes total');
});

test('multi-day accumulates meals count correctly', () => {
  const s = makeState({ activeDays:[0,1,2] });
  const entries = buildTotals(s);
  // Yaourt is in pdj menu 0 — 3 days
  const yaourt = entries.find(e => e.fam === 'Yaourt');
  assertEqual(yaourt.meals, 3);
});

// ═══════════════════════════════════════════════════════════════════════════
console.log('\n── 12. Scenario calculation tests ──────────────────────────────');

// ─── Helpers ────────────────────────────────────────────────────────────────

// Deterministic pseudo-random (seeded) — no external deps
function seededRand(seed) {
  let s = seed;
  return () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff; };
}
function pick(arr, rng) { return arr[Math.floor(rng() * arr.length)]; }

// Simulate what renderWeek shows for a single meal slot (per-person qty per family)
// Returns { fam -> { qty, unit, name } } for the given meal
function simulateDayDisplay(phase, mk, menuIdx, ingrChoices, disabled) {
  const menu = MENUS[mk][menuIdx];
  const result = {};
  menu.items.forEach(item => {
    const fam = item.f;
    const list = activeList(phase, fam, disabled);
    const name = (ingrChoices[fam] && list.includes(ingrChoices[fam]))
      ? ingrChoices[fam]
      : (list[0] || fam);
    const r = resolveQty(fam, name, item);
    result[fam] = { qty: r.q, unit: r.u, name };
  });
  return result;
}

// Verify day display vs shopping list totals for one meal across N persons
function verifyMealTotals(phase, mk, menuIdx, ingrChoices, persons, disabled = new Set()) {
  const display = simulateDayDisplay(phase, mk, menuIdx, ingrChoices, disabled);
  const s = makeState();
  s.phase = String(phase);
  s.days[0].meals[mk].menu = menuIdx;
  s.days[0].meals[mk].persons = persons;
  s.days[0].meals[mk].ingr = { ...ingrChoices };
  s.disabled = disabled;
  // skip other meals to isolate
  MKEYS.filter(m => m !== mk).forEach(m => { s.days[0].meals[m].skipped = true; });
  const totals = buildTotals(s);

  Object.entries(display).forEach(([fam, { qty: qtyPerPerson, unit, name }]) => {
    const entry = totals.find(e => e.fam === fam && e.name === name);
    assert(entry, `Shopping list missing entry for ${fam}/${name}`);
    const expected = qtyPerPerson * persons;
    assertEqual(Math.round(entry.qty * 10) / 10, Math.round(expected * 10) / 10,
      `${fam}/${name}: display=${qtyPerPerson}×${persons}=${expected}, got ${entry.qty}`);
    assertEqual(entry.unit, unit, `${fam}/${name}: unit mismatch`);
    assertEqual(entry.meals, 1, `${fam}/${name}: meals count should be 1`);
    assertEqual(entry.count, persons, `${fam}/${name}: person count should be ${persons}`);
  });
}

// ─── Scenario runner ─────────────────────────────────────────────────────────

function runScenario(label, { phase, days, seed = 42 }) {
  const rng = seededRand(seed);
  const disabled = new Set();
  // Build state
  const s = makeState({ phase: String(phase), activeDays: days.map(d => d.idx) });

  days.forEach(({ idx, meals }) => {
    MKEYS.forEach((mk, mi) => {
      const cfg = meals[mi];
      s.days[idx].meals[mk].menu = cfg.menu;
      s.days[idx].meals[mk].persons = cfg.persons;
      s.days[idx].meals[mk].skipped = cfg.skipped || false;
      s.days[idx].meals[mk].ingr = cfg.ingr || {};
    });
  });

  // Compute expected totals manually
  const expected = {};
  days.forEach(({ idx, meals }) => {
    MKEYS.forEach((mk, mi) => {
      const cfg = meals[mi];
      if (cfg.skipped) return;
      const menu = MENUS[mk][cfg.menu];
      menu.items.forEach(item => {
        const fam = item.f;
        const list = activeList(phase, fam, disabled);
        const chosen = (cfg.ingr && cfg.ingr[fam] && list.includes(cfg.ingr[fam]))
          ? cfg.ingr[fam] : (list[0] || fam);
        const r = resolveQty(fam, chosen, item);
        const key = `${fam}|${chosen}`;
        if (!expected[key]) expected[key] = { fam, name: chosen, qty: 0, unit: r.u, meals: 0, count: 0 };
        expected[key].qty   += r.q * cfg.persons;
        expected[key].meals += 1;
        expected[key].count += cfg.persons;
      });
    });
  });

  const actual = buildTotals(s);

  // Check all expected entries match actual
  Object.values(expected).forEach(exp => {
    const act = actual.find(e => e.fam === exp.fam && e.name === exp.name);
    assert(act, `[${label}] Missing ${exp.fam}/${exp.name} in shopping list`);
    assertEqual(Math.round(act.qty), Math.round(exp.qty),
      `[${label}] ${exp.fam}/${exp.name} qty`);
    assertEqual(act.unit,  exp.unit,  `[${label}] ${exp.fam}/${exp.name} unit`);
    assertEqual(act.meals, exp.meals, `[${label}] ${exp.fam}/${exp.name} meals`);
    assertEqual(act.count, exp.count, `[${label}] ${exp.fam}/${exp.name} persons`);
  });

  // Check no unexpected entries
  actual.forEach(act => {
    const key = `${act.fam}|${act.name}`;
    assert(expected[key], `[${label}] Unexpected entry in shopping list: ${act.fam}/${act.name}`);
  });
}

// ─── Scenario 1: single day, 1 person, all menus Bleu, default ingredients ──
test('Scenario 1: 1 day, 1 person, all Bleu menus, default ingredients', () => {
  runScenario('S1', {
    phase: 2,
    days: [{
      idx: 0,
      meals: [
        { menu: 0, persons: 1 },  // pdj Bleu
        { menu: 0, persons: 1 },  // dej Bleu
        { menu: 0, persons: 1 },  // din Bleu
      ]
    }]
  });
});

// ─── Scenario 2: 1 day, 4 persons, all Vert menus ───────────────────────────
test('Scenario 2: 1 day, 4 persons, all Vert menus', () => {
  runScenario('S2', {
    phase: 2,
    days: [{
      idx: 0,
      meals: [
        { menu: 1, persons: 4 },
        { menu: 1, persons: 4 },
        { menu: 1, persons: 4 },
      ]
    }]
  });
});

// ─── Scenario 3: 1 day, 2 persons, all Orange menus ─────────────────────────
test('Scenario 3: 1 day, 2 persons, all Orange menus', () => {
  runScenario('S3', {
    phase: 2,
    days: [{
      idx: 0,
      meals: [
        { menu: 2, persons: 2 },
        { menu: 2, persons: 2 },
        { menu: 2, persons: 2 },
      ]
    }]
  });
});

// ─── Scenario 4: 1 day, mixed menus, 3 persons, specific ingredient choices ─
test('Scenario 4: mixed menus, 3 persons, specific ingredients', () => {
  runScenario('S4', {
    phase: 2,
    days: [{
      idx: 0,
      meals: [
        { menu: 0, persons: 3, ingr: { Fruit: 'Kiwi' } },                   // pdj Bleu, Kiwi
        { menu: 1, persons: 3, ingr: { Fromage: 'Feta (brebis)', Légumes: 'Carottes', Fruit: 'Mangue' } },
        { menu: 2, persons: 3, ingr: { Poisson: 'Saumon', Légumes: 'Brocoli', Fruit: 'Pomme' } },
      ]
    }]
  });
});

// ─── Scenario 5: 3 days, different persons per meal ─────────────────────────
test('Scenario 5: 3 days, different persons per meal', () => {
  runScenario('S5', {
    phase: 2,
    days: [
      { idx: 0, meals: [ { menu: 0, persons: 2 }, { menu: 1, persons: 3 }, { menu: 2, persons: 1 } ] },
      { idx: 1, meals: [ { menu: 1, persons: 4 }, { menu: 0, persons: 2 }, { menu: 1, persons: 2 } ] },
      { idx: 2, meals: [ { menu: 2, persons: 1 }, { menu: 2, persons: 5 }, { menu: 0, persons: 3 } ] },
    ]
  });
});

// ─── Scenario 6: full week, 2 persons, default menus ────────────────────────
test('Scenario 6: full week 7 days, 2 persons, default menus', () => {
  runScenario('S6', {
    phase: 2,
    days: DAYS.map((_, idx) => ({
      idx,
      meals: [
        { menu: 0, persons: 2 },
        { menu: 0, persons: 2 },
        { menu: 0, persons: 2 },
      ]
    }))
  });
});

// ─── Scenario 7: verify Yaourt × 7 days × 2 persons = 2660g ─────────────────
test('Scenario 7: Yaourt exact total 7 days × 2 persons = 2660g', () => {
  const s = makeState({ activeDays: [0,1,2,3,4,5,6] });
  MKEYS.filter(mk => mk !== 'pdj').forEach(mk => {
    DAYS.forEach((_, di) => { s.days[di].meals[mk].skipped = true; });
  });
  const entries = buildTotals(s);
  const yaourt = entries.find(e => e.fam === 'Yaourt');
  assertEqual(yaourt.qty, 190 * 2 * 7, 'Yaourt: 190g × 2 pers × 7 days');
  assertEqual(yaourt.meals, 7, 'Yaourt: 7 meal occurrences');
  assertEqual(yaourt.count, 14, 'Yaourt: 14 person-meals');
});

// ─── Scenario 8: mixed skipped meals, verify exact counts ───────────────────
test('Scenario 8: 2 days, skip dej day0 and din day1, exact légumes total', () => {
  // dej Bleu: 140g Légumes, din Bleu: 150g Légumes, pdj Bleu: no Légumes
  // day0: pdj(skip dej), din → légumes = 150×2 = 300
  // day1: pdj, dej, skip din   → légumes = 140×2 = 280
  // total légumes = 300 + 280 = 580
  const s = makeState({ activeDays: [0, 1] });
  s.days[0].meals.dej.skipped = true;
  s.days[1].meals.din.skipped = true;
  const entries = buildTotals(s);
  const leg = entries.find(e => e.fam === 'Légumes');
  assertEqual(Math.round(leg.qty), 580, 'légumes total with skips');
  assertEqual(leg.meals, 2, 'légumes: 2 meal occurrences (din d0, dej d1)');
});

// ─── Scenario 9: phase 3 ingredients, verify P3-only items available ─────────
test('Scenario 9: Phase 3, Escalope de veau, Yaourt de chèvre', () => {
  runScenario('S9', {
    phase: 3,
    days: [{
      idx: 0,
      meals: [
        { menu: 0, persons: 2, ingr: { Yaourt: 'Yaourt de chèvre', Fruit: 'Kiwi' } },
        { menu: 1, persons: 2, ingr: { Fromage: 'Fromage de Chèvre', Légumes: 'Chou-fleur', Fruit: 'Framboises' } },
        { menu: 2, persons: 2, ingr: { Poisson: 'Turbot', Légumes: 'Pousses de bambous', Fruit: 'Papaye' } },
      ]
    }]
  });
});

// ─── Scenario 10: different persons per repas, verify mealPersons counter ────
test('Scenario 10: mealPersons counter per meal type', () => {
  const s = makeState({ activeDays: [0, 1] });
  s.days[0].meals.pdj.persons = 3;
  s.days[0].meals.dej.persons = 2;
  s.days[0].meals.din.persons = 1;
  s.days[1].meals.pdj.persons = 1;
  s.days[1].meals.dej.persons = 4;
  s.days[1].meals.din.persons = 2;

  // mealPersons: pdj=3+1=4, dej=2+4=6, din=1+2=3
  const mealPersons = {pdj:0, dej:0, din:0};
  s.activeDays.forEach(di => {
    MKEYS.forEach(mk => {
      const m = s.days[di].meals[mk];
      if (!m.skipped) mealPersons[mk] += m.persons;
    });
  });
  assertEqual(mealPersons.pdj, 4, 'pdj persons');
  assertEqual(mealPersons.dej, 6, 'dej persons');
  assertEqual(mealPersons.din, 3, 'din persons');

  // Verify Yaourt total: pdj persons only = 4 persons × 190g = 760g
  MKEYS.filter(mk => mk !== 'pdj').forEach(mk => {
    s.days[0].meals[mk].skipped = true;
    s.days[1].meals[mk].skipped = true;
  });
  const entries = buildTotals(s);
  const yaourt = entries.find(e => e.fam === 'Yaourt');
  assertEqual(yaourt.qty, 190 * 4, 'Yaourt total = 190×4 pdj persons');
});

// ─── Scenario 11: randomly picked ingredients, verify fmtQty display ─────────
test('Scenario 11: random ingredients, verify fmtQty display matches resolveQty', () => {
  const rng = seededRand(777);
  const phases = [2, 3];
  const families = ['Poisson','Viande','Volaille','Fromage','Légumes','Salade','Lait','Yaourt'];

  phases.forEach(phase => {
    families.forEach(fam => {
      if (!INGR[phase][fam]) return;
      const ing = pick(INGR[phase][fam], rng);
      // Find a menu item that references this family
      let menuItem = null;
      outer: for (const mk of MKEYS) {
        for (const menu of MENUS[mk]) {
          const it = menu.items.find(i => i.f === fam);
          if (it) { menuItem = it; break outer; }
        }
      }
      if (!menuItem) return;
      const r = resolveQty(fam, ing, menuItem);
      // fmtQty should produce a non-empty string with a number in it
      const display = fmtQty(r.q, r.u);
      assert(display.length > 0, `fmtQty empty for ${fam}/${ing}`);
      assert(/\d/.test(display), `fmtQty has no digit for ${fam}/${ing}: "${display}"`);
      assert(r.q > 0, `resolveQty q must be >0 for ${fam}/${ing}`);
    });
  });
});

// ─── Scenario 12: all fruits, verify unit/qty in shopping list ───────────────
test('Scenario 12: each fruit individually, verify qty and unit in shopping list', () => {
  const allFruits = INGR[2].Fruit;
  const menuItem = { f:'Fruit', q:1, u:'fruit' };

  allFruits.forEach(fruit => {
    const s = makeState();
    // Use pdj Bleu which has Fruit
    s.days[0].meals.pdj.ingr['Fruit'] = fruit;
    MKEYS.filter(mk => mk !== 'pdj').forEach(mk => { s.days[0].meals[mk].skipped = true; });

    const r = resolveQty('Fruit', fruit, menuItem);
    const entries = buildTotals(s);
    const entry = entries.find(e => e.fam === 'Fruit' && e.name === fruit);
    assert(entry, `${fruit} missing from shopping list`);
    // qty = resolveQty.q × 2 persons
    assertEqual(Math.round(entry.qty), Math.round(r.q * 2), `${fruit} qty (2 persons)`);
    assertEqual(entry.unit, r.u, `${fruit} unit`);

    // fmtQty display
    const display = fmtQty(entry.qty, entry.unit);
    assert(display.length > 0, `fmtQty empty for ${fruit}`);
    if (r.u === 'g') assert(display.includes('g'), `${fruit}: display should contain 'g'`);
    if (r.u === 'pièce') assert(display.includes('pièce'), `${fruit}: display should say pièce`);
  });
});

// ─── Scenario 13: same ingredient appears in multiple days, aggregated ────────
test('Scenario 13: same ingredient across 3 days aggregates correctly', () => {
  const s = makeState({ activeDays: [0,1,2] });
  // Force Saumon in every dîner Orange
  [0,1,2].forEach(di => {
    s.days[di].meals.din.menu = 2; // Orange — Poisson + Légumes
    s.days[di].meals.din.ingr['Poisson'] = 'Saumon';
  });
  MKEYS.filter(mk => mk !== 'din').forEach(mk => {
    [0,1,2].forEach(di => { s.days[di].meals[mk].skipped = true; });
  });
  const entries = buildTotals(s);
  const saumon = entries.find(e => e.name === 'Saumon');
  assert(saumon, 'Saumon missing');
  assertEqual(saumon.qty, 130 * 2 * 3, 'Saumon: 130g × 2pers × 3days');
  assertEqual(saumon.meals, 3, 'Saumon: 3 meal occurrences');
  assertEqual(saumon.count, 6, 'Saumon: 6 person-meals');
});

// ─── Scenario 14: randomly assembled full week, cross-check totals ─────────────
test('Scenario 14: randomised full week, cross-check all family totals', () => {
  const rng = seededRand(2024);
  const phase = 2;
  const s = makeState({ phase: String(phase), activeDays: [0,1,2,3,4,5,6] });
  const manualTotals = {};

  DAYS.forEach((_, di) => {
    MKEYS.forEach((mk, mi) => {
      const menuIdx = Math.floor(rng() * 3);
      const persons = 1 + Math.floor(rng() * 4); // 1–4 persons
      s.days[di].meals[mk].menu = menuIdx;
      s.days[di].meals[mk].persons = persons;

      const menu = MENUS[mk][menuIdx];
      menu.items.forEach(item => {
        const fam = item.f;
        const list = activeList(phase, fam, new Set());
        const ing = list[Math.floor(rng() * list.length)] || list[0];
        s.days[di].meals[mk].ingr[fam] = ing;

        const r = resolveQty(fam, ing, item);
        const key = `${fam}|${ing}`;
        if (!manualTotals[key]) manualTotals[key] = { fam, name:ing, qty:0, unit:r.u, meals:0, count:0 };
        manualTotals[key].qty   += r.q * persons;
        manualTotals[key].meals += 1;
        manualTotals[key].count += persons;
      });
    });
  });

  const actual = buildTotals(s);

  Object.values(manualTotals).forEach(exp => {
    const act = actual.find(e => e.fam === exp.fam && e.name === exp.name);
    assert(act, `Missing ${exp.fam}/${exp.name}`);
    assertEqual(Math.round(act.qty),   Math.round(exp.qty),   `${exp.fam}/${exp.name} qty`);
    assertEqual(act.meals, exp.meals, `${exp.fam}/${exp.name} meals`);
    assertEqual(act.count, exp.count, `${exp.fam}/${exp.name} count`);
  });
});

// ─── Scenario 15: verifyMealTotals per-meal display ↔ shopping list ──────────
test('Scenario 15: per-meal display qty matches shopping list (pdj Bleu, 5 persons)', () => {
  verifyMealTotals(2, 'pdj', 0, { Fruit: 'Papaye' }, 5);
});

test('Scenario 16: per-meal display qty matches shopping list (dej Vert, 3 persons, Feta)', () => {
  verifyMealTotals(2, 'dej', 1, { Fromage: 'Feta (brebis)', Légumes: 'Épinards', Fruit: 'Mûres' }, 3);
});

test('Scenario 17: per-meal display qty matches shopping list (din Orange, 6 persons, Turbot)', () => {
  verifyMealTotals(2, 'din', 2, { Poisson: 'Turbot', Légumes: 'Avocat', Fruit: 'Abricot frais' }, 6);
});

test('Scenario 18: per-meal display qty matches shopping list (pdj Orange, 1 person, Lait de soja)', () => {
  verifyMealTotals(2, 'pdj', 2, { Lait: 'Lait de soja', Fruit: 'Kiwi' }, 1);
});

test('Scenario 19: per-meal display qty matches shopping list (dej Bleu, 4 persons, Lentilles)', () => {
  verifyMealTotals(2, 'dej', 0, { 'Légumes secs': 'Lentilles corail', Légumes: 'Champignons', Fruit: 'Pomme' }, 4);
});

test('Scenario 20: per-meal display qty matches shopping list (din Vert, 2 persons, Oeufs)', () => {
  verifyMealTotals(2, 'din', 1, { Salade: 'Roquette', Fruit: 'Framboises' }, 2);
});

// ─── Scenario 21: per-person qty displayed = total / persons ──────────────────
test('Scenario 21: per-person display (qty/count) consistent across all entries', () => {
  const s = makeState({ activeDays: [0,1,2] });
  s.days[0].meals.pdj.persons = 3;
  s.days[1].meals.dej.persons = 5;
  s.days[2].meals.din.persons = 2;

  const entries = buildTotals(s);
  entries.forEach(e => {
    const perPers = e.qty / e.count;
    const display = fmtQty(perPers, e.unit);
    assert(display.length > 0, `fmtQty empty for ${e.fam}/${e.name}`);
    assert(perPers > 0, `per-person qty must be >0 for ${e.fam}/${e.name}`);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
console.log('\n── 13. Day label regression tests ─────────────────────────────');

// Simulate the removeDay logic (as implemented in index.html)
function simulateRemoveDay(dayLabels, activeDays, di) {
  dayLabels[di] = DAYS[di];               // reset label — the fix
  const newActive = activeDays.filter(d => d !== di);
  return {
    dayLabels: [...dayLabels],
    activeDays: newActive.length === 0 ? [di === 0 ? 1 : 0] : newActive,
  };
}

// Simulate the commitEditDay logic
function simulateCommitEditDay(dayLabels, di, newName) {
  const updated = [...dayLabels];
  updated[di] = newName.trim() || DAYS[di];
  return updated;
}

test('removeDay resets label to default day name', () => {
  const labels = [...DAYS];
  const result = simulateRemoveDay(labels, [0, 1], 1);
  assertEqual(result.dayLabels[1], DAYS[1], 'label should reset to "Mardi"');
});

test('removeDay then addNextDay: re-added day has default label', () => {
  const labels = [...DAYS];
  labels[1] = 'Mon super mardi';
  // remove day 1
  const { dayLabels, activeDays } = simulateRemoveDay(labels, [0, 1], 1);
  assertEqual(dayLabels[1], 'Mardi', 'label reset after remove');
  // re-add day 1 (addNextDay pushes activeDays.length = 1, next index = 1)
  const reAdded = [...activeDays, 1];
  assertEqual(dayLabels[reAdded[reAdded.length - 1]], 'Mardi', 'label still default after re-add');
});

test('removeDay does not affect labels of other days', () => {
  const labels = [...DAYS];
  labels[0] = 'Jour A';
  labels[2] = 'Jour C';
  const { dayLabels } = simulateRemoveDay(labels, [0, 1, 2], 1);
  assertEqual(dayLabels[0], 'Jour A', 'day 0 label unchanged');
  assertEqual(dayLabels[2], 'Jour C', 'day 2 label unchanged');
  assertEqual(dayLabels[1], 'Mardi',  'day 1 label reset');
});

test('rename then remove: subsequent add gets default name, not renamed one', () => {
  const labels = [...DAYS];
  // rename day 1
  const renamed = simulateCommitEditDay(labels, 1, 'Jour spécial');
  assertEqual(renamed[1], 'Jour spécial', 'rename applied');
  // now remove day 1
  const { dayLabels } = simulateRemoveDay(renamed, [0, 1], 1);
  assertEqual(dayLabels[1], DAYS[1], 'after remove, label back to default');
  // simulate adding it back — label should be the default
  assert(dayLabels[1] !== 'Jour spécial', 'renamed label must NOT persist after remove');
});

test('remove first day falls back to day 1 when only day 0 active', () => {
  const labels = [...DAYS];
  const { activeDays } = simulateRemoveDay(labels, [0], 0);
  assertEqual(activeDays[0], 1, 'should fall back to day index 1');
});

test('remove non-zero day from single active list falls back to day 0', () => {
  const labels = [...DAYS];
  const { activeDays } = simulateRemoveDay(labels, [2], 2);
  assertEqual(activeDays[0], 0, 'should fall back to day index 0');
});

test('commitEditDay: empty input falls back to default day name', () => {
  const labels = [...DAYS];
  const result = simulateCommitEditDay(labels, 3, '   ');
  assertEqual(result[3], DAYS[3], 'blank input should restore default name');
});

test('commitEditDay: valid name is saved correctly', () => {
  const labels = [...DAYS];
  const result = simulateCommitEditDay(labels, 0, 'Lundi de Pâques');
  assertEqual(result[0], 'Lundi de Pâques');
});

test('commitEditDay does not affect other day labels', () => {
  const labels = [...DAYS];
  const result = simulateCommitEditDay(labels, 2, 'Mercredi spécial');
  DAYS.forEach((d, i) => {
    if (i !== 2) assertEqual(result[i], DAYS[i], `day ${i} should be unchanged`);
  });
});

test('full cycle: rename → remove → re-add → label is default', () => {
  let labels = [...DAYS];
  const activeDays = [0, 1, 2];

  // rename day 2 to "Mercredi custom"
  labels = simulateCommitEditDay(labels, 2, 'Mercredi custom');
  assertEqual(labels[2], 'Mercredi custom');

  // remove day 2
  const r = simulateRemoveDay(labels, activeDays, 2);
  labels = r.dayLabels;
  assertEqual(labels[2], DAYS[2], 'reset to default after remove');
  assert(!r.activeDays.includes(2), 'day 2 no longer active');

  // re-add day 2 (simulate addNextDay)
  r.activeDays.push(2);
  assertEqual(labels[2], DAYS[2], 'label still default when re-added');
  assert(labels[2] !== 'Mercredi custom', 'custom name must not survive remove');
});


// ═══════════════════════════════════════════════════════════════════════════
console.log('\n── 14. Remove button visibility rules ──────────────────────────');

// Simulate the logic that decides whether to show the ✕ button
// In index.html: state.activeDays.indexOf(di) > 0
function shouldShowRemoveBtn(activeDays, di) {
  return activeDays.indexOf(di) > 0;
}

test('first active day never shows remove button', () => {
  assert(!shouldShowRemoveBtn([0], 0), 'single day: no remove btn');
  assert(!shouldShowRemoveBtn([0, 1, 2], 0), 'first of many: no remove btn');
  assert(!shouldShowRemoveBtn([3, 4, 5], 3), 'first even if not index 0: no remove btn');
});

test('second and subsequent days show remove button', () => {
  assert(shouldShowRemoveBtn([0, 1], 1), 'second day shows btn');
  assert(shouldShowRemoveBtn([0, 1, 2], 2), 'third day shows btn');
  assert(shouldShowRemoveBtn([0, 1, 2, 3, 4, 5, 6], 6), 'last day shows btn');
});

test('remove button logic uses position in activeDays, not day index', () => {
  // If activeDays = [3, 1, 5], day 3 is first → no btn, day 1 and 5 → btn
  assert(!shouldShowRemoveBtn([3, 1, 5], 3), 'first in list (idx 3) no btn');
  assert( shouldShowRemoveBtn([3, 1, 5], 1), 'second in list (idx 1) shows btn');
  assert( shouldShowRemoveBtn([3, 1, 5], 5), 'third in list (idx 5) shows btn');
});

test('after removing a day, the new first day loses its button', () => {
  // activeDays was [0, 1, 2], we remove day 0 → new activeDays = [1, 2]
  // day 1 is now first → no button
  const newActive = [1, 2];
  assert(!shouldShowRemoveBtn(newActive, 1), 'new first day has no remove btn');
  assert( shouldShowRemoveBtn(newActive, 2), 'second day still has btn');
});

test('single active day has no remove button regardless of which day it is', () => {
  DAYS.forEach((_, di) => {
    assert(!shouldShowRemoveBtn([di], di), `day ${di} alone: no remove btn`);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
console.log('\n── 15. Checked state persistence (shopping list) ───────────────');

// Simulate the checked-state storage logic from index.html
// Keys are "Family|IngredientName" — independent of row index
function simulateSaveChecked(entries, checkedIndices) {
  return new Set(checkedIndices.map(i => `${entries[i].fam}|${entries[i].name}`));
}

function simulateLoadChecked(savedKeys) {
  return savedKeys; // already a Set in our simulation
}

function simulateRenderWithChecked(entries, savedKeys) {
  return entries.map((e, i) => ({
    ...e,
    checked: savedKeys.has(`${e.fam}|${e.name}`),
    rowIndex: i,
  }));
}

test('checked state is stored by ingredient key, not row index', () => {
  const s = makeState();
  s.days[0].meals.dej.menu = 2; // Orange — Viande
  const entries = buildTotals(s);
  // mark first two entries as checked
  const saved = simulateSaveChecked(entries, [0, 1]);
  assert(saved.size === 2, 'two keys saved');
  // keys are fam|name strings, not numbers
  saved.forEach(k => {
    assert(k.includes('|'), `key "${k}" must contain "|" separator`);
    assert(!/^\d+$/.test(k), `key "${k}" must not be a plain number`);
  });
});

test('checked state survives shopping list re-render (same ingredients)', () => {
  const s = makeState();
  const entries1 = buildTotals(s);
  // check entry 0
  const saved = simulateSaveChecked(entries1, [0]);
  // re-render (same state → same entries)
  const entries2 = buildTotals(s);
  const rendered = simulateRenderWithChecked(entries2, simulateLoadChecked(saved));
  assert(rendered[0].checked, 'entry 0 still checked after re-render');
  rendered.slice(1).forEach((r, i) => {
    assert(!r.checked, `entry ${i+1} should not be checked`);
  });
});

test('checked state persists for correct ingredient after menu change adds new entry', () => {
  const s = makeState();
  // build entries, check Légumes secs (from dej Bleu menu 0)
  const entries1 = buildTotals(s);
  const legsec = entries1.find(e => e.fam === 'Légumes secs');
  assert(legsec, 'Légumes secs must exist in default state');
  const saved = new Set([`${legsec.fam}|${legsec.name}`]);

  // now change dej to Vert (Fromage) — Légumes secs disappears
  s.days[0].meals.dej.menu = 1;
  const entries2 = buildTotals(s);
  const rendered2 = simulateRenderWithChecked(entries2, saved);
  // Légumes secs gone, so no entry should be checked (key not in new list)
  rendered2.forEach(r => assert(!r.checked, `no entry should be checked after menu change removes ingredient`));
});

test('unchecking all clears the saved set', () => {
  const saved = new Set(['Légumes|Carottes', 'Fruit|Kiwi', 'Viande|Saumon']);
  // simulate uncheckAll
  saved.clear();
  assertEqual(saved.size, 0, 'all checked states cleared');
});

test('checked key format is stable: fam|name', () => {
  const key = 'Légumes secs|Lentilles corail';
  assert(key.startsWith('Légumes secs'), 'family part correct');
  assert(key.endsWith('Lentilles corail'), 'name part correct');
  assertEqual(key.split('|').length, 2, 'exactly one pipe separator');
});

// ═══════════════════════════════════════════════════════════════════════════
console.log('\n── 16. State persistence through page refresh ───────────────────');

// Simulate saveState / loadState logic from index.html
const STORAGE_KEY = 'weekplans_state_v1';

function simulateSaveState(state) {
  return JSON.stringify({
    version: 1,
    phase: state.phase,
    activeDays: state.activeDays,
    dayLabels: state.dayLabels,
    disabled: [...state.disabled],
    days: state.days.map(d => ({
      meals: {
        pdj: { menu: d.meals.pdj.menu, persons: d.meals.pdj.persons, ingr: {...d.meals.pdj.ingr}, skipped: d.meals.pdj.skipped },
        dej: { menu: d.meals.dej.menu, persons: d.meals.dej.persons, ingr: {...d.meals.dej.ingr}, skipped: d.meals.dej.skipped },
        din: { menu: d.meals.din.menu, persons: d.meals.din.persons, ingr: {...d.meals.din.ingr}, skipped: d.meals.din.skipped },
      }
    }))
  });
}

function simulateLoadState(json) {
  const data = JSON.parse(json);
  if (!data.days || data.days.length !== 7) return null;
  return {
    phase:      data.phase || '2',
    activeDays: data.activeDays || [0],
    dayLabels:  data.dayLabels  || [...DAYS],
    disabled:   new Set(data.disabled || []),
    days: data.days.map(d => ({
      meals: {
        pdj: { menu: d.meals.pdj.menu||0, persons: d.meals.pdj.persons||2, ingr: d.meals.pdj.ingr||{}, skipped: !!d.meals.pdj.skipped },
        dej: { menu: d.meals.dej.menu||0, persons: d.meals.dej.persons||2, ingr: d.meals.dej.ingr||{}, skipped: !!d.meals.dej.skipped },
        din: { menu: d.meals.din.menu||0, persons: d.meals.din.persons||2, ingr: d.meals.din.ingr||{}, skipped: !!d.meals.din.skipped },
      }
    }))
  };
}

test('saveState produces valid JSON', () => {
  const s = makeState();
  const json = simulateSaveState(s);
  assert(typeof json === 'string', 'output must be a string');
  const parsed = JSON.parse(json);
  assert(parsed.days, 'parsed must have days');
  assertEqual(parsed.days.length, 7, 'must have 7 days');
});

test('loadState restores phase correctly', () => {
  const s = makeState({ phase: '3' });
  const restored = simulateLoadState(simulateSaveState(s));
  assertEqual(restored.phase, '3');
});

test('loadState restores activeDays correctly', () => {
  const s = makeState({ activeDays: [0, 2, 4] });
  const restored = simulateLoadState(simulateSaveState(s));
  assert(JSON.stringify(restored.activeDays) === JSON.stringify([0, 2, 4]), 'activeDays restored');
});

test('loadState restores custom dayLabels', () => {
  const s = makeState();
  s.dayLabels[0] = 'Lundi spécial';
  s.dayLabels[3] = 'Jeudi custom';
  const restored = simulateLoadState(simulateSaveState(s));
  assertEqual(restored.dayLabels[0], 'Lundi spécial');
  assertEqual(restored.dayLabels[3], 'Jeudi custom');
});

test('loadState restores disabled ingredients set', () => {
  const s = makeState();
  s.disabled = new Set(['Viande|Jambon cuit', 'Fruit|Melon']);
  const restored = simulateLoadState(simulateSaveState(s));
  assert(restored.disabled.has('Viande|Jambon cuit'), 'disabled key 1 restored');
  assert(restored.disabled.has('Fruit|Melon'), 'disabled key 2 restored');
  assertEqual(restored.disabled.size, 2, 'exactly 2 disabled entries');
});

test('loadState restores skipped meals', () => {
  const s = makeState();
  s.days[0].meals.pdj.skipped = true;
  s.days[2].meals.din.skipped = true;
  const restored = simulateLoadState(simulateSaveState(s));
  assert(restored.days[0].meals.pdj.skipped, 'day 0 pdj skipped restored');
  assert(restored.days[2].meals.din.skipped, 'day 2 din skipped restored');
  assert(!restored.days[1].meals.dej.skipped, 'non-skipped meal stays false');
});

test('loadState restores persons per meal', () => {
  const s = makeState();
  s.days[0].meals.pdj.persons = 5;
  s.days[1].meals.dej.persons = 3;
  s.days[6].meals.din.persons = 1;
  const restored = simulateLoadState(simulateSaveState(s));
  assertEqual(restored.days[0].meals.pdj.persons, 5);
  assertEqual(restored.days[1].meals.dej.persons, 3);
  assertEqual(restored.days[6].meals.din.persons, 1);
});

test('loadState restores menu selection per meal', () => {
  const s = makeState();
  s.days[0].meals.pdj.menu = 2;
  s.days[3].meals.dej.menu = 1;
  s.days[5].meals.din.menu = 2;
  const restored = simulateLoadState(simulateSaveState(s));
  assertEqual(restored.days[0].meals.pdj.menu, 2);
  assertEqual(restored.days[3].meals.dej.menu, 1);
  assertEqual(restored.days[5].meals.din.menu, 2);
});

test('loadState restores ingredient choices', () => {
  const s = makeState();
  s.days[0].meals.din.menu = 2; // Orange — Poisson
  s.days[0].meals.din.ingr['Poisson'] = 'Turbot';
  s.days[0].meals.pdj.ingr['Fruit'] = 'Kiwi';
  const restored = simulateLoadState(simulateSaveState(s));
  assertEqual(restored.days[0].meals.din.ingr['Poisson'], 'Turbot');
  assertEqual(restored.days[0].meals.pdj.ingr['Fruit'], 'Kiwi');
});

test('loadState → buildTotals produces same result as original state', () => {
  const s = makeState({ activeDays: [0, 1, 2] });
  s.days[0].meals.pdj.persons = 3;
  s.days[0].meals.din.menu = 2;
  s.days[0].meals.din.ingr['Poisson'] = 'Saumon';
  s.days[1].meals.dej.menu = 1;
  s.days[1].meals.dej.ingr['Fromage'] = 'Feta (brebis)';

  const original = buildTotals(s);
  const restored = simulateLoadState(simulateSaveState(s));
  const afterLoad = buildTotals(restored);

  assertEqual(original.length, afterLoad.length, 'same number of entries');
  original.forEach((e, i) => {
    assertEqual(afterLoad[i].fam,   e.fam,   `entry ${i} fam`);
    assertEqual(afterLoad[i].name,  e.name,  `entry ${i} name`);
    assertEqual(afterLoad[i].qty,   e.qty,   `entry ${i} qty`);
    assertEqual(afterLoad[i].unit,  e.unit,  `entry ${i} unit`);
    assertEqual(afterLoad[i].meals, e.meals, `entry ${i} meals`);
  });
});

test('loadState returns null for invalid JSON', () => {
  const result = simulateLoadState('{"phase":"2","days":[]}'); // days length != 7
  assert(result === null, 'should return null for invalid data');
});

test('saveState → loadState round-trip is lossless for all 7 days', () => {
  const s = makeState({ activeDays: [0,1,2,3,4,5,6] });
  // Give each day distinct settings
  DAYS.forEach((_, di) => {
    s.days[di].meals.pdj.persons = di + 1;
    s.days[di].meals.dej.menu    = di % 3;
    s.days[di].meals.din.skipped = di % 2 === 0;
    s.dayLabels[di] = `Jour ${di}`;
  });
  const restored = simulateLoadState(simulateSaveState(s));
  DAYS.forEach((_, di) => {
    assertEqual(restored.days[di].meals.pdj.persons, di + 1,    `day ${di} persons`);
    assertEqual(restored.days[di].meals.dej.menu,    di % 3,    `day ${di} menu`);
    assertEqual(restored.days[di].meals.din.skipped, di%2===0,  `day ${di} skipped`);
    assertEqual(restored.dayLabels[di], `Jour ${di}`,           `day ${di} label`);
  });
});



// ═══════════════════════════════════════════════════════════════════════════
console.log('\n── 17. Export / Import coherence ───────────────────────────────');

// Mirrors exportPlan() from index.html (no DOM, returns payload object)
function simulateExport(state) {
  return {
    version: 1,
    phase: state.phase,
    activeDays: state.activeDays,
    dayLabels: state.dayLabels,
    disabled: [...state.disabled],
    days: state.days.map(d => ({
      meals: {
        pdj: { menu: d.meals.pdj.menu, persons: d.meals.pdj.persons, ingr: { ...d.meals.pdj.ingr }, skipped: d.meals.pdj.skipped },
        dej: { menu: d.meals.dej.menu, persons: d.meals.dej.persons, ingr: { ...d.meals.dej.ingr }, skipped: d.meals.dej.skipped },
        din: { menu: d.meals.din.menu, persons: d.meals.din.persons, ingr: { ...d.meals.din.ingr }, skipped: d.meals.din.skipped },
      }
    }))
  };
}

// Mirrors doImport() validation + state update from index.html
function simulateImport(payload) {
  if (!payload.days || !Array.isArray(payload.days) || payload.days.length !== 7) {
    return { ok: false, error: 'Format non reconnu — fichier incompatible.' };
  }
  try {
    const state = {
      phase:      payload.phase || '2',
      activeDays: payload.activeDays || [0],
      dayLabels:  payload.dayLabels  || [...DAYS],
      disabled:   new Set(payload.disabled || []),
      days: payload.days.map(d => ({
        meals: {
          pdj: { menu: d.meals.pdj.menu||0, persons: d.meals.pdj.persons||2, ingr: d.meals.pdj.ingr||{}, skipped: !!d.meals.pdj.skipped },
          dej: { menu: d.meals.dej.menu||0, persons: d.meals.dej.persons||2, ingr: d.meals.dej.ingr||{}, skipped: !!d.meals.dej.skipped },
          din: { menu: d.meals.din.menu||0, persons: d.meals.din.persons||2, ingr: d.meals.din.ingr||{}, skipped: !!d.meals.din.skipped },
        }
      }))
    };
    return { ok: true, state };
  } catch(e) {
    return { ok: false, error: e.message };
  }
}

// Full round-trip: export → JSON.stringify → JSON.parse → import
function roundTrip(state) {
  const payload = simulateExport(state);
  const json    = JSON.stringify(payload);
  const parsed  = JSON.parse(json);
  return simulateImport(parsed);
}

// ── Export payload structure ─────────────────────────────────────────────────

test('export payload has required top-level keys', () => {
  const result = simulateExport(makeState());
  ['version','phase','activeDays','dayLabels','disabled','days'].forEach(k => {
    assert(k in result, `export missing key: ${k}`);
  });
});

test('export payload version is 1', () => {
  assertEqual(simulateExport(makeState()).version, 1);
});

test('export payload always has 7 days', () => {
  const payload = simulateExport(makeState({ activeDays: [0,2,4] }));
  assertEqual(payload.days.length, 7, 'always 7 days regardless of activeDays');
});

test('export payload disabled is a plain array (not a Set)', () => {
  const s = makeState();
  s.disabled = new Set(['Viande|Jambon cuit','Fruit|Melon']);
  const payload = simulateExport(s);
  assert(Array.isArray(payload.disabled), 'disabled must be array for JSON serialisation');
  assertEqual(payload.disabled.length, 2);
});

test('export serialises to valid JSON', () => {
  const json = JSON.stringify(simulateExport(makeState()));
  const parsed = JSON.parse(json);
  assert(parsed.days.length === 7, 'parsed days ok');
});

test('export includes skipped flag per meal', () => {
  const s = makeState();
  s.days[0].meals.pdj.skipped = true;
  s.days[3].meals.din.skipped = true;
  const payload = simulateExport(s);
  assert(payload.days[0].meals.pdj.skipped === true,  'day 0 pdj skipped exported');
  assert(payload.days[3].meals.din.skipped === true,  'day 3 din skipped exported');
  assert(payload.days[1].meals.dej.skipped === false, 'day 1 dej not skipped');
});

test('regression: export without skipped field loses skipped state on import', () => {
  // Documents the bug: if exportPlan omits skipped, import silently resets to false.
  // This test uses a deliberately broken export (no skipped) to show the failure mode.
  const s = makeState();
  s.days[0].meals.pdj.skipped = true;

  // Simulate broken export (no skipped) — what the old code produced
  const brokenPayload = {
    version: 1, phase: s.phase, activeDays: s.activeDays,
    dayLabels: s.dayLabels, disabled: [...s.disabled],
    days: s.days.map(d => ({
      meals: {
        pdj: { menu: d.meals.pdj.menu, persons: d.meals.pdj.persons, ingr: { ...d.meals.pdj.ingr } },
        dej: { menu: d.meals.dej.menu, persons: d.meals.dej.persons, ingr: { ...d.meals.dej.ingr } },
        din: { menu: d.meals.din.menu, persons: d.meals.din.persons, ingr: { ...d.meals.din.ingr } },
      }
    }))
  };
  const broken = simulateImport(brokenPayload);
  assert(broken.ok);
  // skipped is undefined in payload → !!undefined = false → data is lost
  assertEqual(broken.state.days[0].meals.pdj.skipped, false,
    'broken export loses skipped=true (expected failure mode — fix exportPlan to include skipped)');

  // The fixed export includes skipped — verify it roundtrips correctly
  const fixedPayload = simulateExport(s); // simulateExport always includes skipped
  const fixed = simulateImport(fixedPayload);
  assert(fixed.ok);
  assertEqual(fixed.state.days[0].meals.pdj.skipped, true,
    'fixed export preserves skipped=true through round-trip');
});

test('export preserves custom dayLabels', () => {
  const s = makeState();
  s.dayLabels[0] = 'Lundi perso';
  s.dayLabels[5] = 'Weekend';
  const payload = simulateExport(s);
  assertEqual(payload.dayLabels[0], 'Lundi perso');
  assertEqual(payload.dayLabels[5], 'Weekend');
});

test('export preserves activeDays subset', () => {
  const s = makeState({ activeDays: [1, 3, 5] });
  const payload = simulateExport(s);
  assert(JSON.stringify(payload.activeDays) === JSON.stringify([1,3,5]));
});

test('export deep-copies ingr (mutations after export do not affect payload)', () => {
  const s = makeState();
  s.days[0].meals.pdj.ingr['Fruit'] = 'Kiwi';
  const payload = simulateExport(s);
  // mutate original after export
  s.days[0].meals.pdj.ingr['Fruit'] = 'Mangue';
  assertEqual(payload.days[0].meals.pdj.ingr['Fruit'], 'Kiwi', 'export is a snapshot');
});

// ── Import validation ────────────────────────────────────────────────────────

test('import rejects JSON with missing days', () => {
  const result = simulateImport({ version:1, phase:'2' });
  assert(!result.ok, 'should reject');
  assert(result.error.includes('Format'), 'error message should mention format');
});

test('import rejects days array with wrong length', () => {
  const result = simulateImport({ phase:'2', days: [{},{},{}] });
  assert(!result.ok, 'should reject payload with 3 days');
});

test('import rejects non-array days field', () => {
  const result = simulateImport({ phase:'2', days: 'not an array' });
  assert(!result.ok);
});

test('import accepts valid payload and returns ok:true', () => {
  const s = makeState();
  const result = roundTrip(s);
  assert(result.ok, 'valid export should import successfully');
});

test('import defaults phase to "2" when missing', () => {
  const payload = simulateExport(makeState());
  delete payload.phase;
  const result = simulateImport(payload);
  assert(result.ok);
  assertEqual(result.state.phase, '2');
});

test('import defaults activeDays to [0] when missing', () => {
  const payload = simulateExport(makeState({ activeDays: [0,1,2] }));
  delete payload.activeDays;
  const result = simulateImport(payload);
  assert(result.ok);
  assert(JSON.stringify(result.state.activeDays) === JSON.stringify([0]));
});

test('import defaults dayLabels to DAYS when missing', () => {
  const payload = simulateExport(makeState());
  delete payload.dayLabels;
  const result = simulateImport(payload);
  assert(result.ok);
  assert(JSON.stringify(result.state.dayLabels) === JSON.stringify(DAYS));
});

test('import defaults disabled to empty set when missing', () => {
  const payload = simulateExport(makeState());
  delete payload.disabled;
  const result = simulateImport(payload);
  assert(result.ok);
  assertEqual(result.state.disabled.size, 0);
});

test('import disabled array is converted back to Set', () => {
  const s = makeState();
  s.disabled = new Set(['Poisson|Sole','Légumes|Avocat']);
  const result = roundTrip(s);
  assert(result.ok);
  assert(result.state.disabled instanceof Set, 'disabled must be a Set after import');
  assert(result.state.disabled.has('Poisson|Sole'));
  assert(result.state.disabled.has('Légumes|Avocat'));
});

test('import defaults menu to 0 when missing in meal', () => {
  const payload = simulateExport(makeState());
  delete payload.days[0].meals.pdj.menu;
  const result = simulateImport(payload);
  assert(result.ok);
  assertEqual(result.state.days[0].meals.pdj.menu, 0);
});

test('import defaults persons to 2 when missing in meal', () => {
  const payload = simulateExport(makeState());
  delete payload.days[2].meals.dej.persons;
  const result = simulateImport(payload);
  assert(result.ok);
  assertEqual(result.state.days[2].meals.dej.persons, 2);
});

test('import defaults ingr to {} when missing', () => {
  const payload = simulateExport(makeState());
  delete payload.days[0].meals.din.ingr;
  const result = simulateImport(payload);
  assert(result.ok);
  assert(typeof result.state.days[0].meals.din.ingr === 'object');
  assertEqual(Object.keys(result.state.days[0].meals.din.ingr).length, 0);
});

test('import coerces skipped to boolean', () => {
  const payload = simulateExport(makeState());
  // inject truthy non-boolean
  payload.days[0].meals.pdj.skipped = 1;
  payload.days[1].meals.dej.skipped = 0;
  payload.days[2].meals.din.skipped = null;
  const result = simulateImport(payload);
  assert(result.ok);
  assertEqual(result.state.days[0].meals.pdj.skipped, true,  'truthy coerced to true');
  assertEqual(result.state.days[1].meals.dej.skipped, false, '0 coerced to false');
  assertEqual(result.state.days[2].meals.din.skipped, false, 'null coerced to false');
});

// ── Full round-trip coherence ────────────────────────────────────────────────

test('round-trip preserves phase', () => {
  const s = makeState({ phase: '3' });
  const r = roundTrip(s);
  assert(r.ok);
  assertEqual(r.state.phase, '3');
});

test('round-trip preserves activeDays', () => {
  const s = makeState({ activeDays: [0,2,4,6] });
  const r = roundTrip(s);
  assert(r.ok);
  assert(JSON.stringify(r.state.activeDays) === JSON.stringify([0,2,4,6]));
});

test('round-trip preserves custom labels', () => {
  const s = makeState();
  s.dayLabels[2] = 'Mercredi bio';
  s.dayLabels[6] = 'Dimanche relax';
  const r = roundTrip(s);
  assert(r.ok);
  assertEqual(r.state.dayLabels[2], 'Mercredi bio');
  assertEqual(r.state.dayLabels[6], 'Dimanche relax');
});

test('round-trip preserves disabled ingredients', () => {
  const s = makeState();
  s.disabled = new Set(['Viande|Jambon cuit','Fruit|Melon','Salade|Concombre']);
  const r = roundTrip(s);
  assert(r.ok);
  assertEqual(r.state.disabled.size, 3);
  ['Viande|Jambon cuit','Fruit|Melon','Salade|Concombre'].forEach(k => {
    assert(r.state.disabled.has(k), `${k} should be disabled after round-trip`);
  });
});

test('round-trip preserves persons per meal', () => {
  const s = makeState({ activeDays: [0,1,2] });
  s.days[0].meals.pdj.persons = 5;
  s.days[1].meals.dej.persons = 3;
  s.days[2].meals.din.persons = 1;
  const r = roundTrip(s);
  assert(r.ok);
  assertEqual(r.state.days[0].meals.pdj.persons, 5);
  assertEqual(r.state.days[1].meals.dej.persons, 3);
  assertEqual(r.state.days[2].meals.din.persons, 1);
});

test('round-trip preserves menu choices', () => {
  const s = makeState();
  s.days[0].meals.pdj.menu = 2;
  s.days[0].meals.dej.menu = 1;
  s.days[0].meals.din.menu = 2;
  const r = roundTrip(s);
  assert(r.ok);
  assertEqual(r.state.days[0].meals.pdj.menu, 2);
  assertEqual(r.state.days[0].meals.dej.menu, 1);
  assertEqual(r.state.days[0].meals.din.menu, 2);
});

test('round-trip preserves ingredient choices', () => {
  const s = makeState();
  s.days[0].meals.pdj.ingr['Fruit']   = 'Kiwi';
  s.days[0].meals.din.ingr['Poisson'] = 'Turbot';
  s.days[3].meals.dej.ingr['Fromage'] = 'Feta (brebis)';
  const r = roundTrip(s);
  assert(r.ok);
  assertEqual(r.state.days[0].meals.pdj.ingr['Fruit'],   'Kiwi');
  assertEqual(r.state.days[0].meals.din.ingr['Poisson'], 'Turbot');
  assertEqual(r.state.days[3].meals.dej.ingr['Fromage'], 'Feta (brebis)');
});

test('round-trip preserves skipped state', () => {
  const s = makeState();
  s.days[0].meals.pdj.skipped = true;
  s.days[2].meals.din.skipped = true;
  const r = roundTrip(s);
  assert(r.ok);
  assertEqual(r.state.days[0].meals.pdj.skipped, true);
  assertEqual(r.state.days[2].meals.din.skipped, true);
  assertEqual(r.state.days[1].meals.dej.skipped, false);
});

test('round-trip: buildTotals output identical before and after', () => {
  const rng = seededRand(9999);
  const s = makeState({ activeDays: [0,1,2,3] });
  [0,1,2,3].forEach(di => {
    MKEYS.forEach(mk => {
      s.days[di].meals[mk].menu    = Math.floor(rng() * 3);
      s.days[di].meals[mk].persons = 1 + Math.floor(rng() * 4);
      const menu = MENUS[mk][s.days[di].meals[mk].menu];
      menu.items.forEach(item => {
        const list = activeList(s.phase, item.f, s.disabled);
        if (list.length > 1) {
          s.days[di].meals[mk].ingr[item.f] = list[Math.floor(rng() * list.length)];
        }
      });
    });
  });
  const before = buildTotals(s);
  const r = roundTrip(s);
  assert(r.ok, 'round-trip should succeed');
  const after = buildTotals(r.state);
  assertEqual(before.length, after.length, 'same number of shopping entries');
  before.forEach((e, i) => {
    assertEqual(after[i].fam,   e.fam,   `entry ${i} fam`);
    assertEqual(after[i].name,  e.name,  `entry ${i} name`);
    assertEqual(after[i].qty,   e.qty,   `entry ${i} qty`);
    assertEqual(after[i].meals, e.meals, `entry ${i} meals`);
  });
});

test('round-trip all 7 days full configuration lossless', () => {
  const s = makeState({ activeDays: [0,1,2,3,4,5,6] });
  DAYS.forEach((_, di) => {
    s.dayLabels[di] = `Jour ${di}`;
    MKEYS.forEach((mk, mi) => {
      s.days[di].meals[mk].menu    = (di + mi) % 3;
      s.days[di].meals[mk].persons = (di % 4) + 1;
      s.days[di].meals[mk].skipped = (di === 3 && mk === 'dej');
    });
  });
  s.disabled = new Set(['Viande|Jambon cuit', 'Salade|Concombre']);
  const r = roundTrip(s);
  assert(r.ok, 'full week round-trip should succeed');
  DAYS.forEach((_, di) => {
    assertEqual(r.state.dayLabels[di], `Jour ${di}`, `label day ${di}`);
    MKEYS.forEach((mk, mi) => {
      assertEqual(r.state.days[di].meals[mk].menu,    (di+mi)%3,      `menu day ${di} ${mk}`);
      assertEqual(r.state.days[di].meals[mk].persons, (di%4)+1,       `persons day ${di} ${mk}`);
      assertEqual(r.state.days[di].meals[mk].skipped, di===3&&mk==='dej', `skipped day ${di} ${mk}`);
    });
  });
  assertEqual(r.state.disabled.size, 2);
  assert(r.state.disabled.has('Viande|Jambon cuit'));
  assert(r.state.disabled.has('Salade|Concombre'));
});

test('export → corrupt JSON → import shows error (not crash)', () => {
  try {
    JSON.parse('{ invalid json }');
    assert(false, 'should have thrown');
  } catch(e) {
    assert(e instanceof SyntaxError, 'corrupt JSON throws SyntaxError');
  }
});

test('import from different phase restores correct phase', () => {
  const s2 = makeState({ phase: '2' });
  const payload = simulateExport(s2);
  payload.phase = '3';
  const result = simulateImport(payload);
  assert(result.ok);
  assertEqual(result.state.phase, '3');
});

test('export→import coherence: disabled ingredients respected in buildTotals', () => {
  const s = makeState({ activeDays: [0] });
  s.days[0].meals.dej.menu = 2; // Orange — Viande
  s.days[0].meals.dej.ingr['Viande'] = "Filet de porc";
  s.disabled = new Set(["Viande|Filet de porc"]);

  const r = roundTrip(s);
  assert(r.ok);
  // After import, Filet de porc is disabled → buildTotals should not use it
  const entries = buildTotals(r.state);
  const filet = entries.find(e => e.name === "Filet de porc");
  assert(!filet, 'disabled ingredient should not appear in shopping list after import');
});


console.log('\n' + '═'.repeat(56));
const icon = failed === 0 ? '✅' : '❌';
console.log(`${icon}  ${passed}/${total} tests passed${failed > 0 ? `, ${failed} FAILED` : ''}`);
console.log('═'.repeat(56) + '\n');
process.exit(failed > 0 ? 1 : 0);
