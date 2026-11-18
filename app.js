'use strict';
/* קליל · הכסף של הבית. אפליקציית משמעת כסף לגביר ואסתי.
   הנתונים נשמרים ב-localStorage במכשיר. סנכרון אופציונלי דרך sync.js (כבוי כברירת מחדל). */
const KEY = 'money-home-v1';
const USERS = { gavir: { name: 'גביר', letter: 'ג' }, esti: { name: 'אסתי', letter: 'א' } };
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
const CAT_COLORS = { bills: '#FFC89A', food: '#B8F06E', kids: '#FFE56B', trans: '#8FD8FF', subs: '#D4B5FF', rest: '#FFB347', health: '#7EF0C4', shop: '#FF9AD4', misc: '#E8D5C4' };
const EXTRA_COLORS = ['#FF9AD4', '#8FD8FF', '#B8F06E', '#FFE56B', '#7EF0C4', '#FFC89A'];
const SHARE = { bills: .22, food: .25, rest: .08, subs: .04, shop: .08, trans: .1, kids: .12, health: .05, misc: .06 };
const LEVEL_AT = [0, 100, 250, 450, 700, 1000, 1400, 1900, 2500, 3200];
const LEVEL_NAMES = ['מתחילים', 'צוברים תנופה', 'שומרי תקציב', 'חוסכים חכמים', 'אלופי הבית', 'מאסטרים', 'גיבורי כסף', 'אגדות', 'קוסמי תקציב', 'קלילים לגמרי'];
const BADGES = [
  { id: 'first', emoji: '🌱', name: 'התחלה טובה', desc: 'הוצאה ראשונה נרשמה' },
  { id: 'fast', emoji: '⚡', name: 'מהיר כמו ברק', desc: 'הוצאה נרשמה בפחות מעשר שניות' },
  { id: 'eye', emoji: '👀', name: 'עין חדה', desc: 'נצפה מסך ההכוונה החודשי' },
  { id: 'both', emoji: '🏡', name: 'צוות הבית', desc: 'שני בני הזוג הזינו בחודש הזה' },
  { id: 'salaries', emoji: '🌞', name: 'שקיפות', desc: 'שני בני הזוג הזינו משכורת' },
  { id: 'streak7', emoji: '🔥', name: 'שבוע שלם', desc: 'רצף של שבעה ימים' },
  { id: 'underCap', emoji: '🎯', name: 'מתחת לתקרה', desc: 'חודש הסתיים בלי חריגה' },
  { id: 'fundFirst', emoji: '🛡️', name: 'קרן חירום', desc: 'הופקדה הפקדה ראשונה לקרן' },
  { id: 'clean', emoji: '✨', name: 'בלי חריגה', desc: 'שבועיים ברצף בתוך התקציב' },
  { id: 'saver', emoji: '💎', name: 'חוסך מתמיד', desc: 'שלושה חודשים עם חיסכון חיובי' },
  { id: 'planOk', emoji: '📝', name: 'תוכנית מאושרת', desc: 'אושרה התוכנית החודשית יחד' },
  { id: 'morning', emoji: '🌅', name: 'בוקר טוב', desc: 'נפתחה הסקירה שבעה ימים ברצף' },
  { id: 'ten', emoji: '🔟', name: 'עשר הוצאות', desc: 'רשמתם 10 הוצאות' },
  { id: 'subsReview', emoji: '🔍', name: 'בדקנו מנויים', desc: 'עברתם על רשימת המנויים' },
  { id: 'ef50', emoji: '🌳', name: 'חצי קרן', desc: 'חצי מקרן החירום כבר שם' },
  { id: 'ef100', emoji: '🏰', name: 'קרן מלאה', desc: 'קרן החירום מלאה' },
];
const BADGE_XP = 25;
const CHEERS = ['כל הכבוד!', 'עוד צעד קדימה!', 'יופי של רישום!', 'ככה בונים הרגל!', 'אתם על זה!', 'מעולה, ממשיכים!'];
const ICONS = {
  home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M4 11.5 12 5l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1Z"/></svg>',
  budget: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="6" width="18" height="14" rx="4"/><path d="M3 10h18"/><path d="M16 15.5h2"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  guide: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2a7 7 0 0 0-4 12c.6.6 1 1.5 1 2.4V17h6v-.6c0-.9.4-1.8 1-2.4A7 7 0 0 0 12 2Z"/></svg>',
  star: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3 2.7 5.6 6.2.9-4.5 4.3 1.1 6.1L12 17.3 6.5 19.9l1.1-6.1L3.1 9.5l6.2-.9Z"/></svg>',
  back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>',
  gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/></svg>',
};
const LOGO = '<svg class="logo" viewBox="0 0 84 84" aria-hidden="true"><circle cx="42" cy="42" r="38" fill="#FFD44D" stroke="#1B1410" stroke-width="4"/><circle cx="30" cy="36" r="5" fill="#1B1410"/><circle cx="54" cy="36" r="5" fill="#1B1410"/><path d="M28 50c5 10 23 10 28 0" fill="none" stroke="#1B1410" stroke-width="4" stroke-linecap="round"/></svg>';

