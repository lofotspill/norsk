(() => {
  'use strict';
  const D = window.GAME_DATA;
  const { TS, W, H, SCENES, SOLID, WORD_TOTAL, NPCS, PHRASES, QUESTS, ROUTE, CONVOS, MENU } = D;

  const $ = (s) => document.querySelector(s);
  const cv = $('#world'), ctx = cv.getContext('2d');
  cv.width = W * TS; cv.height = H * TS;
  const panel = $('#panel');
  const KEY = 'norsk123.game.v1';

  /* ───────── state ───────── */
  let G = null;                 // saved game state
  const P = { moving: false, t: 0, fx: 0, fy: 0 };   // player animation
  let busy = false;             // dialogue open
  let fade = { a: 0, dir: 0, cb: null };
  let hintOn = true;
  let cur = null;               // current beat (for tests)
  let conv = { item: null };

  const blank = (name) => ({ name, q: 1, scene: 'yard', x: 4, y: 9, dir: 'up', phrases: {}, words: {}, fp: 0, settings: { en: true, sound: true }, ended: false });
  const store = () => { try { localStorage.setItem(KEY, JSON.stringify(G)); } catch (e) { /* ignore */ } };
  const readSave = () => { try { const s = localStorage.getItem(KEY); return s ? JSON.parse(s) : null; } catch (e) { return null; } };

  /* ───────── speech ───────── */
  let voice = null;
  const hasTTS = 'speechSynthesis' in window;
  function findVoice() {
    if (!hasTTS) return;
    const vs = speechSynthesis.getVoices();
    if (!vs.length) return;
    voice = vs.find(v => /^nb[-_]/i.test(v.lang)) || vs.find(v => /^no[-_]/i.test(v.lang)) || vs.find(v => /^(nb|no)$/i.test(v.lang)) || null;
    const b = $('#voiceNote'); if (b) b.hidden = !!voice;
  }
  if (hasTTS) { findVoice(); speechSynthesis.onvoiceschanged = findVoice; }
  function speak(text, slow) {
    if (!hasTTS || (G && G.settings && G.settings.sound === false)) return;
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(String(text).replace(/…/g, ''));
      u.lang = 'nb-NO'; if (voice) u.voice = voice; u.rate = slow ? 0.55 : 0.9;
      speechSynthesis.speak(u);
    } catch (e) { /* ignore */ }
  }
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-say]');
    if (b) { e.preventDefault(); speak(b.dataset.say, b.dataset.slow === '1'); }
  });

  /* ───────── helpers ───────── */
  const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  const norm = (s) => s.normalize('NFC').toLowerCase().replace(/[.,!?]/g, '').replace(/\s+/g, ' ').trim();
  const sub = (s) => String(s).replace(/\{name\}/g, G.name).replace(/\{item\}/g, conv.item ? conv.item.no : '');
  const scene = () => SCENES[G.scene];
  const sayBtns = (t) => `<button class="mini" data-say="${esc(t)}" aria-label="Listen">🔊</button><button class="mini" data-say="${esc(t)}" data-slow="1" aria-label="Listen slowly">🐢</button>`;

  function toast(html) {
    const t = $('#toast'); t.innerHTML = html; t.hidden = false; t.classList.remove('show'); void t.offsetWidth; t.classList.add('show');
    clearTimeout(toast.h); toast.h = setTimeout(() => { t.hidden = true; }, 3200);
  }
  function learn(keys) {
    [].concat(keys).forEach(k => {
      if (!PHRASES[k] || G.phrases[k]) return;
      G.phrases[k] = true; store();
      toast(`📖 <b>New phrase:</b> <span lang="nb">${PHRASES[k][0]}</span> — ${PHRASES[k][1]}`);
      hud();
    });
  }

  /* ───────── HUD ───────── */
  function hud() {
    const q = QUESTS[G.q];
    $('#questNo').textContent = q ? q.no : 'Kapittel 1 er ferdig!';
    $('#questEn').textContent = q ? q.en : 'Chapter 1 is complete. Explore, or play again!';
    const filled = Math.round(Math.min(1, G.fp / 16) * 10);
    $('#friends').innerHTML = `<span class="lbl">Vennskap</span><span class="flakes">${'❄️'.repeat(filled)}${'<i>❄</i>'.repeat(10 - filled)}</span>`;
    $('#wordsCount').textContent = `${Object.keys(G.words).length}/${WORD_TOTAL}`;
    $('#phrCount').textContent = Object.keys(G.phrases).length;
    $('#enBtn').setAttribute('aria-pressed', G.settings.en ? 'true' : 'false');
    $('#enBtn').textContent = G.settings.en ? 'EN ✓' : 'EN';
    $('#sndBtn').textContent = G.settings.sound === false ? '🔇' : '🔊';
  }
  function setQuest(n) {
    G.q = n; store(); hud();
    if (QUESTS[n]) toast(`🎯 <b>New quest:</b> <span lang="nb">${QUESTS[n].no}</span> — ${QUESTS[n].en}`);
  }

  /* ───────── world logic ───────── */
  const npcsHere = () => Object.entries(NPCS).map(([id, n]) => { const p = n.pos(G); return p && p.scene === G.scene ? { id, n, x: p.x, y: p.y } : null; }).filter(Boolean);
  const npcAt = (x, y) => npcsHere().find(o => o.x === x && o.y === y);
  const objAtRect = (o, x, y) => x >= o.x && x < o.x + o.w && y >= o.y && y < o.y + o.h;
  function blocked(x, y) {
    if (x < 0 || y < 0 || x >= W || y >= H) return true;
    if (SOLID.has(scene().g[y][x])) return true;
    return !!npcAt(x, y);
  }
  const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
  function tryMove(dir) {
    if (busy || P.moving || fade.dir || !G) return;
    G.dir = dir;
    const [dx, dy] = DIRS[dir], nx = G.x + dx, ny = G.y + dy;
    if (blocked(nx, ny)) return;
    P.moving = true; P.t = 0; P.fx = G.x; P.fy = G.y; G.x = nx; G.y = ny;
  }
  function arrived() {
    const d = scene().doors.find(d => d.x === G.x && d.y === G.y);
    if (d) goScene(d.to, d.tx, d.ty);
  }
  function goScene(to, x, y, dir) {
    fade = { a: 0, dir: 1, cb: () => {
      G.scene = to; G.x = x; G.y = y; G.dir = dir || 'up'; P.moving = false; snowInit(); store();
      if (to === 'class' && G.q === 2) setQuest(3);
      hud();
    } };
  }

  /* what can be interacted with right now */
  function adjacentTargets() {
    const out = [];
    npcsHere().forEach(o => { if (Math.abs(o.x - G.x) + Math.abs(o.y - G.y) === 1) out.push({ kind: 'npc', id: o.id, x: o.x, y: o.y }); });
    scene().objs.forEach(o => {
      for (let j = o.y; j < o.y + o.h; j++) for (let i = o.x; i < o.x + o.w; i++) {
        if (Math.abs(i - G.x) + Math.abs(j - G.y) === 1) { out.push({ kind: 'obj', o, x: i, y: j }); return; }
      }
    });
    const [dx, dy] = DIRS[G.dir];
    out.sort((a, b) => ((a.x === G.x + dx && a.y === G.y + dy) ? 0 : 1) - ((b.x === G.x + dx && b.y === G.y + dy) ? 0 : 1));
    return out;
  }
  function interact() {
    if (!G || busy || P.moving || fade.dir) return;
    const t = adjacentTargets()[0];
    if (!t) return;
    if (t.kind === 'npc') return talk(t.id);
    const o = t.o;
    if (o.special === 'emptyDesk' && G.q === 4) return runConvo(CONVOS.desk());
    showWord(o);
  }
  function showWord(o) {
    busy = true;
    const first = !G.words[o.word || o.key];
    G.words[o.word || o.key] = true; store(); hud();
    cur = { t: 'word' };
    show(`<div class="wordcard"><div class="lno" lang="nb">${o.no}</div><div class="len">${o.en}</div>
      <div class="acts">${sayBtns(o.no)}<button class="btn" id="cont">OK</button></div></div>`);
    speak(o.no);
    $('#cont').onclick = hide;
    if (first) toast(`🔤 <b>New word:</b> <span lang="nb">${o.no}</span> — ${o.en}`);
  }

  function talk(id) {
    const q = G.q;
    const L = (who, no, en) => [{ t: 'say', who, no, en }];
    let beats;
    switch (id) {
      case 'nora':
        beats = q === 1 ? CONVOS.nora1() : q === 6 ? CONVOS.table() : q >= 7 ? L('Nora', 'Vi ses i morgen!', 'See you tomorrow!') : L('Nora', 'Hei!', 'Hi!'); break;
      case 'jonas':
        beats = q === 6 ? CONVOS.table() : q >= 7 ? L('Jonas', 'Vi ses!', 'See you!') : L('Jonas', 'Hei!', 'Hi!'); break;
      case 'berg':
        beats = q === 3 ? CONVOS.berg1() : q >= 5 ? L('Fru Berg', 'Ha det bra!', 'Goodbye!') : L('Fru Berg', 'Sett deg ned, takk.', 'Please sit down.'); break;
      case 'rita':
        beats = q === 5 ? CONVOS.rita() : q >= 6 ? L('Rita', 'Bare hyggelig!', 'You are welcome!') : L('Rita', 'Hei!', 'Hi!'); break;
      default: return;
    }
    runConvo(beats);
  }

  /* ───────── dialogue panel ───────── */
  function show(html) { panel.innerHTML = html; panel.hidden = false; }
  function hide() { panel.hidden = true; panel.innerHTML = ''; busy = false; cur = null; }

  function runConvo(beats) {
    busy = true; conv = { item: null };
    let i = 0;
    const next = () => {
      if (i >= beats.length) { hide(); return; }
      const b = beats[i++];
      cur = b;
      ({ say: beatSay, narr: beatNarr, ask: beatAsk, build: beatBuild, menu: beatMenu, listen: beatListen, act: beatAct }[b.t])(b, next);
    };
    next();
  }
  function seq(beats, done) {
    let i = 0;
    const next = () => { if (i >= beats.length) return done(); const b = beats[i++]; cur = b; ({ say: beatSay, narr: beatNarr }[b.t])(b, next); };
    next();
  }

  function beatNarr(b, next) {
    show(`<div class="narr">${sub(b.en)}</div><div class="acts"><button class="btn" id="cont">Continue ▸</button></div>`);
    $('#cont').onclick = next;
  }

  function beatSay(b, next) {
    const no = sub(b.no), en = sub(b.en);
    if (b.learn) learn(b.learn);
    let showEn = G.settings.en && (!b.recall || b.force);
    const draw = () => {
      show(`<div class="who">${b.who}</div><div class="lno" lang="nb">${no}</div>
        ${showEn ? `<div class="len">${en}</div>` : `<button class="mini wide" id="reveal">Show English</button>`}
        <div class="acts">${sayBtns(no)}<button class="btn" id="cont">Continue ▸</button></div>`);
      $('#cont').onclick = next;
      const r = $('#reveal'); if (r) r.onclick = () => { showEn = true; draw(); };
    };
    draw();
    speak(no);
  }

  function beatAsk(b, next) {
    let tries = 0, hint = false, locked = false;
    const first = () => tries === 0;
    const draw = () => {
      const opts = b.shuf || (b.shuf = shuffle(b.choices));
      const engOn = G.settings.en && (!b.recall || hint);
      show(`<div class="prompt">Your reply:</div><div class="opts">${opts.map((c, i) => `<button class="opt ${tries >= 2 && c.ok ? 'glow' : ''}" data-i="${i}" ${c.ok ? 'data-ok="1"' : ''}>
        <span class="o-no" lang="nb">${sub(c.no)}</span>${engOn ? `<span class="o-en">${sub(c.en)}</span>` : ''}</button>`).join('')}</div>
        <div class="acts">${(b.recall && !hint) ? '<button class="mini wide" id="hint">Show English</button>' : ''}</div>`);
      const h = $('#hint'); if (h) h.onclick = () => { hint = true; draw(); };
      panel.querySelectorAll('.opt').forEach(btn => btn.onclick = () => {
        if (locked) return;
        const c = opts[+btn.dataset.i];
        speak(sub(c.no));
        if (c.help) { locked = true; seq(c.help.map(x => Object.assign({}, x)), () => { locked = false; draw(); }); return; }
        if (c.ok) {
          locked = true; btn.classList.add('right');
          if (first()) { G.fp++; store(); hud(); }
          if (b.learn) learn(b.learn);
          if (c.learn) learn(c.learn);
          setTimeout(next, 650);
        } else {
          tries++; btn.classList.add('wrong'); locked = true;
          setTimeout(() => {
            if (b.retry) { seq([Object.assign({}, b.retry)], () => { locked = false; draw(); }); } else { locked = false; draw(); }
          }, 450);
        }
      });
    };
    draw();
  }

  function beatBuild(b, next) {
    const answer = sub(b.answer);
    const words = answer.replace(/[.,!?]/g, '').split(/\s+/).filter(Boolean);
    const tiles = shuffle(words.concat(b.extra));
    const chosen = []; let tries = 0, done = false;
    const draw = () => {
      show(`<div class="prompt">${sub(b.en)}</div>
        <div class="line" id="line">${chosen.map(i => `<button class="tile" data-un="${i}" lang="nb">${esc(tiles[i])}</button>`).join('')}</div>
        <div class="tiles">${tiles.map((t, i) => `<button class="tile ${chosen.includes(i) ? 'used' : ''}" data-t="${i}" lang="nb" ${chosen.includes(i) ? 'disabled' : ''}>${esc(t)}</button>`).join('')}</div>
        <div class="msg" id="msg"></div>
        <div class="acts">${tries >= 2 ? '<button class="mini wide" id="showans">Show me</button>' : ''}<button class="btn" id="chk" ${chosen.length ? '' : 'disabled'}>Check</button></div>`);
      panel.querySelectorAll('[data-un]').forEach(x => x.onclick = () => { if (!done) { chosen.splice(chosen.indexOf(+x.dataset.un), 1); draw(); } });
      panel.querySelectorAll('[data-t]').forEach(x => x.onclick = () => { if (!done) { chosen.push(+x.dataset.t); draw(); } });
      const sa = $('#showans'); if (sa) sa.onclick = () => {
        chosen.length = 0; words.forEach(w => { const i = tiles.findIndex((t, k) => t === w && !chosen.includes(k)); chosen.push(i); }); draw();
      };
      $('#chk').onclick = () => {
        const got = norm(chosen.map(i => tiles[i]).join(' '));
        if (got === norm(answer)) {
          done = true;
          if (tries === 0) { G.fp++; store(); hud(); }
          if (b.learn) learn(b.learn);
          show(`<div class="prompt good">Riktig! <span class="len">(Correct)</span></div><div class="lno" lang="nb">${esc(answer)}</div>
            <div class="len">Now say it out loud!</div>
            <div class="acts">${sayBtns(answer)}<button class="btn" id="cont">Continue ▸</button></div>`);
          speak(answer);
          $('#cont').onclick = next;
        } else {
          tries++;
          const m = $('#msg'); m.textContent = 'Not quite. Check the word order and try again.'; m.classList.add('shake');
          if (tries === 2) setTimeout(draw, 350);
        }
      };
    };
    draw();
  }

  function beatMenu(b, next) {
    show(`<div class="prompt">${b.en}</div><div class="menu">${MENU.map((m, i) => `<button class="mitem" data-i="${i}"><span class="emo">${m.emoji}</span><span class="o-no" lang="nb">${m.no}</span><span class="o-en">${m.en}</span></button>`).join('')}</div>`);
    panel.querySelectorAll('.mitem').forEach(x => x.onclick = () => {
      conv.item = MENU[+x.dataset.i]; speak(conv.item.no); x.classList.add('right'); setTimeout(next, 500);
    });
  }

  function beatListen(b, next) {
    let tries = 0, locked = false;
    const draw = () => {
      show(`<div class="prompt">${b.en}</div>
        <div class="acts">${sayBtns(b.say)}</div>
        <div class="opts two">${shuffle(b.opts).map(o => `<button class="opt ${tries >= 2 && o === b.ok ? 'glow' : ''}" data-o="${esc(o)}" ${o === b.ok ? 'data-ok="1"' : ''}><span class="o-no">${o}</span></button>`).join('')}</div>`);
      panel.querySelectorAll('.opt').forEach(x => x.onclick = () => {
        if (locked) return; locked = true;
        if (x.dataset.o === b.ok) {
          x.classList.add('right'); if (tries === 0) { G.fp++; store(); hud(); } setTimeout(next, 600);
        } else { tries++; x.classList.add('wrong'); setTimeout(() => { locked = false; draw(); }, 500); }
      });
    };
    draw();
    speak(b.say);
  }

  function beatAct(b, next) { b.fn(api); next(); }

  const api = {
    npcGone() {},
    quest: setQuest,
    fadeTo(sc, x, y) { goScene(sc, x, y, 'up'); },
    finish() {
      G.q = 7; G.ended = true; store(); hud();
      setTimeout(showEnding, 300);
    }
  };

  /* ───────── overlays: title, phrasebook, ending ───────── */
  function showTitle() {
    const sv = readSave();
    $('#title').hidden = false;
    $('#cont-game').hidden = !(sv && sv.name);
    if (sv && sv.name) $('#cont-game').textContent = `Continue as ${sv.name}`;
    $('#nameIn').value = sv && sv.name ? sv.name : '';
  }
  function startNew() {
    const nm = $('#nameIn').value.trim().split(/\s+/)[0];
    if (!nm) { $('#nameIn').focus(); $('#nameErr').hidden = false; return; }
    G = blank(nm); store(); beginPlay(true);
  }
  function continueGame() { G = readSave(); G.settings = Object.assign({ en: true, sound: true }, G.settings || {}); beginPlay(false); }
  function beginPlay(isNew) {
    $('#title').hidden = true; $('#game').hidden = false;
    snowInit(); hud();
    if (isNew) {
      busy = true;
      show(`<div class="narr">You have just arrived in Norway and started at a new school. It is winter, and everything is new. You do not speak Norwegian yet, and that is okay. In this game you will <b>meet people and make friends</b>, one word at a time.</div>
        <div class="acts"><button class="btn" id="cont">Let us go ▸</button></div>`);
      $('#cont').onclick = () => { hide(); toast('Move with the arrow keys or WASD. Press Space or Enter to talk.'); };
    }
  }

  function phrasebook() {
    const ph = Object.keys(PHRASES).filter(k => G.phrases[k]);
    const wd = Object.values(SCENES).flatMap(s => s.objs).filter((o, i, a) => G.words[o.word || o.key] && a.findIndex(x => (x.word || x.key) === (o.word || o.key)) === i);
    $('#pbBody').innerHTML = `<h3>Phrases (${ph.length}/${Object.keys(PHRASES).length})</h3>
      ${ph.length ? '<ul class="plist">' + ph.map(k => `<li><span><b lang="nb">${PHRASES[k][0]}</b><small>${PHRASES[k][1]}</small></span>${sayBtns(PHRASES[k][0].replace('…', ''))}</li>`).join('') + '</ul>' : '<p class="len">No phrases yet. Talk to someone!</p>'}
      <h3>Words you found (${wd.length}/${WORD_TOTAL})</h3>
      ${wd.length ? '<ul class="plist">' + wd.map(o => `<li><span><b lang="nb">${o.no}</b><small>${o.en}</small></span>${sayBtns(o.no)}</li>`).join('') + '</ul>' : '<p class="len">Walk up to things and press the action button to learn their names.</p>'}`;
    $('#pb').hidden = false;
  }

  function showEnding() {
    busy = true; hide(); busy = true;
    $('#endStats').innerHTML = `<span>👫 Friends: Nora, Jonas</span><span>📖 ${Object.keys(G.phrases).length} phrases</span><span>🔤 ${Object.keys(G.words).length}/${WORD_TOTAL} words</span>`;
    $('#end').hidden = false;
  }

  /* ───────── input ───────── */
  const held = [];
  const KMAP = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', w: 'up', s: 'down', a: 'left', d: 'right', W: 'up', S: 'down', A: 'left', D: 'right' };
  window.addEventListener('keydown', (e) => {
    if (e.target && (e.target.tagName === 'INPUT')) return;
    if (!G || $('#game').hidden) return;
    const d = KMAP[e.key];
    if (d) { e.preventDefault(); if (!held.includes(d)) held.push(d); return; }
    if (e.key === ' ' || e.key === 'Enter' || e.key === 'e' || e.key === 'E') {
      const c = $('#cont');
      if (!panel.hidden && c) { e.preventDefault(); c.click(); return; }
      if (panel.hidden && $('#pb').hidden && $('#end').hidden) { e.preventDefault(); interact(); }
    }
    if (e.key === 'Escape') { $('#pb').hidden = true; }
  });
  window.addEventListener('keyup', (e) => { const d = KMAP[e.key]; if (d) { const i = held.indexOf(d); if (i >= 0) held.splice(i, 1); } });
  document.querySelectorAll('[data-dir]').forEach(b => {
    const on = (e) => { e.preventDefault(); const d = b.dataset.dir; if (!held.includes(d)) held.push(d); };
    const off = (e) => { e.preventDefault(); const i = held.indexOf(b.dataset.dir); if (i >= 0) held.splice(i, 1); };
    b.addEventListener('pointerdown', on); b.addEventListener('pointerup', off); b.addEventListener('pointerleave', off); b.addEventListener('pointercancel', off);
  });
  $('#actBtn').addEventListener('click', () => { const c = $('#cont'); if (!panel.hidden && c) c.click(); else interact(); });

  $('#startBtn').onclick = startNew;
  $('#nameIn').addEventListener('keydown', (e) => { if (e.key === 'Enter') startNew(); });
  $('#cont-game').onclick = continueGame;
  $('#pbBtn').onclick = phrasebook;
  $('#pbClose').onclick = () => { $('#pb').hidden = true; };
  $('#enBtn').onclick = () => { G.settings.en = !G.settings.en; store(); hud(); };
  $('#sndBtn').onclick = () => { G.settings.sound = G.settings.sound === false; store(); hud(); };
  $('#endPB').onclick = phrasebook;
  $('#endKeep').onclick = () => { $('#end').hidden = true; busy = false; panel.hidden = true; };
  $('#endAgain').onclick = () => { const n = G.name; G = blank(n); store(); $('#end').hidden = true; busy = false; panel.hidden = true; hud(); };
  $('#homeBtn').onclick = () => { if (confirm('Go back to the start screen? Your progress is saved.')) { $('#game').hidden = true; showTitle(); } };

  /* ───────── snow ───────── */
  let flakes = [];
  function snowInit() {
    flakes = (G && SCENES[G.scene].outdoor) ? Array.from({ length: 70 }, () => ({ x: Math.random() * W * TS, y: Math.random() * H * TS, r: 1 + Math.random() * 2, s: 0.3 + Math.random() * 0.8, p: Math.random() * 6 })) : [];
  }

  /* ───────── drawing ───────── */
  const FLOOR = { hall: '#e3eaf0', class: '#efe3cf', cafe: '#f2e8d5' };
  function rr(x, y, w, h, r, fill, stroke) {
    ctx.beginPath(); ctx.roundRect(x, y, w, h, r); if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1.5; ctx.stroke(); }
  }
  const hash = (x, y) => ((x * 73856093) ^ (y * 19349663)) & 7;

  function drawGround(x, y, c, sc) {
    const px = x * TS, py = y * TS;
    if (sc.outdoor) {
      ctx.fillStyle = (c === 'p') ? '#d9e5ee' : (hash(x, y) < 1 ? '#eef5fa' : '#f3f8fc'); ctx.fillRect(px, py, TS, TS);
      if (c === 'p') { ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.fillRect(px + 4, py + 6, 10, 2); ctx.fillRect(px + 18, py + 20, 9, 2); }
    } else {
      ctx.fillStyle = FLOOR[G.scene] || '#e8eef3'; ctx.fillRect(px, py, TS, TS);
      ctx.fillStyle = 'rgba(0,0,0,.035)'; if (G.scene !== 'hall') ctx.fillRect(px, py + TS - 1, TS, 1); else if ((x + y) % 2) ctx.fillRect(px, py, TS, TS);
    }
  }

  function drawTile(x, y, c, sc) {
    const px = x * TS, py = y * TS;
    const out = sc.outdoor;
    if (c === 'W') {
      if (out) {
        ctx.fillStyle = '#b8574f'; ctx.fillRect(px, py, TS, TS);
        ctx.fillStyle = 'rgba(0,0,0,.08)'; if (y !== 2) { ctx.fillRect(px, py + 10, TS, 1); ctx.fillRect(px, py + 21, TS, 1); }
        if (y === 1 && x % 3 === 1) { rr(px + 4, py + 4, 24, 22, 3, '#fff'); rr(px + 7, py + 7, 18, 16, 2, '#bfe0f2'); ctx.fillStyle = '#fff'; ctx.fillRect(px + 15, py + 7, 2, 16); }
        if (y === 2) { ctx.fillStyle = '#8f423c'; ctx.fillRect(px, py + 22, TS, 10); ctx.fillStyle = '#f3f8fc'; ctx.fillRect(px, py + 28, TS, 4); }
        if (y === 0) { ctx.fillStyle = '#e8e2dc'; ctx.fillRect(px, py, TS, 8); }
      } else {
        ctx.fillStyle = '#cdd9e5'; ctx.fillRect(px, py, TS, TS);
        if (y === 1 || (G.scene === 'hall' && y === 2)) { ctx.fillStyle = 'rgba(0,0,0,.08)'; ctx.fillRect(px, py + TS - 6, TS, 6); }
      }
    } else if (c === 'D') {
      if (out) { ctx.fillStyle = '#b8574f'; ctx.fillRect(px, py, TS, TS); }
      else { ctx.fillStyle = '#cdd9e5'; ctx.fillRect(px, py, TS, TS); }
      if (y === 11) { ctx.fillStyle = FLOOR[G.scene] || '#e8eef3'; ctx.fillRect(px, py, TS, TS); ctx.fillStyle = 'rgba(80,60,40,.25)'; ctx.fillRect(px + 2, py + 20, 28, 12); ctx.fillStyle = '#6b4a32'; rr(px + 4, py + 18, 24, 14, 2, '#6b4a32'); }
      else { rr(px + 4, py + 4, 24, 28, 3, out ? '#6b4a32' : '#8a6a4a'); rr(px + 7, py + 8, 7, 10, 1, 'rgba(255,255,255,.2)'); ctx.fillStyle = '#f4c542'; ctx.beginPath(); ctx.arc(px + 24, py + 20, 2, 0, 7); ctx.fill(); }
    } else if (c === 'T') {
      ctx.fillStyle = '#6b4a32'; ctx.fillRect(px + 14, py + 22, 5, 9);
      [[16, 4, 10], [16, 10, 13], [16, 17, 15]].forEach(([cx, cy, w]) => { ctx.fillStyle = '#3f7d5c'; ctx.beginPath(); ctx.moveTo(px + cx, py + cy); ctx.lineTo(px + cx - w, py + cy + 11); ctx.lineTo(px + cx + w, py + cy + 11); ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(px + cx, py + cy); ctx.lineTo(px + cx - w * .55, py + cy + 6); ctx.lineTo(px + cx + w * .55, py + cy + 6); ctx.fill(); });
    } else if (c === 'B') {
      ctx.fillStyle = 'rgba(0,0,0,.1)'; ctx.fillRect(px + 2, py + 26, 28, 4);
      ctx.fillStyle = '#7d5a3c'; ctx.fillRect(px + 3, py + 18, 4, 10); ctx.fillRect(px + 25, py + 18, 4, 10);
      rr(px, py + 12, TS, 6, 2, '#b4824f'); rr(px, py + 4, TS, 6, 2, '#b4824f');
      ctx.fillStyle = '#fff'; ctx.fillRect(px + 3, py + 2, 26, 3);
    } else if (c === 's') {
      ctx.fillStyle = 'rgba(100,140,180,.2)'; ctx.beginPath(); ctx.ellipse(px + 16, py + 29, 12, 3, 0, 0, 7); ctx.fill();
      [[16, 22, 9], [16, 12, 7], [16, 5, 5]].forEach(([cx, cy, r], i) => { ctx.beginPath(); ctx.arc(px + cx, py + cy + (i === 0 ? 2 : 0), r, 0, 7); ctx.fillStyle = '#fff'; ctx.fill(); ctx.strokeStyle = '#b6cadc'; ctx.lineWidth = 1.2; ctx.stroke(); });
      ctx.fillStyle = '#e8893b'; ctx.beginPath(); ctx.moveTo(px + 16, py + 6); ctx.lineTo(px + 24, py + 7); ctx.lineTo(px + 16, py + 9); ctx.fill();
      ctx.fillStyle = '#33445a'; ctx.fillRect(px + 13, py + 3, 2, 2); ctx.fillRect(px + 18, py + 3, 2, 2);
      ctx.fillStyle = '#c9514f'; ctx.fillRect(px + 9, py + 10, 14, 3);
      ctx.fillStyle = '#33445a'; ctx.fillRect(px + 11, py - 3, 10, 4);
    } else if (c === 'b') {
      if (sc.g[y][x - 1] !== 'b' && sc.g[y - 1][x] !== 'b') {
        rr(px, py + 2, TS * 3, TS * 2 - 4, 8, '#d9534f'); rr(px + 3, py + 6, TS * 3 - 6, 18, 4, '#bfe0f2');
        ctx.fillStyle = '#d9534f'; [0, 1, 2].forEach(i => ctx.fillRect(px + 30 + i * 32 - 2, py + 6, 3, 18));
        ctx.fillStyle = '#33445a'; ctx.beginPath(); ctx.arc(px + 22, py + TS * 2 - 4, 7, 0, 7); ctx.arc(px + 74, py + TS * 2 - 4, 7, 0, 7); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.fillRect(px + 6, py + 32, 84, 5);
      }
    } else if (c === 'u') {
      ctx.fillStyle = '#7a8c9c'; ctx.fillRect(px + 15, py + 10, 3, 22);
      ctx.beginPath(); ctx.arc(px + 16, py + 9, 9, 0, 7); ctx.fillStyle = '#2f6f9f'; ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('H', px + 16, py + 13);
    } else if (c === 'F') {
      ctx.fillStyle = '#c9a877'; for (let i = 0; i < 4; i++) rr(px + 2 + i * 8, py + 12, 5, 20, 1, '#c9a877');
      ctx.fillStyle = '#b79562'; ctx.fillRect(px, py + 18, TS, 3); ctx.fillStyle = '#fff'; for (let i = 0; i < 4; i++) ctx.fillRect(px + 2 + i * 8, py + 10, 5, 3);
    } else if (c === 'L') {
      rr(px + 1, py + 2, 30, 30, 2, (x % 2) ? '#6f9fc7' : '#7aa9cf'); ctx.fillStyle = 'rgba(0,0,0,.18)';
      for (let i = 0; i < 3; i++) ctx.fillRect(px + 8, py + 8 + i * 3, 16, 1.5);
      ctx.fillStyle = '#f4c542'; ctx.fillRect(px + 22, py + 17, 3, 5);
    } else if (c === 'N') {
      ctx.fillStyle = '#cdd9e5'; ctx.fillRect(px, py, TS, TS);
      rr(px + 3, py + 6, 26, 20, 3, '#fff', '#b9cfe0'); ctx.font = '16px sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#000'; ctx.fillText(x === 5 ? '📚' : '🍴', px + 16, py + 22);
    } else if (c === 'd') {
      ctx.fillStyle = 'rgba(0,0,0,.1)'; ctx.fillRect(px + 3, py + 26, 26, 4);
      rr(px + 1, py + 8, 30, 20, 3, '#d9b98c', '#b9985f'); ctx.fillStyle = '#7aa9cf'; ctx.fillRect(px + 8, py + 12, 11, 8); ctx.fillStyle = '#fff'; ctx.fillRect(px + 9, py + 13, 9, 1.5);
    } else if (c === 'C') {
      rr(px, py + 6, TS, 24, 2, '#9db4c6'); ctx.fillStyle = '#e7f0f6'; ctx.fillRect(px, py + 2, TS, 8);
      ctx.font = '14px sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#000'; if (x % 3 === 0) ctx.fillText(['🥐', '🍎', '🍌', '🥪'][(x / 3 | 0) % 4], px + 16, py + 12);
    } else if (c === 't') {
      ctx.fillStyle = 'rgba(0,0,0,.1)'; ctx.fillRect(px + 2, py + 26, 28, 4);
      rr(px, py + 6, TS, 20, 4, '#cf9d6b', '#b07e4d'); ctx.beginPath(); ctx.arc(px + 16, py + 15, 4, 0, 7); ctx.fillStyle = '#fff'; ctx.fill();
    } else if (c === 'H') {
      ctx.fillStyle = '#cdd9e5'; ctx.fillRect(px, py, TS, TS); rr(px + 1, py + 3, 30, 24, 2, '#fff', '#9fb4c6');
      ctx.fillStyle = '#9fb4c6'; ctx.fillRect(px + 6, py + 10, 14, 1.5); ctx.fillRect(px + 6, py + 16, 20, 1.5);
    } else if (c === 'V') {
      ctx.fillStyle = '#cdd9e5'; ctx.fillRect(px, py, TS, TS); rr(px + 2, py + 3, 28, 24, 3, '#fff'); rr(px + 5, py + 6, 22, 18, 2, '#bfe0f2'); ctx.fillStyle = '#fff'; ctx.fillRect(px + 15, py + 6, 2, 18);
    }
  }

  function drawChar(x, y, cfg, dir, bob, moving, name) {
    const cx = x * TS + TS / 2, by = y * TS + TS - 3;
    const b = Math.sin(bob) * (moving ? 1.8 : .8);
    ctx.fillStyle = 'rgba(40,70,100,.22)'; ctx.beginPath(); ctx.ellipse(cx, by, 9, 3.2, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#3b4a5c'; ctx.fillRect(cx - 5, by - 8, 3.5, 7); ctx.fillRect(cx + 1.5, by - 8, 3.5, 7);
    rr(cx - 8, by - 21 + b, 16, 15, 5, cfg.body);
    ctx.fillStyle = cfg.scarf; ctx.fillRect(cx - 8, by - 21 + b, 16, 4);
    ctx.beginPath(); ctx.arc(cx, by - 26 + b, 7.5, 0, 7); ctx.fillStyle = '#f2c9a5'; ctx.fill();
    if (cfg.hat) { ctx.beginPath(); ctx.arc(cx, by - 28 + b, 7.8, Math.PI, 0); ctx.fillStyle = cfg.hat; ctx.fill(); ctx.fillRect(cx - 8, by - 29 + b, 16, 3); ctx.beginPath(); ctx.arc(cx, by - 36 + b, 2.5, 0, 7); ctx.fillStyle = '#fff'; ctx.fill(); }
    else { ctx.beginPath(); ctx.arc(cx, by - 28 + b, 7.8, Math.PI, 0); ctx.fillStyle = cfg.hair; ctx.fill(); ctx.fillRect(cx - 7.8, by - 29 + b, 15.6, 3); if (dir === 'up') { ctx.beginPath(); ctx.arc(cx, by - 26 + b, 7.5, 0, 7); ctx.fillStyle = cfg.hair; ctx.fill(); } }
    if (dir !== 'up') {
      ctx.fillStyle = '#2c3a4a'; const ex = dir === 'left' ? -2.5 : dir === 'right' ? 2.5 : 0;
      ctx.fillRect(cx - 3.5 + ex, by - 26 + b, 1.8, 2.4); ctx.fillRect(cx + 1.8 + ex, by - 26 + b, 1.8, 2.4);
    }
    if (name) { ctx.font = '600 11px sans-serif'; ctx.textAlign = 'center'; const w = ctx.measureText(name).width + 10; rr(cx - w / 2, by - 52, w, 15, 7, 'rgba(255,255,255,.92)'); ctx.fillStyle = '#1f2d3d'; ctx.fillText(name, cx, by - 41); }
  }

  const PLAYER = { body: '#2f6f9f', hair: '#4a3626', scarf: '#ffffff', hat: '#e8893b' };

  function targetPos() {
    const q = QUESTS[G.q]; if (!q) return null;
    if (G.scene === q.scene) {
      if (q.npc) { const p = NPCS[q.npc].pos(G); return p && p.scene === G.scene ? [p.x, p.y] : null; }
      if (q.obj) return [q.obj.x, q.obj.y];
      return null;
    }
    const r = ROUTE[G.scene] && ROUTE[G.scene][q.scene]; return r || null;
  }

  function draw(t) {
    const sc = scene();
    ctx.clearRect(0, 0, cv.width, cv.height);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const c = sc.g[y][x]; drawGround(x, y, c, sc); }
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const c = sc.g[y][x]; if (c !== '.' && c !== 'f' && c !== 'p') drawTile(x, y, c, sc); }
    /* people, sorted by y */
    const px = P.moving ? P.fx + (G.x - P.fx) * Math.min(1, P.t) : G.x, py = P.moving ? P.fy + (G.y - P.fy) * Math.min(1, P.t) : G.y;
    const near = (x, y) => Math.abs(x - G.x) + Math.abs(y - G.y) <= 2;
    const list = npcsHere().map(o => ({ y: o.y, f: () => drawChar(o.x, o.y, o.n, 'down', t / 500 + o.x, false, near(o.x, o.y) ? o.n.name : null) }));
    list.push({ y: py, f: () => drawChar(px, py, PLAYER, G.dir, t / 120, P.moving, G.name) });
    list.sort((a, b) => a.y - b.y).forEach(o => o.f());
    /* quest marker */
    if (hintOn && !busy) {
      const tp = targetPos();
      if (tp) {
        const mx = tp[0] * TS + TS / 2, my = tp[1] * TS - 10 + Math.sin(t / 250) * 3;
        const npcT = QUESTS[G.q] && QUESTS[G.q].npc && G.scene === QUESTS[G.q].scene;
        const yy = npcT ? my - 26 : my;
        ctx.beginPath(); ctx.moveTo(mx, yy + 10); ctx.lineTo(mx - 7, yy); ctx.lineTo(mx + 7, yy); ctx.closePath(); ctx.fillStyle = '#f4c542'; ctx.fill(); ctx.strokeStyle = '#a77f00'; ctx.lineWidth = 1.5; ctx.stroke();
      }
      if (!P.moving && !fade.dir) {
        const at = adjacentTargets()[0];
        if (at) { const bx = at.x * TS + TS / 2, by = at.y * TS - ((at.kind === 'npc') ? 36 : 2); rr(bx - 11, by - 22, 22, 18, 9, '#fff', '#2f6f9f'); ctx.font = '12px sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#2f6f9f'; ctx.fillText('A', bx, by - 9); }
      }
    }
    /* snow */
    ctx.fillStyle = 'rgba(255,255,255,.95)';
    flakes.forEach(f => { ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, 7); ctx.fill(); });
    /* fade */
    if (fade.a > 0) { ctx.fillStyle = `rgba(20,40,60,${fade.a})`; ctx.fillRect(0, 0, cv.width, cv.height); }
    /* scene name */
    ctx.font = '600 12px sans-serif'; ctx.textAlign = 'right'; rr(cv.width - 112, 8, 104, 20, 10, 'rgba(255,255,255,.8)'); ctx.fillStyle = '#31465b'; ctx.fillText(sc.name, cv.width - 18, 22);
  }

  /* ───────── main loop ───────── */
  let last = 0;
  function loop(t) {
    const dt = Math.min(50, t - last); last = t;
    if (G && !$('#game').hidden) {
      if (P.moving) { P.t += dt / 135; if (P.t >= 1) { P.moving = false; arrived(); } }
      if (!P.moving && !busy && !fade.dir && held.length && panel.hidden && $('#pb').hidden && $('#end').hidden) tryMove(held[held.length - 1]);
      if (fade.dir === 1) { fade.a += dt / 220; if (fade.a >= 1) { fade.a = 1; fade.dir = -1; if (fade.cb) fade.cb(); } }
      else if (fade.dir === -1) { fade.a -= dt / 220; if (fade.a <= 0) { fade.a = 0; fade.dir = 0; } }
      flakes.forEach(f => { f.y += f.s; f.x += Math.sin(t / 1500 + f.p) * .3; if (f.y > H * TS + 4) { f.y = -4; f.x = Math.random() * W * TS; } });
      draw(t);
    }
    requestAnimationFrame(loop);
  }

  /* page snow (behind the layout) */
  (function pageSnow() {
    const c = $('#snow'), x = c.getContext('2d'); let w, h, fl;
    const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    const size = () => { w = c.width = innerWidth; h = c.height = innerHeight; fl = Array.from({ length: Math.min(110, w / 10 | 0) }, () => ({ x: Math.random() * w, y: Math.random() * h, r: 1 + Math.random() * 2.4, s: .25 + Math.random() * .8, p: Math.random() * 6 })); };
    size(); addEventListener('resize', size);
    if (reduce) return;
    (function f(t) { x.clearRect(0, 0, w, h); x.fillStyle = 'rgba(255,255,255,.95)'; fl.forEach(o => { o.y += o.s; o.x += Math.sin(t / 1600 + o.p) * .3; if (o.y > h + 4) { o.y = -4; o.x = Math.random() * w; } x.beginPath(); x.arc(o.x, o.y, o.r, 0, 7); x.fill(); }); requestAnimationFrame(f); })(0);
  })();

  /* test hooks */
  window.__game = {
    get G() { return G; }, cur: () => cur, busy: () => busy,
    teleport(s, x, y, dir) { G.scene = s; G.x = x; G.y = y; G.dir = dir || 'up'; P.moving = false; snowInit(); hud(); },
    interact, api
  };

  if (!hasTTS || !voice) { const n = $('#voiceNote'); if (n) n.hidden = false; }
  showTitle();
  requestAnimationFrame(loop);
})();
