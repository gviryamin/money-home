'use strict';
/* הכסף של הבית: אפליקציית משמעת כסף לגביר ואסתי. כל הנתונים נשמרים ב-localStorage במכשיר בלבד. */
const KEY = 'money-home-v1';
const USERS = { gavir: { name: 'גביר', emoji: '🦁', color: 'c-violet' }, esti: { name: 'אסתי', emoji: '🌸', color: 'c-pink' } };
const DEFAULT_CATS = [
  { id: 'bills', name: 'חשבונות בית', icon: '💡', kind: 'need' },
  { id: 'food', name: 'מזון וסופר', icon: '🛒', kind: 'need' },
  { id: 'rest', name: 'אוכל ומסעדות', icon: '🍕', kind: 'want' },
  { id: 'subs', name: 'מנויים ובידור', icon: '🎬', kind: 'want' },
  { id: 'shop', name: 'קניות', icon: '🛍️', kind: 'want' },
  { id: 'trans', name: 'תחבורה וחניה', icon: '🚗', kind: 'need' },
  { id: 'kids', name: 'ילדים', icon: '🧸', kind: 'need' },
  { id: 'health', name: 'בריאות', icon: '💊', kind: 'need' },
  { id: 'misc', name: 'שונות', icon: '✨', kind: 'want' },
];
const SHARE = { bills: .22, food: .25, rest: .08, subs: .04, shop: .08, trans: .1, kids: .12, health: .05, misc: .06 };

const BADGES = [
  { id: 'onboard', icon: '🚀', name: 'יצאנו לדרך', desc: 'הגדרתם משכורות ותקציב', xp: 30 },
  { id: 'first', icon: '🥇', name: 'הוצאה ראשונה', desc: 'רשמתם את ההוצאה הראשונה', xp: 50 },
  { id: 'ten', icon: '🔟', name: 'עשר הוצאות', desc: 'רשמתם 10 הוצאות', xp: 50 },
  { id: 'streak3', icon: '🔥', name: 'רצף של 3 ימים', desc: 'שלושה ימים ברצף עם רישום', xp: 40 },
  { id: 'streak7', icon: '🌋', name: 'רצף של שבוע', desc: 'שבעה ימים ברצף עם רישום', xp: 100 },
  { id: 'weekUnder', icon: '🛡️', name: 'שבוע בתוך התקציב', desc: 'שבוע מלא בלי לחרוג מהתקציב', xp: 100 },
  { id: 'both', icon: '💞', name: 'צוות מנצח', desc: 'שניכם רשמתם הוצאה השבוע', xp: 60 },
  { id: 'monthSave', icon: '🐷', name: 'חודש עם חיסכון', desc: 'חודש שבו נשאר כסף בצד', xp: 150 },
  { id: 'ef10', icon: '🌱', name: 'קרן חירום 10%', desc: 'צברתם 10% מקרן החירום', xp: 60 },
  { id: 'ef50', icon: '🌳', name: 'קרן חירום 50%', desc: 'חצי מקרן החירום כבר שם', xp: 150 },
  { id: 'ef100', icon: '🏰', name: 'קרן חירום מלאה', desc: 'קרן החירום מלאה!', xp: 300 },
  { id: 'subsReview', icon: '🔍', name: 'בדקנו מנויים', desc: 'עברתם על רשימת המנויים', xp: 40 },
  { id: 'planOk', icon: '🤝', name: 'תוכנית משותפת', desc: 'אישרתם יחד תוכנית לחודש', xp: 60 },
];
const LEVELS = ['מתחילים', 'חוסכים צעירים', 'שומרי תקציב', 'אלופי הבית', 'מאסטרים של כסף', 'אגדות החיסכון'];
const CHEERS = ['כל הכבוד! 💪', 'עוד צעד קדימה! 🚀', 'יופי של רישום! ✨', 'ככה בונים הרגל! 🔥', 'אתם על זה! 🎯', 'מעולה, ממשיכים! 🌈'];