// ---------- utils ----------
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmtN = n => Math.abs(Math.round(n)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const ilsT = n => (n < 0 ? '-' : '') + fmtN(n) + ' ₪';
const ils = n => `<span class="num">${n < 0 ? '<bdi dir="ltr">-' + fmtN(n) + '</bdi> ₪' : fmtN(n) + ' ₪'}</span>`;
const dkey = d => { const x = new Date(d); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`; };
const mkey = d => dkey(d).slice(0, 7);
const today = () => dkey(new Date());
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const MONTHS = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
const monthName = k => { const [y, m] = k.split('-'); return `${MONTHS[+m - 1]} ${y}`; };
const prevMonthKey = k => { const [y, m] = k.split('-').map(Number); return mkey(new Date(y, m - 2, 1)); };
const nextMonthKey = () => mkey(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1));
const dayLabel = k => { if (k === today()) return 'היום'; if (k === dkey(addDays(new Date(), -1))) return 'אתמול'; const [, m, d] = k.split('-'); return `ב־${+d}.${+m}`; };
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------- state (תואם לגרסה 1: אותו מפתח ואותו מבנה, רק שדות נוספים) ----------
function emptyState() {
  return {
    version: 2, onboarded: false, demo: false, me: null,
    users: { gavir: { incomes: [], personalBudget: 0 }, esti: { incomes: [], personalBudget: 0 } },
    categories: DEFAULT_CATS.map(c => ({ ...c, budget: 0 })),
    expenses: [], templates: [],
    fund: { name: 'קרן חירום', target: 0, saved: 0 },
    unlocked: {}, subsReviewed: null, plans: {}, recentCats: [],
    openDays: [], guideViews: [], deposits: 0, fastAdds: 0,
  };
}
let S = load();
function load() {
  try { const r = JSON.parse(localStorage.getItem(KEY)); if (r && r.version) { const s = Object.assign(emptyState(), r); s.version = 2; return s; } } catch (e) { }
  return emptyState();
}
function save() { localStorage.setItem(KEY, JSON.stringify(S)); window.Sync?.push?.(S); }

// ---------- computations ----------
const cat = id => S.categories.find(c => c.id === id) || { name: 'שונות', id: 'misc', kind: 'want' };
const catColor = id => CAT_COLORS[id] || EXTRA_COLORS[Math.abs([...String(id)].reduce((a, c) => a + c.charCodeAt(0), 0)) % EXTRA_COLORS.length];
const userIncome = u => S.users[u].incomes.reduce((a, i) => a + (+i.amount || 0), 0);
const totalIncome = () => userIncome('gavir') + userIncome('esti');
const sharedBudget = () => S.categories.reduce((a, c) => a + (+c.budget || 0), 0);
const pBudget = u => +S.users[u].personalBudget || 0;
const totalBudget = () => sharedBudget() + pBudget('gavir') + pBudget('esti');
const monthExp = (k = mkey(new Date())) => S.expenses.filter(e => e.date.slice(0, 7) === k);
const sum = arr => arr.reduce((a, e) => a + (+e.amount || 0), 0);
const catSpent = (id, k) => sum(monthExp(k).filter(e => e.scope === 'shared' && e.cat === id));
const personalSpent = (u, k) => sum(monthExp(k).filter(e => e.scope === 'personal' && e.user === u));
const sharedSpent = k => sum(monthExp(k).filter(e => e.scope === 'shared'));
const visible = e => e.scope === 'shared' || e.user === S.me; // פרטיות: לא רואים פירוט אישי של בן הזוג
const other = u => (u === 'gavir' ? 'esti' : 'gavir');
const status = p => (p >= 1 ? 'danger' : p >= .8 ? 'warn' : 'ok');
const partnerLeft = () => {
  const o = other(S.me);
  const r = window.Sync?.partnerRemaining?.(); // בסנכרון: השרת מחזיר רק יתרה
  return typeof r === 'number' ? r : pBudget(o) - personalSpent(o);
};

function activeDays() { return new Set([...S.expenses.map(e => e.date), ...S.openDays]); }
function streakDays() { // ימים רצופים שבהם פתחו את האפליקציה או רשמו הוצאה. חריגה לא מאפסת.
  const days = activeDays(); let d = new Date(); if (!days.has(dkey(d))) d = addDays(d, -1);
  let n = 0; while (days.has(dkey(d))) { n++; d = addDays(d, -1); } return n;
}
function openStreak() { const days = new Set(S.openDays); let d = new Date(), n = 0; while (days.has(dkey(d))) { n++; d = addDays(d, -1); } return n; }
function weekUnderStreak() {
  if (!S.expenses.length || !totalBudget()) return 0;
  const first = S.expenses.reduce((m, e) => (e.date < m ? e.date : m), today());
  const weekly = totalBudget() * 7 / 30; let n = 0, end = addDays(new Date(), -1);
  for (let w = 0; w < 52; w++) {
    const start = addDays(end, -6); if (dkey(start) < first) break;
    if (sum(S.expenses.filter(e => e.date >= dkey(start) && e.date <= dkey(end))) <= weekly) n++; else break;
    end = addDays(start, -1);
  }
  return n;
}
function pastMonths() { const ks = [...new Set(S.expenses.map(e => e.date.slice(0, 7)))].filter(k => k < mkey(new Date())); return ks.sort(); }
function savingMonths() { const inc = totalIncome(); return inc ? pastMonths().filter(k => sum(monthExp(k)) < inc).length : 0; }
function monthUnderCap() { return pastMonths().some(k => S.categories.every(c => !c.budget || catSpent(c.id, k) <= c.budget)); }
const fundPct = () => (S.fund.target ? S.fund.saved / S.fund.target : 0);
function xp() {
  return S.expenses.length * 10 + new Set(S.expenses.map(e => e.date)).size * 5
    + ['gavir', 'esti'].filter(u => S.users[u].incomes.length).length * 20
    + S.guideViews.length * 15 + Object.keys(S.plans).length * 30 + weekUnderStreak() * 50
    + monthUnderCapCount() * 100 + (S.deposits || 0) * 40 + BADGES.filter(b => S.unlocked[b.id]).length * BADGE_XP;
}
function monthUnderCapCount() { return pastMonths().filter(k => S.categories.every(c => !c.budget || catSpent(c.id, k) <= c.budget)).length; }
function level() {
  const x = xp(); let i = 0; while (i < LEVEL_AT.length - 1 && x >= LEVEL_AT[i + 1]) i++;
  const lo = LEVEL_AT[i], hi = LEVEL_AT[i + 1] ?? lo + 1000;
  return { lv: i + 1, name: LEVEL_NAMES[i], x, pct: Math.min(1, (x - lo) / (hi - lo)), toNext: hi - x };
}
function checkAchievements(silent = false) {
  const m = monthExp();
  const cond = {
    first: S.expenses.length >= 1, fast: S.fastAdds > 0, eye: S.guideViews.length > 0,
    both: m.some(e => e.user === 'gavir') && m.some(e => e.user === 'esti'),
    salaries: S.users.gavir.incomes.length > 0 && S.users.esti.incomes.length > 0,
    streak7: streakDays() >= 7, underCap: monthUnderCap(), fundFirst: S.deposits > 0 || S.fund.saved > 0,
    clean: weekUnderStreak() >= 2, saver: savingMonths() >= 3, planOk: Object.keys(S.plans).length > 0,
    morning: openStreak() >= 7, ten: S.expenses.length >= 10, subsReview: !!S.subsReviewed,
    ef50: fundPct() >= .5, ef100: fundPct() >= 1,
  };
  const fresh = BADGES.filter(b => cond[b.id] && !S.unlocked[b.id]);
  fresh.forEach(b => S.unlocked[b.id] = Date.now());
  if (fresh.length) { save(); if (!silent) fresh.forEach((b, i) => setTimeout(() => celebrate(b), 900 + i * 1600)); }
  return fresh;
}

// ---------- effects ----------
function toast(text, kind = '', ico = '') {
  const t = document.createElement('div'); t.className = 'toast ' + kind;
  t.innerHTML = `${ico ? `<span class="ico">${ico}</span>` : ''}<div>${text}</div>`; $('#toasts').appendChild(t);
  setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 300); }, 3200);
}
function celebrate(b) { confetti(); toast(`הישג חדש: ${esc(b.name)}<span class="hint">${esc(b.desc)} · ‎+${BADGE_XP} נקודות</span>`, 'ach', b.emoji); navigator.vibrate?.([30, 50, 30]); if (current === 'achieve') render('achieve', true); }
function confetti() {
  if (reduced()) return;
  const cv = $('#confetti'), ctx = cv.getContext('2d'), dpr = devicePixelRatio || 1;
  const W = cv.width = cv.offsetWidth * dpr, H = cv.height = cv.offsetHeight * dpr;
  const colors = ['#FFD44D', '#FF5A73', '#FF7A3C', '#9B7CFF', '#B8F06E', '#7EF0C4', '#8FD8FF', '#FF7AC8'];
  const P = Array.from({ length: 150 }, () => ({ x: W / 2 + (Math.random() - .5) * W * .3, y: H * .3, vx: (Math.random() - .5) * 22 * dpr, vy: (Math.random() * -18 - 5) * dpr, s: (7 + Math.random() * 7) * dpr, r: Math.random() * 6, vr: (Math.random() - .5) * .35, c: colors[Math.random() * colors.length | 0], round: Math.random() < .35 }));
  let f = 0; const N = 120; cancelAnimationFrame(confetti.raf);
  (function tick() {
    ctx.clearRect(0, 0, W, H); f++;
    for (const p of P) { p.vy += .42 * dpr; p.vx *= .985; p.x += p.vx; p.y += p.vy; p.r += p.vr; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.globalAlpha = Math.max(0, 1 - f / N); ctx.fillStyle = p.c; ctx.strokeStyle = '#1B1410'; ctx.lineWidth = dpr; if (p.round) { ctx.beginPath(); ctx.arc(0, 0, p.s / 2, 0, 7); ctx.fill(); ctx.stroke(); } else { ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); ctx.strokeRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); } ctx.restore(); }
    if (f < N) confetti.raf = requestAnimationFrame(tick); else ctx.clearRect(0, 0, W, H);
  })();
}
function xpFloat(text = '+10') {
  const el = document.createElement('div'); el.className = 'xp-float'; el.textContent = text;
  el.style.left = '50%'; el.style.bottom = '110px'; el.style.marginLeft = '-20px'; $('#app').appendChild(el);
  setTimeout(() => el.remove(), 950);
}
function animateIn(root) {
  const fin = () => { $$('[data-p]', root).forEach(b => b.style.width = b.dataset.p); };
  $$('[data-count]', root).forEach(n => {
    const to = +n.dataset.count; if (reduced()) { n.innerHTML = ils(to); return; }
    const t0 = performance.now();
    (function st(t) { const p = Math.min(1, (t - t0) / 800); const e = 1 - Math.pow(1 - p, 3); n.innerHTML = ils(to * e); if (p < 1) requestAnimationFrame(st); })(t0);
  });
  if (reduced()) fin(); else requestAnimationFrame(() => requestAnimationFrame(fin));
}
const cnt = n => `<span data-count="${Math.round(n)}">${ils(0)}</span>`;
const bar = (p, cls = '', style = '') => `<div class="bar ${cls}" ${style}><i data-p="${Math.max(0, Math.min(100, p * 100))}%"></i></div>`;

// ---------- navigation ----------
const ORDER = ['home', 'budget', 'add', 'guide', 'achieve', 'income', 'expenses', 'settings'];
const NO_DOCK = ['add', 'login', 'onboard'];
let current = null, addCtx = null;
function render(name, instant = false) {
  const stage = $('#stage'); const old = stage.querySelector('.screen');
  const el = document.createElement('section');
  el.className = 'screen' + (NO_DOCK.includes(name) ? ' no-dock' : '');
  el.innerHTML = `<div class="enter">${SCREENS[name]()}</div>`; el.dataset.screen = name;
  const swap = () => { old?.remove(); stage.appendChild(el); };
  const doAnim = !instant && !reduced() && old;
  if (doAnim && document.startViewTransition) document.startViewTransition(swap);
  else {
    swap();
    if (doAnim) el.animate([{ opacity: 0, transform: 'translateY(16px) scale(.98)' }, { opacity: 1, transform: 'none' }], { duration: 380, easing: 'cubic-bezier(.22,1,.36,1)' });
  }
  if (instant) $('.enter', el).classList.remove('enter');
  current = name; renderDock(); $('#demoPill').classList.toggle('hidden', !S.demo);
  bindScreen(el, name); animateIn(el);
}
function renderDock() {
  const d = $('#dock'); const show = S.onboarded && S.me && !NO_DOCK.includes(current);
  d.classList.toggle('away', !show);
  const tab = (id, label, icon) => `<button data-tab="${id}" class="${current === id ? 'on' : ''}" aria-label="${label}">${ICONS[icon]}<span>${label}</span></button>`;
  d.innerHTML = tab('home', 'סקירה', 'home') + tab('budget', 'תקציב', 'budget') +
    `<button class="fab ${S.expenses.some(e => e.date === today() && e.user === S.me) ? '' : 'pulse'}" data-tab="add" aria-label="הוספת הוצאה">${ICONS.plus}</button>` +
    tab('guide', 'הכוונה', 'guide') + tab('achieve', 'הישגים', 'star');
  $$('[data-tab]', d).forEach(b => b.onclick = () => { const t = b.dataset.tab; if (t === 'add') openAdd(); else if (t !== current) render(t); });
}
function openAdd(expId = null) { addCtx = { id: expId, t0: Date.now() }; render('add'); }

// ---------- screens ----------
const avatar = (u, cls = '') => `<span class="avatar ${u} ${cls}">${USERS[u].letter}</span>`;
const whoChip = u => `<span class="who ${u}">${USERS[u].name}</span>`;
function hello(title, sub, right = '') {
  return `<div class="hello"><button class="avatar ${S.me}" data-act="switch" aria-label="החלפת פרופיל">${USERS[S.me].letter}</button><div class="t"><h1>${title}</h1><p>${sub}</p></div>${right}</div>`;
}
function expRow(e) {
  const c = cat(e.cat); const mine = e.user === S.me;
  const tag = mine ? 'button' : 'div';
  return `<${tag} class="row" ${mine ? `data-edit="${e.id}" aria-label="עריכת הוצאה"` : ''}><span class="dot" style="background:${catColor(e.cat)}"></span><div class="meta"><b>${esc(e.note || c.name)}</b><span>${esc(c.name)} · ${e.scope === 'shared' ? 'משותף' : 'אישי'} · ${dayLabel(e.date)}</span></div>${whoChip(e.user)}<div class="pay">${ils(e.amount)}</div></${tag}>`;
}
function alertsHtml(k) {
  const items = S.categories.filter(c => c.budget).map(c => ({ c, used: catSpent(c.id, k), p: catSpent(c.id, k) / c.budget })).filter(x => x.p >= .8);
  if (!items.length) return '';
  return `<div class="alerts"><div class="hd">משהו לשים לב אליו</div>${items.map(x => x.p >= 1
    ? `<div class="alert danger"><span class="ico">🚨</span><div>חריגה: ${esc(x.c.name)} עברו את התקרה, ${ils(x.used)} מתוך ${ils(x.c.budget)}.</div></div>`
    : `<div class="alert warn"><span class="ico">⚠️</span><div>${esc(x.c.name)} הגיעו ל־${Math.round(x.p * 100)}% מהתקרה, ${ils(x.used)} מתוך ${ils(x.c.budget)}.</div></div>`).join('')}</div>`;
}
function fundCard() {
  const p = fundPct();
  return `<div class="fund"><div class="top"><span>יעד ראשון: ${esc(S.fund.name)}</span><span>${Math.round(p * 100)}%</span></div>${bar(p)}
    <div class="spread" style="margin-top:8px"><span class="hint" style="color:var(--ink);margin:0">${ils(S.fund.saved)} מתוך ${ils(S.fund.target)}</span><button class="btn sm" data-act="deposit">הפקדתי</button></div>
    <span class="hint" style="color:var(--ink)">כלל אצבע: קרן בגובה שלושה חודשי הוצאות.</span></div>`;
}
const SCREENS = {
  login() {
    return `<div class="login"><div class="brand">${LOGO}<h1>קליל</h1><p>הכסף של הבית, בקלילות</p></div>
      ${['gavir', 'esti'].map(u => `<button class="profile-card ${u}" data-me="${u}"><span class="letter">${USERS[u].letter}</span><div><h2>${USERS[u].name}</h2><span>${u === S.me ? 'הפרופיל הנוכחי' : 'כניסה לפרופיל'}</span></div></button>`).join('')}
      <p class="fine">כל אחד נכנס לפרופיל שלו ומזין רק את ההוצאות ואת המשכורת שלו.${window.Sync?.enabled ? '' : ' בגרסה הזו הנתונים נשמרים במכשיר בלבד.'}</p></div>`;
  },
  home() {
    const k = mkey(new Date()); const inc = totalIncome(); const spent = sum(monthExp(k)); const me = S.me, o = other(me);
    const myLeft = pBudget(me) - personalSpent(me, k); const L = level();
    const recent = S.expenses.filter(visible).sort((a, b) => (b.date + (b.ts || '')).localeCompare(a.date + (a.ts || ''))).slice(0, 5);
    return `${hello(`שלום ${USERS[me].name}`, `תמונת החודש · ${monthName(k)}`, `<button class="icon-btn" data-go="settings" aria-label="הגדרות">${ICONS.gear}</button>`)}
      <div class="hero"><div class="kicker">נשאר לחודש, מתוך הכנסות הבית</div><div class="amt">${cnt(inc - spent)}</div><div class="sub">הוצאות ${ils(spent)} · הכנסות ${ils(inc)}</div>
        <div class="hero-row"><div class="xp-mini"><div class="t"><span>רמה ${L.lv}</span><span>${streakDays()} ימים ברצף 🔥</span></div>${bar(L.pct)}</div></div></div>
      <div class="grid2"><button class="kpi" data-go="budget"><div class="l">תקציב הבית</div><div class="v">${ils(sharedBudget() - sharedSpent(k))}</div><span class="hint">נשאר מתוך ${ilsT(sharedBudget())}</span></button>
        <button class="kpi" data-go="income"><div class="l">הכנסות הבית</div><div class="v">${ils(inc)}</div><span class="hint">משתי המשכורות</span></button></div>
      ${alertsHtml(k)}
      <div class="sec"><h2>התקציב האישי</h2></div>
      <div class="card"><div class="row" style="padding-top:0">${avatar(me, 'sm')}<div class="meta"><b>שלך נשארו ${ils(myLeft)}</b><span>נוצל ${ils(personalSpent(me, k))} מתוך ${ils(pBudget(me))}</span></div></div>${bar(pBudget(me) ? personalSpent(me, k) / pBudget(me) : 0, myLeft < 0 ? 'danger' : 'lime')}</div>
      <div class="partner">${avatar(o, 'sm')}<div><b>ל${USERS[o].name} נשארה יתרה</b><span class="hint">רואים רק יתרה, בלי פירוט הוצאות</span></div><div class="amt">${ils(partnerLeft())}</div></div>
      <div class="sec"><h2>קרן חירום</h2><button class="link" data-go="guide">לתוכנית</button></div>${fundCard()}
      <div class="sec"><h2>הוצאות אחרונות</h2><button class="link" data-go="expenses">הכול</button></div>
      <div class="card">${recent.length ? recent.map(expRow).join('') : `<div class="empty"><span class="e">🐣</span>עוד אין הוצאות. לחצו על הפלוס הצהוב, זה לוקח פחות מעשר שניות.</div>`}</div>`;
  },
  expenses() {
    const k = mkey(new Date());
    const list = S.expenses.filter(visible).sort((a, b) => (b.date + (b.ts || '')).localeCompare(a.date + (a.ts || '')));
    const months = [...new Set(list.map(e => e.date.slice(0, 7)))];
    return `<div class="add-top"><button class="back" data-go="home" aria-label="חזרה">${ICONS.back}</button><h1>כל ההוצאות</h1></div>
      <p class="hint" style="margin-bottom:10px">לחיצה על הוצאה שלך פותחת עריכה או מחיקה. הוצאות של בן הזוג מוצגות לקריאה בלבד, ואת ההוצאות האישיות שלו לא רואים.</p>
      ${months.length ? months.map(m => `<div class="sec"><h2>${monthName(m)}</h2><span class="hint">${ilsT(sum(list.filter(e => e.date.startsWith(m))))}</span></div><div class="card">${list.filter(e => e.date.startsWith(m)).map(expRow).join('')}</div>`).join('') : `<div class="card"><div class="empty"><span class="e">🐣</span>עוד אין הוצאות.</div></div>`}`;
  },
  add() {
    const e = addCtx?.id ? S.expenses.find(x => x.id === addCtx.id) : null;
    const st = addCtx.st = addCtx.st || { amount: e ? String(Math.round(e.amount)) : '', cat: e?.cat || S.recentCats.find(id => S.categories.some(c => c.id === id)) || null, scope: e?.scope || 'shared', note: e?.note || '' };
    const recent = S.recentCats.filter(id => S.categories.some(c => c.id === id)).slice(0, 3);
    const ordered = [...recent.map(cat), ...S.categories.filter(c => !recent.includes(c.id))];
    const myT = e ? [] : S.templates.filter(t => t.scope === 'shared' || !t.user || t.user === S.me);
    return `<div class="add-top"><button class="back" data-act="closeAdd" aria-label="חזרה">${ICONS.back}</button><h1>${e ? 'עריכת הוצאה' : 'הוספת הוצאה'}</h1></div>
      ${myT.length ? `<div class="tpls" aria-label="תבניות קבועות">${myT.map(t => `<button class="tpl" data-tpl="${t.id}"><span class="dot" style="display:inline-block;width:10px;height:10px;background:${catColor(t.cat)}"></span> ${esc(t.label)}<small>${ilsT(t.amount)}</small></button>`).join('')}</div>` : ''}
      <div class="amount-box"><div class="lbl">סכום בשקלים</div><div class="val ${st.amount ? '' : 'placeholder'}" id="amtVal" aria-live="polite">${st.amount ? ilsT(+st.amount) : '0 ₪'}</div></div>
      <div class="payer">${whoChip(S.me)} משלם את ההוצאה מהפרופיל שלו</div>
      <div class="seg" role="tablist"><button data-s="shared" class="${st.scope === 'shared' ? 'on' : ''}">משותף</button><button data-s="personal" class="${st.scope === 'personal' ? 'on' : ''}">אישי</button></div>
      <div class="chips">${ordered.map(c => `<button class="chip ${st.cat === c.id ? 'on' : ''}" data-c="${c.id}" style="--c:${catColor(c.id)}">${esc(c.name)}</button>`).join('')}</div>
      <input id="note" class="note" placeholder="הערה (לא חובה)" value="${esc(st.note)}" maxlength="60">
      <div class="keypad" aria-label="מקלדת סכום">${['1', '2', '3', '4', '5', '6', '7', '8', '9', '00', '0', 'del'].map(k => `<button data-k="${k}" aria-label="${k === 'del' ? 'מחיקת ספרה' : k}">${k === 'del' ? '⌫' : k}</button>`).join('')}</div>
      ${e ? '' : '<label class="opt"><input type="checkbox" id="asTpl"> שמירה גם כתבנית קבועה</label>'}
      <button class="btn primary" id="saveExp" ${st.amount && st.cat ? '' : 'disabled'}>${e ? 'שמירת השינויים' : 'שמירה'}</button>
      ${e ? '<button class="btn danger" data-act="delExp">מחיקת ההוצאה</button>' : ''}`;
  },
  budget() {
    const k = mkey(new Date()); const me = S.me, o = other(me);
    const rows = S.categories.map(c => {
      const used = catSpent(c.id, k), b = +c.budget || 0, p = b ? used / b : 0, s = status(p);
      return `<button class="cat-row" data-cat="${c.id}"><div class="top"><span class="dot" style="background:${catColor(c.id)}"></span><span class="name">${esc(c.name)}</span>${b ? `<span class="badge ${s}">${s === 'danger' ? '100% חריגה' : s === 'warn' ? 'מעל 80%' : 'תקין'}</span>` : '<span class="badge">בלי תקרה</span>'}<span class="used">${ils(used)}</span></div>
        ${bar(p, s === 'ok' ? 'cat' : s, `style="--c:${catColor(c.id)}"`)}<div class="bot"><span>תקרה ${ilsT(b)}</span><span>${b - used >= 0 ? 'נשארו ' + ilsT(b - used) : 'חריגה ' + ilsT(used - b)}</span></div></button>`;
    }).join('');
    const mine = S.expenses.filter(e => e.scope === 'personal' && e.user === me && e.date.startsWith(k));
    const myUsed = sum(mine), myB = pBudget(me);
    return `${hello('התקציב החודשי', 'משותף לבית, ואישי לכל אחד')}
      <div class="card"><div class="spread"><h3 style="margin:0">התקציב המשותף</h3><span class="used" style="font-family:var(--font-display);font-weight:700;font-size:20px">${ils(sharedSpent(k))}</span></div><span class="hint">לחיצה על קטגוריה משנה את התקרה שלה · סך התקרות ${ilsT(sharedBudget())}</span>${rows}
        <button class="btn ghost" data-act="addCat" style="margin-top:8px">הוספת קטגוריה</button></div>
      <div class="sec"><h2>התקציב האישי שלך</h2><button class="link" data-act="editPersonal">שינוי</button></div>
      <div class="card"><div class="spread"><b>נוצל ${ils(myUsed)} מתוך ${ils(myB)}</b><span>${myB - myUsed >= 0 ? `נשארו ${ils(myB - myUsed)}` : `חריגה ${ils(myUsed - myB)}`}</span></div>${bar(myB ? myUsed / myB : 0, myUsed > myB ? 'danger' : 'lime')}
        ${mine.length ? mine.map(expRow).join('') : '<span class="hint">עוד אין הוצאות אישיות החודש.</span>'}</div>
      <div class="sec"><h2>היתרה של ${USERS[o].name}</h2></div>
      <div class="partner">${avatar(o, 'sm')}<div><b>יתרה אישית בלבד</b><span class="hint">בלי פירוט הקניות וההוצאות</span></div><div class="amt">${ils(partnerLeft())}</div></div>
      <div class="sec"><h2>תבניות ומנויים קבועים</h2></div>
      <div class="card">${S.templates.length ? S.templates.map(t => `<div class="row"><span class="dot" style="background:${catColor(t.cat)}"></span><div class="meta"><b>${esc(t.label)}</b><span>${esc(cat(t.cat).name)} · ${t.scope === 'shared' ? 'משותף' : 'אישי'}</span></div><div class="pay">${ils(t.amount)}</div><button class="link" data-deltpl="${t.id}" aria-label="מחיקת תבנית">✕</button></div>`).join('') : '<span class="hint">אין עדיין תבניות. במסך ההוספה אפשר לסמן "שמירה גם כתבנית קבועה".</span>'}</div>`;
  },
  guide() {
    const k = mkey(new Date()); const inc = totalIncome(); const ex = monthExp(k); const spent = sum(ex);
    const byCat = {}; ex.filter(e => e.scope === 'shared').forEach(e => byCat[e.cat] = (byCat[e.cat] || 0) + +e.amount);
    const top = Object.entries(byCat).sort((a, b) => b[1] - a[1]).slice(0, 3);
    const needs = sum(ex.filter(e => e.scope === 'shared' && cat(e.cat).kind === 'need')); const wants = spent - needs; const saved = Math.max(0, inc - spent);
    const pct = v => (inc ? Math.round(v / inc * 100) : 0);
    const kind = !inc ? 'warn' : spent > inc ? 'danger' : 'ok';
    const subs = S.templates.filter(t => t.cat === 'subs'); const plan = proposePlan(); const nk = nextMonthKey();
    return `${hello('ההכוונה של החודש', 'שלוש שאלות וצעד אחד קדימה')}
      <div class="callout ${kind}"><div class="qk">שאלה 1</div><h3>הוצאנו יותר ממה שהרווחנו?</h3>${!inc ? 'עוד לא הוזנו הכנסות, אז אי אפשר לדעת. הוסיפו משכורות במסך ההכנסות.' : spent > inc ? `כן. הוצאנו ${ils(spent)} מתוך הכנסה של ${ils(inc)}, חריגה של ${ils(spent - inc)}.` : `לא! נשארו ${pct(inc - spent)}% מההכנסה, ${ils(inc - spent)}.`}</div>
      <div class="card" style="margin-top:10px"><div class="qk">שאלה 2</div><h3>איפה הכסף דולף?</h3>${top.length ? top.map(([c, v], i) => `<div class="leak"><span class="rank">${i + 1}</span><div style="flex:1"><b>${esc(cat(c).name)}</b>${bar(v / top[0][1], 'cat', `style="--c:${catColor(c)}"`)}</div><b>${ils(v)}</b></div>`).join('') : '<span class="hint">עוד אין מספיק הוצאות החודש כדי לדעת.</span>'}
        ${subs.length ? `<span class="hint">מנויים קבועים: ${subs.map(t => `${esc(t.label)} ${ilsT(t.amount)}`).join(', ')}. יש כפל?</span>` : ''}</div>
      <div class="step"><div class="qk">שאלה 3</div><h3>הצעד לחודש הבא</h3>${suggestStep(top, spent > inc, inc, spent)}</div>
      <div class="card"><h3>כלל 50/30/20</h3>
        ${[['#FFC89A', 'צרכים, 50%', 'חשבונות, מזון, ילדים, תחבורה', needs, 50], ['#FF9AD4', 'רצונות, 30%', 'אוכל בחוץ, מנויים, קניות, אישי', wants, 30], ['#B8F06E', 'חיסכון וקרן חירום, 20%', 'ברירת המחדל ליעד הראשון', saved, 20]].map(([c, n, h, v, t]) => `<div class="rule"><span class="swatch" style="background:${c}"></span><div style="flex:1"><b>${n}</b><span class="hint">${h} · בפועל ${pct(v)}%</span></div><b>${ils(inc * t / 100)}</b></div>`).join('')}</div>
      ${fundCard()}
      <div class="card" style="margin-top:10px"><h3>בדיקת מנויים</h3><span class="hint">סך המנויים הקבועים: ${ilsT(sum(subs))} בחודש.</span><button class="btn ghost" data-act="subsReview" style="margin-top:10px">${S.subsReviewed ? `נבדק ב־${new Date(S.subsReviewed).toLocaleDateString('he-IL')} ✓` : 'סימון: עברנו על המנויים'}</button></div>
      <div class="plan"><h3 class="h3">התוכנית ל${monthName(nk)}</h3>${plan.length ? plan.map(p => `<div class="spread" style="padding:4px 0"><span>${esc(p.name)}</span><span>${ils(p.old)} ← <b>${ils(p.nu)}</b></span></div>`).join('') : '<span class="hint">אין שינויים מוצעים. התקציב נראה מאוזן.</span>'}
        <button class="btn primary" data-act="approvePlan" style="margin-top:12px" ${S.plans[nk] ? 'disabled' : ''}>${S.plans[nk] ? 'אישרתם יחד ✓' : 'אישור התוכנית יחד'}</button></div>`;
  },
  achieve() {
    const L = level(); const got = BADGES.filter(b => S.unlocked[b.id]).length;
    return `<div class="ach-hero"><div class="lvl"><small>רמה</small><b>${L.lv}</b></div><h2>כל הכבוד, ${USERS[S.me].name}</h2><div class="pts">${fmtN(L.x)} נקודות · ${L.lv < LEVEL_AT.length ? `עוד ${fmtN(L.toNext)} לרמה ${L.lv + 1}` : 'הרמה הגבוהה ביותר'}</div>${bar(L.pct)}
        <div class="streaks"><span class="streak">רצף של ${streakDays()} ימים 🔥</span><span class="streak">שבועות בתקציב: ${weekUnderStreak()} 🛡️</span></div></div>
      <div class="sec"><h2>תגים</h2><span class="hint">${got} מתוך ${BADGES.length}</span></div>
      <div class="badges">${BADGES.map(b => { const on = S.unlocked[b.id]; return `<button class="badge-card ${on ? (Date.now() - on < 6e4 ? 'new' : '') : 'lock'}" data-badge="${b.id}"><span class="emoji">${on ? b.emoji : '🔒'}</span><b>${esc(b.name)}</b><span>${esc(b.desc)}</span></button>`; }).join('')}</div>
      <p class="hint" style="text-align:center;margin-top:14px">רצף נספר לפי ימים שבהם פתחתם את האפליקציה או רשמתם הוצאה. חריגה לא מאפסת את הרצף.</p>
      <div class="card" style="margin-top:10px"><h3>איך צוברים נקודות</h3><span class="hint" style="line-height:1.8">הוצאה: 10 · הוצאה ראשונה ביום: 5 נוספות · הזנת משכורת: 20 · צפייה בהכוונה: 15 בחודש · אישור תוכנית: 30 · שבוע בלי חריגה: 50 · חודש מתחת לתקציב: 100 · הפקדה לקרן: 40 · כל תג: ${BADGE_XP}</span></div>`;
  },
  income() {
    const me = S.me, o = other(me); const inc = totalIncome();
    const list = u => S.users[u].incomes.length ? S.users[u].incomes.map(i => `<div class="row"><div class="meta"><b>${esc(i.label)}</b><span>נכנס ב־${i.day} לחודש</span></div><div class="pay">${ils(i.amount)}</div>${u === me ? `<button class="link" data-editinc="${i.id}">עריכה</button>` : ''}</div>`).join('') : '<span class="hint">עוד לא הוזנו הכנסות.</span>';
    return `<div class="add-top"><button class="back" data-go="home" aria-label="חזרה">${ICONS.back}</button><h1>הכנסות</h1></div>
      <div class="total-card"><div class="hint" style="color:var(--ink);font-weight:700">סך הכנסות הבית בחודש</div><div class="v">${cnt(inc)}</div><span class="hint" style="color:var(--ink)">תקציב כולל ${ilsT(totalBudget())} · נשאר לחיסכון ${ilsT(inc - totalBudget())}</span></div>
      <div class="inc-card mine"><h3>${avatar(me, 'sm')} ההכנסות שלך</h3>${list(me)}<button class="btn sm" data-act="addIncome" style="margin-top:10px">הוספת הכנסה</button></div>
      <div class="inc-card theirs"><h3>${avatar(o, 'sm')} ההכנסות של ${USERS[o].name}</h3>${list(o)}<span class="hint">גלוי לקריאה כי סך הבית מחושב ממנו. רק ${USERS[o].name} יכול/ה לערוך.</span></div>`;
  },
  settings() {
    const sy = window.Sync;
    return `<div class="add-top"><button class="back" data-go="home" aria-label="חזרה">${ICONS.back}</button><h1>הגדרות</h1></div>
      <div class="card"><h3>פרופיל</h3><div class="row">${avatar(S.me, 'sm')}<div class="meta"><b>${USERS[S.me].name}</b><span>הפרופיל המחובר</span></div></div><button class="btn ghost" data-act="switch">החלפת פרופיל</button></div>
      <div class="card"><h3>גיבוי</h3><span class="hint">שמרו קובץ גיבוי מדי פעם. אפשר לטעון אותו גם בטלפון אחר.</span><div class="grid2"><button class="btn primary" data-act="export" style="font-size:17px">ייצוא קובץ</button><button class="btn ghost" data-act="import" style="font-size:17px;margin:0">ייבוא קובץ</button></div><input type="file" id="importFile" accept="application/json,.json" hidden></div>
      <div class="card"><h3>נתוני דוגמה</h3><span class="hint">נתונים מומצאים לגמרי, מסומנים בתווית "נתוני דוגמה". הם מחליפים את מה שיש עכשיו במכשיר.</span><button class="btn ghost" data-act="demo" style="margin-top:10px">טען נתוני דוגמה</button></div>
      <div class="notebox"><b>חשוב לדעת:</b> ${sy?.enabled ? `הסנכרון פעיל (${esc(sy.statusText?.() || '')}). כל אחד מעלה רק את הנתונים שלו, ובן הזוג רואה רק את היתרה האישית שלך.` : 'בגרסה הזו הנתונים נשמרים רק במכשיר הזה, בדפדפן. הם לא עולים לשום שרת ולא מסתנכרנים בין הטלפונים. סנכרון בין שני הטלפונים, עם חשבון נפרד לכל אחד, מגיע בגרסה הבאה. עד אז כדאי לייצא גיבוי באופן קבוע.'}</div>
      ${sy?.enabled ? '<div class="card" style="margin-top:10px"><h3>סנכרון</h3><button class="btn ghost" data-act="syncNow">סנכרון עכשיו</button><button class="btn ghost" data-act="signOut">התנתקות</button></div>' : ''}
      <div class="card" style="margin-top:10px"><h3>איפוס</h3><button class="btn danger" data-act="reset">מחיקת כל הנתונים במכשיר</button></div>
      <p class="hint" style="text-align:center;margin-top:12px">גרסה 2.0 · קליל</p>`;
  },
};
function suggestStep(top, over, inc, spent) {
  if (!inc) return 'להזין את המשכורות של שניכם, כדי שנוכל לחשב תקציב והכוונה.';
  const hot = S.categories.find(c => c.budget && catSpent(c.id) > c.budget);
  if (over && top[0]) return `לקצץ 10% ב${esc(cat(top[0][0]).name)}, הקטגוריה הכי גדולה. זה חיסכון של כ־${ils(top[0][1] * .1)} בחודש.`;
  if (hot) return `${esc(hot.name)} חרגו מהתקרה. נסו לקבוע להם יום קבוע בשבוע, או להעלות את התקרה בצורה מודעת בתוכנית.`;
  if (fundPct() < 1) return `להעביר ${ils(Math.max(100, Math.round((inc - spent) * .5 / 50) * 50))} לקרן החירום מיד כשהמשכורת נכנסת.`;
  return 'קרן החירום מלאה! זה הזמן לבחור יחד יעד חיסכון חדש 🎉';
}
function proposePlan() {
  const k = mkey(new Date());
  return S.categories.filter(c => c.budget).map(c => { const s = catSpent(c.id, k); let nu = c.budget; if (s > c.budget) nu = Math.round((c.budget + s) / 2 / 10) * 10; else if (s < c.budget * .6 && new Date().getDate() > 20) nu = Math.round((c.budget + s) / 2 / 10) * 10; return { ...c, old: c.budget, nu }; }).filter(p => p.nu !== p.old);
}

// ---------- bindings ----------
function bindScreen(el, name) {
  $$('[data-go]', el).forEach(b => b.onclick = () => render(b.dataset.go));
  $$('[data-act]', el).forEach(b => b.onclick = () => ACTS[b.dataset.act](b));
  $$('[data-edit]', el).forEach(b => b.onclick = () => openAdd(b.dataset.edit));
  $$('[data-cat]', el).forEach(b => b.onclick = () => editCat(b.dataset.cat));
  $$('[data-deltpl]', el).forEach(b => b.onclick = () => { S.templates = S.templates.filter(t => t.id !== b.dataset.deltpl); save(); render(name, true); toast('התבנית נמחקה', 'ok'); });
  $$('[data-editinc]', el).forEach(b => b.onclick = () => incomeSheet(b.dataset.editinc));
  $$('[data-badge]', el).forEach(b => b.onclick = () => { const x = BADGES.find(z => z.id === b.dataset.badge); toast(`${esc(x.name)}: ${esc(x.desc)}${S.unlocked[x.id] ? '' : ' (עוד נעול)'}`, '', x.emoji); });
  $$('[data-me]', el).forEach(b => b.onclick = () => { S.me = b.dataset.me; save(); render('home'); toast(`שלום ${USERS[S.me].name}!`, 'ok', '👋'); });
  if (name === 'add') bindAdd(el);
  if (name === 'guide') { const k = mkey(new Date()); if (!S.guideViews.includes(k)) { S.guideViews.push(k); save(); xpFloat('+15'); checkAchievements(); } }
}
const ACTS = {
  switch() {
    if (window.Sync?.enabled) return openSheet(`<h2>מחובר/ת כ${USERS[S.me].name}</h2><span class="hint">בסנכרון כל אחד נכנס עם החשבון שלו. כדי להחליף משתמש צריך להתנתק.</span><button class="btn danger" id="so">התנתקות</button><button class="btn ghost" id="no">ביטול</button>`, sh => { $('#no', sh).onclick = closeSheet; $('#so', sh).onclick = () => window.Sync.signOut(); });
    render('login');
  },
  closeAdd() { render(addCtx?.id ? 'expenses' : 'home'); },
  editPersonal() { numberSheet('התקציב האישי שלך לחודש', pBudget(S.me), v => { S.users[S.me].personalBudget = v; save(); render('budget', true); toast('התקציב האישי עודכן', 'ok', '✨'); }); },
  deposit() { numberSheet('כמה הפקדתם לקרן החירום?', '', v => { if (!v) return; S.fund.saved += v; S.deposits = (S.deposits || 0) + 1; save(); render(current, true); xpFloat('+40'); toast(`הפקדה של ${ilsT(v)}! הקרן גדלה`, 'ok', '🌱'); checkAchievements(); }, 'יעד הקרן', S.fund.target, t => { S.fund.target = t; }); },
  subsReview() { S.subsReviewed = Date.now(); save(); render('guide', true); toast('בדיקת מנויים פעם בחודש חוסכת כסף', 'ok', '🔍'); checkAchievements(); },
  approvePlan() { const nk = nextMonthKey(); proposePlan().forEach(p => { cat(p.id).budget = p.nu; }); S.plans[nk] = Date.now(); save(); render('guide', true); confetti(); xpFloat('+30'); toast('התוכנית אושרה. צוות!', 'ok', '🤝'); checkAchievements(); },
  addIncome() { incomeSheet(); },
  addCat() { openSheet(`<h2>קטגוריה חדשה</h2><div class="field"><label>שם</label><input id="cn" class="txt" maxlength="24"></div><div class="field"><label>תקרה חודשית</label><input id="cb" type="number" inputmode="numeric"></div><button class="btn primary" id="ok">הוספה</button>`, sh => { $('#ok', sh).onclick = () => { const n = $('#cn', sh).value.trim(); if (!n) return toast('צריך שם לקטגוריה', 'warn'); S.categories.push({ id: 'c' + uid(), name: n, icon: '•', kind: 'want', budget: +$('#cb', sh).value || 0 }); save(); closeSheet(); render('budget', true); toast('הקטגוריה נוספה', 'ok'); }; }); },
  delExp() {
    openSheet(`<h2>למחוק את ההוצאה?</h2><span class="hint">אי אפשר לבטל את המחיקה.</span><button class="btn danger" id="yes">כן, למחוק</button><button class="btn ghost" id="no">ביטול</button>`, sh => {
      $('#no', sh).onclick = closeSheet;
      $('#yes', sh).onclick = () => { const id = addCtx.id; S.expenses = S.expenses.filter(e => !(e.id === id && e.user === S.me)); window.Sync?.remove?.(id); save(); closeSheet(); render('expenses'); toast('ההוצאה נמחקה', 'ok', '🗑️'); };
    });
  },
  export() { const blob = new Blob([JSON.stringify(S, null, 2)], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `kalil-backup-${today()}.json`; a.click(); toast('קובץ הגיבוי ירד למכשיר', 'ok', '💾'); },
  import() { const f = $('#importFile'); f.onchange = async () => { try { const d = JSON.parse(await f.files[0].text()); if (!d.version || !d.users) throw 0; S = Object.assign(emptyState(), d); save(); boot(); toast('הגיבוי נטען בהצלחה', 'ok', '✅'); } catch (e) { toast('הקובץ לא נראה כמו גיבוי של האפליקציה', 'danger'); } }; f.click(); },
  demo() { if (S.expenses.length && !S.demo && !confirm('נתוני הדוגמה יחליפו את הנתונים הקיימים במכשיר. להמשיך?')) return; loadDemo(); },
  reset() { if (!confirm('למחוק את כל הנתונים במכשיר? כדאי לייצא גיבוי קודם.')) return; localStorage.removeItem(KEY); S = emptyState(); boot(); },
  syncNow() { window.Sync?.pull?.().then(() => { render(current, true); toast('סונכרן', 'ok', '🔄'); }); },
  signOut() { window.Sync?.signOut?.(); },
};

// ---------- add / edit expense ----------
function bindAdd(el) {
  const st = addCtx.st; const val = $('#amtVal', el); const saveBtn = $('#saveExp', el);
  const refresh = () => { val.textContent = st.amount ? ilsT(+st.amount) : '0 ₪'; val.classList.toggle('placeholder', !st.amount); val.classList.remove('bump'); void val.offsetWidth; val.classList.add('bump'); saveBtn.disabled = !(+st.amount > 0 && st.cat); };
  const key = k => { if (k === 'del') st.amount = st.amount.slice(0, -1); else if ((st.amount + k).length <= 7) st.amount = (st.amount + k).replace(/^0+/, ''); refresh(); };
  $$('[data-k]', el).forEach(b => b.onclick = () => key(b.dataset.k));
  $$('[data-c]', el).forEach(b => b.onclick = () => { st.cat = b.dataset.c; $$('[data-c]', el).forEach(x => x.classList.toggle('on', x === b)); refresh(); });
  $$('[data-s]', el).forEach(b => b.onclick = () => { st.scope = b.dataset.s; $$('[data-s]', el).forEach(x => x.classList.toggle('on', x === b)); });
  $('#note', el).oninput = e => st.note = e.target.value;
  $$('[data-tpl]', el).forEach(b => b.onclick = () => { const t = S.templates.find(z => z.id === b.dataset.tpl); commitExpense({ amount: +t.amount, cat: t.cat, scope: t.scope, note: t.label }); });
  saveBtn.onclick = () => {
    if (!(+st.amount > 0) || !st.cat) return;
    if ($('#asTpl', el)?.checked) S.templates.push({ id: uid(), label: st.note.trim() || cat(st.cat).name, amount: +st.amount, cat: st.cat, scope: st.scope, user: S.me });
    commitExpense({ amount: +st.amount, cat: st.cat, scope: st.scope, note: st.note.trim() });
  };
  document.onkeydown = e => {
    if (current !== 'add' || e.target.id === 'note' || !$('#sheetWrap').classList.contains('hidden')) return;
    if (/^[0-9]$/.test(e.key)) key(e.key); else if (e.key === 'Backspace') key('del'); else if (e.key === 'Enter') saveBtn.click();
  };
}
function commitExpense(x) {
  const k = mkey(new Date()); const c = cat(x.cat); const editing = addCtx?.id;
  const prevP = c.budget ? catSpent(c.id, k) / c.budget : 0;
  if (editing) {
    const e = S.expenses.find(z => z.id === editing && z.user === S.me); if (!e) return;
    Object.assign(e, x, { updated: Date.now() });
  } else {
    S.expenses.push({ id: uid(), ...x, user: S.me, date: today(), ts: new Date().toTimeString().slice(0, 8), updated: Date.now() });
    if (Date.now() - addCtx.t0 < 10000) S.fastAdds = (S.fastAdds || 0) + 1;
  }
  S.recentCats = [x.cat, ...S.recentCats.filter(z => z !== x.cat)].slice(0, 5);
  save(); navigator.vibrate?.(20);
  const btn = $('#saveExp'); if (btn) { btn.classList.add('done'); btn.textContent = editing ? 'נשמר ✓' : 'נרשם ✓'; }
  const p = c.budget ? catSpent(c.id, k) / c.budget : 0;
  setTimeout(() => {
    if (x.scope === 'shared' && c.budget && p >= .8) {
      render('budget');
      if (p >= 1) toast(`חריגה: ${esc(c.name)} ${prevP >= 1 ? 'כבר מעל' : 'הגיעו ל־100% מ'}התקרה, ${ils(catSpent(c.id, k))} מתוך ${ils(c.budget)}.`, 'danger', '🚨');
      else toast(`שימו לב: ${esc(c.name)} הגיעו ל־${Math.round(p * 100)}% מהתקרה, ${ils(catSpent(c.id, k))} מתוך ${ils(c.budget)}.`, 'warn', '⚠️');
    } else {
      render(editing ? 'expenses' : 'home');
      if (!editing) { confetti(); xpFloat('+10'); toast(`${CHEERS[Math.random() * CHEERS.length | 0]} ‎+10 נקודות`, 'ok', '🪙'); }
      else toast('ההוצאה עודכנה', 'ok', '✏️');
    }
    checkAchievements();
  }, 380);
}

// ---------- sheets ----------
function openSheet(html, bind) {
  const w = $('#sheetWrap'); w.classList.remove('hidden', 'closing');
  $('#sheet').innerHTML = `<div class="grab"></div>${html}`; w.querySelector('.sheet-backdrop').onclick = closeSheet; bind?.($('#sheet'));
}
function closeSheet() { const w = $('#sheetWrap'); w.classList.add('closing'); setTimeout(() => w.classList.add('hidden'), reduced() ? 0 : 230); }
function numberSheet(title, val, cb, label2, val2, cb2) {
  openSheet(`<h2>${title}</h2><div class="field"><label>סכום בשקלים</label><input id="nv" type="number" inputmode="numeric" value="${val || ''}"></div>${label2 ? `<div class="field"><label>${label2}</label><input id="nv2" type="number" inputmode="numeric" value="${val2 || ''}"></div>` : ''}<button class="btn primary" id="ok">שמירה</button>`, sh => {
    setTimeout(() => $('#nv', sh).focus(), 300);
    $('#ok', sh).onclick = () => { if (label2) cb2(+$('#nv2', sh).value || 0); const v = +$('#nv', sh).value || 0; closeSheet(); cb(v); };
  });
}
function editCat(id) {
  const c = cat(id);
  openSheet(`<h2><span class="dot" style="display:inline-block;background:${catColor(id)}"></span> ${esc(c.name)}</h2><div class="field"><label>שם</label><input id="cn" class="txt" value="${esc(c.name)}" maxlength="24"></div><div class="field"><label>תקרה חודשית</label><input id="cb" type="number" inputmode="numeric" value="${c.budget || ''}"></div><button class="btn primary" id="ok">שמירה</button>`, sh => {
    $('#ok', sh).onclick = () => { c.name = $('#cn', sh).value.trim() || c.name; c.budget = +$('#cb', sh).value || 0; save(); closeSheet(); render('budget', true); toast('הקטגוריה עודכנה', 'ok', '✨'); };
  });
}
function incomeSheet(id) {
  const inc = id ? S.users[S.me].incomes.find(i => i.id === id) : null; // עריכה רק של ההכנסות של הפרופיל המחובר
  openSheet(`<h2>${inc ? 'עריכת הכנסה' : 'הוספת הכנסה'}</h2><div class="field"><label>סוג ההכנסה</label><input id="il" class="txt" value="${esc(inc?.label || 'משכורת')}" maxlength="30"></div><div class="field"><label>סכום חודשי</label><input id="ia" type="number" inputmode="numeric" value="${inc?.amount || ''}"></div><div class="field"><label>יום בחודש שבו נכנסת</label><input id="id" type="number" min="1" max="31" value="${inc?.day || 10}"></div><button class="btn primary" id="ok">שמירה</button>${inc ? '<button class="btn danger" id="del">מחיקת ההכנסה</button>' : ''}`, sh => {
    $('#ok', sh).onclick = () => {
      const a = +$('#ia', sh).value; if (!a) return toast('צריך להזין סכום', 'warn');
      const rec = { label: $('#il', sh).value.trim() || 'הכנסה', amount: a, day: Math.min(31, Math.max(1, +$('#id', sh).value || 1)) };
      if (inc) Object.assign(inc, rec); else { S.users[S.me].incomes.push({ id: uid(), ...rec }); xpFloat('+20'); }
      save(); closeSheet(); render('income', true); toast('ההכנסה נשמרה', 'ok', '💸'); checkAchievements();
    };
    $('#del', sh) && ($('#del', sh).onclick = () => { S.users[S.me].incomes = S.users[S.me].incomes.filter(i => i.id !== id); save(); closeSheet(); render('income', true); toast('ההכנסה נמחקה', 'ok'); });
  });
}

// ---------- onboarding ----------
let OB = {};
function onboarding(step) {
  current = 'onboard'; renderDock(); $('#demoPill').classList.toggle('hidden', !S.demo);
  const stage = $('#stage'); stage.innerHTML = '';
  const el = document.createElement('section'); el.className = 'screen no-dock';
  const dots = n => `<div class="dots">${[0, 1, 2, 3, 4].map(i => `<i class="${i === n ? 'on' : ''}"></i>`).join('')}</div>`;
  const incStep = (u, n) => `<div class="login"><div class="brand" style="margin-bottom:10px"><span class="avatar ${u}" style="width:72px;height:72px;font-size:32px">${USERS[u].letter}</span></div><div class="ob-title">המשכורת של ${USERS[u].name}</div><p class="ob-sub">כמה נכנס בחודש, נטו? אפשר לעדכן אחר כך, ורק ${USERS[u].name} יוכל/תוכל לערוך.</p>
      <div class="field"><label>משכורת חודשית</label><input id="sal" data-u="${u}" type="number" inputmode="numeric" placeholder="0" value="${OB[u]?.amount || ''}"></div>
      <div class="field"><label>יום בחודש שבו המשכורת נכנסת</label><input id="day" type="number" min="1" max="31" value="${OB[u]?.day || 10}"></div>
      <div class="grow"></div>${dots(n)}<button class="btn primary" data-n="${n + 1}">המשך</button><button class="btn ghost" data-skip="${n + 1}">דילוג לעכשיו</button></div>`;
  const budStep = () => {
    const inc = (OB.gavir?.amount || 0) + (OB.esti?.amount || 0); const pb = Math.round(inc * .05 / 50) * 50; const shared = inc * .8 - pb * 2;
    return `<div class="ob-title">התקציב החודשי</div><p class="ob-sub">${inc ? `הצעה לפי הכנסה של ${ilsT(inc)}: כ־80% להוצאות ו־20% לחיסכון. אפשר לשנות הכול.` : 'הזינו תקרה לכל קטגוריה. אפשר לשנות אחר כך.'}</p>
      <div class="card"><h3>התקציב המשותף</h3>${S.categories.map(c => `<div class="bud-row"><span class="nm"><span class="dot" style="background:${catColor(c.id)}"></span>${esc(c.name)}</span><input type="number" inputmode="numeric" data-bud="${c.id}" value="${c.budget || (inc ? Math.round(shared * (SHARE[c.id] || .05) / 50) * 50 : '')}"></div>`).join('')}</div>
      <div class="card"><h3>תקציב אישי לכל אחד</h3>${['gavir', 'esti'].map(u => `<div class="bud-row"><span class="nm">${avatar(u, 'sm')} ${USERS[u].name}</span><input id="pb-${u}" type="number" inputmode="numeric" value="${S.users[u].personalBudget || pb || ''}"></div>`).join('')}<span class="hint">בן הזוג רואה רק את היתרה, לא את הפירוט.</span></div>
      ${dots(3)}<button class="btn primary" data-n="4">שמירת התקציב</button>`;
  };
  const steps = [
    () => `<div class="login"><div class="brand">${LOGO}<h1>קליל</h1><p>הכסף של הבית, בקלילות</p></div><p class="ob-sub">מקום אחד לגביר ולאסתי לנהל את הכסף נכון, לראות לאן הוא הולך, ולהרגיש התקדמות כל שבוע.</p><div class="grow"></div>${dots(0)}
       <button class="btn primary" data-n="1">בואו נתחיל</button><button class="btn ghost" data-demo>טען נתוני דוגמה</button><p class="fine">הנתונים נשמרים במכשיר הזה.</p></div>`,
    () => incStep('gavir', 1), () => incStep('esti', 2), budStep,
    () => window.Sync?.enabled ? `<div class="login"><div class="brand">${LOGO}<h1>הכול מוכן!</h1><p>נכנסים כ${USERS[window.Sync.slot()].name}</p></div><button class="btn primary" data-pick="${window.Sync.slot()}">יאללה</button>${dots(4)}</div>` : `<div class="login"><div class="brand">${LOGO}<h1>הכול מוכן!</h1><p>מי משתמש עכשיו בטלפון הזה?</p></div>${['gavir', 'esti'].map(u => `<button class="profile-card ${u}" data-pick="${u}"><span class="letter">${USERS[u].letter}</span><div><h2>${USERS[u].name}</h2><span>כניסה לפרופיל</span></div></button>`).join('')}${dots(4)}</div>`,
  ];
  el.innerHTML = `<div class="enter">${steps[step]()}</div>`; stage.appendChild(el); animateIn(el);
  $$('[data-n]', el).forEach(b => b.onclick = () => {
    const inp = $('#sal', el);
    if (inp) { const v = +inp.value; if (!v) return toast('הזינו משכורת, או לחצו על דילוג', 'warn'); OB[inp.dataset.u] = { amount: v, day: Math.min(31, Math.max(1, +$('#day', el).value || 10)) }; }
    if (+b.dataset.n === 4) {
      $$('[data-bud]', el).forEach(i => { const c = S.categories.find(z => z.id === i.dataset.bud); if (c) c.budget = +i.value || 0; });
      ['gavir', 'esti'].forEach(u => S.users[u].personalBudget = +$('#pb-' + u, el).value || 0);
    }
    onboarding(+b.dataset.n);
  });
  $$('[data-skip]', el).forEach(b => b.onclick = () => onboarding(+b.dataset.skip));
  $('[data-demo]', el)?.addEventListener('click', loadDemo);
  $$('[data-pick]', el).forEach(b => b.onclick = () => {
    for (const u of ['gavir', 'esti']) if (OB[u]) S.users[u].incomes = [{ id: uid(), label: 'משכורת', amount: OB[u].amount, day: OB[u].day }];
    S.fund.target = Math.round(sharedBudget() * 3 / 100) * 100 || 0;
    S.onboarded = true; S.me = b.dataset.pick; markOpen(); save(); render('home'); confetti(); toast('יצאנו לדרך!', 'ach', '🚀'); checkAchievements();
  });
}

// ---------- demo data: מומצא לגמרי, מסומן ---------
function loadDemo() {
  const s = emptyState(); s.demo = true; s.onboarded = true; s.me = S.me || 'gavir';
  s.users.gavir = { incomes: [{ id: uid(), label: 'משכורת (דוגמה)', amount: 12000, day: 10 }], personalBudget: 800 };
  s.users.esti = { incomes: [{ id: uid(), label: 'משכורת (דוגמה)', amount: 9000, day: 1 }], personalBudget: 800 };
  const B = { bills: 2500, food: 3000, kids: 1500, trans: 1200, subs: 300, rest: 800, health: 400, shop: 600, misc: 500 };
  s.categories.forEach(c => c.budget = B[c.id] || 0);
  s.templates = [
    { id: uid(), label: 'סטרימינג (דוגמה)', amount: 69, cat: 'subs', scope: 'shared' },
    { id: uid(), label: 'יוטיוב (דוגמה)', amount: 25, cat: 'subs', scope: 'shared' },
    { id: uid(), label: 'סופר שבועי (דוגמה)', amount: 650, cat: 'food', scope: 'shared' },
  ];
  const now = new Date(); const day = now.getDate();
  const dOf = n => dkey(new Date(now.getFullYear(), now.getMonth(), Math.max(1, Math.min(day, n))));
  const E = (user, scope, c, amount, note, d) => s.expenses.push({ id: uid(), user, scope, cat: c, amount, note: note + ' (דוגמה)', date: d, ts: '12:00:00' });
  // החודש: חריגות מכוונות כדי להראות 80% ו־100%
  E('gavir', 'shared', 'bills', 2100, 'חשמל, מים וארנונה', dOf(2)); E('esti', 'shared', 'food', 1400, 'קניות שבועיות', dOf(3)); E('esti', 'shared', 'food', 1250, 'קניות שבועיות', dOf(day - 1));
  E('esti', 'shared', 'kids', 900, 'חוגים', dOf(4)); E('gavir', 'shared', 'trans', 750, 'דלק וחניה', dOf(5)); E('gavir', 'shared', 'subs', 290, 'סטרימינג ומשחק', dOf(6));
  E('gavir', 'shared', 'rest', 870, 'משלוחים', dOf(day)); E('gavir', 'personal', 'shop', 420, 'קניות אונליין', dOf(7)); E('esti', 'personal', 'misc', 350, 'בגדים', dOf(8));
  // החודש הקודם, לרצפים ולהשוואה
  for (let d = 35; d >= day; d--) { const dt = dkey(addDays(now, -d)); if (d % 3 === 0) E(d % 2 ? 'gavir' : 'esti', 'shared', ['food', 'trans', 'rest', 'misc'][d % 4], 120 + (d * 37) % 300, 'הוצאה', dt); }
  s.openDays = Array.from({ length: 6 }, (_, i) => dkey(addDays(now, -i)));
  s.fund = { name: 'קרן חירום', target: 20000, saved: 4200 }; s.deposits = 1;
  s.guideViews = [mkey(now)]; s.fastAdds = 1; s.recentCats = ['food', 'rest', 'trans'];
  S = s; checkAchievements(true); save(); render('home'); confetti(); toast('נטענו נתוני דוגמה מומצאים', 'ach', '🎨');
}

// ---------- boot ----------
function markOpen() { const t = today(); if (!S.openDays.includes(t)) { S.openDays.push(t); S.openDays = S.openDays.slice(-60); } }
function boot() {
  if (S.onboarded && S.me) { markOpen(); save(); render('home', true); checkAchievements(); }
  else if (S.onboarded) render('login', true);
  else onboarding(0);
}
window.App = { get state() { return S; }, set state(v) { S = Object.assign(emptyState(), v); }, save, render: n => render(n || current || 'home', true), boot, toast };
if (window.Sync?.enabled) window.Sync.init().then(boot).catch(() => boot()); else boot();
