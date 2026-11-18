'use strict';
/* קליל · סנכרון בין גביר לאסתי דרך Supabase. פעיל רק כש-KALIL_CONFIG.sync.enabled = true.
   כל אחד מתחבר עם קישור במייל, כותב רק את השורות שלו, ובן הזוג מקבל רק יתרה של התקציב האישי.
   localStorage נשאר כמטמון וכגיבוי כשאין רשת. */
(function () {
  const cfg = (window.KALIL_CONFIG || {}).sync || {};
  const enabled = !!(cfg.enabled && cfg.supabaseUrl && cfg.supabaseAnonKey);
  const Sync = { enabled };
  window.Sync = Sync;
  if (!enabled) return;

  const MIGRATED = 'kalil-sync-migrated';
  let sb, uid = null, email = '', slot = null, H = null, partnerRem = null, ready = false, pushTimer = null, pullTimer = null, online = true;
  const $ = s => document.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const month = () => new Date().toISOString().slice(0, 7);
  const LOGO = '<svg class="logo" viewBox="0 0 84 84" aria-hidden="true"><circle cx="42" cy="42" r="38" fill="#FFD44D" stroke="#1B1410" stroke-width="4"/><circle cx="30" cy="36" r="5" fill="#1B1410"/><circle cx="54" cy="36" r="5" fill="#1B1410"/><path d="M28 50c5 10 23 10 28 0" fill="none" stroke="#1B1410" stroke-width="4" stroke-linecap="round"/></svg>';
  function screen(html) { $('#stage').innerHTML = `<section class="screen no-dock"><div class="enter"><div class="login">${html}</div></div></section>`; $('#dock').classList.add('away'); return $('#stage .screen'); }
  const note = (el, t, kind = 'warn') => { const n = el.querySelector('#msg'); n.className = 'toast ' + kind; n.style.position = 'static'; n.style.marginTop = '12px'; n.innerHTML = t; };

  Sync.partnerRemaining = () => partnerRem;
  Sync.slot = () => slot;
  Sync.statusText = () => (online ? `מחובר/ת כ־${email}` : 'אין רשת, השינויים יישלחו כשתחזור');
  Sync.remove = () => { };

  Sync.init = async function () {
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
    sb = createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'pkce' } });
    let { data: { session } } = await sb.auth.getSession();
    if (!session) session = await signIn();
    uid = session.user.id; email = session.user.email || '';
    await ensureHousehold();
    await pull();
    subscribe();
    addEventListener('online', () => { online = true; Sync.push(window.App.state); });
    addEventListener('offline', () => { online = false; });
  };

  // ---------- כניסה עם קישור במייל ----------
  function signIn() {
    return new Promise(resolve => {
      const el = screen(`<div class="brand">${LOGO}<h1>קליל</h1><p>כניסה לחשבון שלך</p></div>
        <div class="card"><h3>כניסה עם קישור במייל</h3><span class="hint">כל אחד נכנס עם המייל שלו. בלי סיסמה: נשלח אליך קישור כניסה.</span>
        <div class="field"><label>כתובת מייל</label><input id="em" class="txt" type="email" autocomplete="email" dir="ltr"></div>
        <button class="btn primary" id="go" style="margin-top:12px">שליחת קישור כניסה</button><div id="msg"></div></div>
        <p class="fine">אפשר להמשיך גם בלי חשבון: הנתונים יישמרו רק במכשיר.</p><button class="btn ghost" id="local">המשך בלי סנכרון</button>`);
      el.querySelector('#go').onclick = async () => {
        const em = el.querySelector('#em').value.trim(); if (!/^\S+@\S+\.\S+$/.test(em)) return note(el, 'צריך כתובת מייל תקינה');
        const { error } = await sb.auth.signInWithOtp({ email: em, options: { emailRedirectTo: location.origin + location.pathname } });
        note(el, error ? 'השליחה נכשלה: ' + esc(error.message) : 'נשלח! פתחו את הקישור מהמייל בטלפון הזה.', error ? 'danger' : 'ok');
      };
      el.querySelector('#local').onclick = () => { Sync.enabled = false; resolve(Promise.reject(new Error('local-only'))); };
      sb.auth.onAuthStateChange((ev, session) => { if (session && (ev === 'SIGNED_IN' || ev === 'INITIAL_SESSION')) resolve(session); });
    });
  }

  // ---------- משק בית של שניים ----------
  async function ensureHousehold() {
    const { data, error } = await sb.from('household_members').select('household_id,slot').eq('user_id', uid).maybeSingle();
    if (error) throw error;
    if (data) { H = data.household_id; slot = data.slot; return; }
    await new Promise(resolve => {
      const el = screen(`<div class="brand">${LOGO}<h1>משק הבית</h1><p>חיבור בינך לבין בן/בת הזוג</p></div>
        <div class="card"><h3>פותחים משק בית חדש</h3><span class="hint">מי את/ה?</span><div class="grid2"><button class="btn" data-slot="gavir" style="background:#FF7A3C">גביר</button><button class="btn" data-slot="esti" style="background:#9B7CFF;margin:0">אסתי</button></div></div>
        <div class="card"><h3>יש לי קוד הצטרפות</h3><div class="field"><label>קוד מבן/בת הזוג</label><input id="code" class="txt" dir="ltr" maxlength="12"></div><button class="btn primary" id="join" style="margin-top:12px">הצטרפות</button></div><div id="msg"></div>`);
      el.querySelectorAll('[data-slot]').forEach(b => b.onclick = async () => {
        const { data, error } = await sb.rpc('create_household', { p_slot: b.dataset.slot });
        if (error) return note(el, 'לא הצלחנו ליצור: ' + esc(error.message), 'danger');
        H = data[0].household_id; slot = b.dataset.slot;
        screen(`<div class="brand">${LOGO}<h1>כמעט שם!</h1><p>תנו לבן/בת הזוג את הקוד הזה</p></div><div class="total-card"><div class="v" dir="ltr">${esc(data[0].invite_code)}</div><span class="hint" style="color:var(--ink)">הקוד עובד פעם אחת. אחרי ההצטרפות משק הבית נסגר לשניכם בלבד.</span></div><button class="btn primary" id="cont">המשך</button>`).querySelector('#cont').onclick = resolve;
      });
      el.querySelector('#join').onclick = async () => {
        const { data, error } = await sb.rpc('join_household', { p_code: el.querySelector('#code').value });
        if (error) return note(el, 'הקוד לא עבד: ' + esc(error.message), 'danger');
        H = data[0].household_id; slot = data[0].slot; resolve();
      };
    });
  }

  // ---------- משיכה מהשרת ----------
  async function pull() {
    const q = t => sb.from(t).select('*').eq('household_id', H);
    const [mem, cats, hs, inc, exp, pb, tpl, us, rem] = await Promise.all([
      q('household_members'), q('categories'), q('household_state').maybeSingle(), q('incomes'), q('expenses'),
      sb.from('personal_budgets').select('*').eq('user_id', uid).maybeSingle(), q('templates'),
      sb.from('user_state').select('*').eq('user_id', uid).maybeSingle(), sb.rpc('partner_remaining', { p_month: month() }),
    ]);
    const err = [mem, cats, hs, inc, exp, pb, tpl, us, rem].find(r => r.error); if (err) throw err.error;
    const slotOf = Object.fromEntries(mem.data.map(m => [m.user_id, m.slot]));
    const local = window.App.state;
    const s = JSON.parse(JSON.stringify(local));
    s.me = slot; s.demo = false;
    s.users = { gavir: { incomes: [], personalBudget: 0 }, esti: { incomes: [], personalBudget: 0 } };
    inc.data.forEach(r => slotOf[r.user_id] && s.users[slotOf[r.user_id]].incomes.push({ id: r.id, label: r.label, amount: +r.amount, day: r.day }));
    s.users[slot].personalBudget = pb.data ? +pb.data.amount : 0;
    s.expenses = exp.data.map(r => ({ id: r.id, user: slotOf[r.user_id], scope: r.scope, cat: r.cat, amount: +r.amount, note: r.note || '', date: r.date, ts: r.ts || '' })).filter(e => e.user);
    s.templates = tpl.data.map(r => ({ id: r.id, label: r.label, amount: +r.amount, cat: r.cat, scope: r.scope, user: slotOf[r.user_id] }));
    if (cats.data.length) s.categories = cats.data.sort((a, b) => a.sort - b.sort).map(r => ({ id: r.id, name: r.name, kind: r.kind, budget: +r.budget }));
    if (hs.data) { s.fund = { name: hs.data.fund_name, target: +hs.data.fund_target, saved: +hs.data.fund_saved }; s.plans = hs.data.plans || {}; s.subsReviewed = hs.data.subs_reviewed ? Date.parse(hs.data.subs_reviewed) : null; }
    if (us.data) Object.assign(s, us.data.data || {});
    s.onboarded = cats.data.length > 0 || (local.onboarded && !local.demo);
    // מיגרציה חד-פעמית: נתונים מקומיים קיימים (לא דוגמה) של הפרופיל הזה עולים לשרת בסנכרון הראשון
    if (!localStorage.getItem(MIGRATED) && !local.demo && local.me === slot) {
      const have = new Set(s.expenses.map(e => e.id));
      s.expenses.push(...local.expenses.filter(e => e.user === slot && !have.has(e.id)));
      if (!s.users[slot].incomes.length) s.users[slot].incomes = local.users[slot].incomes;
      if (!s.users[slot].personalBudget) s.users[slot].personalBudget = local.users[slot].personalBudget;
      const ht = new Set(s.templates.map(t => t.id)); s.templates.push(...local.templates.filter(t => !ht.has(t.id)).map(t => ({ ...t, user: slot })));
      localStorage.setItem(MIGRATED, '1');
    }
    partnerRem = rem.data === null ? null : +rem.data;
    window.App.state = s; ready = true;
    localStorage.setItem('money-home-v1', JSON.stringify(s));
    pushNow(s).catch(() => { });
  }
  Sync.pull = pull;

  // ---------- שליחה לשרת: רק שורות של המשתמש המחובר + נתוני הבית המשותפים ----------
  Sync.push = function (S) {
    if (!ready || S.demo) return;           // נתוני דוגמה לעולם לא עולים לשרת
    clearTimeout(pushTimer); pushTimer = setTimeout(() => pushNow(S).catch(e => { online = false; console.warn('sync push failed', e); }), 700);
  };
  const inList = ids => `(${ids.map(i => `"${String(i).replace(/"/g, '')}"`).join(',')})`;
  async function syncOwn(table, rows) {
    if (rows.length) { const { error } = await sb.from(table).upsert(rows); if (error) throw error; }
    let del = sb.from(table).delete().eq('user_id', uid);
    if (rows.length) del = del.not('id', 'in', inList(rows.map(r => r.id)));
    const { error } = await del; if (error) throw error;
  }
  async function pushNow(S) {
    if (!ready || S.demo) return;
    const mine = e => e.user === slot;
    await syncOwn('expenses', S.expenses.filter(mine).map(e => ({ id: e.id, household_id: H, user_id: uid, scope: e.scope, cat: e.cat, amount: e.amount, note: e.note || null, date: e.date, ts: e.ts || null, updated_at: new Date().toISOString() })));
    await syncOwn('incomes', S.users[slot].incomes.map(i => ({ id: i.id, household_id: H, user_id: uid, label: i.label, amount: i.amount, day: i.day })));
    await syncOwn('templates', S.templates.filter(t => !t.user || t.user === slot).map(t => ({ id: t.id, household_id: H, user_id: uid, label: t.label, amount: t.amount, cat: t.cat, scope: t.scope })));
    let r = await sb.from('personal_budgets').upsert({ user_id: uid, household_id: H, amount: S.users[slot].personalBudget || 0 }); if (r.error) throw r.error;
    if (S.onboarded) {
      r = await sb.from('categories').upsert(S.categories.map((c, i) => ({ household_id: H, id: c.id, name: c.name, kind: c.kind || 'want', budget: c.budget || 0, sort: i }))); if (r.error) throw r.error;
      r = await sb.from('categories').delete().eq('household_id', H).not('id', 'in', inList(S.categories.map(c => c.id))); if (r.error) throw r.error;
    }
    r = await sb.from('household_state').update({ fund_name: S.fund.name, fund_target: S.fund.target || 0, fund_saved: S.fund.saved || 0, plans: S.plans || {}, subs_reviewed: S.subsReviewed ? new Date(S.subsReviewed).toISOString() : null, updated_at: new Date().toISOString() }).eq('household_id', H); if (r.error) throw r.error;
    const { unlocked, openDays, guideViews, fastAdds, deposits, recentCats } = S;
    r = await sb.from('user_state').upsert({ user_id: uid, household_id: H, data: { unlocked, openDays, guideViews, fastAdds, deposits, recentCats } }); if (r.error) throw r.error;
    online = true;
  }

  // ---------- זמן אמת: כשבן הזוג מעדכן, מושכים מחדש ----------
  function subscribe() {
    const ch = sb.channel('household-' + H);
    ['expenses', 'incomes', 'categories', 'household_state', 'templates'].forEach(t =>
      ch.on('postgres_changes', { event: '*', schema: 'public', table: t, filter: `household_id=eq.${H}` }, () => {
        clearTimeout(pullTimer); pullTimer = setTimeout(() => pull().then(() => window.App.render()).catch(() => { }), 1200);
      }));
    ch.subscribe();
  }
  Sync.signOut = async () => { await sb.auth.signOut(); localStorage.removeItem(MIGRATED); localStorage.removeItem('money-home-v1'); location.reload(); };
})();
