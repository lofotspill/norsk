/* Course content for "Norsk på 1·2·3".
   Principle: every word is SHOWN and HEARD on a "new word" card before it is ever asked about.
   Lessons are short. Wrong answers come back at the end of the lesson. */

(function () {
  'use strict';

  /* ───────── small helpers ───────── */
  const say = (w) => `<button class="say" data-say="${w}" aria-label="Listen: ${w}" title="Listen">🔊</button>`;
  const W = (no, en) => `<span class="w"><b lang="nb">${no}</b>${say(no)}${en ? `<span class="en">${en}</span>` : ''}</span>`;
  const G = (g) => `<span class="g g-${g}">${g}</span>`;
  const TERM = (term, no, def) => `<div class="term"><b>${term}</b>${no ? ` <span lang="nb">(${no})</span>` : ''}: ${def}</div>`;
  const TIP = (html) => `<div class="tip">${html}</div>`;

  /* items: no = Norwegian, en = English, vis = what is shown big (emoji or digit) */
  const I = (no, en, vis, o) => Object.assign({ no, en, vis: vis === undefined ? no : vis }, o || {});
  const NUM = (no, n, en, tip) => I(no, en, String(n), { num: true, tip });
  const N = (no, en, vis, tip) => I(no, en, vis, { noun: true, tip });

  /* steps */
  const note = (title, html, icon, tag) => ({ k: 'note', title, html, icon, tag });
  const GR = (title, html) => [title, html, 'Grammar'];
  const chat = (lines) => `<div class="chat">${lines.map(l => `<div class="bub them"><span lang="nb">${l}</span></div>`).join('')}<div class="bub me ghost">…</div></div>`;
  /* a small conversation: the learner picks what to say */
  const dlg = (lines, opts, a, why) => ({ k: 'mc', big: chat(lines), say: lines[lines.length - 1].replace(/<[^>]+>/g, ''), q: 'What do you say?', opts, a, why });
  const mc = (q, opts, a, why, big) => ({ k: 'mc', q, opts, a, why, big });
  const hearMC = (word, q, opts, a, why) => ({ k: 'mc', say: word, q, opts, a, why });
  const ty = (q, a, why, big) => ({ k: 'type', q, a: Array.isArray(a) ? a : [a], why, big });
  const bank = (q, answer, extra, why, sayIt) => ({
    k: 'bank', q, say: sayIt || null, a: [answer],
    tiles: answer.replace(/[.,!?]/g, '').split(/\s+/).concat(extra || []), why
  });
  const match = (q, pairs, why) => ({ k: 'match', q, pairs, why });

  /* lesson spec → lesson. groups: items are taught (cards) in small groups, each followed by practice. */
  function lesson(id, title, icon, spec) {
    const items = (spec.groups || []).flatMap(g => g.items);
    return { id, title, icon, items, spec };
  }

  /* ───────── UNIT 1: WELCOME ───────── */
  const cognates = [
    I('hus', 'house', '🏠'), I('bok', 'book', '📖'), I('fisk', 'fish', '🐟'), I('vinter', 'winter', '❄️'),
    I('fot', 'foot', '🦶'), I('hånd', 'hand', '✋')
  ];

  const u1 = {
    id: 'u1', title: 'Velkommen', sub: 'Welcome', blurb: 'A first look at Norwegian.',
    lessons: [
      lesson('u1l1', 'Hei og velkommen!', '👋', {
        welcome: true,
        build: () => [
          note('Hei og velkommen! (Hello and welcome!) 👋', `
<p>You are about to learn <b>Norwegian</b>. It is a language of fjords, mountains, long summer evenings and northern lights, spoken by around five million people.</p>
<p>We will go slowly, one small step at a time. You will <b>always see and hear a new word before you are asked about it</b>. If you make a mistake, that is perfectly fine. The question simply comes back at the end of the lesson until it sticks.</p>
<p>Say the words out loud as you go. That is the fastest way to learn them.</p>`),
          note('What kind of language is Norwegian?', `
<p>Norwegian belongs to the <b>Germanic</b> language family. That is the same family as <b>English</b>, German and Dutch, so you already have a head start.</p>
<p>More exactly, Norwegian is a <b>North Germanic</b> (or <i>Scandinavian</i>) language. It grew out of <b>Old Norse</b>, the language of the Vikings.</p>
<p>Its closest relatives are <b>Swedish</b> and <b>Danish</b>. Speakers of the three can often understand each other. Icelandic and Faroese are more distant cousins.</p>`),
          note('Words you almost know already', `
<p>Because English and Norwegian are relatives, many words look and sound alike. Listen to these:</p>
<p>${W('hus', 'house')}${W('bok', 'book')}${W('fisk', 'fish')}${W('vinter', 'winter')}${W('fot', 'foot')}${W('hånd', 'hand')}</p>
<p>English also borrowed words from the Vikings: <i>egg</i>, <i>sky</i>, <i>knife</i>, <i>window</i>, <i>husband</i> and <i>take</i> all come from Old Norse. And from Norwegian itself we got <i>ski</i>, <i>fjord</i>, <i>slalom</i> and <i>troll</i>.</p>`),
          note('Two ways of writing Norwegian', `
<p>Norway has <b>two official written standards</b>:</p>
<p><b>Bokmål</b> (“book language”) is used by most Norwegians. <b>Nynorsk</b> (“new Norwegian”) was built in the 1800s from country dialects and is used by roughly one in ten.</p>
<p>In this course we learn <b>Bokmål</b>.</p>
<p>Spoken Norwegian also varies a lot from place to place. People proudly speak their own dialects. We teach the pronunciation that is easiest to understand all over the country.</p>`),
          note('How this course works', `
<p><b>1.</b> Each lesson is short. First you meet a few new words or sounds.</p>
<p><b>2.</b> Then you practise them: listening, matching, typing, and building sentences.</p>
<p><b>3.</b> Mistakes come back at the end of the lesson.</p>
<p><b>4.</b> Little notes explain how the language works, in plain English.</p>
<p>The first unit is the <b>alphabet</b>. Then we count, greet people, and learn our first words. Let us warm up with a few words you just met.</p>`),
          match('Match the Norwegian words with their English meaning.', [['hus', 'house'], ['bok', 'book'], ['fisk', 'fish'], ['vinter', 'winter']], 'These words are close relatives of the English ones.'),
          { k: 'mc', say: 'hånd', q: 'Tap what you hear.', opts: ['hånd', 'fot', 'fisk', 'hus'], a: 'hånd', why: 'That was <b>hånd</b>, “hand”.' },
          mc('Which is the Norwegian word for <b>“foot”</b>?', ['fot', 'hånd', 'bok', 'vinter'], 'fot', '<b>fot</b> means “foot”.')
        ]
      })
    ]
  };

  /* ───────── UNIT 2: ALPHABET ───────── */
  const alpha = 'abcdefghijklmnopqrstuvwxyzæøå'.split('').map(c => `<span class="${'æøå'.includes(c) ? 'newl' : ''}" lang="nb">${c}</span>`).join('');

  const u2 = {
    id: 'u2', title: 'Alfabetet', sub: 'The alphabet', blurb: 'Letters and sounds.',
    lessons: [
      lesson('u2l1', 'The alphabet', '🔤', {
        build: () => [
          note('29 letters', `
<p>Norwegian uses the same letters as English, plus <b>three extra ones</b> at the end: <b>æ, ø</b> and <b>å</b>. That makes <b>29 letters</b> in total.</p>
<div class="alpha">${alpha}</div>
<p>The letters <b>c, q, w, x</b> and <b>z</b> only appear in words borrowed from other languages.</p>`),
          note('Letters and sounds', `
<p>In English, the same letters can sound very different (<i>though</i>, <i>through</i>, <i>tough</i>). Norwegian is much more regular: <b>once you know the sounds, you can read almost any word out loud.</b></p>
<p>Letters are split into two groups:</p>
${TERM('Vowels', 'vokaler', 'sounds you can sing and hold, like “ah” or “oo”. Norwegian has nine vowel letters: <b>a e i o u y æ ø å</b>.')}
${TERM('Consonants', 'konsonanter', 'all the other letters. You make them by squeezing or stopping the air, like <b>b</b>, <b>k</b> or <b>s</b>.')}`),
          mc('How many letters are there in the Norwegian alphabet?', ['26', '27', '29', '31'], '29', 'There are 29: the 26 English letters plus <b>æ, ø</b> and <b>å</b>.'),
          mc('Which three letters are extra in Norwegian?', ['æ, ø, å', 'ä, ö, å', 'á, é, í', 'ç, ñ, ü'], 'æ, ø, å', 'The Norwegian alphabet ends with <b>æ ø å</b>.'),
          mc('Which of these is a <b>vowel</b>?', ['å', 'k', 't', 's'], 'å', '<b>å</b> is one of the nine vowels. The others are consonants.'),
          mc('Which of these is a <b>consonant</b>?', ['k', 'æ', 'y', 'o'], 'k', 'The nine vowels are a e i o u y æ ø å. Everything else is a consonant.')
        ]
      }),
      lesson('u2l2', 'Vowels: a e i o u', '🅰️', {
        groups: [
          {
            pre: ['Five familiar vowels', `<p>Let us meet the first five vowels. Each one has a <b>long</b> and a <b>short</b> version. Listen carefully and repeat out loud.</p>`],
            items: [
              I('dag', 'day', '🌅', { tip: '<b>a</b> sounds like the <i>a</i> in <i>father</i>.' }),
              I('se', 'to see', '👀', { tip: '<b>e</b> sounds like <i>ay</i> in <i>say</i>, but held steady, with no glide.' }),
              I('vi', 'we', '👫', { tip: '<b>i</b> sounds like <i>ee</i> in <i>see</i>.' })
            ]
          },
          {
            pre: ['Two trickier ones', `<p>The vowel <b>o</b> is usually pronounced like English “<i>oo</i>”. And <b>u</b> has no English match at all, so take your time.</p>`],
            items: [
              I('sko', 'shoe', '👟', { tip: '<b>o</b> is usually “<i>oo</i>” as in <i>moon</i>. So <i>sko</i> sounds like “skoo”.' }),
              I('hus', 'house', '🏠', { tip: '<b>u</b>: round your lips as if to say “oo”, then try to say “ee” instead.' })
            ],
            post: ['Practising the Norwegian u', `<p>The Norwegian <b>u</b> is the hardest vowel for English speakers. Round your lips like you are whistling, and say “ee”.</p><p>Say it slowly: ${W('hus', 'house')} ${W('du', 'you')}</p>`]
          }
        ]
      }),
      lesson('u2l3', 'Vowels: y æ ø å', '🔡', {
        groups: [
          {
            pre: ['Meet the special vowels', `<p>These four vowels do not exist in English, except <b>æ</b>, which is close. <b>y</b>, <b>ø</b> and <b>å</b> need a little practice.</p>`],
            items: [
              I('by', 'city', '🏙️', { tip: '<b>y</b>: say “ee” and then round your lips without moving your tongue. Like German <i>ü</i> or French <i>u</i>.' }),
              I('vær', 'weather', '🌦️', { tip: '<b>æ</b> sounds like the <i>a</i> in <i>cat</i>, stretched out.' }),
              I('snø', 'snow', '❄️', { tip: '<b>ø</b> sounds like <i>ur</i> in British <i>fur</i>, but without the r.' })
            ]
          },
          {
            items: [
              I('brød', 'bread', '🍞', { tip: 'Another <b>ø</b>. The <b>d</b> at the end is silent here: “brur”.' }),
              I('gå', 'to walk', '🚶', { tip: '<b>å</b> sounds like <i>aw</i> in <i>saw</i>.' }),
              I('båt', 'boat', '⛵', { tip: 'Another <b>å</b>: “bawt”.' })
            ]
          }
        ]
      }),
      lesson('u2l4', 'Consonants that surprise you', '🗣️', {
        groups: [
          {
            pre: ['Most consonants are easy', `<p>Most Norwegian consonants sound like English ones. These few are different, so they get their own lesson.</p>`],
            items: [
              I('ja', 'yes', '✅', { tip: '<b>j</b> sounds like English <i>y</i> in <i>yes</i>. So <i>ja</i> is “ya”.' }),
              I('kino', 'cinema', '🎬', { tip: '<b>k</b> before <b>i</b> or <b>y</b>, and <b>kj</b>, make a soft <i>h</i> like in <i>huge</i>: “hee-noo”.' }),
              I('ski', 'ski', '🎿', { tip: '<b>sk</b> before <b>i</b> or <b>y</b>, and <b>sj</b>, sound like English <i>sh</i>. <i>ski</i> is “shee”.' })
            ]
          },
          {
            items: [
              I('sjø', 'sea', '🌊', { tip: '<b>sj</b> = <i>sh</i>. So <i>sjø</i> sounds like “shur”.' }),
              I('lang', 'long', '📏', { tip: '<b>ng</b> sounds like <i>ng</i> in <i>sing</i>. There is no hard <i>g</i> after it.' })
            ]
          }
        ]
      }),
      lesson('u2l5', 'Silent letters and r', '🤫', {
        groups: [
          {
            pre: ['Letters you do not say', `<p>In some letter combinations, the first letter is <b>silent</b>. You write it, but you do not pronounce it. This happens with <b>hj-</b>, <b>gj-</b> and <b>hv-</b>.</p>`],
            items: [
              I('hjem', 'home', '🏡', { tip: '<b>hj</b>: the <b>h</b> is silent. <i>hjem</i> sounds like “yem”.' }),
              I('hva', 'what', '❓', { tip: '<b>hv</b>: the <b>h</b> is silent. <i>hva</i> sounds like “va”.' }),
              I('hjelp', 'help', '🆘', { tip: 'Silent <b>h</b> again: “yelp”.' })
            ]
          },
          {
            pre: ['The Norwegian r', `<p>The Norwegian <b>r</b> is never the English <i>r</i>. Roll it with the tip of your tongue, or make it at the back of your throat. Both are correct.</p>`],
            items: [
              I('hvit', 'white', '⚪', { tip: 'Silent <b>h</b> in <b>hv</b>: “veet”.' }),
              I('rød', 'red', '🔴', { tip: 'Roll the <b>r</b>. The <b>ø</b> is the “fur” sound, and the final <b>d</b> is silent.' })
            ]
          }
        ]
      }),
      lesson('u2l6', 'Long and short vowels', '↔️', {
        groups: [
          {
            pre: ['A rule that helps with spelling', `
<p>Every vowel can be <b>long</b> or <b>short</b>. A simple rule tells you which:</p>
<div class="rule"><span class="hl">vowel + one consonant</span> → <b>long</b> vowel<br><span class="hl">vowel + two consonants</span> (like a double letter) → <b>short</b> vowel</div>
<p>A double letter is <b>not</b> said twice. It only tells you that the vowel before it is short. Compare:</p>
<p>${W('tak', 'roof')} (long a) &nbsp; ${W('takk', 'thanks')} (short a)</p>
<p>${W('mat', 'food')} (long a) &nbsp; ${W('matt', 'tired, weak')} (short a)</p>`],
            items: [
              I('takk', 'thanks', '🙏', { tip: 'Two k’s: <b>short</b> a.' }),
              I('tak', 'roof', 'tak', { tip: 'One k: <b>long</b> a.' }),
              I('mat', 'food', '🍽️', { tip: 'One t: <b>long</b> a.' }),
              I('matt', 'tired, weak', '😴', { tip: 'Two t’s: <b>short</b> a.' })
            ]
          }
        ],
        extra: () => [
          mc('The vowel before a <b>double consonant</b> is…', ['short', 'long', 'silent', 'stressed'], 'short', 'Double consonant → short vowel. That is why <i>takk</i> has a short <b>a</b>.'),
          mc('Which word has a <b>long</b> vowel?', ['tak', 'takk', 'matt', 'hatt'], 'tak', '<i>tak</i> has one consonant after the vowel, so the <b>a</b> is long.'),
          mc('Which word has a <b>short</b> vowel?', ['matt', 'mat', 'tak', 'hat'], 'matt', '<i>matt</i> has a double <b>t</b>, so the <b>a</b> is short.'),
          note('Where is the stress?', `
<p>In most Norwegian words, you say the <b>first syllable</b> a little louder and longer. A <b>syllable</b> is one “beat” of a word: <i>hus</i> has one, <i>sykkel</i> (bicycle) has two (syk-kel).</p>
<p>Listen: ${W('sykkel', 'bicycle')} ${W('norsk', 'Norwegian')} ${W('vinter', 'winter')}</p>
<p>Say the first part strongly: <b>SYK</b>kel, <b>NORSK</b>, <b>VIN</b>ter.</p>`),
          mc('In most Norwegian words, which syllable is stressed?', ['the first', 'the last', 'the second', 'none'], 'the first', 'Stress usually falls on the first syllable: <b>SYK</b>kel.')
        ]
      })
    ]
  };

  /* ───────── UNIT 3: NUMBERS ───────── */
  const u3 = {
    id: 'u3', title: 'Tall', sub: 'Numbers', blurb: 'Counting from 0 to 20.',
    lessons: [
      lesson('u3l1', 'Count 1 to 5', '1️⃣', {
        groups: [
          { pre: ['Let us count!', `<p>Norwegian numbers look and sound a lot like English ones. Say each number out loud as you hear it.</p>`], items: [NUM('en', 1, 'one'), NUM('to', 2, 'two', '<b>to</b> sounds like “too” (but with the rounded Norwegian <i>o</i>).'), NUM('tre', 3, 'three')] },
          { items: [NUM('fire', 4, 'four'), NUM('fem', 5, 'five')], post: ['Say them in a row', `<p>Count out loud: ${W('en', '1')} ${W('to', '2')} ${W('tre', '3')} ${W('fire', '4')} ${W('fem', '5')}</p>`] }
        ]
      }),
      lesson('u3l2', 'Count 6 to 10, and zero', '🔟', {
        groups: [
          { pre: ['Six to ten', `<p>Watch out for <b>sju</b>. It starts with <b>sj</b>, which you know from the alphabet unit: it sounds like <i>sh</i>. So <i>sju</i> is “shoo”.</p>`], items: [NUM('seks', 6, 'six'), NUM('sju', 7, 'seven', '<b>sj</b> = <i>sh</i>. Also written <i>syv</i>.'), NUM('åtte', 8, 'eight', 'The <b>å</b> sounds like <i>aw</i>. Two t’s, so a short vowel.')] },
          { items: [NUM('ni', 9, 'nine'), NUM('ti', 10, 'ten'), NUM('null', 0, 'zero')] }
        ]
      }),
      lesson('u3l3', 'Count 11 to 15', '⏩', {
        groups: [
          { pre: ['The teens', `<p>Like English, Norwegian has two special numbers, 11 and 12, followed by the “teens”. In English they end in <b>-teen</b>. In Norwegian, they end in <b>-ten</b>.</p>`], items: [NUM('elleve', 11, 'eleven'), NUM('tolv', 12, 'twelve'), NUM('tretten', 13, 'thirteen', '<b>tre</b> (3) + <b>ten</b>.')] },
          { items: [NUM('fjorten', 14, 'fourteen', 'Like <i>fire</i> (4), but changed a little.'), NUM('femten', 15, 'fifteen', '<b>fem</b> (5) + <b>ten</b>.')] }
        ]
      }),
      lesson('u3l4', 'Count 16 to 20', '⏭️', {
        groups: [
          { pre: ['Keep going', `<p>The pattern continues. <b>16 to 19</b> still end in <b>-ten</b> (or very nearly), and then comes twenty.</p>`], items: [NUM('seksten', 16, 'sixteen'), NUM('sytten', 17, 'seventeen'), NUM('atten', 18, 'eighteen', 'Two t’s, so the vowel is short.')] },
          { pre: ['Nineteen and twenty', `<p><b>tjue</b> begins with <b>tj</b>, which sounds like the soft “h” of <i>kino</i>. You can also write it <i>tyve</i>.</p>`], items: [NUM('nitten', 19, 'nineteen'), NUM('tjue', 20, 'twenty', '<b>tj</b> is a soft <i>h</i>: “hyoo-eh”. Also written <i>tyve</i>.')] }
        ]
      }),
      lesson('u3l5', 'Number practice', '🎯', { review: 'num', groups: [] })
    ]
  };

  /* ───────── UNIT 4: GREETINGS ───────── */
  const u4 = {
    id: 'u4', title: 'Hei!', sub: 'Greetings', blurb: 'Saying hello, thanks and your name.',
    lessons: [
      lesson('u4l1', 'Hello and goodbye', '👋', {
        groups: [
          { pre: ['Hello!', `<p>Time for your first real phrases. <b>Hei</b> is the all-purpose word for hello. You can use it with anyone, any time of day.</p>`], items: [I('hei', 'hi, hello', '👋'), I('god morgen', 'good morning', '🌅'), I('god kveld', 'good evening', '🌆')] },
          { items: [I('god natt', 'good night', '🌙'), I('ha det', 'goodbye', '🫶', { tip: 'Literally “have it”. Add <b>bra</b> (good) to say <i>ha det bra</i>.' })] }
        ]
      }),
      lesson('u4l2', 'Thanks and sorry', '🙏', {
        groups: [
          { pre: ['Being polite', `<p>Norwegians say <b>takk</b> (thanks) a lot. You learned it in the alphabet unit with its short vowel.</p>`], items: [I('takk', 'thanks', '🙏'), I('vær så god', 'you’re welcome; here you are', '🎁', { tip: 'Say it when handing something over, or after someone says <i>takk</i>.' }), I('unnskyld', 'sorry; excuse me', '🙇', { tip: 'Pronounced “oon-shyl”. <b>sk</b> before <b>y</b> sounds like <i>sh</i>.' })] },
          { items: [I('ja', 'yes', '✅'), I('nei', 'no', '❌'), I('vær så snill', 'please', '🥺')] }
        ]
      }),
      lesson('u4l3', 'What is your name?', '🪪', {
        groups: [
          {
            pre: ['I and you', `<p>Two tiny but important words: <b>jeg</b> (I) and <b>du</b> (you). They are called <b>pronouns</b>, words that stand in for a person.</p>`],
            items: [I('jeg', 'I', '🙋', { tip: '<b>jeg</b> is said “yai”. The <b>g</b> is silent.' }), I('du', 'you', '👉'), I('heter', 'am called; is called', '🏷️', { tip: 'A <b>verb</b> is an action or state word. <b>heter</b> does not change: <i>jeg heter</i>, <i>du heter</i>.' })]
          },
          {
            pre: ['Your first questions', `<p>You already know <b>hva</b> (what), which is said “va”. So <i>Hva heter du?</i> means “What are you called?”, or “What is your name?”.</p>`],
            items: [I('Hva heter du?', 'What is your name?', '❓'), I('Jeg heter Anna.', 'My name is Anna.', '🙂', { say: 'Jeg heter Anna' }), I('Hyggelig å møte deg.', 'Nice to meet you.', '🤝')],
            post: GR('Questions turn the words around', `<p>In a question, the verb jumps in front of the person word.</p>
<div class="rule" lang="nb"><b>Du heter</b> Anna. → <b>Heter du</b> Anna?</div>
<p>With a question word like <b lang="nb">hva</b> (what) the order is: <b>question word → verb → person</b>.</p>
<div class="rule" lang="nb"><b>Hva</b> · <b>heter</b> · <b>du</b>?</div>
<p>Good news: the verb never changes with the person. It is <b>jeg heter</b> and <b>du heter</b>.</p>`)
          }
        ],
        extra: () => [
          bank('Translate: “What is your name?”', 'Hva heter du?', ['jeg', 'hei'], 'Hva heter du? = “What are you called?”'),
          bank('Translate: “My name is Anna.”', 'Jeg heter Anna.', ['du', 'hva'], 'Jeg heter Anna.'),
          bank('Tap what you hear.', 'Hyggelig å møte deg.', ['heter', 'jeg'], 'Hyggelig å møte deg = “Nice to meet you”.', 'Hyggelig å møte deg')
        ]
      }),
      lesson('u4l4', 'How are you?', '😊', {
        groups: [
          {
            pre: ['A small conversation', `<p>Norwegians use <b>bra</b> (good) for “fine” or “well”. Let us build a tiny conversation.</p>`],
            items: [I('Hvordan har du det?', 'How are you?', '💬'), I('Jeg har det bra.', 'I am fine.', '😊', { say: 'Jeg har det bra' }), I('Og du?', 'And you?', '🔁')]
          },
          { items: [I('Takk, bra!', 'Thanks, good!', '👍'), I('Ha det bra!', 'Goodbye!', '👋')] }
        ],
        extra: () => [
          bank('Translate: “I am fine.”', 'Jeg har det bra.', ['du', 'heter'], '<b>Jeg har det bra</b> literally means “I have it good”.'),
          bank('Translate: “How are you?”', 'Hvordan har du det?', ['jeg', 'heter'], 'Hvordan har du det?'),
          bank('Translate: “And you?”', 'Og du?', ['jeg', 'hei'], 'Og du?')
        ]
      })
    ]
  };

  /* ───────── UNIT 5: FIRST WORDS ───────── */
  const NOUN_INTRO = note('Nouns, and the little word before them', `
<p>A <b>noun</b> (<span lang="nb">substantiv</span>) is a word for a <b>person, animal, place or thing</b>: <i>car</i>, <i>dog</i>, <i>girl</i>, <i>house</i>.</p>
<p>In English, we say <i>a car</i>. In Norwegian, there are three little words for <b>“a”</b>:</p>
<table>
<tr><td>${G('en')}</td><td>${W('en bil', 'a car')}</td></tr>
<tr><td>${G('ei')}</td><td>${W('ei bok', 'a book')}</td></tr>
<tr><td>${G('et')}</td><td>${W('et hus', 'a house')}</td></tr>
</table>
<p>Which one you use depends on the noun. Every noun belongs to one of three groups, called <b>genders</b> (<span lang="nb">kjønn</span>). It has nothing to do with male and female: a car is not “male”.</p>
<div class="tip">Do not try to work the gender out. <b>Always learn the little word together with the noun</b>: <i>en bil</i>, <i>ei bok</i>, <i>et hus</i>.</div>`, '🏷️');

  const u5 = {
    id: 'u5', title: 'Første ord', sub: 'First words', blurb: 'Your first nouns, with en, ei and et.',
    lessons: [
      lesson('u5l1', 'En: cars and pets', '🚗', {
        articles: true,
        groups: [
          { pre: NOUN_INTRO, items: [N('en bil', 'a car', '🚗'), N('en hund', 'a dog', '🐶'), N('en katt', 'a cat', '🐱')] },
          { items: [N('en sykkel', 'a bicycle', '🚲'), N('en fisk', 'a fish', '🐟')] }
        ]
      }),
      lesson('u5l2', 'Et: houses and apples', '🏠', {
        articles: true,
        groups: [
          { pre: ['The word “et”', `<p>Words that use <b>et</b> are called <b>neuter</b>. Many of them are everyday things.</p>`], items: [N('et hus', 'a house', '🏠'), N('et eple', 'an apple', '🍎'), N('et egg', 'an egg', '🥚')] },
          { items: [N('et tre', 'a tree', '🌳'), N('et barn', 'a child', '🧒')] }
        ]
      }),
      lesson('u5l3', 'Ei: books and girls', '📖', {
        articles: true,
        groups: [
          { pre: ['The word “ei”', `<p>Words that use <b>ei</b> are <b>feminine</b>.</p><div class="tip">In standard Bokmål, you may also say <b>en</b> for feminine words. Both <i>ei bok</i> and <i>en bok</i> are correct. We teach <b>ei</b> so you recognise it when you hear it or read it.</div>`], items: [N('ei bok', 'a book', '📖'), N('ei jente', 'a girl', '👧'), N('ei klokke', 'a clock', '🕐')] },
          { items: [N('ei seng', 'a bed', '🛏️'), N('ei uke', 'a week', '🗓️')] }
        ]
      }),
      lesson('u5l4', 'People and things', '🧑', {
        articles: true,
        groups: [
          { pre: ['A mix of all three', `<p>Now the three groups are mixed together. Listen carefully and notice the little word each time.</p>`], items: [N('en mann', 'a man', '👨'), N('ei dame', 'a lady', '👩'), N('en stol', 'a chair', '🪑')] },
          { items: [N('et vindu', 'a window', '🪟'), N('ei jakke', 'a jacket', '🧥')] }
        ]
      }),
      lesson('u5l5', 'Food and drink', '🍞', {
        articles: true,
        groups: [
          { pre: ['At the table', `<p>Time for some food and drink words. Remember to learn each with its little word.</p>`], items: [N('en kaffe', 'a coffee', '☕'), N('et brød', 'a loaf of bread', '🍞'), N('en ost', 'a cheese', '🧀')] },
          { items: [N('et vann', 'a (glass of) water', '💧'), N('en banan', 'a banana', '🍌')] }
        ]
      })
    ]
  };

  /* ───────── UNIT 6: THE, AND MORE THAN ONE ───────── */
  const tfmc = (src, en, opts, a, why) => ({ k: 'mc', big: `<span class="bigword" lang="nb">${src}</span>`, q: `How do you say <b>“${en}”</b>?`, opts, a, why });
  const tfty = (src, en, a, why) => ({ k: 'type', big: `<span class="bigword" lang="nb">${src}</span>`, q: `Write <b>“${en}”</b> in Norwegian.`, a: Array.isArray(a) ? a : [a], why });

  const u6 = {
    id: 'u6', title: 'Bestemt form og flertall', sub: '“The” and “more than one”', blurb: 'Saying “the car” and “the cars”.',
    lessons: [
      lesson('u6l1', '“The”: one thing', '🔎', {
        groups: [
          {
            pre: ['“The” goes at the end', `
<p>In English, you put a word <i>before</i> the noun: <i>the car</i>. Norwegian does something different. It <b>adds a small ending</b> to the noun.</p>
<p>This is called the <b>definite form</b> (<span lang="nb">bestemt form</span>). It means a particular thing that we both know about.</p>
<table>
<tr><th>a …</th><th>the …</th><th>ending</th></tr>
<tr><td>${G('en')} en bil</td><td><b>bilen</b></td><td class="hl">-en</td></tr>
<tr><td>${G('ei')} ei jente</td><td><b>jenta</b></td><td class="hl">-a</td></tr>
<tr><td>${G('et')} et hus</td><td><b>huset</b></td><td class="hl">-et</td></tr>
</table>
<p>This is why the gender matters: it decides the ending.</p>`],
            items: [I('bilen', 'the car', '🚗', { tip: 'en bil → bil<b>en</b>' }), I('huset', 'the house', '🏠', { tip: 'et hus → hus<b>et</b>' }), I('jenta', 'the girl', '👧', { tip: 'ei jente → jent<b>a</b>. (<i>jenten</i> is also correct.)' })]
          },
          { items: [I('hunden', 'the dog', '🐶', { tip: 'en hund → hund<b>en</b>' }), I('eplet', 'the apple', '🍎', { tip: 'et eple → epl<b>et</b>' }), I('boka', 'the book', '📖', { tip: 'ei bok → bok<b>a</b>. (<i>boken</i> is also correct.)' })] }
        ],
        extra: () => [
          tfmc('en katt', 'the cat', ['katten', 'kattet', 'katta'], 'katten', 'en katt → kat<b>ten</b>: <b>en</b>-words add <b>-en</b>.'),
          tfmc('et barn', 'the child', ['barnet', 'barnen', 'barna'], 'barnet', 'et barn → barn<b>et</b>: <b>et</b>-words add <b>-et</b>.'),
          tfty('en fisk', 'the fish', 'fisken', 'en fisk → fisk<b>en</b>.'),
          tfty('et egg', 'the egg', 'egget', 'et egg → egg<b>et</b>.'),
          tfty('ei seng', 'the bed', ['senga', 'sengen'], 'ei seng → seng<b>a</b> (or seng<b>en</b>).')
        ]
      }),
      lesson('u6l2', 'More than one', '👯', {
        groups: [
          {
            pre: ['The plural', `
<p>More than one of something is called the <b>plural</b> (<span lang="nb">flertall</span>). One of something is the <b>singular</b> (<span lang="nb">entall</span>).</p>
<table>
<tr><th>Gender</th><th>Rule</th><th>Example</th></tr>
<tr><td>${G('en')}</td><td>add <span class="hl">-er</span></td><td>en bil → <b>biler</b></td></tr>
<tr><td>${G('ei')}</td><td>add <span class="hl">-er</span></td><td>ei jente → <b>jenter</b></td></tr>
<tr><td>${G('et')}</td><td>add <span class="hl">nothing</span></td><td>et hus → <b>hus</b></td></tr>
</table>
<p>Neuter words that end in <b>-e</b> add <b>-r</b>: <i>et eple → epler</i>.</p>`],
            items: [I('biler', 'cars', '🚗🚗', { tip: 'en bil → bil<b>er</b>' }), I('jenter', 'girls', '👧👧', { tip: 'ei jente → jent<b>er</b>' }), I('hus', 'houses', '🏠🏠', { tip: 'et hus → <b>hus</b>: neuter nouns stay the same.' })]
          },
          {
            pre: ['A few irregular ones', `<p>A few very common words change their vowel in the plural. Just learn these by heart.</p>`],
            items: [I('epler', 'apples', '🍎🍎', { tip: 'et eple → epl<b>er</b>' }), I('bøker', 'books', '📖📖', { tip: 'ei bok → <b>bøker</b>. The <b>o</b> turns into <b>ø</b>.' }), I('menn', 'men', '👨👨', { tip: 'en mann → <b>menn</b>.' })]
          }
        ],
        extra: () => [
          tfmc('en katt', 'cats', ['katter', 'katten', 'kattene'], 'katter', 'en katt → katt<b>er</b>.'),
          tfmc('et barn', 'children', ['barn', 'barner', 'barnet'], 'barn', 'et barn → <b>barn</b>. Neuter words do not change.'),
          tfty('en stol', 'chairs', 'stoler', 'en stol → stol<b>er</b>.'),
          tfty('ei uke', 'weeks', 'uker', 'ei uke → uk<b>er</b>. The word already ends in -e, so only <b>-r</b> is added.')
        ]
      }),
      lesson('u6l3', '“The”: more than one', '🔎', {
        groups: [
          {
            pre: ['The, in the plural', `<p>To say “the cars”, “the girls” or “the houses”, take the <b>plural</b> and add <b class="hl">-ene</b>. It is the same for all three genders. No more thinking!</p>
<div class="rule" lang="nb"><b>en bil</b> → <b>bilen</b> → <b>biler</b> → <b>bilene</b></div>
<p>(a car → the car → cars → the cars)</p>`],
            items: [I('bilene', 'the cars', '🚗🚗', { tip: 'biler + <b>ene</b>' }), I('jentene', 'the girls', '👧👧', { tip: 'jenter + <b>ene</b>' }), I('husene', 'the houses', '🏠🏠', { tip: 'hus + <b>ene</b>' })]
          },
          { items: [I('eplene', 'the apples', '🍎🍎', { tip: 'epler + <b>ene</b>' }), I('bøkene', 'the books', '📖📖', { tip: 'bøker + <b>ene</b>' }), I('hundene', 'the dogs', '🐶🐶', { tip: 'hunder + <b>ene</b>' })] }
        ],
        extra: () => [
          mc('Which row shows all four forms of <b>en stol</b> (a chair)?', ['en stol – stolen – stoler – stolene', 'en stol – stolet – stol – stolene', 'en stol – stola – stoler – stolen', 'en stol – stolen – stol – stolet'], 'en stol – stolen – stoler – stolene', 'a chair, the chair, chairs, the chairs.'),
          tfty('biler', 'the cars', 'bilene', 'biler + <b>ene</b> = bilene.'),
          tfty('katter', 'the cats', 'kattene', 'katter + <b>ene</b> = kattene.')
        ]
      })
    ]
  };


  /* ───────── extra lessons ───────── */
  u4.blurb = 'Politeness first: greetings, thanks and your name.';
  u4.lessons.push(lesson('u4l5', 'Mastery: meet someone', '🎯', {
    groups: [],
    build: () => [
      note('Put it all together', '<p>Now you will <b>use</b> what you know in a real conversation. Pick what you would say, and say it out loud.</p>', '🎯'),
      dlg(['Hei!'], ['Hei!', 'Takk', 'God natt'], 'Hei!', 'Greet back with <b>Hei!</b>'),
      dlg(['Hva heter du?'], ['Jeg heter Anna.', 'Jeg har det bra.', 'Ha det bra!'], 'Jeg heter Anna.', '<b>Hva heter du?</b> asks for your name.'),
      dlg(['Hyggelig å møte deg.'], ['Hyggelig å møte deg.', 'Vær så god.', 'God natt.'], 'Hyggelig å møte deg.', 'You can answer with the same phrase.'),
      dlg(['Hvordan har du det?'], ['Takk, bra! Og du?', 'Jeg heter Anna.', 'Vær så snill.'], 'Takk, bra! Og du?', '<b>Takk, bra! Og du?</b> means “Thanks, good! And you?”'),
      dlg(['Takk!'], ['Vær så god!', 'Unnskyld.', 'God morgen.'], 'Vær så god!', '<b>Vær så god</b> is the reply to <b>takk</b>.'),
      dlg(['Ha det bra!'], ['Ha det bra!', 'Hva heter du?', 'Jeg heter Anna.'], 'Ha det bra!', 'Say goodbye back.'),
      bank('Build: “Hi! My name is Anna.”', 'Hei! Jeg heter Anna.', ['du', 'takk'], 'Hei! Jeg heter Anna.', 'Hei! Jeg heter Anna'),
      bank('Build: “Thanks, I am fine.”', 'Takk, jeg har det bra.', ['heter', 'hei'], '<b>Takk, jeg har det bra.</b>', 'Takk, jeg har det bra')
    ]
  }));

  u5.lessons.push(
    lesson('u5l6', 'This is a …', '👉', {
      groups: [
        {
          pre: GR('“Er” means “is”', `<p>Now we build <b>whole sentences</b> with the nouns you know. The key word is <b lang="nb">er</b>, which means <b>is</b> (and also <b>am</b> and <b>are</b>). It never changes.</p>
<div class="rule" lang="nb">jeg <b>er</b> · du <b>er</b> · det <b>er</b></div>
<p><b lang="nb">Dette</b> means “this”. <b lang="nb">Det</b> means “it” or “that”.</p>`),
          items: [I('Dette er en bil.', 'This is a car.', '🚗'), I('Dette er et hus.', 'This is a house.', '🏠'), I('Dette er ei bok.', 'This is a book.', '📖')]
        },
        { items: [I('Hva er dette?', 'What is this?', '❓'), I('Det er en katt.', 'It is a cat.', '🐱')] }
      ],
      extra: () => [
        bank('Build: “This is a house.”', 'Dette er et hus.', ['en', 'ei'], 'house = <b>et</b> hus.'),
        bank('Build: “What is this?”', 'Hva er dette?', ['det', 'heter'], 'Hva er dette?')
      ]
    }),
    lesson('u5l7', 'Is it a …?', '🤔', {
      groups: [
        {
          pre: GR('The same trick again', `<p>You already know that a question turns the words around: <i>Du heter → Heter du?</i> It works for <b>er</b> too.</p>
<div class="rule" lang="nb">Det <b>er</b> en hund. → <b>Er</b> det en hund?</div>
<p>Answer with <b lang="nb">ja</b> (yes) or <b lang="nb">nei</b> (no), then a full sentence.</p>`),
          items: [I('Er det en hund?', 'Is it a dog?', '🐶'), I('Ja, det er en hund.', 'Yes, it is a dog.', '✅'), I('Nei, det er en katt.', 'No, it is a cat.', '❌')]
        }
      ],
      extra: () => [
        bank('Build: “Is it a cat?”', 'Er det en katt?', ['dette', 'hva'], '<b>Er det …?</b> turns the sentence into a question.'),
        mc('Which little word fits? <b lang="nb">Er det ___ bok?</b> (book)', ['ei', 'en', 'et'], 'ei', '<b>ei bok</b>. (<i>en bok</i> is also correct in Bokmål.)'),
        bank('Build: “No, it is a house.”', 'Nei, det er et hus.', ['en', 'ei'], 'house = <b>et</b> hus.')
      ]
    })
  );

  u6.lessons.push(lesson('u6l4', 'Mastery: the and plural', '🎯', {
    groups: [], review: true,
    note: '<p>A mix of <b>the</b> and <b>more than one</b>. Remember: <b>en → -en</b>, <b>et → -et</b>, <b>ei → -a</b>, plural <b>-er</b>, and “the” plural <b>-ene</b>. Say each answer out loud.</p>'
  }));

  /* ───────── UNIT 7: MY AND YOUR ───────── */
  const flip = (src, en, a, why) => ({ k: 'type', big: `<span class="bigword" lang="nb">${src}</span>`, q: `Say <b>“${en}”</b> the other way round.`, a: Array.isArray(a) ? a : [a], why });
  const u7 = {
    id: 'u7', title: 'Min og din', sub: '“My” and “your”', blurb: 'Saying my cat and your dog, two ways.',
    lessons: [
      lesson('u7l1', 'My: min, mi, mitt', '🙋', {
        groups: [
          {
            pre: GR('“My” depends on the noun', `<p>To say <b>my</b>, Norwegian picks one of three little words. It depends on whether the noun is an <b>en</b>, <b>ei</b> or <b>et</b> word. You met these three groups already.</p>
<table>
<tr><td>${G('en')} en bil</td><td><b>min</b> bil</td><td>my car</td></tr>
<tr><td>${G('ei')} ei bok</td><td><b>mi</b> bok</td><td>my book</td></tr>
<tr><td>${G('et')} et hus</td><td><b>mitt</b> hus</td><td>my house</td></tr>
</table>
<div class="tip">In Bokmål you can also say <i>min bok</i>. We teach <b>mi</b> so you recognise it.</div>`),
            items: [I('min bil', 'my car', '🚗'), I('min hund', 'my dog', '🐶'), I('mi bok', 'my book', '📖')]
          },
          { items: [I('mitt hus', 'my house', '🏠'), I('mitt eple', 'my apple', '🍎')] }
        ],
        extra: () => [
          mc('Which word fits? <b lang="nb">___ katt</b> (my cat)', ['min', 'mi', 'mitt'], 'min', 'en katt → <b>min</b> katt.'),
          mc('Which word fits? <b lang="nb">___ barn</b> (my child)', ['mitt', 'min', 'mi'], 'mitt', 'et barn → <b>mitt</b> barn.')
        ]
      }),
      lesson('u7l2', 'Your: din, di, ditt', '👉', {
        groups: [
          {
            pre: GR('“Your” works the same way', `<p><b>din / di / ditt</b> means <b>your</b>, and follows exactly the same pattern as min / mi / mitt.</p>
<table>
<tr><td>${G('en')}</td><td><b>min</b> bil</td><td><b>din</b> bil</td></tr>
<tr><td>${G('ei')}</td><td><b>mi</b> bok</td><td><b>di</b> bok</td></tr>
<tr><td>${G('et')}</td><td><b>mitt</b> hus</td><td><b>ditt</b> hus</td></tr>
</table>`),
            items: [I('din katt', 'your cat', '🐱'), I('di klokke', 'your clock', '🕐'), I('ditt hus', 'your house', '🏠')]
          },
          { items: [I('din bil', 'your car', '🚗'), I('ditt barn', 'your child', '🧒')] }
        ],
        extra: () => [
          mc('Which word fits? <b lang="nb">___ hund</b> (your dog)', ['din', 'di', 'ditt'], 'din', 'en hund → <b>din</b> hund.'),
          mc('Which word fits? <b lang="nb">___ eple</b> (your apple)', ['ditt', 'din', 'di'], 'ditt', 'et eple → <b>ditt</b> eple.')
        ]
      }),
      lesson('u7l3', 'Katten min', '🐱', {
        groups: [
          {
            pre: GR('Two ways to say “my cat”', `<p>You can put “my” <b>before</b> the noun, like English. Or you can put it <b>after</b> the noun. In that case, the noun gets its <b>“the” ending</b> from Unit 5.</p>
<table>
<tr><th>before</th><th>after</th></tr>
<tr><td><b>min</b> katt</td><td>katt<b>en</b> <b>min</b></td></tr>
<tr><td><b>mi</b> bok</td><td>bok<b>a</b> <b>mi</b></td></tr>
<tr><td><b>mitt</b> hus</td><td>hus<b>et</b> <b>mitt</b></td></tr>
</table>
<div class="rule">noun + <b>the ending</b> + <b>min / mi / mitt</b></div>
<p>So <b lang="nb">katten min</b> literally means “the cat my”, but it just means “my cat”.</p>`),
            items: [I('katten min', 'my cat', '🐱', { tip: 'en katt → katt<b>en</b> + <b>min</b>' }), I('hunden din', 'your dog', '🐶', { tip: 'en hund → hund<b>en</b> + <b>din</b>' }), I('boka mi', 'my book', '📖', { tip: 'ei bok → bok<b>a</b> + <b>mi</b>' })]
          },
          {
            pre: GR('Which one should I use?', `<p><b lang="nb">katten min</b> is the <b>everyday</b> way. It is what you will hear most, especially for family, pets and things you own.</p>
<p><b lang="nb">min katt</b> is used when you want to stress it: “<i>MY</i> cat, not yours.” It is also common in more formal writing.</p>
<div class="tip">Not sure? Use the <b>“after”</b> form: <i>katten min</i>.</div>
<div class="tip bad">Never use both: <s>min katten</s> is wrong. Either <b>min katt</b> or <b>katten min</b>.</div>`),
            items: [I('huset ditt', 'your house', '🏠', { tip: 'et hus → hus<b>et</b> + <b>ditt</b>' }), I('bilen min', 'my car', '🚗', { tip: 'en bil → bil<b>en</b> + <b>min</b>' })]
          }
        ],
        extra: () => [
          mc('Which one is <b>NOT</b> correct?', ['min katten', 'katten min', 'min katt', 'hunden din'], 'min katten', 'You use <b>either</b> <i>min katt</i> <b>or</b> <i>katten min</i>, never both.'),
          flip('min bil', 'my car', 'bilen min', 'bil<b>en</b> + <b>min</b>.'),
          flip('ditt hus', 'your house', 'huset ditt', 'hus<b>et</b> + <b>ditt</b>.'),
          flip('mi bok', 'my book', ['boka mi', 'boken mi'], 'bok<b>a</b> + <b>mi</b>. (<i>boken mi</i> is also correct.)')
        ]
      }),
      lesson('u7l4', 'Dette er katten min', '💬', {
        groups: [
          {
            pre: GR('Now use it in sentences', `<p>Look how the pieces you know fit together:</p>
<div class="rule" lang="nb">Dette <b>er</b> <b>katten min</b>.</div>
<div class="rule" lang="nb"><b>Er</b> det <b>boka di</b>?</div>
<p>And with <b lang="nb">heter</b> you can ask for the name of a pet: <b lang="nb">Hva heter hunden din?</b></p>`),
            items: [I('Dette er katten min.', 'This is my cat.', '🐱'), I('Er det boka di?', 'Is that your book?', '📖'), I('Ja, det er boka mi.', 'Yes, it is my book.', '✅')]
          },
          { items: [I('Hva heter hunden din?', 'What is your dog called?', '🐶'), I('Hunden min heter Pelle.', 'My dog is called Pelle.', '🐕')] }
        ],
        extra: () => [
          bank('Build: “This is my dog.”', 'Dette er hunden min.', ['min', 'mi'], 'Dette er <b>hunden min</b>.'),
          bank('Build: “Is it your house?”', 'Er det huset ditt?', ['hus', 'din'], 'Er det <b>huset ditt</b>?')
        ]
      }),
      lesson('u7l5', 'Mastery: mine and yours', '🎯', {
        groups: [],
        build: () => [
          note('Show what you can do', '<p>A conversation about things that belong to you. Choose the best reply.</p>', '🎯'),
          dlg(['Hva er dette?'], ['Det er katten min.', 'Hei!', 'Jeg heter Anna.'], 'Det er katten min.', 'Use <b>det er …</b> to answer.'),
          dlg(['Er det boka di?'], ['Ja, det er boka mi.', 'Takk, bra!', 'Ha det bra!'], 'Ja, det er boka mi.', '<b>boka di</b> → <b>boka mi</b>.'),
          dlg(['Hva heter hunden din?'], ['Hunden min heter Pelle.', 'Jeg har det bra.', 'God natt.'], 'Hunden min heter Pelle.', 'Answer with <b>heter</b>.'),
          dlg(['Er det huset ditt?'], ['Ja, det er huset mitt.', 'Vær så god.', 'God natt.'], 'Ja, det er huset mitt.', '<b>huset ditt</b> → <b>huset mitt</b>.'),
          bank('Build: “My cat is called Luna.”', 'Katten min heter Luna.', ['min', 'er'], 'Katten min heter Luna.'),
          mc('Which of these means <b>“your book”</b>?', ['boka di', 'boka mi', 'di bok mi'], 'boka di', 'bok<b>a</b> + <b>di</b>.')
        ]
      })
    ]
  };

  /* ───────── UNIT 8: SENTENCES ───────── */
  const u8 = {
    id: 'u8', title: 'Si noe om deg selv', sub: 'Talk about yourself', blurb: 'Where you are from, what you speak, have and like.',
    lessons: [
      lesson('u8l1', 'Where are you from?', '🌍', {
        groups: [
          {
            pre: GR('Asking “where”', `<p><b lang="nb">Hvor</b> means <b>where</b>. You already know the pattern: question word → verb → person.</p>
<div class="rule" lang="nb"><b>Hvor</b> · <b>er</b> · <b>du</b> fra?</div>
<p><b lang="nb">fra</b> means “from”. To answer, put your country after <b lang="nb">Jeg er fra</b>.</p>
<div class="tip">Most country names look like the English ones. Ask your teacher for the Norwegian name of your country and use it in place of <i>Polen</i>.</div>`),
            items: [I('Hvor er du fra?', 'Where are you from?', '🌍'), I('Jeg er fra Norge.', 'I am from Norway.', '🏔️'), I('Jeg er fra Polen.', 'I am from Poland.', '🌍')]
          },
          { items: [I('Jeg er fra England.', 'I am from England.', '🌍'), I('Er du fra Norge?', 'Are you from Norway?', '🤔')] }
        ],
        extra: () => [
          bank('Build: “Where are you from?”', 'Hvor er du fra?', ['heter', 'hva'], 'Hvor er du fra?'),
          bank('Build: “I am from Poland.”', 'Jeg er fra Polen.', ['du', 'har'], 'Jeg er fra Polen.')
        ]
      }),
      lesson('u8l2', 'I speak …', '🗣️', {
        groups: [
          {
            pre: GR('Verbs ending in -er', `<p>A <b>verb</b> is a word for an action: <i>speak</i>, <i>like</i>, <i>live</i>. Most Norwegian verbs end in <b>-er</b> in the present tense, and <b>they are the same for every person</b>.</p>
<div class="rule" lang="nb">jeg snakk<b>er</b> · du snakk<b>er</b> · hun snakk<b>er</b></div>
<p>Compare this to English: <i>I speak</i>, but <i>she speak<b>s</b></i>. Norwegian is easier!</p>`),
            items: [I('Jeg snakker norsk.', 'I speak Norwegian.', '🗣️'), I('Jeg snakker engelsk.', 'I speak English.', '💬'), I('Snakker du norsk?', 'Do you speak Norwegian?', '❓')]
          },
          {
            pre: GR('“A little”', `<p><b lang="nb">litt</b> means “a little”. It goes right before the language: <b lang="nb">Jeg snakker litt norsk.</b></p>`),
            items: [I('Jeg snakker litt norsk.', 'I speak a little Norwegian.', '🤏'), I('Ja, jeg snakker litt norsk.', 'Yes, I speak a little Norwegian.', '✅')]
          }
        ],
        extra: () => [
          bank('Build: “Do you speak English?”', 'Snakker du engelsk?', ['jeg', 'er'], 'The verb comes first in the question.'),
          bank('Build: “I speak a little Norwegian.”', 'Jeg snakker litt norsk.', ['du', 'engelsk'], 'Jeg snakker litt norsk.')
        ]
      }),
      lesson('u8l3', 'I have …', '🎒', {
        groups: [
          {
            pre: GR('“Har” and “ikke”', `<p><b lang="nb">har</b> means <b>have</b> (<i>jeg har, du har</i>). It never changes. Questions turn it around, as you know: <b lang="nb">Har du …?</b></p>
<p><b lang="nb">ikke</b> means <b>not</b>. It goes <b>right after the verb</b>:</p>
<div class="rule" lang="nb">Jeg har <b>ikke</b> katt.</div>
<div class="tip">When you say you do <b>not</b> have something, Norwegians usually drop <i>en / ei / et</i>: <i>Jeg har ikke katt.</i></div>`),
            items: [I('Jeg har en hund.', 'I have a dog.', '🐶'), I('Har du en katt?', 'Do you have a cat?', '🐱'), I('Nei, jeg har ikke katt.', 'No, I do not have a cat.', '❌')]
          }
        ],
        extra: () => [
          bank('Build: “Do you have a dog?”', 'Har du en hund?', ['er', 'jeg'], 'Har du en hund?'),
          bank('Build: “I do not have a dog.”', 'Jeg har ikke hund.', ['en', 'du'], '<b>ikke</b> comes right after the verb, and <i>en</i> is dropped.'),
          mc('Where does <b>ikke</b> go?', ['Jeg har ikke katt.', 'Jeg ikke har katt.', 'Ikke jeg har katt.'], 'Jeg har ikke katt.', '<b>ikke</b> comes right after the verb.')
        ]
      }),
      lesson('u8l4', 'I like …', '❤️', {
        groups: [
          {
            pre: ['What do you like?', `<p>Another verb in <b>-er</b>: <b lang="nb">liker</b> means “like”. It follows the same patterns you have met: the question flips, and <b>ikke</b> goes after the verb.</p>`],
            items: [I('Jeg liker kaffe.', 'I like coffee.', '☕'), I('Liker du fisk?', 'Do you like fish?', '🐟'), I('Ja, jeg liker fisk.', 'Yes, I like fish.', '✅')]
          },
          { items: [I('Jeg liker ikke fisk.', 'I do not like fish.', '🚫'), I('Jeg liker musikk.', 'I like music.', '🎵')] }
        ],
        extra: () => [
          bank('Build: “Do you like coffee?”', 'Liker du kaffe?', ['jeg', 'er'], 'Liker du kaffe?'),
          bank('Build: “I do not like fish.”', 'Jeg liker ikke fisk.', ['du', 'har'], '<b>ikke</b> comes after the verb.')
        ]
      }),
      lesson('u8l5', 'Mastery: a first chat', '🎯', {
        groups: [],
        build: () => [
          note('Your first real conversation', '<p>Everything comes together here: greeting, name, where you are from, languages, likes. Choose what you would say.</p>', '🎯'),
          dlg(['Hei! Hva heter du?'], ['Hei! Jeg heter Anna.', 'Takk, bra!', 'Ha det bra!'], 'Hei! Jeg heter Anna.', 'Greet and give your name.'),
          dlg(['Hvor er du fra?'], ['Jeg er fra Polen.', 'Jeg heter Polen.', 'Jeg har en hund.'], 'Jeg er fra Polen.', '<b>Jeg er fra …</b>'),
          dlg(['Snakker du norsk?'], ['Ja, jeg snakker litt norsk.', 'Nei, jeg heter norsk.', 'Vær så god.'], 'Ja, jeg snakker litt norsk.', '<b>Jeg snakker litt norsk.</b>'),
          dlg(['Har du en hund?'], ['Ja, jeg har en hund.', 'Jeg er fra hund.', 'God natt.'], 'Ja, jeg har en hund.', '<b>Ja, jeg har …</b>'),
          dlg(['Liker du kaffe?'], ['Ja, jeg liker kaffe.', 'Dette er katten min.', 'Hva er dette?'], 'Ja, jeg liker kaffe.', '<b>Jeg liker …</b>'),
          bank('Build: “I am from Poland and I speak a little Norwegian.”', 'Jeg er fra Polen, og jeg snakker litt norsk.', ['heter', 'du'], 'Two sentences joined with <b>og</b> (and).'),
          bank('Build: “My dog is called Pelle.”', 'Hunden min heter Pelle.', ['du', 'er'], 'Hunden min heter Pelle.')
        ]
      })
    ]
  };

  window.UNITS = [u1, u2, u4, u3, u5, u6, u7, u8];
})();
