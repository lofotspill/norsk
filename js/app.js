(() => {
  'use strict';

  const app = document.getElementById('app');
  const UNITS = window.UNITS;
  const KEY = 'norsk123.progress.v3';

  /* flat lesson list: lessons unlock one after another */
  const FLAT = [];
  UNITS.forEach(u => u.lessons.forEach((l, j) => FLAT.push({ unit: u, lesson: l, idx: FLAT.length, ui: j })));

  /* ───────── progress ───────── */
  let mem = { lessons: {}, xp: 0 };
  const load = () => { try { const s = localStorage.getItem(KEY); return s ? JSON.parse(s) : mem; } catch (e) { return mem; } };
  const save = (p) => { mem = p; try { localStorage.setItem(KEY, JSON.stringify(p)); } catch (e) { /* ignore */ } };
  const isDone = (id) => !!(load().lessons || {})[id];
  const isOpen = (i) => i === 0 || isDone(FLAT[i - 1].lesson.id) || isDone(FLAT[i].lesson.id);

  /* ───────── progress code: save, restore, and share with a teacher ─────────
     The code holds the stars and XP, nothing personal. It can be pasted back in on any device. */
  const checksum = (t) => { let h = 7; for (let i = 0; i < t.length; i++) h = (h * 31 + t.charCodeAt(i)) % 46656; return h.toString(36).padStart(3, '0'); };
  const b64 = (t) => btoa(t).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const unb64 = (t) => atob(t.replace(/-/g, '+').replace(/_/g, '/'));
  function makeCode() {
    const p = load();
    const body = Object.keys(p.lessons || {}).filter(id => FLAT.some(f => f.lesson.id === id))
      .map(id => `${id}.${p.lessons[id].stars}.${Math.round((p.lessons[id].acc || 0) * 100)}`).join(',') + '|' + (p.xp || 0);
    const b = b64(body);
    return 'NO1-' + b + '-' + checksum(b);
  }
  function readCode(raw) {
    const t = String(raw || '').replace(/\s+/g, '');
    const m = /^NO1-([A-Za-z0-9_-]*)-([0-9a-z]{3})$/.exec(t);
    if (!m || checksum(m[1]) !== m[2]) return null;
    try {
      const [ls, xp] = unb64(m[1]).split('|');
      const lessons = {};
      (ls ? ls.split(',') : []).forEach(x => {
        const [id, st, ac] = x.split('.');
        if (FLAT.some(f => f.lesson.id === id) && +st >= 1 && +st <= 3) lessons[id] = { stars: +st, acc: Math.min(1, (+ac || 0) / 100) };
      });
      return { lessons, xp: Math.max(0, +xp || 0) };
    } catch (e) { return null; }
  }
  function restore(raw) {
    const r = readCode(raw);
    if (!r) return false;
    const p = load();
    p.lessons = p.lessons || {};
    Object.keys(r.lessons).forEach(id => {
      const o = p.lessons[id];
      p.lessons[id] = o ? { stars: Math.max(o.stars, r.lessons[id].stars), acc: Math.max(o.acc || 0, r.lessons[id].acc) } : r.lessons[id];
    });
    p.xp = Math.max(p.xp || 0, r.xp);
    save(p);
    return true;
  }
  const SHARE = 'norsk123.share', QUEUE = 'norsk123.queue';
  const jget = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } };
  const jset = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* ignore */ } };
  const formCfg = () => { const c = window.NORSK_FORM; return c && c.url && c.fields ? c : null; };
  function flushQueue() {
    const c = formCfg(); if (!c) return;
    const q = jget(QUEUE, []);
    if (!q.length) return;
    jset(QUEUE, []);
    q.forEach(item => {
      const body = new URLSearchParams();
      Object.keys(c.fields).forEach(k => { if (c.fields[k] && item[k] !== undefined) body.append(c.fields[k], item[k]); });
      try {
        fetch(c.url, { method: 'POST', mode: 'no-cors', body }).catch(() => { const n = jget(QUEUE, []); n.push(item); jset(QUEUE, n.slice(-30)); });
      } catch (e) { const n = jget(QUEUE, []); n.push(item); jset(QUEUE, n.slice(-30)); }
    });
  }
  function shareProgress(lesson, stars, acc, xp) {
    const sh = jget(SHARE, null), c = formCfg();
    if (!c || !sh || !sh.on || !sh.name) return;
    const q = jget(QUEUE, []);
    q.push({ name: sh.name, lesson: lesson.title + ' (' + lesson.id + ')', stars: String(stars), acc: String(Math.round(acc * 100)), xp: String(xp), time: new Date().toISOString(), code: makeCode() });
    jset(QUEUE, q.slice(-30));
    flushQueue();
  }

  /* ───────── speech ───────── */
  let voice = null;
  const hasTTS = 'speechSynthesis' in window;
  function findVoice() {
    if (!hasTTS) return;
    const vs = speechSynthesis.getVoices();
    if (!vs.length) return;
    voice = vs.find(v => /^nb[-_]/i.test(v.lang)) || vs.find(v => /^no[-_]/i.test(v.lang)) ||
            vs.find(v => /^(nb|no)$/i.test(v.lang)) || null;
  }
  if (hasTTS) {
    findVoice();
    speechSynthesis.onvoiceschanged = () => { findVoice(); if (state.view === 'home') render(); };
  }
  const audioOK = () => hasTTS && !!voice;
  let curUtter = null, speakTimer = 0, curAudio = null;
  const HAVE = new Set(window.AUDIO_FILES || []);
  const slug = (t) => String(t).toLowerCase().replace(/[.,!?…]/g, '').trim().replace(/\s+/g, '-');
  function stopAll() {
    clearTimeout(speakTimer);
    try { speechSynthesis.cancel(); } catch (e) { /* ignore */ }
    if (curAudio) { try { curAudio.pause(); } catch (e) { /* ignore */ } curAudio = null; }
  }
  /* The slow button says the words one at a time with a pause between them. A single word is said twice.
     This works with every voice, also those that ignore the speed setting. */
  function tts(text, slow) {
    speakTimer = setTimeout(() => {
      const parts = text.split(/\s+/).filter(Boolean);
      const queue = !slow ? [text] : (parts.length === 1 ? [parts[0], parts[0]] : parts);
      let i = 0;
      const next = () => {
        if (i >= queue.length) return;
        try {
          const u = new SpeechSynthesisUtterance(queue[i++]);
          u.lang = 'nb-NO';
          if (voice) u.voice = voice;
          u.rate = slow ? 0.6 : 0.9;
          u.onend = () => { if (curUtter === u) speakTimer = setTimeout(next, slow ? 650 : 0); };
          u.onerror = () => { if (curUtter === u) curUtter = null; };
          curUtter = u;
          speechSynthesis.speak(u);
          if (speechSynthesis.paused) speechSynthesis.resume();
        } catch (e) { /* ignore */ }
      };
      next();
    }, 90);
  }
  function speak(text, slow) {
    stopAll();
    const clean = String(text).replace(/<[^>]+>/g, '').replace(/\.\.\./g, '');
    const f = slug(clean) + (slow ? '-sakte' : '');
    if (HAVE.has(f)) {
      const a = new Audio('audio/' + encodeURIComponent(f) + '.mp3');
      curAudio = a;
      a.onerror = () => { curAudio = null; if (hasTTS) tts(clean, slow); };
      a.play().catch(() => { curAudio = null; if (hasTTS) tts(clean, slow); });
      return;
    }
    if (hasTTS) tts(clean, slow);
  }
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-say]');
    if (b) { e.preventDefault(); speak(b.dataset.say, b.dataset.slow === '1'); }
  });

  /* ───────── helpers ───────── */
  const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const norm = (s) => s.normalize('NFC').toLowerCase().replace(/[.,!?]/g, '').replace(/\s+/g, ' ').trim();
  const fold = (t) => t.replace(/å/g, 'a').replace(/ø/g, 'o').replace(/æ/g, 'e');
  const lev = (a, b) => { const d = Array.from({ length: a.length + 1 }, (_, i) => [i]); for (let j = 1; j <= b.length; j++) d[0][j] = j;
    for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); return d[a.length][b.length]; };
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  const plain = (s) => String(s).replace(/<[^>]+>/g, '');

  /* ───────── drag and drop: pointer events, with a tap as the fallback ─────────
     One set of listeners for the whole app. Each exercise registers what can be dragged (sel),
     where it can be dropped (drop), and what a tap or a drop does. A short press is a tap,
     moving more than a few pixels starts a drag. Keyboard activation also counts as a tap. */
  let dz = null, dg = null;
  const setDnd = (cfg) => { dz = cfg; };
  const under = (x, y) => { const el = document.elementFromPoint(x, y); return el && dz && dz.drop ? el.closest(dz.drop) : null; };
  app.addEventListener('pointerdown', (e) => {
    if (!dz || (e.pointerType === 'mouse' && e.button !== 0)) return;
    const el = e.target.closest(dz.sel);
    if (!el || el.disabled || el.dataset.lock === '1') return;
    dg = { el, x: e.clientX, y: e.clientY, on: false, ghost: null, over: null, dx: 0, dy: 0 };
  });
  window.addEventListener('pointermove', (e) => {
    if (!dg) return;
    if (!dg.on) {
      if (Math.hypot(e.clientX - dg.x, e.clientY - dg.y) < 8) return;
      if (dz && dz.canDrag && !dz.canDrag(dg.el)) return;
      dg.on = true;
      const r = dg.el.getBoundingClientRect();
      const g = dg.el.cloneNode(true);
      g.classList.add('dragghost'); g.removeAttribute('id'); g.removeAttribute('data-drop');
      g.style.width = r.width + 'px'; g.style.height = r.height + 'px';
      document.body.appendChild(g);
      dg.ghost = g; dg.dx = e.clientX - r.left; dg.dy = e.clientY - r.top;
      dg.el.classList.add('dragging');
    }
    dg.ghost.style.left = (e.clientX - dg.dx) + 'px';
    dg.ghost.style.top = (e.clientY - dg.dy) + 'px';
    const t = under(e.clientX, e.clientY);
    if (t !== dg.over) { if (dg.over) dg.over.classList.remove('over'); dg.over = t; if (t) t.classList.add('over'); }
    e.preventDefault();
  }, { passive: false });
  function endDrag(e, cancel) {
    if (!dg) return;
    const d = dg; dg = null;
    if (d.ghost) d.ghost.remove();
    d.el.classList.remove('dragging');
    if (d.over) d.over.classList.remove('over');
    if (!dz || cancel) return;
    if (!d.on) { if (dz.onTap) dz.onTap(d.el); return; }
    if (dz.onDrop) dz.onDrop(d.el, under(e.clientX, e.clientY));
  }
  window.addEventListener('pointerup', (e) => endDrag(e, false));
  window.addEventListener('pointercancel', (e) => endDrag(e, true));
  app.addEventListener('click', (e) => {
    if (e.detail !== 0 || !dz) return;
    const el = e.target.closest(dz.sel);
    if (el && !el.disabled && el.dataset.lock !== '1' && dz.onTap) dz.onTap(el);
  });

  /* ───────── exercise generators (only ever used on items already taught) ───────── */
  const sayOf = (it) => (it.say || it.no).replace('...', '');
  const art = (it) => (it.noun && /^(en|ei|et) /.test(it.no)) ? it.no.split(' ')[0] : null;
  const bare = (it) => it.noun ? it.no.replace(/^(en|ei|et) /, '') : it.no;
  const answersOf = (it) => {
    const a = [it.no].concat(it.alt || []);
    if (it.noun) { a.push(bare(it)); if (it.no.startsWith('ei ')) a.push(it.no.replace(/^ei /, 'en ')); }
    return a;
  };
  const whyOf = (it) => `<b lang="nb">${it.no}</b> means “${it.en}”.${it.tip ? '<br>' + it.tip : ''}`;
  const hasPic = (it) => it.vis !== it.no;
  const bigVis = (it) => `<span class="bigvis">${it.vis}</span>`;
  const bigWord = (it) => `<span class="bigword" lang="nb">${it.no}</span>`;
  const words = (it) => it.no.trim().split(/\s+/).length;

  function others(item, pool, n, lab) {
    const seen = new Set([lab(item)]), out = [];
    for (const p of shuffle(pool)) {
      const l = lab(p);
      if (!seen.has(l)) { seen.add(l); out.push(p); if (out.length >= n) break; }
    }
    return out;
  }
  const options = (item, pool, lab, n) => shuffle([lab(item)].concat(others(item, pool, n || 3, lab).map(lab)));

  const exPic = (it, pool) => !hasPic(it) ? exHear(it, pool) : ({
    k: 'mc', big: bigVis(it), q: it.num ? 'Which word is this number?' : 'Which word matches the picture?',
    opts: options(it, pool, x => x.no), a: it.no, why: whyOf(it)
  });
  const exHear = (it, pool, digit) => (digit && it.num) ? ({
    k: 'mc', say: sayOf(it), q: 'Tap the number you hear.', opts: options(it, pool.filter(x => x.num), x => x.vis), a: it.vis, why: whyOf(it)
  }) : ({
    k: 'mc', say: sayOf(it), q: 'Tap what you hear.', opts: options(it, pool, x => x.no), a: it.no, why: whyOf(it)
  });
  const exEnNo = (it, pool) => ({
    k: 'mc', big: it.num ? bigVis(it) : (hasPic(it) ? bigVis(it) : ''), q: `How do you say <b>“${it.en}”</b>?`,
    opts: options(it, pool, x => x.no), a: it.no, why: whyOf(it)
  });
  const exNoEn = (it, pool) => it.num ? ({
    k: 'mc', big: bigWord(it), say: sayOf(it), q: 'Which number is this?', opts: options(it, pool.filter(x => x.num), x => x.vis), a: it.vis, why: whyOf(it)
  }) : ({
    k: 'mc', big: bigWord(it), say: sayOf(it), q: 'What does this mean?', opts: options(it, pool, x => x.en), a: it.en, why: whyOf(it)
  });
  const uniqPics = (pool) => { const seen = new Set(); return pool.filter(x => hasPic(x) && !seen.has(x.vis) && seen.add(x.vis)); };
  const exPicTap = (it, pool) => {
    const ps = uniqPics(pool);
    if (!hasPic(it) || ps.length < 3) return exHear(it, pool);
    const others3 = shuffle(ps.filter(x => x.vis !== it.vis)).slice(0, 3).map(x => x.vis);
    return { k: 'mc', pics: true, say: sayOf(it), q: 'Tap the picture that matches what you hear.', opts: shuffle([it.vis].concat(others3)), a: it.vis, why: whyOf(it) };
  };
  const exPMatch = (items) => {
    const ok = items.length >= 2 && items.every(it => hasPic(it) && !it.num) && new Set(items.map(i => i.vis)).size === items.length;
    if (!ok) return exMatch(items);
    return { k: 'match', pics: true, q: 'Match each picture with its word.', pairs: items.map(it => [it.vis, it.no]), why: items.map(it => `<b lang="nb">${it.no}</b> = ${it.en}`).join(' · ') };
  };
  const exMatch = (items) => ({
    k: 'match', q: 'Tap the matching pairs.', pairs: items.map(it => [it.no, it.num ? it.vis : it.en]),
    why: items.map(it => `<b lang="nb">${it.no}</b> = ${it.num ? it.vis : it.en}`).join(' · ')
  });
  const exTypeHear = (it) => ({ k: 'type', say: sayOf(it), q: 'Type what you hear.', a: answersOf(it), why: whyOf(it) });
  const exTypeEn = (it) => ({
    k: 'type', big: hasPic(it) ? bigVis(it) : '', q: it.num ? 'Write this number in Norwegian.' : `Write <b>“${it.en}”</b> in Norwegian.`,
    a: answersOf(it), why: whyOf(it)
  });
  const exArt = (it) => {
    const a = art(it);
    if (!a) return exPic(it, [it]);
    return {
      k: 'mc', big: bigVis(it), q: `Which little word fits? <b lang="nb">___ ${bare(it)}</b> (${it.en})`,
      opts: a === 'ei' ? ['ei', 'et'] : ['en', 'ei', 'et'], a,
      why: `<b lang="nb">${it.no}</b>${a === 'ei' ? '. (<i>en ' + bare(it) + '</i> is also correct in Bokmål.)' : '.'}`
    };
  };
  /* build a word letter by letter after hearing it */
  const LET = 'abdefghiklmnoprstuvyæøå'.split('');
  const exSpell = (it) => {
    const w = it.no, have = new Set(w.split(''));
    const extra = shuffle(LET.filter(c => !have.has(c))).slice(0, 2);
    return { k: 'bank', join: '', letters: true, q: 'Listen, then spell the word with the letters.', say: sayOf(it), tiles: w.split('').concat(extra), a: [w], why: whyOf(it) };
  };
  /* drag the words to the pictures */
  const exLabel = (items) => ({
    k: 'label', q: 'Drag each word to its picture.', pairs: items.map(it => [it.vis, it.no]),
    why: items.map(it => `<b lang="nb">${it.no}</b> = ${it.en}`).join(' · ')
  });
  const exMemory = (items) => {
    const pics = items.every(it => hasPic(it) && !it.num) && new Set(items.map(i => i.vis)).size === items.length;
    return pics
      ? { k: 'memory', q: 'Find the pairs: a picture and its word.', pairs: items.map(it => [it.vis, it.no]), noSide: 1, why: items.map(it => `<b lang="nb">${it.no}</b> = ${it.en}`).join(' · ') }
      : { k: 'memory', q: 'Find the pairs: the Norwegian and its meaning.', pairs: items.map(it => [it.no, it.num ? it.vis : it.en]), noSide: 0, why: items.map(it => `<b lang="nb">${it.no}</b> = ${it.num ? it.vis : it.en}`).join(' · ') };
  };

  /* one varied practice step per group of new words */
  function groupPractice(items, n) {
    const picsOK = items.length >= 3 && items.every(hasPic) && !items.some(i => i.num) && new Set(items.map(i => i.vis)).size === items.length;
    const opts = [() => exPMatch(items)];
    if (picsOK && items.every(i => i.no.length <= 16)) opts.push(() => exLabel(items));
    if (items.length >= 3 && items.every(i => i.no.length <= 13)) opts.push(() => exMemory(items));
    return opts[n % opts.length]();
  }

  function reviewSteps(pool, n, targets) {
    const seen = new Set();
    pool = pool.filter(it => !seen.has(it.no) && seen.add(it.no));
    if (pool.length < 4) return [];
    const mix = targets && targets.length ? targets : shuffle(pool);
    const picsPool = pool.filter(i => hasPic(i) && !i.num && i.no.length <= 16);
    const out = [];
    const kinds = ['enNo', 'hear', 'spell', 'noEn', 'match', 'typeEn', 'hear', 'label', 'memory', 'typeHear'];
    for (let i = 0; i < n; i++) {
      const it = mix[i % mix.length];
      let k = kinds[i % kinds.length];
      const single = !/\s/.test(it.no);
      if (k === 'spell' && !single) k = 'typeHear';
      if (k === 'label' && uniqPics(picsPool).length < 3) k = 'enNo';
      if (k === 'memory' && pool.filter(x => x.no.length <= 13).length < 4) k = 'match';
      if (k === 'match') out.push(exMatch(shuffle(pool).slice(0, Math.min(4, pool.length))));
      else if (k === 'memory') out.push(exMemory(shuffle(pool.filter(x => x.no.length <= 13)).slice(0, 4)));
      else if (k === 'label') out.push(exLabel(shuffle(uniqPics(picsPool)).slice(0, 3)));
      else if (k === 'enNo') out.push(exEnNo(it, pool));
      else if (k === 'hear') out.push(exHear(it, pool, i % 2 === 0));
      else if (k === 'spell') out.push(exSpell(it));
      else if (k === 'typeHear') out.push(exTypeHear(it));
      else if (k === 'noEn') out.push(exNoEn(it, pool));
      else out.push(exTypeEn(it));
    }
    return out;
  }
  const toNote = (p) => Array.isArray(p) ? { k: 'note', title: p[0], html: p[1], tag: p[2] } : p;

  /* the grammar and sound notes of a unit, collected for its Guide page */
  function guideNotes(u) {
    const out = [], seen = new Set();
    const add = (p) => { const n = p && toNote(p); if (n && (n.tag === 'Grammar' || n.tag === 'Sounds' || n.guide) && !seen.has(n.title)) { seen.add(n.title); out.push(n); } };
    u.lessons.forEach(l => {
      (l.spec.groups || []).forEach(g => { add(g.pre); add(g.post); });
      (l.spec.guide || []).forEach(add);
    });
    return out;
  }

  /* a short, mixed lesson that closes a unit and brings back older material */
  function mesterSteps(f) {
    const sp = f.lesson.spec;
    const own = f.unit.lessons.filter(l => l !== f.lesson).flatMap(l => l.items);
    const earlier = FLAT.filter(x => x.idx < f.idx && x.unit !== f.unit).flatMap(x => x.lesson.items).filter(i => words(i) <= 2);
    const old = shuffle(earlier).slice(0, 4);
    const pool = own.concat(old);
    const nBase = sp.mix ? 7 : 9;
    const targets = shuffle(own).slice(0, nBase - Math.min(2, old.length)).concat(old.slice(0, 2));
    const base = reviewSteps(pool, nBase, shuffle(targets));
    const extra = sp.mix ? sp.mix() : [];
    const out = base.slice();
    extra.forEach((ex, j) => out.splice(Math.min(out.length, 2 + j * 3), 0, ex));
    return [{ k: 'note', title: 'Mastery time', icon: '🏆', html: sp.note || '<p>A mix of everything in this unit, with a few older words and phrases too. Say the answers out loud. When you finish, the next unit opens.</p>' }].concat(out);
  }

  function buildSteps(f) {
    const sp = f.lesson.spec;
    if (sp.build) return sp.build();
    if (sp.mester || sp.review) return mesterSteps(f);
    const all = f.lesson.items;
    const prior = f.unit.lessons.slice(0, f.ui).flatMap(l => l.items);
    let seen = (sp.pool || []).slice();
    const st = [];
    sp.groups.forEach((g, gi) => {
      seen = seen.concat(g.items);
      const first = g.items[0];
      const same = prior.filter(p => !!p.noun === !!first.noun && !!p.num === !!first.num && (words(p) > 1) === (words(first) > 1));
      const pool = seen.concat(shuffle(same).slice(0, 4));
      if (g.pre) st.push(toNote(g.pre));
      st.push({ k: 'grid', items: g.items });
      st.push(groupPractice(g.items, f.idx + gi));
      const its = shuffle(g.items);
      st.push(sp.articles ? exArt(its[0]) : exPicTap(its[0], pool));
      if (g.items.length >= 4 || gi === sp.groups.length - 1) st.push(exEnNo(its[1] || its[0], pool));
      if (g.post) st.push(toNote(g.post));
    });
    if (!sp.noend) {
      const mix = shuffle(all);
      const single = mix.filter(i => !/\s/.test(i.no) && i.no.length >= 2);
      st.push(single.length ? exSpell(single[0]) : exTypeHear(mix[0]));
      st.push(exNoEn(mix[1] || mix[0], seen));
    }
    if (sp.extra) st.push(...sp.extra());
    return st;
  }

  /* ───────── state + render ───────── */
  const state = { view: 'home', run: null, guide: null };
  function render() {
    dz = null;
    ({ home: renderHome, step: renderStep, done: renderDone, guide: renderGuide })[state.view]();
    app.focus({ preventScroll: true });
  }
  function go(view) { state.view = view; render(); window.scrollTo({ top: 0 }); }

  /* ───────── home: the path ───────── */
  const KIND = { intro: 'Start', ord: 'Words', bruk: 'Use it', samtale: 'Talk', mester: 'Mastery' };
  function renderHome() {
    const p = load();
    const doneCount = Object.keys(p.lessons || {}).filter(id => FLAT.some(f => f.lesson.id === id)).length;
    let h = `<section class="card hero">
      <h1><span lang="nb">Hei!</span> 👋</h1>
      <p class="lead">Welcome to <b>Norsk på 1·2·3</b>. Learn Norwegian (Bokmål) in small, friendly steps: new words, then sentences, then grammar that explains how it all fits. Start at the top and follow the path.</p>
      <div class="stats"><span>⭐ ${p.xp || 0} XP</span><span>✅ ${doneCount} of ${FLAT.length} lessons</span></div>
    </section>`;
    if (!audioOK()) {
      h += `<div class="banner"><b>No Norwegian voice found on this device.</b> The listening buttons need one. On a Mac you can add it under System Settings → Accessibility → Spoken Content → System Voice → Manage Voices → Norwegian. Until then, listening questions will show the word as text.</div>`;
    }
    const poolItems = FLAT.filter(f => isDone(f.lesson.id)).flatMap(f => f.lesson.items);
    const uniq = new Set(poolItems.map(i => i.no));
    const fc = formCfg(), sh = jget(SHARE, { on: false, name: '' });
    h += `<details class="card codecard" id="codecard"><summary>💾 Save or restore my progress</summary>
      <p class="muted">Your progress is saved on this device. To keep it safe, or to move it to another device, copy your <b>progress code</b>. Paste a code below to get your stars and XP back.</p>
      <div class="coderow"><input class="ans" id="mycode" readonly aria-label="Your progress code" value="${esc(makeCode())}"><button class="btn ghost" id="copycode">Copy</button></div>
      <div class="coderow"><input class="ans" id="incode" placeholder="Paste a progress code here" aria-label="Paste a progress code" autocomplete="off" autocapitalize="off" spellcheck="false"><button class="btn" id="usecode">Restore</button></div>
      <div id="codemsg" class="codemsg" role="status"></div>
      ${fc ? `<hr class="soft"><label class="sharerow"><input type="checkbox" id="shareon" ${sh.on ? 'checked' : ''}> <span>Share my progress with my teacher after each lesson</span></label>
      <div class="coderow"><input class="ans" id="sharename" placeholder="Your name or nickname" aria-label="Your name or nickname" value="${esc(sh.name || '')}" maxlength="40"></div>
      <p class="muted small">Only your name, the lesson, your stars and your progress code are sent. You can switch this off at any time.</p>` : ''}
    </details>`;
    if (uniq.size >= 8) {
      h += `<button class="mod practice" id="practice"><span class="num">🔁</span><span class="info"><b>Practice</b><small>A quick mixed review of what you have learned</small></span></button>`;
    }
    let currentMarked = false;
    UNITS.forEach((u) => {
      const gn = guideNotes(u).length;
      h += `<div class="unit"><div class="unithead"><div class="uh1"><div><b>${u.title}</b><small>${u.sub}</small></div>${gn ? `<button class="guidebtn" data-guide="${u.id}">📘 Guide</button>` : ''}</div><span>${u.blurb}</span>${u.goal ? `<span class="goal">🎯 <i lang="nb">${u.goal[0]}</i> <em>${u.goal[1]}</em></span>` : ''}</div><div class="trail">`;
      u.lessons.forEach((l) => {
        const f = FLAT.find(x => x.lesson === l);
        const r = (p.lessons || {})[l.id];
        const open = isOpen(f.idx);
        const kind = l.spec.kind || 'ord';
        let cls = 'node k-' + kind, label = '';
        if (r) { cls += ' done'; label = '★'.repeat(r.stars) + '☆'.repeat(3 - r.stars); }
        else if (open && !currentMarked) { cls += ' current'; currentMarked = true; label = 'Start'; }
        else if (open) { label = ''; }
        else { cls += ' locked'; label = '🔒'; }
        h += `<div class="${cls}">
          <button class="circle" ${open ? `data-lesson="${f.idx}"` : 'disabled'} aria-label="${l.title}${open ? '' : ' (locked)'}">${r ? (kind === 'mester' ? '🏆' : '✓') : l.icon}</button>
          <div class="nlabel"><span class="kind">${KIND[kind]}</span><b>${l.title}</b><small>${label}</small></div></div>`;
      });
      h += '</div></div>';
    });
    app.innerHTML = h;
    const curNode = app.querySelector('.node.current');
    if (curNode && Object.keys(p.lessons || {}).length) setTimeout(() => curNode.scrollIntoView({ block: 'center' }), 50);
    app.querySelectorAll('[data-lesson]').forEach(b => b.addEventListener('click', () => startLesson(FLAT[+b.dataset.lesson])));
    app.querySelectorAll('[data-guide]').forEach(b => b.addEventListener('click', () => { state.guide = b.dataset.guide; go('guide'); }));
    const msg = (t, ok) => { const m = app.querySelector('#codemsg'); m.textContent = t; m.className = 'codemsg ' + (ok ? 'ok' : 'no'); };
    app.querySelector('#copycode').onclick = () => {
      const v = app.querySelector('#mycode').value;
      const done = () => msg('Code copied.', true);
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(v).then(done, () => { app.querySelector('#mycode').select(); msg('Select the code and copy it.', true); });
      else { app.querySelector('#mycode').select(); msg('Select the code and copy it.', true); }
    };
    app.querySelector('#usecode').onclick = () => {
      if (restore(app.querySelector('#incode').value)) { document.getElementById('codecard').dataset.open = '1'; render(); const d = app.querySelector('#codecard'); d.open = true; const m = app.querySelector('#codemsg'); m.textContent = 'Done! Your progress is back.'; m.className = 'codemsg ok'; setTimeout(() => d.scrollIntoView({ block: 'center' }), 120); }
      else msg('That code does not look right. Check that you pasted all of it.', false);
    };
    const so = app.querySelector('#shareon'), sn = app.querySelector('#sharename');
    if (so) {
      const upd = () => { const on = so.checked && !!sn.value.trim(); jset(SHARE, { on: so.checked, name: sn.value.trim() }); if (so.checked && !sn.value.trim()) msg('Write your name or nickname so your teacher knows who you are.', false); else if (on) msg('Sharing is on.', true); else msg('Sharing is off.', true); };
      so.onchange = upd; sn.onchange = upd;
    }
    const pr = app.querySelector('#practice');
    if (pr) pr.onclick = () => {
      const steps = reviewSteps(poolItems, 10);
      begin({ unit: null, lesson: { id: '_practice', title: 'Practice', icon: '🔁' } }, steps, true);
    };
  }

  const tagLabel = (t) => t === 'Grammar' ? '📘 Grammar' : t === 'Sounds' ? '🔊 Sounds' : t;
  function renderGuide() {
    const u = UNITS.find(x => x.id === state.guide) || UNITS[0];
    const notes = guideNotes(u);
    app.innerHTML = `<div class="runhead"><button class="linkish" id="back">← Back to the path</button><span>${u.title} · Guide</span></div>
      <section class="card"><h1>📘 ${u.title}</h1>
        <p class="lead">${u.sub}. The rules and sounds from this unit in one place, so you can read them again whenever you like.</p>
        ${u.goal ? `<div class="tip">🎯 <b lang="nb">${u.goal[0]}</b> <span class="muted">${u.goal[1]}</span></div>` : ''}</section>
      ${notes.map(n => `<section class="card note">${n.tag ? `<div class="tagbadge ${n.tag === 'Grammar' ? 'gram' : ''}">${tagLabel(n.tag)}</div>` : ''}<h2>${n.title}</h2>${n.html}</section>`).join('')}
      <div class="row" style="justify-content:flex-end"><button class="btn" id="back2">Back to the path</button></div>`;
    app.querySelector('#back').onclick = app.querySelector('#back2').onclick = () => go('home');
  }

  /* ───────── running a lesson ───────── */
  const EX_KINDS = ['mc', 'type', 'match', 'bank', 'slots', 'label', 'sort', 'ending', 'spot', 'memory'];
  function startLesson(f) { begin(f, buildSteps(f), false); }
  function begin(f, steps, practice) {
    const q = steps.map(s => Object.assign({ tries: 0 }, s));
    state.run = { f, practice, q, i: 0, exTotal: q.filter(s => EX_KINDS.includes(s.k)).length, first: 0 };
    go('step');
  }

  function bar(R) { return `<div class="progress" aria-label="Progress"><i style="width:${Math.min(100, (R.i / R.q.length) * 100)}%"></i></div>
    <div class="runhead"><button class="linkish" id="quit">✕ Leave lesson</button><span>${R.f.lesson.title}</span></div>`; }

  function next() {
    const R = state.run;
    R.i++;
    if (R.i >= R.q.length) return finishRun();
    renderStep();
  }
  function finishRun() {
    const R = state.run;
    const acc = R.exTotal ? R.first / R.exTotal : 1;
    const stars = acc >= 0.9 ? 3 : acc >= 0.7 ? 2 : 1;
    const xp = R.first * 10 + 5;
    const p = load();
    p.xp = (p.xp || 0) + xp;
    if (!R.practice) {
      const prev = (p.lessons || {})[R.f.lesson.id];
      p.lessons = p.lessons || {};
      p.lessons[R.f.lesson.id] = { stars: Math.max(stars, prev ? prev.stars : 0), acc: Math.max(acc, prev ? prev.acc : 0) };
    }
    save(p);
    R.result = { acc, stars, xp };
    if (!R.practice) shareProgress(R.f.lesson, stars, acc, p.xp);
    go('done');
  }

  function renderDone() {
    const R = state.run, r = R.result;
    const nf = !R.practice && FLAT[R.f.idx + 1];
    const mester = !R.practice && R.f.lesson.spec.kind === 'mester';
    app.innerHTML = `
      <section class="card done">
        <div class="bigvis">${mester ? '🏆' : '🎉'}</div>
        <h1 lang="nb">${mester ? 'Mester!' : 'Bra jobbet!'}</h1>
        <p class="lead">${R.practice ? 'Practice complete.' : mester ? 'Unit complete. <span lang="en">(You mastered it!)</span>' : 'Lesson complete.'} ${mester ? '' : '<span lang="en">(Well done!)</span>'}</p>
        ${R.practice ? '' : `<div class="stars">${'★'.repeat(r.stars)}${'☆'.repeat(3 - r.stars)}</div>`}
        <div class="stats"><span>🎯 ${Math.round(r.acc * 100)}% on the first try</span><span>⭐ +${r.xp} XP</span></div>
        <div class="row" style="justify-content:center;margin-top:18px">
          ${nf ? '<button class="btn" id="nextl">Next lesson →</button>' : ''}
          <button class="btn ${nf ? 'ghost' : ''}" id="again">${R.practice ? 'Practise again' : 'Do it again'}</button>
          <button class="btn ghost" id="home">Back to the path</button>
        </div>
      </section>`;
    const $ = (s) => app.querySelector(s);
    if ($('#nextl')) $('#nextl').onclick = () => startLesson(nf);
    $('#again').onclick = () => startLesson(R.f);
    $('#home').onclick = () => go('home');
    if (R.practice) $('#again').onclick = () => {
      const poolItems = FLAT.filter(f => isDone(f.lesson.id)).flatMap(f => f.lesson.items);
      begin(R.f, reviewSteps(poolItems, 10), true);
    };
  }

  const audioBar = (word) => !word ? '' : `<div class="listenbar">
      <button class="bigsay" data-say="${esc(word)}">🔊 Listen</button>
      <button class="bigsay" data-say="${esc(word)}" data-slow="1">🐢 Slowly</button></div>
      ${audioOK() ? '' : `<div class="noaudio">Audio is not available on this device. The word is: <b lang="nb">${word}</b></div>`}`;

  const feedbackHTML = (ok, s, correct, near) => `<div class="feedback ${ok ? 'ok' : 'no'}" role="status">
    <b lang="nb">${near ? 'Nesten!' : ok ? 'Riktig!' : 'Ikke helt.'} <span style="font-weight:400" lang="en">${near ? '(Almost. Check the spelling.)' : ok ? '(Correct)' : '(Not quite. This one will come back.)'}</span></b>
    ${near && correct ? `<div>Spelled: <b lang="nb">${correct}</b></div>` : ''}
    ${!ok && correct ? `<div>Correct answer: <b lang="nb">${correct}</b></div>` : ''}
    <div>${s.why || ''}</div></div>`;

  function renderStep() {
    const R = state.run;
    const s = R.q[R.i];
    dz = null;
    if (s.k === 'note') return renderNote(R, s);
    if (s.k === 'card') return renderCard(R, s);
    if (s.k === 'grid') return renderGrid(R, s);
    return renderExercise(R, s);
  }

  function wireQuit() {
    const q = app.querySelector('#quit');
    if (q) q.onclick = () => { if (confirm('Leave this lesson? Your progress in this lesson will be lost.')) go('home'); };
  }

  function renderNote(R, s) {
    app.innerHTML = `${bar(R)}
      <section class="card note">
        ${s.tag ? `<div class="tagbadge ${s.tag === 'Grammar' ? 'gram' : ''}">${tagLabel(s.tag)}</div>` : ''}
        ${s.icon ? `<div class="noteicon">${s.icon}</div>` : ''}
        <h2>${s.title}</h2>${s.html}
      </section>
      <div class="row" style="justify-content:flex-end"><button class="btn" id="go">Continue →</button></div>`;
    wireQuit(); app.querySelector('#go').onclick = next; app.querySelector('#go').focus();
  }

  function renderGrid(R, s) {
    const seen = new Set();
    app.innerHTML = `${bar(R)}
      <section class="card gridcard">
        <div class="badge">New words</div>
        <div class="q" style="text-align:center;margin-top:14px">Tap each one to hear it.</div>
        <div class="tilegrid">${s.items.map((it, i) => `<button class="wtile" data-i="${i}">${hasPic(it) ? `<span class="wv">${it.vis}</span>` : ''}<span class="wn" lang="nb">${it.no}</span><span class="we">${it.en}</span></button>`).join('')}</div>
        <div id="gsel" class="gsel" hidden></div>
      </section>
      <div class="row" style="justify-content:flex-end"><button class="btn" id="go" disabled>Continue →</button></div>`;
    wireQuit();
    const tiles = [...app.querySelectorAll('.wtile')];
    tiles.forEach(t => t.onclick = () => {
      const it = s.items[+t.dataset.i];
      tiles.forEach(x => x.classList.remove('on')); t.classList.add('on', 'seen');
      seen.add(+t.dataset.i); speak(sayOf(it));
      const g = app.querySelector('#gsel'); g.hidden = false;
      g.innerHTML = `<div class="gword"><b lang="nb">${it.no}</b><span>${audioBtns(sayOf(it))}</span></div>${it.tip ? `<div class="tip">${it.tip}</div>` : ''}`;
      if (seen.size === s.items.length) { const go = app.querySelector('#go'); go.disabled = false; go.classList.add('ready'); }
    });
    app.querySelector('#go').onclick = next;
  }
  const audioBtns = (w) => `<button class="say" data-say="${esc(w)}" aria-label="Listen">🔊</button><button class="say" data-say="${esc(w)}" data-slow="1" aria-label="Listen slowly">🐢</button>`;

  function renderCard(R, s) {
    const it = s.item;
    const showPic = hasPic(it);
    app.innerHTML = `${bar(R)}
      <section class="card newword">
        <div class="badge">New</div>
        ${showPic ? `<div class="bigvis">${it.vis}</div>` : ''}
        <div class="nw-no" lang="nb">${it.no}</div>
        <div class="nw-en">${it.en}</div>
        <div class="listenbar" style="justify-content:center">
          <button class="bigsay" data-say="${esc(sayOf(it))}">🔊 Listen</button>
          <button class="bigsay" data-say="${esc(sayOf(it))}" data-slow="1">🐢 Slowly</button>
        </div>
        ${it.tip ? `<div class="tip">${it.tip}</div>` : ''}
      </section>
      <div class="row" style="justify-content:flex-end"><button class="btn" id="go">Continue →</button></div>`;
    wireQuit(); const b = app.querySelector('#go'); b.onclick = next; b.focus();
    setTimeout(() => { if (state.run === R && R.q[R.i] === s) speak(sayOf(it)); }, 250);
  }

  /* ───────── exercises ───────── */
  const chunkLabel = (t) => String(t).replace(/[.,!?]+$/, '');

  function renderExercise(R, s) {
    let body = '';
    if (s.k === 'mc') {
      s.shuf = s.shuf || shuffle(s.opts);
      body = `${s.big ? `<div class="bigwrap">${s.big}</div>` : ''}${audioBar(s.say)}
        <div class="opts ${s.pics ? 'pics' : (s.shuf.every(o => String(o).length < 12) ? 'two' : '')}" role="radiogroup">
        ${s.shuf.map((o, i) => `<button class="opt ${s.pics ? 'picbtn' : ''}" role="radio" aria-checked="false" data-i="${i}" lang="nb">${o}</button>`).join('')}</div>`;
    } else if (s.k === 'type') {
      body = `${s.big ? `<div class="bigwrap">${s.big}</div>` : ''}${audioBar(s.say)}
        <input class="ans" id="ans" type="text" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" aria-label="Your answer" lang="nb">
        <div class="chars" aria-label="Special letters"><button data-ch="æ">æ</button><button data-ch="ø">ø</button><button data-ch="å">å</button></div>`;
    } else if (s.k === 'match') {
      s.left = s.left || shuffle(s.pairs.map(p => p[0]));
      s.right = s.right || shuffle(s.pairs.map(p => p[1]));
      body = `<div class="match">
        <div style="display:grid;gap:10px">${s.left.map(l => `<button class="opt dg ${s.pics ? 'bigemo' : ''}" data-l="${esc(l)}" lang="nb">${l}</button>`).join('')}</div>
        <div style="display:grid;gap:10px">${s.right.map(r => `<button class="opt" data-r="${esc(r)}" data-drop>${r}</button>`).join('')}</div></div>`;
    } else if (s.k === 'bank') {
      s.order = s.order || shuffle(s.tiles.map((t, i) => i));
      body = `${s.big ? `<div class="bigwrap">${s.big}</div>` : ''}${audioBar(s.say)}<div class="line" id="line" data-drop aria-label="Your answer"></div><div class="tiles" id="tiles" data-drop></div>`;
    } else if (s.k === 'slots') {
      s.cache = s.cache || {};
      s.cache.order = s.cache.order || shuffle(s.tiles.map((t, i) => i));
      body = `${audioBar(s.say)}<div class="board" id="board"></div><div class="tiles" id="stiles" data-drop></div>`;
    } else if (s.k === 'label') {
      body = `<div class="scene" id="lscene"></div><div class="chips" id="lchips" data-drop></div>`;
    } else if (s.k === 'sort') {
      body = `<div class="bins" id="bins"></div><div class="chips" id="schips" data-drop></div>`;
    } else if (s.k === 'ending') {
      body = `<div class="erows" id="erows"></div><div class="chips" id="echips"></div>`;
    } else if (s.k === 'spot') {
      body = `<div class="spotline" id="spot">${s.words.map((w, i) => `<button class="spotw" data-w="${i}" lang="nb">${w}</button>`).join('')}</div>`;
    } else if (s.k === 'memory') {
      s.cache = s.cache || {};
      if (!s.cache.cards) s.cache.cards = shuffle(s.pairs.flatMap((p, id) => [{ id, text: p[0], no: s.noSide === 0 }, { id, text: p[1], no: s.noSide === 1 }]));
      body = `<div class="memgrid" id="mem">${s.cache.cards.map((c, i) => `<button class="mcard ${/^[\d]+$/.test(c.text) ? 'num' : ''}" data-m="${i}" aria-label="Card ${i + 1}"><span class="back">❄️</span><span class="front ${/[^\u0000-ɏ]/.test(c.text) ? 'emo' : ''}" lang="${c.no ? 'nb' : 'en'}">${c.text}</span></button>`).join('')}</div>`;
    }

    const noCheck = s.k === 'match' || s.k === 'memory';
    const canSkip = ['type', 'bank', 'slots'].includes(s.k);
    app.innerHTML = `${bar(R)}
      <section class="card">
        <div class="q">${s.q}</div>
        ${body}
        <div id="fb"></div>
        <div class="row" style="justify-content:flex-end">
          ${canSkip ? '<button class="linkish" id="skip" style="margin-right:auto">I do not know</button>' : ''}
          <button class="btn" id="check" ${noCheck ? 'hidden' : 'disabled'}>Check</button>
        </div>
      </section>`;
    wireQuit();

    const $ = (x) => app.querySelector(x);
    const fb = $('#fb'), btn = $('#check');
    let answered = false;

    const finish = (ok, correctText, near) => {
      answered = true;
      if (ok) { if (s.tries === 0) R.first++; }
      else if (!['match', 'memory'].includes(s.k) && s.tries < 2) R.q.push(Object.assign({}, s, { tries: s.tries + 1, shuf: null, order: null, cache: null }));
      fb.innerHTML = feedbackHTML(ok, s, correctText, near);
      btn.hidden = false; btn.disabled = false; const sk = $('#skip'); if (sk) sk.hidden = true;
      btn.textContent = R.i === R.q.length - 1 ? 'Finish' : 'Continue →';
      btn.onclick = next; btn.focus();
      dz = null;
    };
    const c = { s, R, $, btn, fb, finish, isDone: () => answered, skip: $('#skip') };
    ({ mc: wireMC, type: wireType, match: wireMatch, bank: wireBank, slots: wireSlots, label: wireLabel, sort: wireSort, ending: wireEnding, spot: wireSpot, memory: wireMemory })[s.k](c);
  }

  function wireMC(c) {
    const { s, btn } = c;
    let sel = null;
    const opts = [...app.querySelectorAll('.opt')];
    opts.forEach(b => b.onclick = () => {
      if (c.isDone()) return;
      opts.forEach(x => { x.classList.remove('sel'); x.setAttribute('aria-checked', 'false'); });
      b.classList.add('sel'); b.setAttribute('aria-checked', 'true');
      sel = s.shuf[+b.dataset.i]; btn.disabled = false;
    });
    btn.onclick = () => {
      if (c.isDone() || sel === null) return;
      opts.forEach(x => {
        x.disabled = true;
        const v = s.shuf[+x.dataset.i];
        if (v === s.a) x.classList.add('right'); else if (x.classList.contains('sel')) x.classList.add('wrong');
      });
      c.finish(sel === s.a, s.a);
    };
  }

  function wireType(c) {
    const { s, btn, $ } = c;
    const inp = $('#ans');
    inp.focus();
    inp.addEventListener('input', () => { btn.disabled = !inp.value.trim(); });
    inp.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !btn.disabled) btn.click(); });
    app.querySelectorAll('[data-ch]').forEach(b => b.onclick = () => {
      if (c.isDone()) return;
      const a = inp.selectionStart == null ? inp.value.length : inp.selectionStart;
      const z = inp.selectionEnd == null ? inp.value.length : inp.selectionEnd;
      inp.value = inp.value.slice(0, a) + b.dataset.ch + inp.value.slice(z);
      inp.focus(); inp.setSelectionRange(a + 1, a + 1); btn.disabled = false;
    });
    btn.onclick = () => {
      if (c.isDone()) return;
      const val = norm(inp.value), ans = s.a.map(norm);
      let ok = ans.includes(val), near = false;
      if (!ok) near = ans.some(x => fold(x) === fold(val) || (val.length >= 5 && x.length >= 5 && lev(x, val) <= 1));
      inp.disabled = true; inp.classList.add(ok || near ? 'right' : 'wrong');
      c.finish(ok || near, s.a[0], near && !ok);
    };
    if (c.skip) c.skip.onclick = () => { if (c.isDone()) return; inp.disabled = true; inp.classList.add('wrong'); c.finish(false, s.a[0]); };
  }

  function wireMatch(c) {
    const { s } = c;
    let pickL = null, mistakes = 0, done = 0;
    const pairOf = Object.fromEntries(s.pairs.map(p => [p[0], p[1]]));
    const lefts = [...app.querySelectorAll('[data-l]')], rights = [...app.querySelectorAll('[data-r]')];
    const select = (b) => {
      if (c.isDone() || b.classList.contains('done')) return;
      lefts.forEach(x => x.classList.remove('sel')); b.classList.add('sel'); pickL = b;
      if (!s.pics) speak(b.dataset.l);
    };
    const pair = (l, r) => {
      if (c.isDone() || !l || !r || l.classList.contains('done') || r.classList.contains('done')) return;
      if (pairOf[l.dataset.l] === r.dataset.r) {
        l.classList.remove('sel'); l.classList.add('done'); r.classList.add('done'); if (pickL === l) pickL = null; done++;
        if (s.pics) speak(r.dataset.r);
        if (done === s.pairs.length) c.finish(mistakes === 0, s.pairs.map(p => `${p[0]} = ${p[1]}`).join(' · '));
      } else { mistakes++; r.classList.add('flash'); setTimeout(() => r.classList.remove('flash'), 500); }
    };
    rights.forEach(b => b.onclick = () => pair(pickL, b));
    setDnd({
      sel: '[data-l]', drop: '[data-r]',
      onTap: select,
      onDrop: (el, t) => { if (t) { select(el); pair(el, t); } }
    });
  }

  /* build a sentence (or a word) from tiles; tiles can be dragged, tapped, and reordered */
  function wireBank(c) {
    const { s, btn, $ } = c;
    const join = s.join === undefined ? ' ' : s.join;
    const chosen = [];
    const line = $('#line'), tiles = $('#tiles');
    const cls = s.letters ? 'tile letter' : 'tile';
    const paint = () => {
      line.innerHTML = chosen.map(i => `<button class="${cls} dg" data-un="${i}" data-drop lang="nb">${s.tiles[i]}</button>`).join('');
      tiles.innerHTML = s.order.map(i => `<button class="${cls} ${chosen.includes(i) ? 'used' : 'dg'}" data-t="${i}" lang="nb" ${chosen.includes(i) ? 'disabled' : ''}>${s.tiles[i]}</button>`).join('');
      btn.disabled = c.isDone() || !chosen.length;
    };
    const remove = (i) => { const j = chosen.indexOf(i); if (j >= 0) chosen.splice(j, 1); };
    paint();
    setDnd({
      sel: '[data-t],[data-un]', drop: '[data-un],#line,#tiles',
      onTap: (el) => {
        if (c.isDone()) return;
        if (el.dataset.t !== undefined) chosen.push(+el.dataset.t); else remove(+el.dataset.un);
        paint();
      },
      onDrop: (el, t) => {
        if (c.isDone() || !t || t === el) return;
        const fromPool = el.dataset.t !== undefined, i = +(fromPool ? el.dataset.t : el.dataset.un);
        if (t.id === 'tiles') { if (!fromPool) remove(i); paint(); return; }
        if (!fromPool) remove(i);
        if (t.dataset.un !== undefined) { const j = chosen.indexOf(+t.dataset.un); chosen.splice(j < 0 ? chosen.length : j, 0, i); }
        else chosen.push(i);
        paint();
      }
    });
    btn.onclick = () => {
      if (c.isDone()) return;
      const got = norm(chosen.map(i => s.tiles[i]).join(join));
      c.finish(s.a.map(norm).includes(got), s.a[0]);
    };
    if (c.skip) c.skip.onclick = () => { if (!c.isDone()) c.finish(false, s.a[0]); };
  }

  /* the sentence board: numbered boxes, the verb tile is green and belongs in box 2 */
  function wireSlots(c) {
    const { s, btn, $ } = c;
    const n = s.chunks.length, order = s.cache.order;
    const put = Array(n).fill(null);
    const paint = () => {
      $('#board').innerHTML = put.map((v, k) => `<div class="sl ${s.v2 && k === 1 ? 'v2' : ''}" data-slot="${k}" data-drop><i>${k + 1}</i>${v !== null ? `<button class="tile dg ${s.tiles[v].verb ? 'verb' : ''}" data-p="${v}" lang="nb">${s.tiles[v].t}</button>` : ''}</div>`).join('');
      $('#stiles').innerHTML = order.map(i => `<button class="tile ${s.tiles[i].verb ? 'verb' : ''} ${put.includes(i) ? 'used' : 'dg'}" data-c="${i}" lang="nb" ${put.includes(i) ? 'disabled' : ''}>${s.tiles[i].t}</button>`).join('');
      btn.disabled = c.isDone() || put.some(v => v === null);
    };
    paint();
    setDnd({
      sel: '[data-c],[data-p]', drop: '[data-slot],#stiles',
      onTap: (el) => {
        if (c.isDone()) return;
        if (el.dataset.c !== undefined) { const k = put.indexOf(null); if (k >= 0) put[k] = +el.dataset.c; }
        else put[put.indexOf(+el.dataset.p)] = null;
        paint();
      },
      onDrop: (el, t) => {
        if (c.isDone() || !t) return;
        if (el.dataset.c !== undefined) { if (t.dataset.slot !== undefined) put[+t.dataset.slot] = +el.dataset.c; }
        else {
          const j = put.indexOf(+el.dataset.p);
          if (t.dataset.slot !== undefined) { const k = +t.dataset.slot; const tmp = put[k]; put[k] = put[j]; put[j] = tmp; }
          else put[j] = null;
        }
        paint();
      }
    });
    btn.onclick = () => {
      if (c.isDone()) return;
      const sl = [...app.querySelectorAll('.sl')];
      let ok = true;
      put.forEach((v, k) => { const good = v === k; if (!good) ok = false; sl[k].classList.add(good ? 'right' : 'wrong'); });
      c.finish(ok, s.a[0]);
    };
    if (c.skip) c.skip.onclick = () => { if (!c.isDone()) c.finish(false, s.a[0]); };
  }

  /* drag each word to its picture */
  function wireLabel(c) {
    const { s, btn, $ } = c;
    s.cache = s.cache || {};
    const order = s.cache.order = s.cache.order || shuffle(s.pairs.map((p, i) => i));
    const put = s.pairs.map(() => null);
    let sel = null;
    const paint = () => {
      $('#lscene').innerHTML = s.pairs.map((p, k) => `<div class="obj"><span class="ov">${p[0]}</span><button class="lslot ${put[k] !== null ? 'full dg' : ''}" data-slot="${k}" data-drop lang="nb" aria-label="Place a word here">${put[k] !== null ? s.pairs[put[k]][1] : ''}</button></div>`).join('');
      $('#lchips').innerHTML = order.map(i => { const used = put.includes(i); return `<button class="chip ${used ? 'used' : 'dg'} ${sel === i ? 'sel' : ''}" data-c="${i}" lang="nb" ${used ? 'disabled' : ''}>${s.pairs[i][1]}</button>`; }).join('');
      btn.disabled = c.isDone() || put.some(v => v === null);
    };
    const place = (k, i) => { put[k] = i; speak(s.pairs[i][1]); };
    paint();
    setDnd({
      sel: '[data-c],[data-slot]', drop: '[data-slot],#lchips',
      canDrag: (el) => el.dataset.c !== undefined || put[+el.dataset.slot] !== null,
      onTap: (el) => {
        if (c.isDone()) return;
        if (el.dataset.c !== undefined) sel = sel === +el.dataset.c ? null : +el.dataset.c;
        else { const k = +el.dataset.slot; if (sel !== null) { place(k, sel); sel = null; } else put[k] = null; }
        paint();
      },
      onDrop: (el, t) => {
        if (c.isDone() || !t) return;
        if (el.dataset.c !== undefined) { if (t.dataset.slot !== undefined) place(+t.dataset.slot, +el.dataset.c); }
        else {
          const j = +el.dataset.slot;
          if (t.dataset.slot !== undefined) { const k = +t.dataset.slot; if (k !== j) { const tmp = put[k]; put[k] = put[j]; put[j] = tmp; } }
          else put[j] = null;
        }
        sel = null; paint();
      }
    });
    btn.onclick = () => {
      if (c.isDone()) return;
      const sl = [...app.querySelectorAll('.lslot')];
      let ok = true;
      put.forEach((v, k) => { const good = v === k; if (!good) ok = false; sl[k].classList.add(good ? 'right' : 'wrong'); });
      c.finish(ok, s.pairs.map(p => `${p[0]} ${p[1]}`).join(' · '));
    };
  }

  /* sort words into boxes (for example en / ei / et) */
  function wireSort(c) {
    const { s, btn, $ } = c;
    s.cache = s.cache || {};
    const order = s.cache.order = s.cache.order || shuffle(s.items.map((t, i) => i));
    const put = s.items.map(() => null);
    let sel = null;
    const chip = (i, extra) => `<button class="chip dg ${extra || ''} ${sel === i ? 'sel' : ''}" data-c="${i}" lang="nb">${s.items[i].t}</button>`;
    const paint = () => {
      $('#bins').innerHTML = s.bins.map(b => `<div class="bin" data-bin="${b.id}" data-drop><div class="binh">${b.label}</div><div class="binb">${order.filter(i => put[i] === b.id).map(i => chip(i, 'placed')).join('')}</div></div>`).join('');
      $('#schips').innerHTML = order.filter(i => put[i] === null).map(i => chip(i)).join('');
      btn.disabled = c.isDone() || put.some(v => v === null);
    };
    paint();
    setDnd({
      sel: '[data-c],[data-bin]', drop: '[data-bin],#schips',
      canDrag: (el) => el.dataset.c !== undefined,
      onTap: (el) => {
        if (c.isDone()) return;
        if (el.dataset.c !== undefined) {
          const i = +el.dataset.c;
          if (put[i] !== null) { if (sel !== null) { put[sel] = put[i]; sel = null; } else put[i] = null; }
          else sel = sel === i ? null : i;
        } else if (sel !== null) { put[sel] = el.dataset.bin; sel = null; }
        paint();
      },
      onDrop: (el, t) => {
        if (c.isDone() || !t || el.dataset.c === undefined) return;
        const i = +el.dataset.c;
        put[i] = t.dataset.bin !== undefined ? t.dataset.bin : null;
        sel = null; paint();
      }
    });
    btn.onclick = () => {
      if (c.isDone()) return;
      let ok = true;
      app.querySelectorAll('.bin .chip').forEach(el => { const i = +el.dataset.c; const good = put[i] === s.items[i].bin; if (!good) ok = false; el.classList.add(good ? 'right' : 'wrong'); });
      c.finish(ok, s.items.map(it => `${plain(it.t)} → ${(s.bins.find(b => b.id === it.bin) || {}).label}`).join(' · '));
    };
  }

  /* drag an ending onto a word; the first rows are worked examples */
  function wireEnding(c) {
    const { s, btn, $ } = c;
    const put = s.rows.map(r => r.given ? r.ans : null);
    let sel = null;
    const lab = (v) => v === '' ? '–' : '-' + v;
    const paint = () => {
      $('#erows').innerHTML = s.rows.map((r, k) => `<div class="erow"><span class="esrc" lang="nb">${r.src}</span><span class="earr">→</span><span class="estem" lang="nb">${r.stem}</span><button class="eslot ${r.given ? 'given' : 'dg'} ${put[k] !== null ? 'full' : ''}" data-slot="${k}" ${r.given ? 'data-lock="1" disabled' : 'data-drop'} lang="nb" aria-label="Place an ending here">${put[k] !== null ? lab(put[k]) : ''}</button></div>`).join('');
      $('#echips').innerHTML = s.chips.map((v, j) => `<button class="chip dg ${sel === j ? 'sel' : ''}" data-c="${j}" lang="nb">${lab(v)}</button>`).join('');
      btn.disabled = c.isDone() || s.rows.some((r, k) => put[k] === null);
    };
    paint();
    setDnd({
      sel: '[data-c],[data-slot]', drop: '[data-slot]',
      canDrag: (el) => el.dataset.c !== undefined || put[+el.dataset.slot] !== null,
      onTap: (el) => {
        if (c.isDone()) return;
        if (el.dataset.c !== undefined) sel = sel === +el.dataset.c ? null : +el.dataset.c;
        else { const k = +el.dataset.slot; if (sel !== null) { put[k] = s.chips[sel]; speak(s.rows[k].stem + s.chips[sel]); sel = null; } else put[k] = null; }
        paint();
      },
      onDrop: (el, t) => {
        if (c.isDone()) return;
        if (el.dataset.c !== undefined) { if (t && t.dataset.slot !== undefined) put[+t.dataset.slot] = s.chips[+el.dataset.c]; }
        else { const j = +el.dataset.slot; if (t && t.dataset.slot !== undefined && +t.dataset.slot !== j) { put[+t.dataset.slot] = put[j]; put[j] = null; } else if (!t) put[j] = null; }
        sel = null; paint();
      }
    });
    btn.onclick = () => {
      if (c.isDone()) return;
      const sl = [...app.querySelectorAll('.eslot')];
      let ok = true;
      s.rows.forEach((r, k) => { if (r.given) return; const good = put[k] === r.ans; if (!good) ok = false; sl[k].classList.add(good ? 'right' : 'wrong'); });
      c.finish(ok, s.rows.filter(r => !r.given).map(r => r.stem + r.ans).join(' · '));
    };
  }

  /* tap the word that is wrong */
  function wireSpot(c) {
    const { s, btn } = c;
    const bad = [].concat(s.bad);
    let sel = null;
    const ws = [...app.querySelectorAll('.spotw')];
    ws.forEach(b => b.onclick = () => {
      if (c.isDone()) return;
      ws.forEach(x => x.classList.remove('sel')); b.classList.add('sel'); sel = +b.dataset.w; btn.disabled = false;
    });
    btn.onclick = () => {
      if (c.isDone() || sel === null) return;
      const ok = bad.includes(sel);
      ws.forEach((x, i) => { x.disabled = true; if (bad.includes(i)) x.classList.add('right'); else if (i === sel) x.classList.add('wrong'); });
      c.finish(ok, s.fix);
    };
  }

  /* flip two cards at a time and find the pairs */
  function wireMemory(c) {
    const { s } = c;
    const cards = s.cache.cards;
    const els = [...app.querySelectorAll('.mcard')];
    let open = [], mistakes = 0, found = 0, lock = false;
    els.forEach((b, i) => b.onclick = () => {
      if (c.isDone() || lock || b.classList.contains('up')) return;
      b.classList.add('up');
      if (cards[i].no) speak(cards[i].text);
      open.push(i);
      if (open.length < 2) return;
      const [a, z] = open; open = [];
      if (cards[a].id === cards[z].id) {
        els[a].classList.add('gone'); els[z].classList.add('gone'); found++;
        if (found === s.pairs.length) setTimeout(() => c.finish(mistakes <= s.pairs.length, s.pairs.map(p => `${p[0]} = ${p[1]}`).join(' · ')), 350);
      } else {
        mistakes++; lock = true;
        setTimeout(() => { els[a].classList.remove('up'); els[z].classList.remove('up'); lock = false; }, 850);
      }
    });
  }

  /* ───────── header / footer ───────── */
  document.getElementById('homeLink').addEventListener('click', (e) => {
    e.preventDefault();
    if (state.view === 'step') { if (confirm('Leave this lesson? Your progress in this lesson will be lost.')) go('home'); }
    else go('home');
  });
  document.getElementById('resetBtn').addEventListener('click', () => {
    if (confirm('Reset all progress on this device? This cannot be undone.')) { save({ lessons: {}, xp: 0 }); go('home'); }
  });

  /* ───────── falling snow ───────── */
  (function snow() {
    const c = document.getElementById('snow');
    const ctx = c.getContext('2d');
    const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    let w = 0, h = 0, flakes = [], raf = 0;
    function size() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth; h = window.innerHeight;
      c.width = w * dpr; c.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.min(150, Math.round(w / 9));
      flakes = Array.from({ length: n }, () => ({ x: Math.random() * w, y: Math.random() * h, r: 1 + Math.random() * 2.6, s: 0.25 + Math.random() * 0.9, p: Math.random() * 6.28 }));
      draw();
    }
    function draw() {
      ctx.clearRect(0, 0, w, h);
      for (const f of flakes) {
        ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, 6.283);
        ctx.fillStyle = 'rgba(255,255,255,0.95)'; ctx.fill();
        ctx.lineWidth = 0.6; ctx.strokeStyle = 'rgba(120,160,200,0.35)'; ctx.stroke();
      }
    }
    function step(t) {
      for (const f of flakes) {
        f.y += f.s; f.x += Math.sin(t / 1600 + f.p) * 0.35;
        if (f.y > h + 5) { f.y = -5; f.x = Math.random() * w; }
        if (f.x > w + 5) f.x = -5; else if (f.x < -5) f.x = w + 5;
      }
      draw(); raf = requestAnimationFrame(step);
    }
    size();
    window.addEventListener('resize', size);
    if (!reduce) {
      raf = requestAnimationFrame(step);
      document.addEventListener('visibilitychange', () => { if (document.hidden) cancelAnimationFrame(raf); else raf = requestAnimationFrame(step); });
    }
  })();

  /* ───────── night mode ───────── */
  (function theme() {
    const btn = document.getElementById('themeBtn'), K = 'norsk123.theme';
    let saved = null; try { saved = localStorage.getItem(K); } catch (e) { /* ignore */ }
    const mq = window.matchMedia ? matchMedia('(prefers-color-scheme: dark)') : null;
    const apply = (t) => { document.documentElement.dataset.theme = t; btn.textContent = t === 'dark' ? '☀️ Day' : '🌙 Night'; btn.setAttribute('aria-pressed', t === 'dark'); };
    apply(saved || (mq && mq.matches ? 'dark' : 'light'));
    if (mq && mq.addEventListener) mq.addEventListener('change', (e) => { if (!saved) apply(e.matches ? 'dark' : 'light'); });
    btn.onclick = () => { const n = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'; saved = n; try { localStorage.setItem(K, n); } catch (e) { /* ignore */ } apply(n); };
    /* twinkling stars, only visible at night */
    const c = document.getElementById('stars'), x = c.getContext('2d');
    let w = 0, h = 0, st = [];
    const size = () => { w = c.width = innerWidth; h = c.height = innerHeight; st = Array.from({ length: Math.min(160, Math.round(w / 8)) }, () => ({ x: Math.random() * w, y: Math.random() * h * 0.85, r: 0.5 + Math.random() * 1.5, p: Math.random() * 6.28, s: 0.6 + Math.random() * 1.6 })); };
    size(); addEventListener('resize', size);
    const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    (function f(t) {
      if (document.documentElement.dataset.theme === 'dark') {
        x.clearRect(0, 0, w, h);
        st.forEach(o => { const a = reduce ? 0.8 : 0.35 + 0.65 * Math.abs(Math.sin(t / 1000 * o.s + o.p)); x.globalAlpha = a; x.fillStyle = '#fff'; x.beginPath(); x.arc(o.x, o.y, o.r, 0, 6.283); x.fill(); });
        x.globalAlpha = 1;
      }
      requestAnimationFrame(f);
    })(0);
  })();

  window.__norsk = { state, FLAT, render, makeCode, readCode, restore };
  render();
  flushQueue();
})();
