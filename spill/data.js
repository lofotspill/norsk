/* Data for the 2D game: maps, objects, people, phrases, quests and conversations.
   Chapter 1: "Første skoledag" (First day at school).  Goal: make friends. */
(function () {
  'use strict';

  const TS = 32, W = 20, H = 12;
  const grid = (f) => Array.from({ length: H }, () => Array(W).fill(f));
  const rect = (g, c, x, y, w, h) => { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (g[j] && g[j][i] !== undefined) g[j][i] = c; };
  const put = (g, c, x, y) => rect(g, c, x, y, 1, 1);

  /* ───────── maps ───────── */
  function yard() {
    const g = grid('.');
    rect(g, 'W', 0, 0, 20, 3); put(g, 'D', 9, 2);
    rect(g, 'p', 8, 3, 3, 6); rect(g, 'p', 9, 9, 1, 2);
    [[1, 3], [18, 3], [2, 10], [17, 10], [6, 9], [13, 9]].forEach(([x, y]) => put(g, 'T', x, y));
    rect(g, 'B', 13, 5, 2, 1);
    put(g, 's', 16, 6);
    rect(g, 'b', 0, 8, 3, 2);
    put(g, 'u', 3, 7);
    rect(g, 'F', 0, 11, 20, 1);
    return g;
  }
  function hall() {
    const g = grid('f');
    rect(g, 'W', 0, 0, 20, 3);
    [1, 2, 6, 7, 8, 10, 11, 12, 16, 17, 18].forEach(x => put(g, 'L', x, 2));
    put(g, 'D', 4, 2); put(g, 'D', 15, 2); put(g, 'N', 5, 2); put(g, 'N', 14, 2);
    put(g, 'D', 9, 11);
    return g;
  }
  function classroom() {
    const g = grid('f');
    rect(g, 'W', 0, 0, 20, 2);
    rect(g, 'H', 6, 1, 8, 1);
    [2, 3, 16, 17].forEach(x => put(g, 'V', x, 1));
    [[3, 5], [6, 5], [11, 5], [14, 5], [17, 5], [3, 7], [6, 7], [9, 7], [14, 7], [17, 7], [3, 9], [6, 9], [11, 9], [14, 9], [17, 9]].forEach(([x, y]) => put(g, 'd', x, y));
    put(g, 'D', 9, 11);
    return g;
  }
  function cafe() {
    const g = grid('f');
    rect(g, 'W', 0, 0, 20, 2);
    rect(g, 'C', 4, 3, 12, 1);
    rect(g, 't', 3, 6, 2, 1); rect(g, 't', 3, 9, 2, 1); rect(g, 't', 8, 8, 2, 1); rect(g, 't', 13, 8, 2, 1);
    put(g, 'D', 9, 11);
    return g;
  }

  const SCENES = {
    yard: {
      name: 'Skolegården', outdoor: true, g: yard(),
      doors: [{ x: 9, y: 2, to: 'hall', tx: 9, ty: 10 }],
      objs: [
        { x: 16, y: 6, w: 1, h: 1, key: 'snomann', no: 'en snømann', en: 'a snowman' },
        { x: 0, y: 8, w: 3, h: 2, key: 'buss', no: 'en buss', en: 'a bus' },
        { x: 3, y: 7, w: 1, h: 1, key: 'busstopp', no: 'et busstopp', en: 'a bus stop' },
        { x: 1, y: 3, w: 1, h: 1, key: 'tre', no: 'et tre', en: 'a tree' },
        { x: 13, y: 5, w: 2, h: 1, key: 'benk', no: 'en benk', en: 'a bench' },
        { x: 5, y: 2, w: 3, h: 1, key: 'skole', no: 'en skole', en: 'a school' }
      ],
      spawn: { x: 4, y: 9 }
    },
    hall: {
      name: 'Gangen', g: hall(),
      doors: [{ x: 9, y: 11, to: 'yard', tx: 9, ty: 3 }, { x: 4, y: 2, to: 'class', tx: 9, ty: 10 }, { x: 15, y: 2, to: 'cafe', tx: 9, ty: 10 }],
      objs: [
        { x: 5, y: 2, w: 1, h: 1, key: 'klasserom', no: 'et klasserom', en: 'a classroom' },
        { x: 14, y: 2, w: 1, h: 1, key: 'kantine', no: 'en kantine', en: 'a canteen' },
        { x: 6, y: 2, w: 3, h: 1, key: 'skap', no: 'et skap', en: 'a locker' }
      ],
      spawn: { x: 9, y: 10 }
    },
    class: {
      name: 'Klasserommet', g: classroom(),
      doors: [{ x: 9, y: 11, to: 'hall', tx: 4, ty: 3 }],
      objs: [
        { x: 6, y: 1, w: 8, h: 1, key: 'tavle', no: 'en tavle', en: 'a whiteboard' },
        { x: 2, y: 1, w: 2, h: 1, key: 'vindu', no: 'et vindu', en: 'a window' },
        { x: 11, y: 5, w: 1, h: 1, key: 'tomPult', no: 'en pult', en: 'a desk', word: 'pult', special: 'emptyDesk' },
        { x: 3, y: 5, w: 1, h: 1, key: 'pult', no: 'en pult', en: 'a desk' },
        { x: 6, y: 5, w: 1, h: 1, key: 'pult', no: 'en pult', en: 'a desk' },
        { x: 14, y: 5, w: 1, h: 1, key: 'pult', no: 'en pult', en: 'a desk' },
        { x: 3, y: 7, w: 1, h: 1, key: 'pult', no: 'en pult', en: 'a desk' },
        { x: 6, y: 7, w: 1, h: 1, key: 'pult', no: 'en pult', en: 'a desk' },
        { x: 9, y: 7, w: 1, h: 1, key: 'pult', no: 'en pult', en: 'a desk' },
        { x: 14, y: 7, w: 1, h: 1, key: 'pult', no: 'en pult', en: 'a desk' }
      ],
      spawn: { x: 9, y: 10 }
    },
    cafe: {
      name: 'Kantina', g: cafe(),
      doors: [{ x: 9, y: 11, to: 'hall', tx: 15, ty: 3 }],
      objs: [
        { x: 4, y: 3, w: 12, h: 1, key: 'disk', no: 'en disk', en: 'a counter' },
        { x: 3, y: 6, w: 2, h: 1, key: 'bord', no: 'et bord', en: 'a table' },
        { x: 3, y: 9, w: 2, h: 1, key: 'bord', no: 'et bord', en: 'a table' },
        { x: 8, y: 8, w: 2, h: 1, key: 'bord', no: 'et bord', en: 'a table' },
        { x: 13, y: 8, w: 2, h: 1, key: 'bord', no: 'et bord', en: 'a table' }
      ],
      spawn: { x: 9, y: 10 }
    }
  };
  const SOLID = new Set(['W', 'T', 'B', 's', 'b', 'u', 'L', 'N', 'd', 'C', 't', 'H', 'V', 'F']);
  const WORD_TOTAL = new Set(Object.values(SCENES).flatMap(s => s.objs.map(o => o.word || o.key))).size;

  /* ───────── people ───────── */
  const NPCS = {
    nora:  { name: 'Nora',      body: '#c9514f', hair: '#6b4a2f', scarf: '#f3d36b', pos: (G) => G.q <= 1 ? { scene: 'yard', x: 11, y: 6 } : G.q <= 4 ? { scene: 'class', x: 12, y: 5 } : { scene: 'cafe', x: 12, y: 8 } },
    jonas: { name: 'Jonas',     body: '#3f8a69', hair: '#2e2e2e', scarf: '#ffffff', pos: (G) => G.q >= 5 ? { scene: 'cafe', x: 15, y: 8 } : null },
    berg:  { name: 'Fru Berg',  body: '#7b5ea7', hair: '#b9b9b9', scarf: '#d8c6f0', pos: () => ({ scene: 'class', x: 9, y: 3 }) },
    rita:  { name: 'Rita',      body: '#e0a93b', hair: '#b8742e', scarf: '#ffffff', pos: () => ({ scene: 'cafe', x: 9, y: 3 }) }
  };

  /* ───────── phrasebook ───────── */
  const PHRASES = {
    hei: ['Hei!', 'Hi!'],
    heter: ['Jeg heter …', 'My name is …'],
    hvaHeter: ['Hva heter du?', 'What is your name?'],
    hyggelig: ['Hyggelig å møte deg.', 'Nice to meet you.'],
    hvordan: ['Hvordan har du det?', 'How are you?'],
    bra: ['Jeg har det bra.', 'I am fine.'],
    visesPhrase: ['Vi ses!', 'See you!'],
    morgen: ['God morgen.', 'Good morning.'],
    forstar: ['Jeg forstår ikke.', 'I do not understand.'],
    ikkeProblem: ['Ikke noe problem!', 'No problem!'],
    sammen: ['Skal vi spise lunsj sammen?', 'Shall we eat lunch together?'],
    jaTakk: ['Ja, takk!', 'Yes, please!'],
    hvaVilDu: ['Hva vil du ha?', 'What would you like?'],
    jegVilHa: ['Jeg vil ha …, takk.', 'I would like …, please.'],
    tjue: ['Det blir tjue kroner.', 'That will be twenty kroner.'],
    vaerSaGod: ['Vær så god!', 'Here you are!'],
    takk: ['Takk!', 'Thanks!'],
    bareHyggelig: ['Bare hyggelig!', 'You are welcome!'],
    herPlass: ['Her er det plass!', 'There is room here!'],
    vaereMed: ['Vil du være med?', 'Do you want to join?'],
    jaGjerne: ['Ja, gjerne!', 'Yes, gladly!'],
    iMorgen: ['Vi ses i morgen!', 'See you tomorrow!']
  };

  /* ───────── quests ───────── */
  const QUESTS = {
    1: { no: 'Si hei til Nora.', en: 'Say hi to Nora.', scene: 'yard', npc: 'nora' },
    2: { no: 'Finn klasserommet.', en: 'Find the classroom.', scene: 'class' },
    3: { no: 'Snakk med læreren.', en: 'Talk to the teacher.', scene: 'class', npc: 'berg' },
    4: { no: 'Finn en tom pult.', en: 'Find an empty desk.', scene: 'class', obj: { x: 11, y: 5 } },
    5: { no: 'Kjøp lunsj i kantina.', en: 'Buy lunch in the canteen.', scene: 'cafe', npc: 'rita' },
    6: { no: 'Sitt sammen med Nora og Jonas.', en: 'Sit with Nora and Jonas.', scene: 'cafe', npc: 'nora' }
  };
  /* where to head when the goal is in another room */
  const ROUTE = {
    yard: { hall: [9, 2], class: [9, 2], cafe: [9, 2] },
    hall: { yard: [9, 11], class: [4, 2], cafe: [15, 2] },
    class: { yard: [9, 11], hall: [9, 11], cafe: [9, 11] },
    cafe: { yard: [9, 11], hall: [9, 11], class: [9, 11] }
  };

  /* ───────── conversations ───────── */
  const say = (who, no, en, o) => Object.assign({ t: 'say', who, no, en }, o || {});
  const narr = (en) => ({ t: 'narr', en });
  const ask = (choices, o) => Object.assign({ t: 'ask', choices }, o || {});
  const C = (no, en, ok, o) => Object.assign({ no, en, ok: !!ok }, o || {});
  const build = (en, answer, extra, o) => Object.assign({ t: 'build', en, answer, extra: extra || [] }, o || {});
  const act = (fn) => ({ t: 'act', fn });

  const hm = (who) => say(who, 'Hm?', 'Hmm? That does not fit. Try another answer.');

  const MENU = [
    { no: 'et eple', en: 'an apple', emoji: '🍎' }, { no: 'en banan', en: 'a banana', emoji: '🍌' }, { no: 'en kakao', en: 'a hot chocolate', emoji: '☕' }, { no: 'en bolle', en: 'a bun', emoji: '🥐' }
  ];

  const CONVOS = {
    nora1: () => [
      narr('A girl in a red coat waves at you.'),
      say('Nora', 'Hei!', 'Hi!', { learn: 'hei' }),
      ask([C('Hei!', 'Hi!', true), C('Takk.', 'Thanks.'), C('Ha det bra!', 'Goodbye!')], { retry: hm('Nora') }),
      say('Nora', 'Jeg heter Nora. Hva heter du?', 'My name is Nora. What is your name?', { learn: ['heter', 'hvaHeter'] }),
      build('Tell her your name: “My name is {name}.”', 'Jeg heter {name}.', ['Hva', 'du'], { learn: 'heter' }),
      say('Nora', 'Hyggelig å møte deg, {name}!', 'Nice to meet you, {name}!', { learn: 'hyggelig' }),
      ask([C('Hyggelig å møte deg.', 'Nice to meet you.', true), C('Hva heter du?', 'What is your name?'), C('Ha det bra.', 'Goodbye.')], { retry: hm('Nora') }),
      say('Nora', 'Hvordan har du det?', 'How are you?', { learn: 'hvordan' }),
      ask([C('Jeg har det bra.', 'I am fine.', true), C('Hyggelig å møte deg.', 'Nice to meet you.'), C('Ha det bra.', 'Goodbye.')], { retry: hm('Nora'), learn: 'bra' }),
      say('Nora', 'Bra! Vi har norsk nå. Vi ses i klasserommet!', 'Good! We have Norwegian now. See you in the classroom!', { learn: 'visesPhrase' }),
      ask([C('Vi ses!', 'See you!', true), C('Hei!', 'Hi!'), C('Takk.', 'Thanks.')], { retry: hm('Nora') }),
      narr('Nora runs off towards the school. Follow her: go through the door at the top. Tip: tap or press the action button next to things to learn new words!'),
      act((api) => { api.npcGone(); api.quest(2); })
    ],
    berg1: () => [
      say('Fru Berg', 'God morgen!', 'Good morning!', { learn: 'morgen' }),
      ask([C('God morgen.', 'Good morning.', true), C('Ha det bra.', 'Goodbye.'), C('Takk.', 'Thanks.')], { retry: hm('Fru Berg') }),
      say('Fru Berg', 'Hva heter du?', 'What is your name?', { recall: true }),
      ask([C('Jeg heter {name}.', 'My name is {name}.', true), C('Jeg har det bra.', 'I am fine.'), C('Hyggelig å møte deg.', 'Nice to meet you.')], { recall: true, retry: hm('Fru Berg') }),
      say('Fru Berg', 'Velkommen til klassen, {name}. Sett deg ned, takk.', 'Welcome to the class, {name}. Please sit down.', { recall: true }),
      narr('Hmm. You did not catch everything. That is completely normal! Norwegians are happy to repeat. Tell her you do not understand.'),
      ask([C('Jeg forstår ikke.', 'I do not understand.', true), C('Ha det bra.', 'Goodbye.'), C('Hei!', 'Hi!')], { retry: hm('Fru Berg'), learn: 'forstar' }),
      say('Fru Berg', 'Ikke noe problem! Sett deg ned, takk.', 'No problem! Please sit down.', { learn: 'ikkeProblem' }),
      narr('“Sett deg ned” means “sit down”. Find the empty desk next to Nora.'),
      act((api) => api.quest(4))
    ],
    desk: () => [
      narr('You sit down at the empty desk next to Nora.'),
      say('Nora', 'Hei igjen! Skal vi spise lunsj sammen?', 'Hi again! Shall we eat lunch together?', { learn: 'sammen' }),
      ask([C('Ja, takk!', 'Yes, please!', true), C('Ha det bra!', 'Goodbye!'), C('Jeg heter {name}.', 'My name is {name}.')], { retry: hm('Nora'), learn: 'jaTakk' }),
      narr('Ring-ring! The school bell rings. It is lunch time.'),
      act((api) => { api.quest(5); api.fadeTo('hall', 4, 3); })
    ],
    rita: () => [
      say('Rita', 'Hei! Hva vil du ha?', 'Hi! What would you like?', { learn: 'hvaVilDu' }),
      { t: 'menu', en: 'Choose something from the counter.' },
      build('Order it: “I would like {item}, please.”', 'Jeg vil ha {item}, takk.', ['heter', 'du'], { learn: 'jegVilHa' }),
      say('Rita', 'Det blir tjue kroner.', 'That will be twenty kroner (20 kr).', { learn: 'tjue' }),
      { t: 'listen', en: 'Listen to Rita, then tap the right amount to pay.', say: 'tjue kroner', opts: ['12 kr', '20 kr', '15 kr'], ok: '20 kr' },
      say('Rita', 'Vær så god!', 'Here you are!', { learn: 'vaerSaGod' }),
      ask([C('Takk!', 'Thanks!', true), C('Hei!', 'Hi!'), C('Ja.', 'Yes.')], { retry: hm('Rita'), learn: 'takk' }),
      say('Rita', 'Bare hyggelig!', 'You are welcome!', { learn: 'bareHyggelig' }),
      act((api) => api.quest(6))
    ],
    table: () => [
      say('Nora', '{name}! Her er det plass!', '{name}! There is room here!', { learn: 'herPlass' }),
      say('Nora', 'Dette er Jonas.', 'This is Jonas.'),
      say('Jonas', 'Hei! Jeg heter Jonas. Hva heter du?', 'Hi! My name is Jonas. What is your name?', { recall: true }),
      ask([C('Jeg heter {name}.', 'My name is {name}.', true), C('Ha det bra.', 'Goodbye.'),
        C('Jeg forstår ikke.', 'I do not understand.', false, { help: [say('Jonas', 'Jeg heter Jonas. Hva heter du?', 'My name is Jonas. What is your name?', { force: true })] })], { recall: true, retry: hm('Jonas') }),
      say('Jonas', 'Hyggelig! Vil du være med på fotball i morgen?', 'Nice! Do you want to join us for football tomorrow?', { learn: 'vaereMed' }),
      ask([C('Ja, gjerne!', 'Yes, gladly!', true), C('Ha det bra!', 'Goodbye!'), C('Jeg heter {name}.', 'My name is {name}.'),
        C('Jeg forstår ikke.', 'I do not understand.', false, { help: [say('Jonas', 'Vil du være med på fotball i morgen?', 'Do you want to join us for football tomorrow?', { force: true })] })], { retry: hm('Jonas'), learn: 'jaGjerne' }),
      say('Jonas', 'Supert!', 'Great!'),
      say('Nora', 'Vi ses i morgen!', 'See you tomorrow!', { recall: true, learn: 'iMorgen' }),
      ask([C('Vi ses!', 'See you!', true), C('Hyggelig å møte deg.', 'Nice to meet you.'), C('Jeg har det bra.', 'I am fine.')], { recall: true, retry: hm('Nora') }),
      act((api) => api.finish())
    ]
  };

  window.GAME_DATA = { TS, W, H, SCENES, SOLID, WORD_TOTAL, NPCS, PHRASES, QUESTS, ROUTE, CONVOS, MENU };
})();
