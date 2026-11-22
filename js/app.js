(() => {
  'use strict';

  const app = document.getElementById('app');
  const MODULES = window.MODULES;
  const ROADMAP = window.ROADMAP;
  const PASS = 0.8;
  const KEY = 'norsk123.progress.v1';

  /* ───────── progress (localStorage, with in-memory fallback) ───────── */
  let mem = {};
  const load = () => { try { const s = localStorage.getItem(KEY); return s ? JSON.parse(s) : mem; } catch (e) { return mem; } };
  const save = (p) => { mem = p; try { localStorage.setItem(KEY, JSON.stringify(p)); } catch (e) { /* ignore */ } };
  const passed = (id) => !!(load()['m' + id] && load()['m' + id].passed);
  const unlocked = (i) => i === 0 || passed(MODULES[i - 1].id);

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
  function speak(text, slow) {
    if (!hasTTS) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'nb-NO';
    if (voice) u.voice = voice;
    u.rate = slow ? 0.55 : 0.9;
    speechSynthesis.speak(u);
  }
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-say]');
    if (b) { e.preventDefault(); speak(b.dataset.say, b.dataset.slow === '1'); }
  });

  /* ───────── helpers ───────── */
  const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const norm = (s) => s.normalize('NFC').toLowerCase().replace(/\s+/g, ' ').trim().replace(/[.!?]+$/, '');
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  const stripTags = (s) => String(s).replace(/<[^>]+>/g, '');

  /* ───────── state + render ───────── */
  const state = { view: 'home', m: 0, l: 0, q: null };

  function render() {
    if (state.view === 'home') renderHome();
    else if (state.view === 'lesson') renderLesson();
    else if (state.view === 'practice') renderQuestion();
    else if (state.view === 'result') renderResult();
    app.focus({ preventScroll: true });
  }
  function go(view, patch) { Object.assign(state, { view }, patch || {}); render(); window.scrollTo({ top: 0 }); }

  /* ───────── home ───────── */
  function renderHome() {
    const p = load();
    let h = `<section class="card hero">
      <h1>Norsk på 1·2·3</h1>
      <p class="lead">Learn Norwegian (Bokmål) one small step at a time. Every new word and every grammar term is explained in English. Each module ends with a short test, and passing it opens the next module.</p>
    </section>`;
    if (!audioOK()) {
      h += `<div class="banner"><b>No Norwegian voice found on this device.</b> The listening buttons need one. On a Mac you can add it under System Settings → Accessibility → Spoken Content → System Voice → Manage Voices → Norwegian. Until then, listening exercises will show the word as text.</div>`;
    }
    h += '<ol class="path">';
    MODULES.forEach((m, i) => {
      const r = p['m' + m.id];
      const open = unlocked(i);
      const state_ = r && r.passed ? `Passed ${Math.round(r.best * 100)}%` : (open ? (r ? 'Continue' : 'Start') : '🔒 Locked');
      h += `<li>${open
        ? `<button class="mod ${r && r.passed ? 'done' : ''}" data-open="${i}">`
        : `<div class="mod locked" aria-disabled="true">`}
        <span class="num">${r && r.passed ? '✓' : m.id}</span>
        <span class="info"><b>${m.title}</b><small>${m.blurb}</small></span>
        <span class="state">${state_}</span>
        ${open ? '</button>' : '</div>'}</li>`;
    });
    ROADMAP.forEach((m, i) => {
      h += `<li><div class="mod soon" aria-disabled="true">
        <span class="num">${MODULES.length + i + 1}</span>
        <span class="info"><b>${m.title}</b><small>${m.blurb}</small></span>
        <span class="state">Coming soon</span></div></li>`;
    });
    h += '</ol>';
    app.innerHTML = h;
    app.querySelectorAll('[data-open]').forEach(b => b.addEventListener('click', () => go('lesson', { m: +b.dataset.open, l: 0 })));
  }

  /* ───────── lessons ───────── */
  function renderLesson() {
    const m = MODULES[state.m];
    const n = m.lessons.length;
    const L = m.lessons[state.l];
    const last = state.l === n - 1;
    app.innerHTML = `
      <div class="crumbs">Module ${m.id} · ${m.title}</div>
      <div class="dots" aria-label="Lesson ${state.l + 1} of ${n}">${m.lessons.map((_, i) => `<i class="${i <= state.l ? 'on' : ''}"></i>`).join('')}</div>
      <section class="card">${L.html}</section>
      <div class="row between">
        <span class="row">
          ${state.l > 0 ? '<button class="btn ghost" id="prev">← Back</button>' : '<button class="btn ghost" id="home">Home</button>'}
        </span>
        <span class="row">
          ${last ? '' : '<button class="linkish" id="skip">Skip to practice</button>'}
          <button class="btn" id="next">${last ? 'Start practice test →' : 'Next →'}</button>
        </span>
      </div>`;
    const $ = (s) => app.querySelector(s);
    if ($('#prev')) $('#prev').onclick = () => go('lesson', { l: state.l - 1 });
    if ($('#home')) $('#home').onclick = () => go('home');
    if ($('#skip')) $('#skip').onclick = startPractice;
    $('#next').onclick = () => last ? startPractice() : go('lesson', { l: state.l + 1 });
  }

  /* ───────── practice ───────── */
  function startPractice() {
    const m = MODULES[state.m];
    const list = shuffle(m.practice).map(q => {
      const c = Object.assign({}, q);
      if (c.t === 'mc') c.shuf = shuffle(c.opts);
      if (c.t === 'match') { c.left = shuffle(c.pairs.map(p => p[0])); c.right = shuffle(c.pairs.map(p => p[1])); }
      return c;
    });
    go('practice', { q: { list, i: 0, score: 0, wrong: [] } });
  }

  const feedbackHTML = (ok, q, extra) => `<div class="feedback ${ok ? 'ok' : 'no'}" role="status">
    <b lang="nb">${ok ? 'Riktig!' : 'Ikke helt.'} <span style="font-weight:400" lang="en">${ok ? '(Correct)' : '(Not quite)'}</span></b>
    ${!ok && extra ? `<div>Correct answer: <b>${extra}</b></div>` : ''}
    <div>${q.why || ''}</div></div>`;

  function listenBar(q) {
    if (!q.say) return '';
    return `<div class="listenbar">
      <button class="bigsay" data-say="${esc(q.say)}">🔊 Listen</button>
      <button class="bigsay" data-say="${esc(q.say)}" data-slow="1">🐢 Slowly</button></div>
      ${audioOK() ? '' : `<div class="noaudio">Audio is not available on this device. The word is: <b lang="nb">${q.say}</b></div>`}`;
  }

  function renderQuestion() {
    const S = state.q;
    const m = MODULES[state.m];
    const q = S.list[S.i];
    const total = S.list.length;
    let body = '';

    if (q.t === 'mc') {
      body = `${listenBar(q)}<div class="opts ${q.shuf.every(o => stripTags(o).length < 14) && q.shuf.length === 3 ? 'two' : ''}" role="radiogroup">
        ${q.shuf.map((o, i) => `<button class="opt" role="radio" aria-checked="false" data-i="${i}">${o}</button>`).join('')}</div>`;
    } else if (q.t === 'type') {
      body = `${listenBar(q)}
        <input class="ans" id="ans" type="text" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" aria-label="Your answer" lang="nb">
        <div class="chars" aria-label="Special letters"><button data-ch="æ">æ</button><button data-ch="ø">ø</button><button data-ch="å">å</button></div>`;
    } else if (q.t === 'match') {
      body = `<div class="match">
        <div style="display:grid;gap:10px">${q.left.map(l => `<button class="opt" data-l="${esc(l)}" lang="nb">${l}</button>`).join('')}</div>
        <div style="display:grid;gap:10px">${q.right.map(r => `<button class="opt" data-r="${esc(r)}">${r}</button>`).join('')}</div></div>`;
    }

    app.innerHTML = `
      <div class="crumbs">Module ${m.id} · Practice test</div>
      <div class="progress" aria-label="Question ${S.i + 1} of ${total}"><i style="width:${(S.i / total) * 100}%"></i></div>
      <section class="card">
        <div class="crumbs">Question ${S.i + 1} of ${total}</div>
        <div class="q">${q.q}</div>
        ${body}
        <div id="fb"></div>
        <div class="row between">
          <button class="linkish" id="quit">Leave test</button>
          <button class="btn" id="check" ${q.t === 'match' ? 'hidden' : 'disabled'}>Check</button>
        </div>
      </section>`;

    const $ = (s) => app.querySelector(s);
    const fb = $('#fb');
    const btn = $('#check');
    $('#quit').onclick = () => go('lesson', { l: 0 });
    let answered = false;

    const finish = (ok, correctText) => {
      answered = true;
      if (ok) S.score++; else S.wrong.push({ q: q.q, correct: correctText, why: q.why });
      fb.innerHTML = feedbackHTML(ok, q, correctText);
      btn.hidden = false; btn.disabled = false;
      btn.textContent = S.i === total - 1 ? 'See result' : 'Next →';
      btn.focus();
      btn.onclick = () => { S.i++; if (S.i >= total) finishTest(); else renderQuestion(); };
    };

    if (q.t === 'mc') {
      let sel = null;
      const opts = [...app.querySelectorAll('.opt')];
      opts.forEach(b => b.onclick = () => {
        if (answered) return;
        opts.forEach(x => { x.classList.remove('sel'); x.setAttribute('aria-checked', 'false'); });
        b.classList.add('sel'); b.setAttribute('aria-checked', 'true');
        sel = q.shuf[+b.dataset.i]; btn.disabled = false;
      });
      btn.onclick = () => {
        if (answered || sel === null) return;
        const ok = sel === q.a;
        opts.forEach(x => {
          x.disabled = true;
          const v = q.shuf[+x.dataset.i];
          if (v === q.a) x.classList.add('right');
          else if (x.classList.contains('sel')) x.classList.add('wrong');
        });
        finish(ok, q.a);
      };
    } else if (q.t === 'type') {
      const inp = $('#ans');
      inp.focus();
      inp.addEventListener('input', () => { btn.disabled = !inp.value.trim(); });
      inp.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !btn.disabled) btn.click(); });
      app.querySelectorAll('[data-ch]').forEach(b => b.onclick = () => {
        if (answered) return;
        const s = inp.selectionStart || inp.value.length, e2 = inp.selectionEnd || inp.value.length;
        inp.value = inp.value.slice(0, s) + b.dataset.ch + inp.value.slice(e2);
        inp.focus(); inp.setSelectionRange(s + 1, s + 1); btn.disabled = false;
      });
      btn.onclick = () => {
        if (answered) return;
        const ok = q.a.map(norm).includes(norm(inp.value));
        inp.disabled = true; inp.classList.add(ok ? 'right' : 'wrong');
        finish(ok, q.a.join(' / '));
      };
    } else if (q.t === 'match') {
      let pickL = null, mistakes = 0, done = 0;
      const pairOf = Object.fromEntries(q.pairs.map(p => [p[0], p[1]]));
      const lefts = [...app.querySelectorAll('[data-l]')];
      const rights = [...app.querySelectorAll('[data-r]')];
      lefts.forEach(b => b.onclick = () => {
        if (answered || b.classList.contains('done')) return;
        lefts.forEach(x => x.classList.remove('sel')); b.classList.add('sel'); pickL = b;
      });
      rights.forEach(b => b.onclick = () => {
        if (answered || b.classList.contains('done') || !pickL) return;
        if (pairOf[pickL.dataset.l] === b.dataset.r) {
          pickL.classList.remove('sel'); pickL.classList.add('done'); b.classList.add('done'); pickL = null; done++;
          if (done === q.pairs.length) finish(mistakes === 0, q.pairs.map(p => `${p[0]} = ${p[1]}`).join(', '));
        } else {
          mistakes++; b.classList.add('flash'); setTimeout(() => b.classList.remove('flash'), 500);
        }
      });
    }
  }

  function finishTest() {
    const S = state.q, m = MODULES[state.m];
    const ratio = S.score / S.list.length;
    const p = load();
    const prev = p['m' + m.id] || { best: 0, passed: false, tries: 0 };
    p['m' + m.id] = { best: Math.max(prev.best, ratio), passed: prev.passed || ratio >= PASS, tries: prev.tries + 1 };
    save(p);
    go('result');
  }

  function renderResult() {
    const S = state.q, m = MODULES[state.m];
    const ratio = S.score / S.list.length;
    const ok = ratio >= PASS;
    const next = MODULES[state.m + 1];
    app.innerHTML = `
      <section class="card">
        <div class="crumbs">Module ${m.id} · Result</div>
        <div class="score ${ok ? 'ok' : ''}">${Math.round(ratio * 100)}%</div>
        <p class="lead">${S.score} of ${S.list.length} correct.
          ${ok ? `<b lang="nb">Bra jobbet!</b> <span>(Well done!) ${next ? 'The next module is now open.' : 'You have finished all the modules that are ready so far. More are coming.'}</span>`
               : `You need ${Math.round(PASS * 100)}% to pass. Read the explanations below, review the lessons, and try again.`}</p>
        ${S.wrong.length ? `<h3>Review</h3><ul class="wronglist">${S.wrong.map(w => `<li>${w.q}<br>Answer: <b>${w.correct}</b><br><small>${w.why || ''}</small></li>`).join('')}</ul>` : ''}
        <div class="row">
          ${ok && next ? '<button class="btn" id="nextm">Next module →</button>' : ''}
          <button class="btn ${ok && next ? 'ghost' : ''}" id="again">Try again</button>
          <button class="btn ghost" id="review">Review lessons</button>
          <button class="btn ghost" id="home">Home</button>
        </div>
      </section>`;
    const $ = (s) => app.querySelector(s);
    if ($('#nextm')) $('#nextm').onclick = () => go('lesson', { m: state.m + 1, l: 0 });
    $('#again').onclick = startPractice;
    $('#review').onclick = () => go('lesson', { l: 0 });
    $('#home').onclick = () => go('home');
  }

  /* ───────── header / footer ───────── */
  document.getElementById('homeLink').addEventListener('click', (e) => { e.preventDefault(); go('home'); });
  document.getElementById('resetBtn').addEventListener('click', () => {
    if (confirm('Reset all progress on this device? This cannot be undone.')) { save({}); go('home'); }
  });

  /* ───────── falling snow ───────── */
  (function snow() {
    const c = document.getElementById('snow');
    const ctx = c.getContext('2d');
    const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    let w = 0, h = 0, flakes = [];
    function size() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth; h = window.innerHeight;
      c.width = w * dpr; c.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.min(150, Math.round(w / 9));
      flakes = Array.from({ length: n }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        r: 1 + Math.random() * 2.6, s: 0.25 + Math.random() * 0.9, p: Math.random() * 6.28
      }));
      draw(0);
    }
    function draw(t) {
      ctx.clearRect(0, 0, w, h);
      for (const f of flakes) {
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r, 0, 6.283);
        ctx.fillStyle = 'rgba(255,255,255,0.95)';
        ctx.fill();
        ctx.lineWidth = 0.6;
        ctx.strokeStyle = 'rgba(120,160,200,0.35)';
        ctx.stroke();
      }
    }
    function step(t) {
      for (const f of flakes) {
        f.y += f.s;
        f.x += Math.sin(t / 1600 + f.p) * 0.35;
        if (f.y > h + 5) { f.y = -5; f.x = Math.random() * w; }
        if (f.x > w + 5) f.x = -5; else if (f.x < -5) f.x = w + 5;
      }
      draw(t);
      raf = requestAnimationFrame(step);
    }
    let raf = 0;
    size();
    window.addEventListener('resize', size);
    if (!reduce) {
      raf = requestAnimationFrame(step);
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) cancelAnimationFrame(raf); else raf = requestAnimationFrame(step);
      });
    }
  })();

  render();
})();
