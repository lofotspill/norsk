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
  const note = (title, html, icon) => ({ k: 'note', title, html, icon });
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
            items: [I('Hva heter du?', 'What is your name?', '❓'), I('Jeg heter Anna.', 'My name is Anna.', '🙂', { say: 'Jeg heter Anna' }), I('Hyggelig å møte deg.', 'Nice to meet you.', '🤝')]
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

  window.UNITS = [u1, u2, u3, u4, u5, u6];
})();
