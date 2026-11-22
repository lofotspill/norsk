/* Course content for "Norsk på 1·2·3".
   Every grammar term is explained the first time it appears. */

const say = (w) => `<button class="say" data-say="${w}" aria-label="Listen: ${w}" title="Listen">🔊</button>`;
const W = (no, en) => `<span class="w"><b lang="nb">${no}</b>${say(no)}${en ? `<span class="en">${en}</span>` : ''}</span>`;
const G = (g) => `<span class="g g-${g}">${g}</span>`;
const TERM = (term, no, def) => `<div class="term"><b>${term}</b>${no ? ` <span lang="nb">(${no})</span>` : ''} — ${def}</div>`;
const TIP = (html) => `<div class="tip">${html}</div>`;

/* question builders */
const mc = (q, opts, a, why) => ({ t: 'mc', q, opts, a, why });
const ls = (word, q, opts, a, why) => ({ t: 'mc', say: word, q, opts, a, why });
const ty = (q, a, why, say) => ({ t: 'type', q, a: Array.isArray(a) ? a : [a], why, say });
const mt = (q, pairs, why) => ({ t: 'match', q, pairs, why });

window.MODULES = [

/* ───────────────────────── MODULE 1 ───────────────────────── */
{
  id: 1,
  title: 'Letters and sounds',
  blurb: 'The alphabet, vowels, tricky consonants, and how long and short sounds work.',
  lessons: [
    {
      title: 'The Norwegian alphabet',
      html: `
<h2>The Norwegian alphabet</h2>
<p>Norwegian is written with the same Latin letters as English, plus <b>three extra letters</b> at the very end of the alphabet. In total there are <b>29 letters</b>.</p>
<div class="rule" lang="nb"><b>a b c d e f g h i j k l m n o p q r s t u v w x y z æ ø å</b></div>
<p>The letters <b>c, q, w, x</b> and <b>z</b> are only used in words borrowed from other languages. You will hardly meet them.</p>
${TERM('Letter', 'bokstav', 'a written symbol, like <b>a</b> or <b>ø</b>.')}
${TERM('Sound', 'lyd', 'what you hear when you say the letter or word out loud.')}
<p>In English, the same letters can be pronounced in many different ways (think of <i>though</i>, <i>through</i> and <i>tough</i>). Norwegian is much more regular. Once you learn the rules in this module, you can read almost any Norwegian word out loud.</p>
${TERM('Vowel', 'vokal', 'a sound made with open, free airflow. The vowel letters are <b>a e i o u y æ ø å</b>. Every syllable needs at least one vowel.')}
${TERM('Consonant', 'konsonant', 'a sound made by blocking or narrowing the airflow with your lips, tongue or throat, like <b>b</b>, <b>k</b>, <b>s</b> or <b>t</b>. All the other letters are consonants.')}
<p>Tap the speaker buttons to hear words. If you cannot hear anything, see the note on the front page about Norwegian voices.</p>
<p>Try: ${W('å', 'the last letter')} ${W('snø', 'snow')} ${W('vinter', 'winter')}</p>`
    },
    {
      title: 'The nine vowels',
      html: `
<h2>The nine vowels</h2>
<p>Norwegian has nine vowel letters. Each one can be <b>long</b> (held a bit longer) or <b>short</b>. The "sounds like" column gives the closest English sound. Listen to every example.</p>
<table>
<tr><th>Letter</th><th>Sounds like</th><th>Examples</th></tr>
<tr><td class="big">a</td><td><i>a</i> in <i>father</i></td><td>${W('dag', 'day')}${W('takk', 'thanks')}</td></tr>
<tr><td class="big">e</td><td>long: <i>ay</i> in <i>say</i>, but held steady with no glide.<br>short: <i>e</i> in <i>bed</i></td><td>${W('se', 'see')}${W('seng', 'bed')}</td></tr>
<tr><td class="big">i</td><td>long: <i>ee</i> in <i>see</i><br>short: <i>i</i> in <i>sit</i></td><td>${W('vi', 'we')}${W('vinter', 'winter')}</td></tr>
<tr><td class="big">o</td><td>usually <i>oo</i> in <i>moon</i><br>sometimes short, like <i>o</i> in <i>off</i></td><td>${W('bok', 'book')}${W('sko', 'shoe')}${W('komme', 'come')}</td></tr>
<tr><td class="big">u</td><td>no English match. Round your lips as for <i>oo</i>, then try to say <i>ee</i>.</td><td>${W('hus', 'house')}${W('du', 'you')}</td></tr>
<tr><td class="big">y</td><td>round your lips and say <i>ee</i>. Like German <i>ü</i> or French <i>u</i>.</td><td>${W('by', 'city')}${W('ny', 'new')}</td></tr>
<tr><td class="big">æ</td><td><i>a</i> in <i>cat</i> (stretched when long)</td><td>${W('vær', 'weather')}${W('lære', 'to learn')}</td></tr>
<tr><td class="big">ø</td><td><i>ur</i> in British <i>fur</i>, without the r</td><td>${W('snø', 'snow')}${W('brød', 'bread')}</td></tr>
<tr><td class="big">å</td><td><i>aw</i> in <i>saw</i></td><td>${W('gå', 'to walk')}${W('båt', 'boat')}</td></tr>
</table>
${TIP('<b>u and y</b> are the hardest vowels for English speakers. Both use rounded lips. For <b>y</b>, say <i>ee</i> and then round your lips without moving your tongue. Practise <span lang="nb">du – by – hus – ny</span> slowly.')}`
    },
    {
      title: 'Consonants that behave differently',
      html: `
<h2>Consonants that behave differently</h2>
<p>Most consonants sound like they do in English. These are the ones that do not.</p>
<table>
<tr><th>Spelling</th><th>Sounds like</th><th>Examples</th></tr>
<tr><td class="big">j</td><td><i>y</i> in <i>yes</i></td><td>${W('ja', 'yes')}${W('jente', 'girl')}</td></tr>
<tr><td class="big">kj</td><td>a soft <i>h</i>, like <i>h</i> in <i>huge</i>. The letter <b>k</b> also sounds like this before <b>i</b> and <b>y</b>.</td><td>${W('kjøre', 'to drive')}${W('kino', 'cinema')}</td></tr>
<tr><td class="big">sj</td><td><i>sh</i> in <i>ship</i>. Also written <b>skj</b>, and <b>sk</b> before <b>i</b> or <b>y</b>.</td><td>${W('sjø', 'sea')}${W('skje', 'spoon')}${W('ski', 'ski')}</td></tr>
<tr><td class="big">hj</td><td>the <b>h</b> is silent, so it sounds like <i>y</i></td><td>${W('hjem', 'home')}${W('hjelp', 'help')}</td></tr>
<tr><td class="big">gj</td><td>the <b>g</b> is silent, so it sounds like <i>y</i></td><td>${W('gjøre', 'to do')}</td></tr>
<tr><td class="big">hv</td><td>the <b>h</b> is silent, so it sounds like <i>v</i></td><td>${W('hva', 'what')}${W('hvit', 'white')}</td></tr>
<tr><td class="big">ng</td><td><i>ng</i> in <i>sing</i>, with no hard <i>g</i> after it</td><td>${W('lang', 'long')}${W('seng', 'bed')}</td></tr>
<tr><td class="big">r</td><td>never the English <i>r</i>. Roll it with the tip of your tongue, or make it at the back of your throat. Both are correct.</td><td>${W('rød', 'red')}${W('rom', 'room')}</td></tr>
</table>
<p class="tip">A letter that is <b>written but not pronounced</b> is called a <b>silent letter</b> (<span lang="nb">stum bokstav</span>). Silent letters are common in <b>hj-, gj-</b> and <b>hv-</b> words.</p>`
    },
    {
      title: 'Long and short vowels, and stress',
      html: `
<h2>Long and short vowels</h2>
<p>This is the most useful sound rule in Norwegian, and it also helps with spelling.</p>
<div class="rule"><span class="hl">vowel + one consonant</span> → the vowel is <b>long</b><br><span class="hl">vowel + two consonants</span> (for example a double letter) → the vowel is <b>short</b></div>
<p>Compare these pairs. They differ only in vowel length, and they mean different things.</p>
<table>
<tr><th>Long vowel</th><th>Short vowel</th></tr>
<tr><td>${W('tak', 'roof')}</td><td>${W('takk', 'thanks')}</td></tr>
<tr><td>${W('mat', 'food')}</td><td>${W('matt', 'tired, weak')}</td></tr>
<tr><td>${W('hat', 'hate')}</td><td>${W('hatt', 'hat')}</td></tr>
</table>
<p>A double consonant is <b>not</b> pronounced twice. It is one consonant sound, and it tells you the vowel before it is short.</p>
<h2>Stress</h2>
${TERM('Syllable', 'staving', 'one "beat" in a word. <i>hus</i> has one syllable, <i>sykkel</i> (bicycle) has two (syk-kel), and <i>sjokolade</i> (chocolate) has four (sjo-ko-la-de).')}
${TERM('Stress', 'trykk', 'the syllable you say a little louder and longer.')}
<p>In most Norwegian words, the stress is on the <b>first syllable</b>: <b>SYK</b>kel, <b>NOR</b>sk, <b>VIN</b>ter, <b>SNØ</b>mann. Words borrowed from other languages sometimes have stress elsewhere, like <b>ba<u>NAN</u></b>.</p>
<p>Listen: ${W('sykkel', 'bicycle')} ${W('norsk', 'Norwegian')} ${W('snømann', 'snowman')}</p>
${TIP('Norwegian also has two <b>word tones</b> (a kind of melody in the word). Do not worry about them yet. Getting vowels, consonants and stress right will already make you easy to understand.')}`
    },
    {
      title: 'Word list: module 1',
      html: `
<h2>Word list</h2>
<p>These are all the words from this module. Say each one out loud after you hear it.</p>
<p>${[
  ['hus', 'house'], ['by', 'city'], ['ny', 'new'], ['snø', 'snow'], ['brød', 'bread'], ['gå', 'to walk'],
  ['båt', 'boat'], ['bok', 'book'], ['sko', 'shoe'], ['jente', 'girl'], ['kino', 'cinema'], ['kjøre', 'to drive'],
  ['sjø', 'sea'], ['ski', 'ski'], ['hjem', 'home'], ['hva', 'what'], ['lang', 'long'], ['tak', 'roof'],
  ['takk', 'thanks'], ['vinter', 'winter'], ['sykkel', 'bicycle']
].map(([a, b]) => W(a, b)).join('')}</p>
<p>When you are ready, start the practice test. You need <b>80%</b> to unlock the next module.</p>`
    }
  ],
  practice: [
    mc('How many letters are there in the Norwegian alphabet?', ['26', '27', '29', '31'], '29', 'There are 29: the 26 English letters plus <b>æ, ø</b> and <b>å</b>.'),
    mc('Which three letters come at the end of the Norwegian alphabet?', ['æ, ø, å', 'ä, ö, å', 'á, é, í', 'ç, ñ, ü'], 'æ, ø, å', 'The Norwegian alphabet ends with <b>æ, ø, å</b>.'),
    mc('What is a <b>vowel</b>?', ['A sound made with open, free airflow', 'A sound made by blocking the airflow completely', 'A letter that is never pronounced', 'The first letter of a word'], 'A sound made with open, free airflow', 'Vowels are made with open airflow: a, e, i, o, u, y, æ, ø, å.'),
    mc('Which of these is a <b>consonant</b>?', ['k', 'æ', 'y', 'o'], 'k', 'The nine vowels are a e i o u y æ ø å. Everything else, including <b>k</b>, is a consonant.'),
    ls('hus', 'Listen. Which word do you hear?', ['hus', 'hos', 'hys', 'his'], 'hus', 'It was <b>hus</b> (house), with the rounded <b>u</b> sound.'),
    mc('Which word starts with the English <i>sh</i> sound?', ['ski', 'kino', 'bil', 'ja'], 'ski', '<b>sk</b> before <b>i</b> or <b>y</b> sounds like <i>sh</i>. So <i>ski</i> sounds like "shee".'),
    mc('Which spelling has a silent <b>h</b>?', ['hjem', 'hus', 'hund', 'hage'], 'hjem', 'In <b>hj-</b> the <b>h</b> is silent: <i>hjem</i> sounds like "yem".'),
    mc('The Norwegian <b>j</b> in <i>ja</i> sounds like which English letter?', ['y (as in yes)', 'j (as in jam)', 'h (as in hot)', 'g (as in go)'], 'y (as in yes)', '<b>ja</b> is pronounced "ya".'),
    mt('Match each Norwegian vowel to the English word it sounds like.', [['å', 'saw'], ['ø', 'fur'], ['æ', 'cat'], ['i', 'see']], '<b>å</b> = saw, <b>ø</b> = fur (without the r), <b>æ</b> = cat, <b>i</b> = see.'),
    mc('Is the vowel in <i>takk</i> (thanks) long or short?', ['Short, because k is doubled', 'Long, because k is doubled', 'Long, because there are two syllables', 'Silent'], 'Short, because k is doubled', 'Vowel + two consonants → short vowel. Compare <i>tak</i> (roof), which has a long vowel.'),
    mc('Which word means <b>thanks</b>?', ['takk', 'tak', 'tack', 'taak'], 'takk', '<b>takk</b> = thanks (short a). <b>tak</b> = roof (long a).'),
    mc('Where is the stress usually placed in Norwegian words?', ['On the first syllable', 'On the last syllable', 'On the second syllable', 'Always on a vowel'], 'On the first syllable', 'Stress is usually on the first syllable: <b>SYK</b>kel, <b>VIN</b>ter.'),
    ty('Listen to the word and type it. Use the buttons below if you do not have æ, ø or å on your keyboard.', 'snø', 'The word was <b>snø</b> (snow).', 'snø'),
    ls('kino', 'Listen. What does this word mean?', ['cinema', 'kitchen', 'child', 'chin'], 'cinema', '<b>kino</b> = cinema. The <b>k</b> before <b>i</b> sounds like a soft <i>h</i> ("hee-noo").'),
    mc('How is <b>hva</b> (what) pronounced?', ['"va"', '"hwa"', '"hav"', '"ha"'], '"va"', 'In <b>hv-</b> the <b>h</b> is silent. <i>hva</i> sounds like "va".'),
    mc('What does <b>ng</b> sound like in <i>lang</i> (long)?', ['Like <i>ng</i> in <i>sing</i>, no hard g', 'Like <i>ng</i> in <i>finger</i>, with a hard g', 'Like a plain <i>n</i>', 'Like <i>nk</i>'], 'Like <i>ng</i> in <i>sing</i>, no hard g', 'Norwegian <b>ng</b> is always the soft sound as in <i>sing</i>.')
  ]
},

/* ───────────────────────── MODULE 2 ───────────────────────── */
{
  id: 2,
  title: 'Nouns and gender: en, ei, et',
  blurb: 'What a noun is, and the three small words that mean "a" in Norwegian.',
  lessons: [
    {
      title: 'What is a noun?',
      html: `
<h2>What is a noun?</h2>
${TERM('Noun', 'substantiv', 'a word that names a <b>person</b>, an <b>animal</b>, a <b>place</b>, a <b>thing</b> or an <b>idea</b>.')}
<p>Nouns are the "naming" words. If you can put <i>a</i> or <i>the</i> in front of it in English, it is probably a noun.</p>
<table>
<tr><th>Type</th><th>Examples</th></tr>
<tr><td>person</td><td>${W('gutt', 'boy')}${W('lærer', 'teacher')}${W('venn', 'friend')}</td></tr>
<tr><td>animal</td><td>${W('katt', 'cat')}${W('hund', 'dog')}</td></tr>
<tr><td>place</td><td>${W('by', 'city')}${W('land', 'country')}</td></tr>
<tr><td>thing</td><td>${W('bok', 'book')}${W('bil', 'car')}${W('stol', 'chair')}</td></tr>
</table>
<p>Words that are <b>not</b> nouns, for comparison:</p>
<p>${W('spise', 'to eat (action)')}${W('stor', 'big (describes)')}${W('rød', 'red (describes)')}</p>
<p>Actions are called <b>verbs</b> and describing words are called <b>adjectives</b>. We will learn those in later modules.</p>`
    },
    {
      title: 'Three genders',
      html: `
<h2>Every noun has a gender</h2>
${TERM('Gender', 'kjønn', 'a category that every noun belongs to. In Norwegian, nouns are <b>masculine</b>, <b>feminine</b> or <b>neuter</b>. This has nothing to do with whether the thing is male or female. A table is not "male" or "female", but it still has a grammatical gender.')}
<p>The gender decides which small word you use for <b>a / an</b>:</p>
${TERM('Article', 'artikkel', 'a small word in front of a noun, like <i>a</i>, <i>an</i> or <i>the</i> in English. The Norwegian words for <i>a / an</i> are:')}
<table>
<tr><th>Gender</th><th>Word for "a / an"</th><th>Example</th></tr>
<tr><td>masculine</td><td>${G('en')}</td><td>${W('en bil', 'a car')}</td></tr>
<tr><td>feminine</td><td>${G('ei')}</td><td>${W('ei jente', 'a girl')}</td></tr>
<tr><td>neuter</td><td>${G('et')}</td><td>${W('et hus', 'a house')}</td></tr>
</table>
<p>So <b>en</b>, <b>ei</b> and <b>et</b> all mean <i>a / an</i>. Which one you use depends on the noun.</p>
${TIP('<b>Always learn the article together with the noun.</b> Learn <i>en bil</i>, <i>ei bok</i>, <i>et hus</i> as one unit. Gender is difficult to guess, so do not try to work it out from the meaning.')}
<p><b>Good to know:</b> In standard Bokmål, feminine nouns may also use <b>en</b>. Both <i>ei bok</i> and <i>en bok</i> are correct. We teach <b>ei</b> here so that you recognise it when you hear or read it. Neuter nouns always use <b>et</b>.</p>`
    },
    {
      title: 'Words to learn',
      html: `
<h2>Words to learn</h2>
<p>Learn each noun with its article. Listen and repeat.</p>
<div class="cols">
<div><h3>${G('en')} masculine</h3>
${W('en mann', 'a man')}${W('en gutt', 'a boy')}${W('en bil', 'a car')}${W('en stol', 'a chair')}${W('en katt', 'a cat')}${W('en hund', 'a dog')}${W('en venn', 'a friend')}${W('en dag', 'a day')}${W('en sykkel', 'a bicycle')}${W('en by', 'a city')}</div>
<div><h3>${G('ei')} feminine</h3>
${W('ei jente', 'a girl')}${W('ei dame', 'a lady')}${W('ei bok', 'a book')}${W('ei jakke', 'a jacket')}${W('ei klokke', 'a clock')}${W('ei uke', 'a week')}${W('ei seng', 'a bed')}${W('ei hånd', 'a hand')}</div>
<div><h3>${G('et')} neuter</h3>
${W('et hus', 'a house')}${W('et barn', 'a child')}${W('et eple', 'an apple')}${W('et land', 'a country')}${W('et bord', 'a table')}${W('et vindu', 'a window')}${W('et brød', 'a loaf of bread')}${W('et år', 'a year')}</div>
</div>
${TIP('Say the full phrase aloud, for example "<span lang="nb">en bil</span>", not just "<span lang="nb">bil</span>". That is how the gender sticks in your memory.')}`
    }
  ],
  practice: [
    mc('What is a <b>noun</b>?', ['A word that names a person, animal, place, thing or idea', 'A word that describes an action', 'A word that describes how something looks', 'A small word like <i>and</i> or <i>but</i>'], 'A word that names a person, animal, place, thing or idea', 'A noun (<i>substantiv</i>) names things. Examples: <i>katt</i>, <i>by</i>, <i>bok</i>.'),
    mc('Which of these words is a <b>noun</b>?', ['stol (chair)', 'spise (to eat)', 'rød (red)', 'stor (big)'], 'stol (chair)', '<b>stol</b> names a thing, so it is a noun. <i>spise</i> is an action, and <i>rød</i> and <i>stor</i> describe things.'),
    mc('Which of these words is <b>not</b> a noun?', ['hund (dog)', 'land (country)', 'stor (big)', 'venn (friend)'], 'stor (big)', '<b>stor</b> describes something, so it is not a noun.'),
    mc('How many genders do Norwegian nouns have in Bokmål?', ['One', 'Two', 'Three', 'Four'], 'Three', 'Masculine (<b>en</b>), feminine (<b>ei</b>) and neuter (<b>et</b>).'),
    mc('What do <b>en</b>, <b>ei</b> and <b>et</b> all mean in English?', ['a / an', 'the', 'one hundred', 'and'], 'a / an', 'They are all articles meaning <i>a / an</i>. The noun decides which one you use.'),
    mc('<b>___ bil</b> (a car)', ['en', 'ei', 'et'], 'en', '<b>en bil</b>. Car is masculine.'),
    mc('<b>___ hus</b> (a house)', ['en', 'ei', 'et'], 'et', '<b>et hus</b>. House is neuter.'),
    mc('<b>___ jente</b> (a girl)', ['en', 'ei', 'et'], 'ei', '<b>ei jente</b>. Girl is feminine. (<i>en jente</i> is also allowed in Bokmål.)'),
    mc('<b>___ eple</b> (an apple)', ['en', 'ei', 'et'], 'et', '<b>et eple</b>. Apple is neuter.'),
    mc('<b>___ sykkel</b> (a bicycle)', ['en', 'ei', 'et'], 'en', '<b>en sykkel</b>. Bicycle is masculine.'),
    mc('<b>___ vindu</b> (a window)', ['en', 'ei', 'et'], 'et', '<b>et vindu</b>. Window is neuter.'),
    mt('Match each Norwegian noun to its English meaning.', [['bok', 'book'], ['hund', 'dog'], ['vindu', 'window'], ['uke', 'week'], ['barn', 'child']], 'bok = book, hund = dog, vindu = window, uke = week, barn = child.'),
    ty('Write "a book" in Norwegian, with the article.', ['ei bok', 'en bok'], '<b>ei bok</b>, or <b>en bok</b>. Both are correct in Bokmål, because feminine nouns can take <i>en</i>.'),
    ty('Write "a house" in Norwegian, with the article.', 'et hus', '<b>et hus</b>. House is neuter, so it always uses <i>et</i>.'),
    ls('et barn', 'Listen. What do you hear?', ['a child', 'a boy', 'a house', 'a bed'], 'a child', '<b>et barn</b> = a child.'),
    mc('Why should you learn the article together with each noun?', ['Because the gender is hard to guess from the meaning', 'Because Norwegian has no other words for "a"', 'Because articles are always pronounced louder', 'Because it makes the word shorter'], 'Because the gender is hard to guess from the meaning', 'A table or a book has no real gender, so you have to learn it: <i>en stol</i>, <i>ei bok</i>, <i>et bord</i>.'),
    mc('Which of these is <b>also</b> correct in standard Bokmål?', ['en bok', 'et bok', 'ei hus', 'en barn'], 'en bok', 'Feminine nouns may take <b>en</b>, so <i>en bok</i> is fine. Neuter nouns always take <b>et</b>.')
  ]
},

/* ───────────────────────── MODULE 3 ───────────────────────── */
{
  id: 3,
  title: 'The, and more than one',
  blurb: 'How to say "the car" and "the cars", and how to make plurals.',
  lessons: [
    {
      title: 'Singular, plural, a and the',
      html: `
<h2>Four forms of every noun</h2>
<p>Every noun can appear in four forms. Here are the grammar words for them, and what they mean.</p>
${TERM('Singular', 'entall', 'one of something: <i>a car</i>, <i>the car</i>.')}
${TERM('Plural', 'flertall', 'more than one: <i>cars</i>, <i>the cars</i>.')}
${TERM('Indefinite form', 'ubestemt form', 'any one, not a particular thing: <i>a car</i>, <i>cars</i>. In Norwegian: <i>en bil</i>, <i>biler</i>.')}
${TERM('Definite form', 'bestemt form', 'a particular thing that we both know about: <i>the car</i>, <i>the cars</i>. In Norwegian: <i>bilen</i>, <i>bilene</i>.')}
<table>
<tr><th></th><th>Singular</th><th>Plural</th></tr>
<tr><th>Indefinite</th><td>${W('en bil', 'a car')}</td><td>${W('biler', 'cars')}</td></tr>
<tr><th>Definite</th><td>${W('bilen', 'the car')}</td><td>${W('bilene', 'the cars')}</td></tr>
</table>
<p>The big difference from English: Norwegian does <b>not</b> put a separate word for <i>the</i> in front. Instead, it <b>adds a small ending</b> to the noun.</p>`
    },
    {
      title: '"The": the definite form',
      html: `
<h2>Saying "the"</h2>
<p>To say <i>the</i> in the singular, take the noun and add an ending. The ending depends on the gender, so now you can see why gender matters.</p>
<table>
<tr><th>Gender</th><th>Indefinite (a)</th><th>Definite (the)</th><th>Ending</th></tr>
<tr><td>${G('en')}</td><td>${W('en bil', 'a car')}</td><td>${W('bilen', 'the car')}</td><td class="hl">-en</td></tr>
<tr><td>${G('ei')}</td><td>${W('ei jente', 'a girl')}</td><td>${W('jenta', 'the girl')}</td><td class="hl">-a</td></tr>
<tr><td>${G('et')}</td><td>${W('et hus', 'a house')}</td><td>${W('huset', 'the house')}</td><td class="hl">-et</td></tr>
</table>
<div class="rule"><span lang="nb">en bil → bil<b class="hl">en</b></span> &nbsp;·&nbsp; <span lang="nb">ei bok → bok<b class="hl">a</b></span> &nbsp;·&nbsp; <span lang="nb">et hus → hus<b class="hl">et</b></span></div>
<p>More examples:</p>
<p>${W('stolen', 'the chair')}${W('hunden', 'the dog')}${W('boka', 'the book')}${W('klokka', 'the clock')}${W('eplet', 'the apple')}${W('barnet', 'the child')}${W('bordet', 'the table')}</p>
<p>If a noun already ends in <b>-e</b>, you only add the last letter: masculine words add <b>-n</b> and neuter words add <b>-t</b>. For example <span lang="nb">en gate → gaten</span> (the street) and <span lang="nb">et eple → eplet</span> (the apple). Feminine words ending in <b>-e</b> swap the <b>-e</b> for <b>-a</b>: <span lang="nb">jente → jent<b>a</b></span>, <span lang="nb">klokke → klokk<b>a</b></span>.</p>
${TIP('In standard Bokmål, feminine nouns can also take <b>-en</b> in the definite: <i>boka</i> or <i>boken</i>, <i>jenta</i> or <i>jenten</i>. Both are correct. We use <b>-a</b> here because it is very common in speech. If you use <i>en</i> for feminine words, use <b>-en</b> to match.')}`
    },
    {
      title: 'More than one: the plural',
      html: `
<h2>Making plurals</h2>
<p>The plural <b>indefinite</b> means "more than one", without saying which ones: <i>cars</i>, <i>girls</i>, <i>houses</i>.</p>
<table>
<tr><th>Gender</th><th>Rule</th><th>Examples</th></tr>
<tr><td>${G('en')}</td><td>add <span class="hl">-er</span></td><td>${W('en bil → biler', 'cars')}${W('en katt → katter', 'cats')}${W('en stol → stoler', 'chairs')}</td></tr>
<tr><td>${G('ei')}</td><td>add <span class="hl">-er</span></td><td>${W('ei jente → jenter', 'girls')}${W('ei klokke → klokker', 'clocks')}${W('ei uke → uker', 'weeks')}</td></tr>
<tr><td>${G('et')}</td><td>add <span class="hl">nothing</span> (the word stays the same)</td><td>${W('et hus → hus', 'houses')}${W('et barn → barn', 'children')}${W('et bord → bord', 'tables')}</td></tr>
</table>
<p>Neuter words that end in <b>-e</b> add <b>-r</b>: <span lang="nb">et eple → epler</span> (apples).</p>
<p>When the singular already ends in <b>-e</b>, add only <b>-r</b>: <span lang="nb">ei jakke → jakker</span>.</p>
<h3>A few irregular plurals</h3>
<p>Some very common words change their vowel. These you simply learn by heart:</p>
<p>${W('en mann → menn', 'men')}${W('ei bok → bøker', 'books')}${W('ei hånd → hender', 'hands')}</p>
${TIP('Spoken numbers use the plural: <span lang="nb">to biler</span> (two cars), <span lang="nb">tre hus</span> (three houses). You will meet numbers soon.')}`
    },
    {
      title: '"The" in the plural',
      html: `
<h2>Saying "the" in the plural</h2>
<p>For the plural definite ("the cars", "the girls"), take the <b>plural form</b> and add <span class="hl">-ene</span>. This works for all three genders.</p>
<div class="rule"><span lang="nb">biler → bil<b class="hl">ene</b></span> &nbsp;·&nbsp; <span lang="nb">jenter → jent<b class="hl">ene</b></span> &nbsp;·&nbsp; <span lang="nb">hus → hus<b class="hl">ene</b></span></div>
<table>
<tr><th>Singular</th><th>Plural</th><th>Plural + the</th></tr>
<tr><td>${W('en bil', 'a car')}</td><td>${W('biler', 'cars')}</td><td>${W('bilene', 'the cars')}</td></tr>
<tr><td>${W('ei jente', 'a girl')}</td><td>${W('jenter', 'girls')}</td><td>${W('jentene', 'the girls')}</td></tr>
<tr><td>${W('et hus', 'a house')}</td><td>${W('hus', 'houses')}</td><td>${W('husene', 'the houses')}</td></tr>
<tr><td>${W('et eple', 'an apple')}</td><td>${W('epler', 'apples')}</td><td>${W('eplene', 'the apples')}</td></tr>
<tr><td>${W('ei bok', 'a book')}</td><td>${W('bøker', 'books')}</td><td>${W('bøkene', 'the books')}</td></tr>
</table>
<p>Here is the whole pattern for <b>bil</b> in one place:</p>
<div class="rule" lang="nb"><b>en bil</b> → <b>bilen</b> → <b>biler</b> → <b>bilene</b></div>
<p>(a car → the car → cars → the cars)</p>`
    },
    {
      title: 'Word list: module 3',
      html: `
<h2>Summary</h2>
<table>
<tr><th>Gender</th><th>a</th><th>the</th><th>plural</th><th>the (plural)</th></tr>
<tr><td>${G('en')}</td><td>en bil</td><td>bilen</td><td>biler</td><td>bilene</td></tr>
<tr><td>${G('ei')}</td><td>ei jente</td><td>jenta</td><td>jenter</td><td>jentene</td></tr>
<tr><td>${G('et')}</td><td>et hus</td><td>huset</td><td>hus</td><td>husene</td></tr>
</table>
<p>Listen to the forms:</p>
<p>${[
  ['bilen', 'the car'], ['biler', 'cars'], ['bilene', 'the cars'], ['jenta', 'the girl'], ['jenter', 'girls'], ['jentene', 'the girls'],
  ['huset', 'the house'], ['husene', 'the houses'], ['boka', 'the book'], ['bøker', 'books'], ['eplet', 'the apple'], ['epler', 'apples'], ['menn', 'men']
].map(([a, b]) => W(a, b)).join('')}</p>
<p>You need <b>80%</b> in the practice test to finish this module.</p>`
    }
  ],
  practice: [
    mc('What is the <b>plural</b> of a noun?', ['The form that means more than one', 'The form that means "the"', 'The form with the article <i>en</i>', 'The first form in the dictionary'], 'The form that means more than one', 'Plural (<i>flertall</i>) means more than one: <i>cars</i>, <i>girls</i>.'),
    mc('Which pair is the <b>definite</b> form in English?', ['the car, the cars', 'a car, cars', 'my car, your car', 'one car, two cars'], 'the car, the cars', 'Definite form (<i>bestemt form</i>) is the "the" form: a particular thing.'),
    mc('How does Norwegian say "the" in the singular?', ['By adding an ending to the noun', 'By putting a separate word before the noun', 'By repeating the noun', 'It does not have a word for "the"'], 'By adding an ending to the noun', 'Norwegian adds an ending: <i>bil → bilen</i>, <i>hus → huset</i>.'),
    ty('Write the definite form (the car): <b>en bil → ?</b>', 'bilen', 'Masculine nouns take <b>-en</b>: <b>bilen</b>.'),
    ty('Write the definite form (the house): <b>et hus → ?</b>', 'huset', 'Neuter nouns take <b>-et</b>: <b>huset</b>.'),
    ty('Write the definite form (the girl): <b>ei jente → ?</b>', ['jenta', 'jenten'], 'Feminine nouns take <b>-a</b>: <b>jenta</b>. (<i>jenten</i> is also allowed.)'),
    ty('Write the definite form (the child): <b>et barn → ?</b>', 'barnet', 'Neuter nouns take <b>-et</b>: <b>barnet</b>.'),
    ty('Write the definite form (the book): <b>ei bok → ?</b>', ['boka', 'boken'], 'Feminine: <b>boka</b> (or <b>boken</b>).'),
    ty('Write the definite form (the apple): <b>et eple → ?</b>', 'eplet', 'Neuter: <b>eple + t = eplet</b>. The word already ends in <b>-e</b>, so only <b>-t</b> is added.'),
    mc('What is the plural of <b>en bil</b> (a car)?', ['biler', 'bilen', 'bils', 'bilene'], 'biler', 'Masculine plural: add <b>-er</b>.'),
    mc('What is the plural of <b>ei jente</b> (a girl)?', ['jenter', 'jenta', 'jentene', 'jentes'], 'jenter', 'Feminine plural: add <b>-er</b>.'),
    mc('What is the plural of <b>et hus</b> (a house)?', ['hus', 'huser', 'huset', 'hus-er'], 'hus', 'Neuter nouns do not change in the plural. <i>et hus → hus</i>.'),
    mc('What is the plural of <b>et eple</b> (an apple)?', ['epler', 'eple', 'eplen', 'eples'], 'epler', 'Neuter nouns ending in <b>-e</b> add <b>-r</b>: <b>epler</b>.'),
    mc('What is the plural of <b>ei bok</b> (a book)?', ['bøker', 'boker', 'bok', 'boks'], 'bøker', '<b>bøker</b>. This one changes its vowel (<i>o → ø</i>). Learn it by heart.'),
    mc('What is the plural of <b>en mann</b> (a man)?', ['menn', 'manner', 'manns', 'mann'], 'menn', '<b>menn</b>. Another irregular plural to learn by heart.'),
    ty('Write "the cars" in Norwegian (one word).', 'bilene', 'Plural + <b>-ene</b>: <i>biler</i> → <b>bilene</b>.'),
    ty('Write "the houses" in Norwegian (one word).', 'husene', '<i>hus</i> + <b>-ene</b> = <b>husene</b>.'),
    ty('Write "the girls" in Norwegian (one word).', 'jentene', '<i>jenter</i> → <b>jentene</b>.'),
    mc('Which row shows the correct four forms of <b>en stol</b>?', ['en stol – stolen – stoler – stolene', 'en stol – stolet – stol – stolene', 'en stol – stola – stoler – stolen', 'en stol – stolen – stol – stolet'], 'en stol – stolen – stoler – stolene', 'Masculine: <b>-en</b> (the), <b>-er</b> (plural), <b>-ene</b> (the plural).'),
    ls('husene', 'Listen. What does this word mean?', ['the houses', 'the house', 'houses', 'a house'], 'the houses', '<b>husene</b> = the houses (plural + <i>-ene</i>).')
  ]
}
];

/* Modules that are planned but not built yet. Shown greyed out on the front page. */
window.ROADMAP = [
  { title: 'Pronouns and verbs in the present', blurb: 'jeg, du, han, hun… and your first verbs' },
  { title: 'Building sentences', blurb: 'Word order and the "verb second" rule' },
  { title: 'Questions and "not"', blurb: 'Asking questions and saying ikke' },
  { title: 'Adjectives', blurb: 'Describing words and how they change' },
  { title: 'The past', blurb: 'Telling what happened' },
  { title: 'Can, will, must', blurb: 'Modal verbs' },
  { title: 'Longer sentences', blurb: 'Because, that, when and which' },
  { title: 'Prepositions and compound words', blurb: 'på, i, til… and long Norwegian words' },
  { title: 'Reading and conversation', blurb: 'Short texts and dialogues' }
];