// ---------- utils ----------
const $ = (s, el = document) => el.querySelector(s);
const uid = () => Math.random().toString(36).slice(2, 10);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmtN = n => Math.round(n).toLocaleString('en-US');
const ils = n => `<span class="num">${fmtN(n)} ₪</span>`;
const ilsT = n => `${fmtN(n)} ₪`;
const dkey = d => { const x = new Date(d); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`; };
const mkey = d => dkey(d).slice(0, 7);
const today = () => dkey(new Date());
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const MONTHS = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
const monthName = k => { const [y, m] = k.split('-'); return `${MONTHS[+m - 1]} ${y}`; };
const prevMonthKey = k => { const [y, m] = k.split('-').map(Number); const d = new Date(y, m - 2, 1); return mkey(d); };
const dayLabel = k => { if (k === today()) return 'היום'; if (k === dkey(addDays(new Date(), -1))) return 'אתמול'; const [, m, d] = k.split('-'); return `ב-${+d}.${+m}`; };

// ---------- state ----------
function emptyState() {
  return {
    version: 1, onboarded: false, demo: false, me: null,
    users: { gavir: { incomes: [], personalBudget: 0 }, esti: { incomes: [], personalBudget: 0 } },
    categories: DEFAULT_CATS.map(c => ({ ...c, budget: 0 })),
    expenses: [], templates: [],
    fund: { name: 'קרן חירום', target: 0, saved: 0 },
    unlocked: {}, xpEvents: 0, subsReviewed: null, plans: {}, recentCats: [],
  };
}
let S = load();
function load() { try { const r = JSON.parse(localStorage.getItem(KEY)); if (r && r.version) return Object.assign(emptyState(), r); } catch (e) { } return emptyState(); }
function save() { localStorage.setItem(KEY, JSON.stringify(S)); }

// ---------- computations ----------
const cat = id => S.categories.find(c => c.id === id) || { name: 'שונות', icon: '✨', id: 'misc' };
const userIncome = u => S.users[u].incomes.reduce((a, i) => a + (+i.amount || 0), 0);
const totalIncome = () => userIncome('gavir') + userIncome('esti');
const sharedBudget = () => S.categories.reduce((a, c) => a + (+c.budget || 0), 0);
const totalBudget = () => sharedBudget() + (+S.users.gavir.personalBudget || 0) + (+S.users.esti.personalBudget || 0);
const monthExp = (k = mkey(new Date())) => S.expenses.filter(e => e.date.slice(0, 7) === k);
const sum = arr => arr.reduce((a, e) => a + (+e.amount || 0), 0);
const catSpent = (id, k) => sum(monthExp(k).filter(e => e.scope === 'shared' && e.cat === id));
const personalSpent = (u, k) => sum(monthExp(k).filter(e => e.scope === 'personal' && e.user === u));
const sharedSpent = k => sum(monthExp(k).filter(e => e.scope === 'shared'));
const visible = e => e.scope === 'shared' || e.user === S.me; // פרטיות: לא רואים פירוט אישי של בן הזוג
const other = u => (u === 'gavir' ? 'esti' : 'gavir');

function streakDays() {
  const days = new Set(S.expenses.map(e => e.date));
  let d = new Date(); if (!days.has(dkey(d))) d = addDays(d, -1);
  let n = 0; while (days.has(dkey(d))) { n++; d = addDays(d, -1); }
  return n;
}
function weekUnderStreak() {
  if (!S.expenses.length || !totalBudget()) return 0;
  const first = S.expenses.reduce((m, e) => (e.date < m ? e.date : m), today());
  const weekly = totalBudget() * 7 / 30;
  let n = 0, end = addDays(new Date(), -1);
  for (let w = 0; w < 52; w++) {
    const start = addDays(end, -6);
    if (dkey(start) < first) break;
    const s = sum(S.expenses.filter(e => e.date >= dkey(start) && e.date <= dkey(end)));
    if (s <= weekly) n++; else break;
    end = addDays(start, -1);
  }
  return n;
}
function bothThisWeek() { const from = dkey(addDays(new Date(), -6)); const ws = S.expenses.filter(e => e.date >= from); return ws.some(e => e.user === 'gavir') && ws.some(e => e.user === 'esti'); }
function monthWithSavings() {
  const inc = totalIncome(); if (!inc) return false;
  const pk = prevMonthKey(mkey(new Date()));
  const pe = monthExp(pk); return pe.length > 0 && sum(pe) < inc;
}
const fundPct = () => (S.fund.target ? S.fund.saved / S.fund.target : 0);
function xp() { let x = S.expenses.length * 10; for (const b of BADGES) if (S.unlocked[b.id]) x += b.xp; return x; }
function level() { const x = xp(); let k = 0; while (50 * (k + 1) * (k + 2) <= x) k++; const lo = 50 * k * (k + 1), hi = 50 * (k + 1) * (k + 2); return { lv: k + 1, name: LEVELS[Math.min(k, LEVELS.length - 1)], pct: (x - lo) / (hi - lo), x, toNext: hi - x }; }

function checkAchievements(silent = false) {
  const cond = {
    onboard: S.onboarded, first: S.expenses.length >= 1, ten: S.expenses.length >= 10,
    streak3: streakDays() >= 3, streak7: streakDays() >= 7, weekUnder: weekUnderStreak() >= 1,
    both: bothThisWeek(), monthSave: monthWithSavings(), ef10: fundPct() >= .1, ef50: fundPct() >= .5, ef100: fundPct() >= 1,
    subsReview: !!S.subsReviewed, planOk: Object.keys(S.plans).length > 0,
  };
  const fresh = [];
  for (const b of BADGES) if (cond[b.id] && !S.unlocked[b.id]) { S.unlocked[b.id] = Date.now(); fresh.push(b); }
  if (fresh.length) { save(); if (!silent) fresh.forEach((b, i) => setTimeout(() => celebrate(b), 700 + i * 1500)); }
  return fresh;
}

// ---------- effects ----------
function toast(html, cls = '') {
  const t = document.createElement('div'); t.className = 'toast ' + cls; t.innerHTML = html; $('#toasts').appendChild(t);
  setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 320); }, cls ? 3200 : 2200);
}
function celebrate(b) { confetti(); toast(`🏆 הישג חדש: ${b.icon} ${esc(b.name)}<br><small>קיבלתם ${b.xp} נקודות XP</small>`, 'ach'); navigator.vibrate?.([30, 50, 30]); renderTop(); if (current === 'achieve') go('achieve', true); }
function confetti() {
  const cv = $('#confetti'), ctx = cv.getContext('2d'); const W = cv.width = cv.offsetWidth * devicePixelRatio, H = cv.height = cv.offsetHeight * devicePixelRatio;
  const colors = ['#7c3aed', '#ec4899', '#fb923c', '#facc15', '#14b8a6', '#38bdf8', '#84cc16'];
  const P = Array.from({ length: 160 }, () => ({ x: W / 2, y: H * .35, vx: (Math.random() - .5) * 26 * devicePixelRatio, vy: (Math.random() * -22 - 6) * devicePixelRatio, s: (6 + Math.random() * 8) * devicePixelRatio, r: Math.random() * 6, vr: (Math.random() - .5) * .4, c: colors[Math.random() * colors.length | 0], shape: Math.random() < .3 ? 1 : 0 }));
  let f = 0; cancelAnimationFrame(confetti._raf);
  (function tick() {
    ctx.clearRect(0, 0, W, H); f++;
    for (const p of P) { p.vy += .55 * devicePixelRatio; p.vx *= .985; p.x += p.vx; p.y += p.vy; p.r += p.vr; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.c; ctx.globalAlpha = Math.max(0, 1 - f / 150); if (p.shape) { ctx.beginPath(); ctx.arc(0, 0, p.s / 2, 0, 7); ctx.fill(); } else ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); ctx.restore(); }
    if (f < 150) confetti._raf = requestAnimationFrame(tick); else ctx.clearRect(0, 0, W, H);
  })();
}
function flyCoin() {
  const fab = $('#fab').getBoundingClientRect(), app = $('#app').getBoundingClientRect();
  for (let i = 0; i < 6; i++) {
    const c = document.createElement('div'); c.className = 'flycoin'; c.textContent = ['🪙', '⭐', '💜'][i % 3]; $('#app').appendChild(c);
    const x0 = fab.left - app.left + 16, y0 = fab.top - app.top;
    c.animate([{ transform: `translate(${x0}px,${y0}px) scale(.4)`, opacity: 1 }, { transform: `translate(${x0 + (Math.random() - .5) * 220}px,${y0 - 160 - Math.random() * 160}px) scale(1.2)`, opacity: 1, offset: .6 }, { transform: `translate(${60}px,${20}px) scale(.3)`, opacity: 0 }], { duration: 900 + i * 80, easing: 'cubic-bezier(.2,.8,.3,1)' }).onfinish = () => c.remove();
  }
}
function countUp(el) {
  el.querySelectorAll('[data-count]').forEach(n => {
    const to = +n.dataset.count; const t0 = performance.now(); const d = 800;
    (function st(t) { const p = Math.min(1, (t - t0) / d); const e = 1 - Math.pow(1 - p, 3); n.textContent = `${fmtN(to * e)} ₪`; if (p < 1) requestAnimationFrame(st); })(t0);
  });
  requestAnimationFrame(() => requestAnimationFrame(() => {
    el.querySelectorAll('[data-w]').forEach(b => b.style.width = b.dataset.w);
    el.querySelectorAll('[data-off]').forEach(c => c.style.strokeDashoffset = c.dataset.off);
  }));
}
const cnt = n => `<span class="num" data-count="${Math.round(n)}">0 ₪</span>`;
const pctColor = p => (p >= 1 ? 'var(--red)' : p >= .8 ? 'var(--orange)' : 'var(--teal)');

// ---------- navigation ----------
const ORDER = ['home', 'budget', 'guide', 'achieve', 'income', 'settings'];
let current = null;
function go(name, instant = false) {
  const stage = $('#stage'); const old = stage.querySelector('.screen');
  const el = document.createElement('section'); el.className = 'screen'; el.dataset.screen = name; el.innerHTML = SCREENS[name]();
  stage.appendChild(el);
  const dir = ORDER.indexOf(name) >= ORDER.indexOf(current) ? 1 : -1; // RTL: קדימה = נכנס משמאל
  if (old) {
    if (instant) old.remove();
    else {
      old.animate([{ transform: 'none', opacity: 1 }, { transform: `translateX(${dir * 30}%)`, opacity: 0 }], { duration: 320, easing: 'cubic-bezier(.4,0,.2,1)' }).onfinish = () => old.remove();
      el.animate([{ transform: `translateX(${-dir * 40}%)`, opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 380, easing: 'cubic-bezier(.2,.9,.3,1)' });
    }
  }
  current = name;
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === name));
  bindScreen(el, name); countUp(el);
}
function renderShell() {
  const on = S.onboarded && S.me;
  ['#topbar', '#tabbar'].forEach(s => $(s).classList.toggle('hidden', !on));
  $('#demoBanner').classList.toggle('hidden', !S.demo);
  if (on) renderTop();
}
function renderTop() {
  if (!S.me) return; const u = USERS[S.me]; const L = level();
  $('#profileBtn').textContent = u.emoji;
  const h = new Date().getHours(); const greet = h < 12 ? 'בוקר טוב' : h < 18 ? 'צהריים טובים' : 'ערב טוב';
  $('#hello').textContent = `${greet}, ${u.name}`;
  $('#levelMini').innerHTML = `רמה ${L.lv} · ${L.name} <span class="bar"><i style="width:${L.pct * 100}%"></i></span>`;
  $('#fab').classList.toggle('pulse', !S.expenses.some(e => e.date === today()));
}

// ---------- screens ----------
const SCREENS = {
  home() {
    const k = mkey(new Date()); const inc = totalIncome(); const spent = sum(monthExp(k)); const left = inc - spent;
    const me = S.me, o = other(me);
    const myLeft = (+S.users[me].personalBudget || 0) - personalSpent(me, k);
    const oLeft = (+S.users[o].personalBudget || 0) - personalSpent(o, k);
    const sh = sharedBudget() - sharedSpent(k);
    const recent = S.expenses.filter(visible).sort((a, b) => (b.date + b.ts).localeCompare(a.date + a.ts)).slice(0, 6);
    const st = streakDays();
    return `<div class="stagger">
      <div class="hero"><div class="lbl">נשאר החודש מכל ההכנסות (${monthName(k)})</div><div class="big">${cnt(left)}</div>
        <div class="row"><div class="pill">הכנסות<b>${ils(inc)}</b></div><div class="pill">הוצאות<b>${ils(spent)}</b></div><div class="pill">רצף<b>${st} 🔥</b></div></div></div>
      <div class="grid2">
        <div class="mini c-teal" data-go="budget"><div class="t">נשאר בתקציב הבית</div><div class="v">${cnt(sh)}</div><div class="e">🏠</div></div>
        <div class="mini ${USERS[me].color}" data-go="budget"><div class="t">נשאר לי לעצמי</div><div class="v">${cnt(myLeft)}</div><div class="e">${USERS[me].emoji}</div></div>
        <div class="mini ${USERS[o].color}" data-go="budget"><div class="t">נשאר ל${USERS[o].name} (יתרה בלבד)</div><div class="v">${cnt(oLeft)}</div><div class="e">${USERS[o].emoji}</div></div>
        <div class="mini c-orange" data-go="income"><div class="t">ההכנסות שלי</div><div class="v">${cnt(userIncome(me))}</div><div class="e">💼</div></div>
      </div>
      ${fundCard()}
      <div class="card"><h3>🧾 הוצאות אחרונות</h3>
        ${recent.length ? `<div class="list">${recent.map(itemHtml).join('')}</div>` : `<div class="empty"><div class="big">🐣</div><b>עוד אין הוצאות החודש</b><br>לחצו על הפלוס הוורוד ורשמו את הראשונה, זה לוקח פחות מ-10 שניות</div>`}
      </div></div>`;
  },
  budget() {
    const k = mkey(new Date()); const warns = [];
    const rings = S.categories.map(c => {
      const s = catSpent(c.id, k), b = +c.budget || 0, p = b ? s / b : 0;
      if (b && p >= 1) warns.push(`<div class="warn w100">🚨 ${esc(c.name)}: עברתם את התקרה (${Math.round(p * 100)}%)</div>`);
      else if (b && p >= .8) warns.push(`<div class="warn w80">⚠️ ${esc(c.name)}: הגעתם ל-${Math.round(p * 100)}% מהתקרה</div>`);
      return ring(c.icon, c.name, s, b, `data-cat="${c.id}"`);
    }).join('');
    const pr = u => { const b = +S.users[u].personalBudget || 0, s = personalSpent(u, k), p = b ? s / b : 0; return `<div style="margin-bottom:12px"><div class="spread"><b>${USERS[u].emoji} התקציב של ${USERS[u].name}${u === S.me ? ' (אני)' : ''}</b><span>${b - s >= 0 ? `נשאר ${ils(b - s)}` : `חריגה של ${ils(s - b)}`}</span></div><div class="bar" style="margin-top:6px"><i data-w="${Math.min(100, p * 100)}%" style="background:${pctColor(p)}"></i></div><small class="muted">${u === S.me ? `הוצאתי ${ilsT(s)} מתוך ${ilsT(b)}` : 'פירוט ההוצאות האישיות נשאר פרטי'}</small></div>`; };
    const tot = sharedBudget(), ts = sharedSpent(k);
    return `<h2>התקציב של ${MONTHS[new Date().getMonth()]} 🎯</h2><p class="sub">לחצו על קטגוריה כדי לשנות את התקרה שלה</p>
      <div class="stagger">${warns.join('')}
      <div class="card"><div class="spread"><h3>🏠 תקציב הבית המשותף</h3><b>${ils(ts)} / ${ils(tot)}</b></div><div class="bar"><i data-w="${Math.min(100, tot ? ts / tot * 100 : 0)}%" style="background:var(--grad)"></i></div></div>
      <div class="card"><h3>🍩 לפי קטגוריה</h3><div class="rings">${rings}</div></div>
      <div class="card"><h3>👤 תקציבים אישיים</h3>${pr(S.me)}${pr(other(S.me))}<button class="btn soft small" data-act="editPersonal">שינוי התקציב האישי שלי</button></div>
      <div class="card"><h3>🔁 תבניות קבועות ומנויים</h3>${S.templates.length ? `<div class="list">${S.templates.map(t => `<div class="item"><div class="ic">${cat(t.cat).icon}</div><div class="mid"><b>${esc(t.label)}</b><small>${esc(cat(t.cat).name)} · ${t.scope === 'shared' ? 'משותף' : 'אישי'}</small></div><div class="amt">${ils(t.amount)}</div><button class="btn ghost small" data-deltpl="${t.id}">✕</button></div>`).join('')}</div>` : '<p class="muted">עדיין אין תבניות. כשמוסיפים הוצאה אפשר לסמן "שמור כתבנית קבועה".</p>'}</div>
      </div>`;
  },
  guide() {
    const k = mkey(new Date()); const inc = totalIncome(); const ex = monthExp(k); const spent = sum(ex);
    const byCat = {}; ex.filter(e => e.scope === 'shared').forEach(e => byCat[e.cat] = (byCat[e.cat] || 0) + +e.amount);
    const pers = sum(ex.filter(e => e.scope === 'personal'));
    const top = Object.entries(byCat).sort((a, b) => b[1] - a[1]).slice(0, 3);
    const needs = sum(ex.filter(e => e.scope === 'shared' && cat(e.cat).kind === 'need'));
    const wants = spent - needs; const saved = Math.max(0, inc - spent);
    const pct = v => (inc ? Math.round(v / inc * 100) : 0);
    const over = spent > inc;
    const step = suggestStep(top, over, inc, spent);
    const subs = S.templates.filter(t => t.cat === 'subs');
    const plan = proposePlan(); const nextK = mkey(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1));
    return `<h2>ההכוונה של החודש 🧭</h2><p class="sub">שלוש שאלות, תשובה אחת ברורה, וצעד אחד קדימה</p><div class="stagger">
      <div class="card"><div class="q"><div class="qn">1</div><div><b>הוצאנו יותר ממה שהרווחנו?</b>${!inc ? 'עוד לא הוזנו הכנסות, אז אי אפשר לדעת. הוסיפו משכורות במסך ההכנסות.' : over ? `כן, לצערנו. הוצאנו ${ils(spent)} והרווחנו ${ils(inc)}. החריגה היא ${ils(spent - inc)}.` : `לא! 🎉 הוצאנו ${ils(spent)} מתוך ${ils(inc)}, ונשארו ${ils(inc - spent)}.`}</div></div>
      <div class="q"><div class="qn">2</div><div><b>לאן הלך רוב הכסף?</b>${top.length ? top.map(([c, v], i) => `${['🥇', '🥈', '🥉'][i]} ${esc(cat(c).name)}: ${ils(v)}`).join('<br>') : 'עוד אין מספיק הוצאות החודש כדי לדעת.'}${pers ? `<br><small class="muted">ועוד הוצאות אישיות של שניכם: ${ilsT(pers)}</small>` : ''}</div></div>
      <div class="q"><div class="qn">3</div><div><b>מה הצעד לחודש הבא?</b>${step}</div></div></div>
      <div class="card"><h3>⚖️ כלל 50/30/20</h3><p class="muted" style="margin-top:0">כלל אצבע: חצי מההכנסה לצרכים, שליש לרצונות, וחמישית לחיסכון.</p><div class="rule">
        ${ruleBar('צרכים (חשבונות, סופר, ילדים)', pct(needs), 50, 'var(--teal)')}${ruleBar('רצונות (מסעדות, קניות, מנויים)', pct(wants), 30, 'var(--pink)')}${ruleBar('חיסכון (מה שנשאר)', pct(saved), 20, 'var(--violet)')}</div></div>
      ${fundCard(true)}
      <div class="card"><h3>🔍 בדיקת מנויים</h3>${subs.length ? `<div class="list">${subs.map(t => `<div class="item"><div class="ic">🎬</div><div class="mid"><b>${esc(t.label)}</b><small>${t.scope === 'shared' ? 'משותף' : 'אישי'}</small></div><div class="amt">${ils(t.amount)}</div></div>`).join('')}</div><p class="muted">סך המנויים בחודש: ${ils(sum(subs))}. יש מנוי שאתם לא באמת משתמשים בו?</p>` : '<p class="muted">עדיין לא הוגדרו מנויים כתבניות קבועות. כדאי לרשום אותם כדי לראות כמה הם עולים יחד.</p>'}
        <button class="btn soft block" data-act="subsReview">${S.subsReviewed ? `✅ נבדק לאחרונה ב-${new Date(S.subsReviewed).toLocaleDateString('he-IL')}` : 'סימון: עברנו על המנויים'}</button></div>
      <div class="card"><h3>📅 התוכנית ל${monthName(nextK)}</h3>${plan.length ? `<p class="muted" style="margin-top:0">הצעה לפי ההכנסות וההוצאות של החודש:</p><div class="list">${plan.map(p => `<div class="spread"><span>${p.icon} ${esc(p.name)}</span><span>${ils(p.old)} ← <b>${ils(p.nu)}</b></span></div>`).join('')}</div><br>` : '<p class="muted">אין שינויים מוצעים. התקציב הנוכחי נראה מאוזן.</p>'}
        <button class="btn primary block" data-act="approvePlan" ${S.plans[nextK] ? 'disabled' : ''}>${S.plans[nextK] ? '✅ אישרתם את התוכנית יחד' : 'אישור התוכנית יחד 🤝'}</button></div>
      </div>`;
  },
  achieve() {
    const L = level(); const st = streakDays(), wu = weekUnderStreak();
    const got = BADGES.filter(b => S.unlocked[b.id]).length;
    return `<h2>ההישגים שלכם 🏆</h2><p class="sub">כל רישום מקרב אתכם לרמה הבאה. ממשיכים ככה!</p><div class="stagger">
      <div class="lvl-card"><div class="spread"><div><div style="opacity:.8">רמה</div><div class="lv">${L.lv}</div></div><div style="text-align:left"><b style="font-size:20px">${L.name}</b><div style="opacity:.8">סך הכול ${L.x} נקודות XP</div></div></div>
        <div class="bar"><i data-w="${L.pct * 100}%"></i></div><small style="opacity:.85">עוד ${L.toNext} נקודות XP לרמה הבאה</small></div>
      <div class="streaks"><div class="streak"><div class="f">🔥</div><div class="n">${st}</div><b>ימים ברצף עם רישום</b></div><div class="streak"><div class="f">🛡️</div><div class="n">${wu}</div><b>שבועות ברצף בתקציב</b></div></div>
      <div class="card"><h3>🎖️ תגים (${got} מתוך ${BADGES.length})</h3><div class="badges">${BADGES.map(b => `<div class="badge ${S.unlocked[b.id] ? (Date.now() - S.unlocked[b.id] < 6e4 ? 'new' : '') : 'locked'}" data-badge="${b.id}"><div class="bi">${S.unlocked[b.id] ? b.icon : '🔒'}</div><b>${esc(b.name)}</b></div>`).join('')}</div></div>
      <div class="card"><h3>💡 איך מרוויחים נקודות</h3><p class="muted" style="margin:0;line-height:1.7">כל הוצאה שנרשמת: 10 נקודות XP.<br>כל תג חדש: בין 30 ל-300 נקודות XP.<br>רישום יומי שומר על הרצף, גם אם זה רק קפה ☕</p></div></div>`;
  },
  income() {
    const me = S.me; const inc = totalIncome(); const left = inc - totalBudget();
    const block = u => `<div class="card"><h3>${USERS[u].emoji} ההכנסות של ${USERS[u].name}${u === me ? ' (אני)' : ''}</h3>
      ${S.users[u].incomes.length ? `<div class="list">${S.users[u].incomes.map(i => `<div class="item"><div class="ic">💼</div><div class="mid"><b>${esc(i.label)}</b><small>נכנס ב-${i.day} לחודש</small></div><div class="amt">${ils(i.amount)}</div>${u === me ? `<button class="btn ghost small" data-delinc="${i.id}">✕</button>` : ''}</div>`).join('')}</div>` : '<p class="muted">עוד לא הוזנו הכנסות.</p>'}
      ${u === me ? '<br><button class="btn soft block" data-act="addIncome">הוספת הכנסה</button>' : '<small class="muted">רק ' + USERS[u].name + ' יכול/ה לערוך את ההכנסות האלה</small>'}</div>`;
    return `<h2>הכנסות 💼</h2><p class="sub">כל אחד מזין את המשכורת וההכנסות שלו</p><div class="stagger">
      <div class="hero" style="background:var(--grad2)"><div class="lbl">הכנסה חודשית של הבית</div><div class="big">${cnt(inc)}</div><div class="row"><div class="pill">תקציב כולל<b>${ils(totalBudget())}</b></div><div class="pill">נשאר לחיסכון<b>${ils(left)}</b></div></div></div>
      ${block(me)}${block(other(me))}</div>`;
  },
  settings() {
    return `<h2>הגדרות ⚙️</h2><p class="sub">גיבוי, פרופיל ונתונים</p><div class="stagger">
      <div class="card"><h3>👥 פרופיל</h3><p class="muted" style="margin-top:0">כרגע מחובר/ת: ${USERS[S.me].emoji} ${USERS[S.me].name}</p><button class="btn soft block" data-act="switch">החלפה ל${USERS[other(S.me)].name}</button></div>
      <div class="card"><h3>💾 גיבוי</h3><p class="muted" style="margin-top:0">שמרו קובץ גיבוי מדי פעם. אפשר לטעון אותו גם בטלפון אחר.</p><div class="row"><button class="btn primary" style="flex:1" data-act="export">ייצוא קובץ</button><button class="btn soft" style="flex:1" data-act="import">ייבוא קובץ</button></div><input type="file" id="importFile" accept="application/json,.json" hidden></div>
      <div class="card"><h3>🎨 נתוני דוגמה</h3><p class="muted" style="margin-top:0">רוצים לראות איך זה נראה מלא? נתוני הדוגמה מומצאים ומסומנים בפס צהוב. הם מחליפים את מה שיש עכשיו.</p><button class="btn soft block" data-act="demo">טען נתוני דוגמה</button></div>
      <div class="note">🔐 <b>חשוב לדעת:</b> בגרסה הראשונה הנתונים נשמרים רק במכשיר הזה, בדפדפן. הם לא עולים לשום שרת, ולכן גם לא מסתנכרנים בין הטלפון שלך לטלפון של בן/בת הזוג. סנכרון בין שני הטלפונים מגיע בגרסה הבאה. עד אז, כדאי לייצא גיבוי באופן קבוע.</div><br>
      <div class="card"><h3>🧹 איפוס</h3><button class="btn danger block" data-act="reset">מחיקת כל הנתונים במכשיר</button></div>
      <p class="muted" style="text-align:center;font-size:12px">גרסה 1.0 · הכסף של הבית</p></div>`;
  },
};
function ring(icon, name, s, b, attrs) {
  const p = b ? s / b : 0; const C = 2 * Math.PI * 30;
  return `<div class="ring" ${attrs}><div class="wrap"><svg viewBox="0 0 74 74"><circle class="bgc" cx="37" cy="37" r="30"/><circle class="fg" cx="37" cy="37" r="30" stroke="${pctColor(p)}" stroke-dasharray="${C}" stroke-dashoffset="${C}" data-off="${C * (1 - Math.min(1, p))}"/></svg><div class="center">${icon}</div></div><div class="nm">${esc(name)}</div><div class="rm">${!b ? 'בלי תקרה' : b - s >= 0 ? `נשאר ${ilsT(b - s)}` : `חריגה של ${ilsT(s - b)}`}</div></div>`;
}
function ruleBar(label, actual, target, color) { return `<div><div class="rl"><span>${label}</span><span>בפועל ${actual}% · יעד ${target}%</span></div><div class="bar"><i data-w="${Math.min(100, actual)}%" style="background:${color}"></i></div></div>`; }
function fundCard(withBtn = true) {
  const p = fundPct();
  return `<div class="card"><div class="spread"><h3>🐷 ${esc(S.fund.name)} (היעד הראשון)</h3><b>${Math.round(p * 100)}%</b></div>
    <div class="bar" style="height:16px"><i data-w="${Math.min(100, p * 100)}%" style="background:linear-gradient(90deg,#84cc16,#14b8a6)"></i></div>
    <div class="spread" style="margin-top:8px"><small class="muted">נחסך ${ilsT(S.fund.saved)} מתוך ${ilsT(S.fund.target)}</small>${withBtn ? '<button class="btn soft small" data-act="deposit">הפקדתי לקרן</button>' : ''}</div>
    <small class="muted">כלל אצבע: קרן חירום בגובה שלושה חודשי הוצאות.</small></div>`;
}
function itemHtml(e) {
  const c = cat(e.cat);
  return `<div class="item"><div class="ic">${c.icon}</div><div class="mid"><b>${esc(e.note || c.name)}<span class="tag ${e.scope}">${e.scope === 'shared' ? 'משותף' : 'אישי'}</span></b><small>${USERS[e.user].name} · ${dayLabel(e.date)}</small></div><div class="amt">${ils(e.amount)}</div></div>`;
}
function suggestStep(top, over, inc, spent) {
  if (!inc) return 'להזין את המשכורות של שניכם, כדי שנוכל לחשב תקציב והכוונה.';
  const hot = S.categories.find(c => c.budget && catSpent(c.id) > c.budget);
  if (over && top[0]) return `לקצץ 10% ב${esc(cat(top[0][0]).name)}, הקטגוריה הכי גדולה. זה חיסכון של כ-${ils(top[0][1] * .1)} בחודש.`;
  if (hot) return `${esc(hot.name)} חרגה מהתקרה. נסו לקבוע לה יום קבוע בשבוע לקניות, או להעלות את התקרה בצורה מודעת.`;
  if (fundPct() < 1) return `להעביר אוטומטית ${ils(Math.max(100, (inc - spent) * .5))} לקרן החירום מיד כשהמשכורת נכנסת.`;
  return 'קרן החירום מלאה! זה הזמן לבחור יעד חיסכון חדש ביחד 🎉';
}
function proposePlan() {
  const k = mkey(new Date());
  return S.categories.filter(c => c.budget).map(c => { const s = catSpent(c.id, k); let nu = c.budget; if (s > c.budget) nu = Math.round((c.budget + s) / 2 / 10) * 10; else if (s < c.budget * .6 && new Date().getDate() > 20) nu = Math.round((c.budget + s) / 2 / 10) * 10; return { ...c, old: c.budget, nu }; }).filter(p => p.nu !== p.old);
}

// ---------- screen bindings ----------
function bindScreen(el, name) {
  el.querySelectorAll('[data-go]').forEach(b => b.onclick = () => go(b.dataset.go));
  el.querySelectorAll('[data-cat]').forEach(b => b.onclick = () => editCat(b.dataset.cat));
  el.querySelectorAll('[data-deltpl]').forEach(b => b.onclick = () => { S.templates = S.templates.filter(t => t.id !== b.dataset.deltpl); save(); go(name, true); });
  el.querySelectorAll('[data-delinc]').forEach(b => b.onclick = () => { S.users[S.me].incomes = S.users[S.me].incomes.filter(i => i.id !== b.dataset.delinc); save(); go(name, true); });
  el.querySelectorAll('[data-badge]').forEach(b => b.onclick = () => { const x = BADGES.find(z => z.id === b.dataset.badge); toast(`${x.icon} ${esc(x.name)}: ${esc(x.desc)}${S.unlocked[x.id] ? '' : ' (עוד לא נפתח)'}`); });
  el.querySelectorAll('[data-act]').forEach(b => b.onclick = () => ACTS[b.dataset.act](b));
}
const ACTS = {
  editPersonal() { numberSheet('התקציב האישי שלי לחודש', S.users[S.me].personalBudget, v => { S.users[S.me].personalBudget = v; save(); go('budget', true); toast('התקציב האישי עודכן ✨'); }); },
  deposit() { numberSheet('כמה הפקדתם לקרן החירום?', '', v => { S.fund.saved += v; save(); go(current, true); toast(`הפקדה של ${ilsT(v)}! הקרן גדלה 🌱`); checkAchievements(); }, 'יעד הקרן', S.fund.target, t => { S.fund.target = t; }); },
  subsReview() { S.subsReviewed = Date.now(); save(); go('guide', true); toast('מעולה! בדיקת מנויים פעם בחודש חוסכת כסף 🔍'); checkAchievements(); },
  approvePlan() { const nextK = mkey(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1)); proposePlan().forEach(p => { cat(p.id).budget = p.nu; }); S.plans[nextK] = Date.now(); save(); go('guide', true); toast('התוכנית אושרה. צוות! 🤝'); checkAchievements(); },
  addIncome() { incomeSheet(); },
  switch() { S.me = other(S.me); save(); renderShell(); go('home'); toast(`שלום ${USERS[S.me].name}! ${USERS[S.me].emoji}`); },
  export() { const blob = new Blob([JSON.stringify(S, null, 2)], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `money-home-backup-${today()}.json`; a.click(); toast('קובץ הגיבוי ירד למכשיר 💾'); },
  import() { const f = $('#importFile'); f.onchange = async () => { try { const d = JSON.parse(await f.files[0].text()); if (!d.version || !d.users) throw 0; S = Object.assign(emptyState(), d); save(); renderShell(); go('home'); toast('הגיבוי נטען בהצלחה ✅'); } catch (e) { toast('הקובץ לא נראה כמו גיבוי של האפליקציה'); } }; f.click(); },
  demo() { if (S.expenses.length && !S.demo && !confirm('נתוני הדוגמה יחליפו את הנתונים הקיימים. להמשיך?')) return; loadDemo(); },
  reset() { if (!confirm('למחוק את כל הנתונים במכשיר? כדאי לייצא גיבוי קודם.')) return; localStorage.removeItem(KEY); S = emptyState(); current = null; $('#stage').innerHTML = ''; renderShell(); onboarding(0); },
};

// ---------- sheets ----------
function openSheet(html, bind) {
  const w = $('#sheetWrap'); const sh = $('#sheet'); w.classList.remove('hidden', 'closing'); sh.classList.remove('closing');
  sh.innerHTML = `<div class="grab"></div>${html}`; w.querySelector('.sheet-backdrop').onclick = closeSheet; bind?.(sh);
}
function closeSheet() { const w = $('#sheetWrap'); w.classList.add('closing'); $('#sheet').classList.add('closing'); setTimeout(() => w.classList.add('hidden'), 240); }
function numberSheet(title, val, cb, label2, val2, cb2) {
  openSheet(`<h2>${title}</h2><div class="amount-wrap"><input id="nv" class="amount-input" type="number" inputmode="decimal" placeholder="0" value="${val || ''}"><span>₪</span></div>
    ${label2 ? `<label class="lb">${label2}</label><input id="nv2" class="field" type="number" inputmode="decimal" value="${val2 || ''}">` : ''}
    <button class="btn primary block" id="ok">שמירה</button>`, sh => {
    const i = $('#nv', sh); setTimeout(() => i.focus(), 300);
    $('#ok', sh).onclick = () => { if (label2) cb2(+$('#nv2', sh).value || 0); const v = +i.value || 0; closeSheet(); cb(v); };
  });
}
function editCat(id) {
  const c = cat(id);
  openSheet(`<h2>${c.icon} עריכת קטגוריה</h2><label class="lb">שם</label><input id="cn" class="field" value="${esc(c.name)}"><label class="lb">תקרה חודשית</label><input id="cb" class="field" type="number" inputmode="decimal" value="${c.budget || ''}"><button class="btn primary block" id="ok">שמירה</button>`, sh => {
    $('#ok', sh).onclick = () => { c.name = $('#cn', sh).value.trim() || c.name; c.budget = +$('#cb', sh).value || 0; save(); closeSheet(); go('budget', true); toast('הקטגוריה עודכנה ✨'); };
  });
}
function incomeSheet() {
  openSheet(`<h2>הוספת הכנסה 💼</h2><label class="lb">סוג ההכנסה</label><input id="il" class="field" value="משכורת"><label class="lb">סכום חודשי</label><input id="ia" class="field" type="number" inputmode="decimal" placeholder="לדוגמה 10,000"><label class="lb">יום בחודש שבו נכנסת</label><input id="id" class="field" type="number" min="1" max="31" value="10"><button class="btn primary block" id="ok">שמירה</button>`, sh => {
    $('#ok', sh).onclick = () => { const a = +$('#ia', sh).value; if (!a) return toast('צריך להזין סכום'); S.users[S.me].incomes.push({ id: uid(), label: $('#il', sh).value || 'הכנסה', amount: a, day: +$('#id', sh).value || 1 }); save(); closeSheet(); go('income', true); toast('ההכנסה נשמרה 💸'); };
  });
}
function addSheet() {
  const recent = S.recentCats.filter(id => S.categories.some(c => c.id === id)).slice(0, 3);
  const ordered = [...recent.map(cat), ...S.categories.filter(c => !recent.includes(c.id))];
  let sel = { cat: recent[0] || null, scope: 'shared' };
  const myT = S.templates.filter(t => t.scope === 'shared' || t.user === S.me);
  openSheet(`<h2 style="text-align:center;margin-top:0">הוצאה חדשה ⚡</h2>
    ${myT.length ? `<label class="lb">בלחיצה אחת</label><div class="tpls">${myT.map(t => `<button class="tpl" data-tpl="${t.id}">${cat(t.cat).icon} ${esc(t.label)}<small>${ilsT(t.amount)}</small></button>`).join('')}</div>` : ''}
    <div class="amount-wrap"><input id="amt" class="amount-input" type="number" inputmode="decimal" placeholder="0"><span>₪</span></div>
    <div class="chips">${ordered.map(c => `<button class="chip ${recent.includes(c.id) ? 'recent' : ''} ${sel.cat === c.id ? 'on' : ''}" data-c="${c.id}">${c.icon} ${esc(c.name)}</button>`).join('')}</div>
    <div class="seg"><button data-s="shared" class="on">🏠 משותף</button><button data-s="personal">👤 אישי</button></div>
    <input id="note" class="field" placeholder="הערה (לא חובה)">
    <label class="row" style="margin:0 4px 14px;font-weight:700;font-size:14px"><input type="checkbox" id="asTpl"> שמירה כתבנית קבועה</label>
    <button class="btn primary block save-btn" id="saveExp">רישום ההוצאה</button>`, sh => {
    const amt = $('#amt', sh); setTimeout(() => amt.focus(), 350);
    sh.querySelectorAll('[data-c]').forEach(b => b.onclick = () => { sel.cat = b.dataset.c; sh.querySelectorAll('[data-c]').forEach(x => x.classList.toggle('on', x === b)); });
    sh.querySelectorAll('[data-s]').forEach(b => b.onclick = () => { sel.scope = b.dataset.s; sh.querySelectorAll('[data-s]').forEach(x => x.classList.toggle('on', x === b)); });
    sh.querySelectorAll('[data-tpl]').forEach(b => b.onclick = () => { const t = S.templates.find(z => z.id === b.dataset.tpl); addExpense({ amount: t.amount, cat: t.cat, scope: t.scope, note: t.label }, b); });
    $('#saveExp', sh).onclick = e => {
      const a = +amt.value; if (!a || a <= 0) { amt.parentElement.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-10px)' }, { transform: 'translateX(10px)' }, { transform: 'translateX(0)' }], { duration: 300 }); return toast('כמה זה עלה? הזינו סכום'); }
      if (!sel.cat) return toast('בחרו קטגוריה');
      const note = $('#note', sh).value.trim();
      if ($('#asTpl', sh).checked) S.templates.push({ id: uid(), label: note || cat(sel.cat).name, amount: a, cat: sel.cat, scope: sel.scope, user: S.me });
      addExpense({ amount: a, cat: sel.cat, scope: sel.scope, note }, e.currentTarget);
    };
  });
}
function addExpense(x, btn) {
  S.expenses.push({ id: uid(), ...x, user: S.me, date: today(), ts: new Date().toISOString().slice(11, 19) });
  S.recentCats = [x.cat, ...S.recentCats.filter(c => c !== x.cat)].slice(0, 5);
  save(); navigator.vibrate?.(20);
  if (btn) { btn.classList.add('done'); btn.textContent = '✓ נרשם!'; }
  const k = mkey(new Date()); const c = cat(x.cat);
  setTimeout(() => {
    closeSheet(); flyCoin(); toast(`${CHEERS[Math.random() * CHEERS.length | 0]} +10 XP`);
    if (x.scope === 'shared' && c.budget) { const p = catSpent(c.id, k) / c.budget; if (p >= 1) setTimeout(() => toast(`🚨 ${c.name}: עברתם את התקרה החודשית`), 900); else if (p >= .8) setTimeout(() => toast(`⚠️ ${c.name}: הגעתם ל-${Math.round(p * 100)}% מהתקרה`), 900); }
    renderTop(); go(current === 'home' || !current ? 'home' : current, true); checkAchievements();
  }, 450);
}

// ---------- onboarding ----------
let OB = { gavir: '', esti: '' };
function onboarding(step) {
  $('#stage').innerHTML = ''; renderShell();
  const el = document.createElement('section'); el.className = 'screen'; el.style.padding = '0';
  const dots = n => `<div class="dots">${[0, 1, 2, 3, 4].map(i => `<i class="${i === n ? 'on' : ''}"></i>`).join('')}</div>`;
  const steps = [
    () => `<div class="ob"><div class="art">🐷</div><h1>הכסף של הבית</h1><p>מקום אחד לגביר ולאסתי לנהל את הכסף נכון, לראות לאן הוא הולך, ולהרגיש התקדמות כל שבוע.</p><div class="grow"></div>${dots(0)}
       <button class="btn primary block" data-n="1">בואו נתחיל ✨</button><br><button class="btn soft block" data-demo>טען נתוני דוגמה</button><p style="font-size:13px">הנתונים נשמרים רק במכשיר הזה.</p></div>`,
    () => incStep('gavir', 1), () => incStep('esti', 2),
    () => budStep(),
    () => `<div class="ob"><div class="art">🎉</div><h1>הכול מוכן!</h1><p>מי משתמש עכשיו בטלפון הזה?</p><div class="who"><button class="c-violet" data-me="gavir"><span>🦁</span>גביר</button><button class="c-pink" data-me="esti"><span>🌸</span>אסתי</button></div><div class="grow"></div>${dots(4)}</div>`,
  ];
  el.innerHTML = steps[step](); $('#stage').appendChild(el);
  el.animate([{ opacity: 0, transform: 'translateX(-30%)' }, { opacity: 1, transform: 'none' }], { duration: 380, easing: 'cubic-bezier(.2,.9,.3,1)' });
  el.querySelectorAll('[data-n]').forEach(b => b.onclick = () => {
    const inp = el.querySelector('#sal');
    if (inp) { const u = inp.dataset.u; const v = +inp.value; if (!v) { toast('הזינו משכורת (אפשר לעדכן אחר כך)'); return; } OB[u] = { amount: v, day: +el.querySelector('#day').value || 10 }; }
    if (+b.dataset.n === 4) {
      el.querySelectorAll('[data-bud]').forEach(i => { const c = S.categories.find(z => z.id === i.dataset.bud); if (c) c.budget = +i.value || 0; });
      S.users.gavir.personalBudget = +el.querySelector('#pb-gavir').value || 0; S.users.esti.personalBudget = +el.querySelector('#pb-esti').value || 0;
    }
    onboarding(+b.dataset.n);
  });
  el.querySelectorAll('[data-skip]').forEach(b => b.onclick = () => onboarding(+b.dataset.skip));
  el.querySelector('[data-demo]')?.addEventListener('click', loadDemo);
  el.querySelectorAll('[data-me]').forEach(b => b.onclick = () => {
    for (const u of ['gavir', 'esti']) if (OB[u]) S.users[u].incomes = [{ id: uid(), label: 'משכורת', amount: OB[u].amount, day: OB[u].day }];
    S.fund.target = Math.round(sharedBudget() * 3 / 100) * 100 || 0;
    S.onboarded = true; S.me = b.dataset.me; save(); renderShell(); go('home'); checkAchievements();
  });
  function incStep(u, n) {
    return `<div class="ob"><div class="art">${USERS[u].emoji}</div><h1>המשכורת של ${USERS[u].name}</h1><p>כמה נכנס בחודש, נטו? אפשר להוסיף עוד הכנסות אחר כך.</p>
      <div class="amount-wrap"><input id="sal" data-u="${u}" class="amount-input" type="number" inputmode="decimal" placeholder="0" value="${OB[u]?.amount || ''}"><span>₪</span></div>
      <label class="lb">יום בחודש שבו המשכורת נכנסת</label><input id="day" class="field" type="number" min="1" max="31" value="${OB[u]?.day || 10}">
      <div class="grow"></div>${dots(n)}<button class="btn primary block" data-n="${n + 1}">המשך</button><button class="btn ghost block" data-skip="${n + 1}">דילוג לעכשיו</button></div>`;
  }
  function budStep() {
    const inc = (OB.gavir?.amount || 0) + (OB.esti?.amount || 0);
    const pb = Math.round(inc * .05 / 50) * 50; const shared = inc * .8 - pb * 2;
    return `<div class="ob" style="padding-top:10px"><h1>התקציב החודשי 🎯</h1><p>${inc ? `הצעה לפי הכנסה של ${ilsT(inc)}: כ-80% להוצאות, ו-20% נשאר לחיסכון. אפשר לשנות הכול.` : 'הזינו תקרה לכל קטגוריה. אפשר לשנות אחר כך.'}</p>
      <div class="card"><h3>🏠 תקציב הבית המשותף</h3>${S.categories.map(c => `<div class="bud-row"><span class="nm">${c.icon} ${esc(c.name)}</span><input class="field" type="number" inputmode="decimal" data-bud="${c.id}" value="${c.budget || (inc ? Math.round(shared * SHARE[c.id] / 50) * 50 : '')}"></div>`).join('')}</div>
      <div class="card"><h3>👤 תקציב אישי לכל אחד</h3>${['gavir', 'esti'].map(u => `<div class="bud-row"><span class="nm">${USERS[u].emoji} ${USERS[u].name}</span><input class="field" id="pb-${u}" type="number" inputmode="decimal" value="${S.users[u].personalBudget || pb || ''}"></div>`).join('')}<small class="muted">בן הזוג רואה רק את היתרה, לא את הפירוט.</small></div>
      ${dots(3)}<button class="btn primary block" data-n="4">שמירת התקציב</button></div>`;
  }
}

// ---------- demo data (מומצא לגמרי) ----------
function loadDemo() {
  const s = emptyState(); s.demo = true; s.onboarded = true; s.me = S.me || 'gavir';
  s.users.gavir = { incomes: [{ id: uid(), label: 'משכורת (דוגמה)', amount: 12000, day: 10 }], personalBudget: 800 };
  s.users.esti = { incomes: [{ id: uid(), label: 'משכורת (דוגמה)', amount: 10500, day: 1 }, { id: uid(), label: 'עבודה צדדית (דוגמה)', amount: 1200, day: 15 }], personalBudget: 800 };
  const B = { bills: 2800, food: 3200, rest: 900, subs: 400, shop: 1000, trans: 1200, kids: 1600, health: 500, misc: 600 };
  s.categories.forEach(c => c.budget = B[c.id]);
  s.templates = [
    { id: uid(), label: 'סטרימינג (דוגמה)', amount: 50, cat: 'subs', scope: 'shared' },
    { id: uid(), label: 'מוזיקה (דוגמה)', amount: 25, cat: 'subs', scope: 'shared' },
    { id: uid(), label: 'סופר שבועי (דוגמה)', amount: 650, cat: 'food', scope: 'shared' },
    { id: uid(), label: 'חוג לילדים (דוגמה)', amount: 280, cat: 'kids', scope: 'shared' },
  ];
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const pool = [['food', 'סופר', 180, 520], ['rest', 'פיצה', 70, 180], ['trans', 'דלק', 150, 300], ['shop', 'בגדים', 90, 300], ['misc', 'מתנה', 50, 160], ['kids', 'ציוד לגן', 40, 140], ['health', 'בית מרקחת', 30, 120], ['bills', 'חשמל', 300, 450]];
  for (let d = 40; d >= 1; d--) {
    const date = dkey(addDays(new Date(), -d)); const n = 1 + (rnd() * 2 | 0);
    for (let i = 0; i < n; i++) { const p = pool[rnd() * pool.length | 0]; s.expenses.push({ id: uid(), amount: Math.round(p[2] + rnd() * (p[3] - p[2])), cat: p[0], scope: 'shared', note: p[1] + ' (דוגמה)', user: rnd() < .5 ? 'gavir' : 'esti', date, ts: '12:00:00' }); }
    if (rnd() < .25) s.expenses.push({ id: uid(), amount: Math.round(30 + rnd() * 120), cat: 'misc', scope: 'personal', note: 'קפה וספר (דוגמה)', user: rnd() < .5 ? 'gavir' : 'esti', date, ts: '15:00:00' });
  }
  s.fund = { name: 'קרן חירום', target: 36000, saved: 6500 };
  s.recentCats = ['food', 'rest', 'trans'];
  S = s; save(); checkAchievements(true); save(); renderShell(); go('home'); confetti(); toast('נטענו נתוני דוגמה מומצאים 🎨', 'ach');
}

// ---------- boot ----------
$('#fab').onclick = addSheet;
document.querySelectorAll('.tab[data-tab]').forEach(t => t.onclick = () => current !== t.dataset.tab && go(t.dataset.tab));
$('#settingsBtn').onclick = () => go('settings');
$('#profileBtn').onclick = () => ACTS.switch();
if (S.onboarded && S.me) { renderShell(); go('home'); checkAchievements(); } else onboarding(0);
