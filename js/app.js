(() => {
  'use strict';

  const app = document.getElementById('app');
  const UNITS = window.UNITS;
  const KEY = 'norsk123.progress.v3';

  /* flat lesson list: lessons unlock one after another */
  const FLAT = [];
  UNITS.forEach(u => u.lessons.forEach(l => FLAT.push({ unit: u, lesson: l, idx: FLAT.length })));

  /* ───────── progress ───────── */
  let mem = { lessons: {}, xp: 0 };
  const load = () => { try { const s = localStorage.getItem(KEY); return s ? JSON.parse(s) : mem; } catch (e) { return mem; } };
  const save = (p) => { mem = p; try { localStorage.setItem(KEY, JSON.stringify(p)); } catch (e) { /* ignore */ } };
  const isDone = (id) => !!(load().lessons || {})[id];
  const isOpen = (i) => i === 0 || isDone(FLAT[i - 1].lesson.id);

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
    const clean = String(text).replace(/\.\.\./g, '');
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

  function drill(items, pool, spec) {
    const st = items.map((it, i) => (spec.articles && i % 2 === 0) ? exArt(it) : (i % 2 === 0 ? exPic(it, pool) : exHear(it, pool, spec.digits !== false)));
    return st;
  }
  function finalMix(all, pool, spec) {
    const types = ['enNo', 'typeHear', 'noEn', 'typeEn', 'hear', 'enNo'];
    return shuffle(all).slice(0, 3).map((it, i) => {
      switch (types[i]) {
        case 'enNo': return spec.articles && i % 2 ? exArt(it) : exEnNo(it, pool);
        case 'typeHear': return exTypeHear(it);
        case 'noEn': return exNoEn(it, pool);
        case 'typeEn': return exTypeEn(it);
        default: return exHear(it, pool, i % 2 === 0);
      }
    });
  }
  function reviewSteps(pool, n) {
    const seen = new Set();
    pool = pool.filter(it => !seen.has(it.no) && seen.add(it.no));
    if (pool.length < 4) return [];
    const mix = shuffle(pool);
    const out = [];
    const kinds = ['enNo', 'hear', 'typeHear', 'noEn', 'match', 'typeEn', 'hear', 'enNo', 'match', 'noEn'];
    for (let i = 0; i < n; i++) {
      const it = mix[i % mix.length];
      const k = kinds[i % kinds.length];
      if (k === 'match') out.push(exMatch(shuffle(pool).slice(0, Math.min(4, pool.length))));
      else if (k === 'enNo') out.push(exEnNo(it, pool));
      else if (k === 'hear') out.push(exHear(it, pool, i % 2 === 0));
      else if (k === 'typeHear') out.push(exTypeHear(it));
      else if (k === 'noEn') out.push(exNoEn(it, pool));
      else out.push(exTypeEn(it));
    }
    return out;
  }
  const toNote = (p) => Array.isArray(p) ? { k: 'note', title: p[0], html: p[1], tag: p[2] } : p;

  function buildSteps(f) {
    const sp = f.lesson.spec;
    if (sp.build) return sp.build();
    if (sp.review) {
      const pool = f.unit.lessons.filter(l => l !== f.lesson).flatMap(l => l.items);
      return [{ k: 'note', title: 'Mix it up', icon: '🎯', html: sp.note || '<p>Time to mix everything you have learned in this unit. Say the answers out loud.</p>' }].concat(reviewSteps(pool, 10));
    }
    const all = f.lesson.items, pool = all.concat(sp.pool || []);
    const st = [];
    sp.groups.forEach(g => {
      if (g.pre) st.push(toNote(g.pre));
      st.push({ k: 'grid', items: g.items });
      st.push(exPMatch(g.items));
      const its = shuffle(g.items);
      st.push(sp.articles ? exArt(its[0]) : exPicTap(its[0], pool));
      st.push(exEnNo(its[1] || its[0], pool));
      if (g.post) st.push(toNote(g.post));
    });
    const mix = shuffle(all);
    st.push(exTypeHear(mix[0]));
    st.push(exNoEn(mix[1] || mix[0], pool));
    if (sp.extra) st.push(...sp.extra());
    return st;
  }

  /* ───────── state + render ───────── */
  const state = { view: 'home', run: null };
  function render() {
    ({ home: renderHome, step: renderStep, done: renderDone })[state.view]();
    app.focus({ preventScroll: true });
  }
  function go(view) { state.view = view; render(); window.scrollTo({ top: 0 }); }

  /* ───────── home: the path ───────── */
  function renderHome() {
    const p = load();
    const doneCount = Object.keys(p.lessons || {}).length;
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
    if (uniq.size >= 8) {
      h += `<button class="mod practice" id="practice"><span class="num">🔁</span><span class="info"><b>Practice</b><small>A quick mixed review of what you have learned</small></span></button>`;
    }
    let currentMarked = false;
    UNITS.forEach((u) => {
      h += `<div class="unit"><div class="unithead"><div><b>${u.title}</b><small>${u.sub}</small></div><span>${u.blurb}</span></div><div class="trail">`;
      u.lessons.forEach((l) => {
        const f = FLAT.find(x => x.lesson === l);
        const r = (p.lessons || {})[l.id];
        const open = isOpen(f.idx);
        let cls = 'node', label = '';
        if (r) { cls += ' done'; label = '★'.repeat(r.stars) + '☆'.repeat(3 - r.stars); }
        else if (open && !currentMarked) { cls += ' current'; currentMarked = true; label = 'Start'; }
        else if (open) { label = ''; }
        else { cls += ' locked'; label = '🔒'; }
        h += `<div class="${cls}">
          <button class="circle" ${open ? `data-lesson="${f.idx}"` : 'disabled'} aria-label="${l.title}${open ? '' : ' (locked)'}">${r ? '✓' : l.icon}</button>
          <div class="nlabel"><b>${l.title}</b><small>${label}</small></div></div>`;
      });
      h += '</div></div>';
    });
    app.innerHTML = h;
    const curNode = app.querySelector('.node.current');
    if (curNode && Object.keys(p.lessons || {}).length) setTimeout(() => curNode.scrollIntoView({ block: 'center' }), 50);
    app.querySelectorAll('[data-lesson]').forEach(b => b.addEventListener('click', () => startLesson(FLAT[+b.dataset.lesson])));
    const pr = app.querySelector('#practice');
    if (pr) pr.onclick = () => {
      const steps = reviewSteps(poolItems, 10);
      begin({ unit: null, lesson: { id: '_practice', title: 'Practice', icon: '🔁' } }, steps, true);
    };
  }

  /* ───────── running a lesson ───────── */
  function startLesson(f) { begin(f, buildSteps(f), false); }
  function begin(f, steps, practice) {
    const q = steps.map(s => Object.assign({ tries: 0 }, s));
    state.run = { f, practice, q, i: 0, exTotal: q.filter(s => ['mc', 'type', 'match', 'bank'].includes(s.k)).length, first: 0 };
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
    go('done');
  }

  function renderDone() {
    const R = state.run, r = R.result;
    const nf = !R.practice && FLAT[R.f.idx + 1];
    app.innerHTML = `
      <section class="card done">
        <div class="bigvis">🎉</div>
        <h1 lang="nb">Bra jobbet!</h1>
        <p class="lead">${R.practice ? 'Practice complete.' : 'Lesson complete.'} <span lang="en">(Well done!)</span></p>
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
    $('#again').onclick = () => R.practice ? app.querySelector('#home').click() : startLesson(R.f);
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
        ${s.tag ? `<div class="tagbadge ${s.tag === 'Grammar' ? 'gram' : ''}">${s.tag === 'Grammar' ? '📘 Grammar' : s.tag}</div>` : ''}
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

  function renderExercise(R, s) {
    const total = R.q.length;
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
        <div style="display:grid;gap:10px">${s.left.map(l => `<button class="opt ${s.pics ? 'bigemo' : ''}" data-l="${esc(l)}" lang="nb">${l}</button>`).join('')}</div>
        <div style="display:grid;gap:10px">${s.right.map(r => `<button class="opt" data-r="${esc(r)}">${r}</button>`).join('')}</div></div>`;
    } else if (s.k === 'bank') {
      s.order = s.order || shuffle(s.tiles.map((t, i) => i));
      body = `${audioBar(s.say)}<div class="line" id="line" aria-label="Your sentence"></div><div class="tiles" id="tiles"></div>`;
    }

    app.innerHTML = `${bar(R)}
      <section class="card">
        <div class="q">${s.q}</div>
        ${body}
        <div id="fb"></div>
        <div class="row" style="justify-content:flex-end">
          ${(s.k === 'type' || s.k === 'bank') ? '<button class="linkish" id="skip" style="margin-right:auto">I do not know</button>' : ''}
          <button class="btn" id="check" ${s.k === 'match' ? 'hidden' : 'disabled'}>Check</button>
        </div>
      </section>`;
    wireQuit();

    const $ = (x) => app.querySelector(x);
    const fb = $('#fb'), btn = $('#check');
    let answered = false;
    const sk = $('#skip'); if (sk) sk.onclick = () => { if (answered) return; const i = $('#ans'); if (i) { i.disabled = true; i.classList.add('wrong'); } sk.hidden = true; finish(false, s.a[0]); };

    const finish = (ok, correctText, near) => {
      answered = true;
      if (ok) { if (s.tries === 0) R.first++; }
      else if (s.k !== 'match' && s.tries < 2) R.q.push(Object.assign({}, s, { tries: s.tries + 1, shuf: null, order: null }));
      fb.innerHTML = feedbackHTML(ok, s, correctText, near);
      btn.hidden = false; btn.disabled = false; if (sk) sk.hidden = true;
      btn.textContent = R.i === R.q.length - 1 ? 'Finish' : 'Continue →';
      btn.onclick = next; btn.focus();
    };

    if (s.k === 'mc') {
      let sel = null;
      const opts = [...app.querySelectorAll('.opt')];
      opts.forEach(b => b.onclick = () => {
        if (answered) return;
        opts.forEach(x => { x.classList.remove('sel'); x.setAttribute('aria-checked', 'false'); });
        b.classList.add('sel'); b.setAttribute('aria-checked', 'true');
        sel = s.shuf[+b.dataset.i]; btn.disabled = false;
      });
      btn.onclick = () => {
        if (answered || sel === null) return;
        opts.forEach(x => {
          x.disabled = true;
          const v = s.shuf[+x.dataset.i];
          if (v === s.a) x.classList.add('right'); else if (x.classList.contains('sel')) x.classList.add('wrong');
        });
        finish(sel === s.a, s.a);
      };
    } else if (s.k === 'type') {
      const inp = $('#ans');
      inp.focus();
      inp.addEventListener('input', () => { btn.disabled = !inp.value.trim(); });
      inp.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !btn.disabled) btn.click(); });
      app.querySelectorAll('[data-ch]').forEach(b => b.onclick = () => {
        if (answered) return;
        const a = inp.selectionStart == null ? inp.value.length : inp.selectionStart;
        const z = inp.selectionEnd == null ? inp.value.length : inp.selectionEnd;
        inp.value = inp.value.slice(0, a) + b.dataset.ch + inp.value.slice(z);
        inp.focus(); inp.setSelectionRange(a + 1, a + 1); btn.disabled = false;
      });
      btn.onclick = () => {
        if (answered) return;
        const val = norm(inp.value), ans = s.a.map(norm);
        let ok = ans.includes(val), near = false;
        if (!ok) near = ans.some(x => fold(x) === fold(val) || (val.length >= 5 && x.length >= 5 && lev(x, val) <= 1));
        inp.disabled = true; inp.classList.add(ok || near ? 'right' : 'wrong');
        finish(ok || near, s.a[0], near && !ok);
      };
    } else if (s.k === 'match') {
      let pickL = null, mistakes = 0, done = 0;
      const pairOf = Object.fromEntries(s.pairs.map(p => [p[0], p[1]]));
      const lefts = [...app.querySelectorAll('[data-l]')], rights = [...app.querySelectorAll('[data-r]')];
      lefts.forEach(b => b.onclick = () => {
        if (answered || b.classList.contains('done')) return;
        lefts.forEach(x => x.classList.remove('sel')); b.classList.add('sel'); pickL = b;
        if (!s.pics) speak(b.dataset.l);
      });
      rights.forEach(b => b.onclick = () => {
        if (answered || b.classList.contains('done') || !pickL) return;
        if (pairOf[pickL.dataset.l] === b.dataset.r) {
          pickL.classList.remove('sel'); pickL.classList.add('done'); b.classList.add('done'); pickL = null; done++;
          if (s.pics) speak(b.dataset.r);
          if (done === s.pairs.length) finish(mistakes === 0, s.pairs.map(p => `${p[0]} = ${p[1]}`).join(' · '));
        } else { mistakes++; b.classList.add('flash'); setTimeout(() => b.classList.remove('flash'), 500); }
      });
    } else if (s.k === 'bank') {
      const chosen = [];
      const line = $('#line'), tiles = $('#tiles');
      const paint = () => {
        line.innerHTML = chosen.map(i => `<button class="tile" data-un="${i}" lang="nb">${s.tiles[i]}</button>`).join('');
        tiles.innerHTML = s.order.map(i => `<button class="tile ${chosen.includes(i) ? 'used' : ''}" data-t="${i}" lang="nb" ${chosen.includes(i) ? 'disabled' : ''}>${s.tiles[i]}</button>`).join('');
        line.querySelectorAll('[data-un]').forEach(b => b.onclick = () => { if (!answered) { chosen.splice(chosen.indexOf(+b.dataset.un), 1); paint(); } });
        tiles.querySelectorAll('[data-t]').forEach(b => b.onclick = () => { if (!answered) { chosen.push(+b.dataset.t); paint(); } });
        btn.disabled = answered || !chosen.length;
      };
      paint();
      btn.onclick = () => {
        if (answered) return;
        const got = norm(chosen.map(i => s.tiles[i]).join(' '));
        const ok = s.a.map(norm).includes(got);
        finish(ok, s.a[0]);
      };
    }
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

  window.__norsk = { state };
  render();
})();
