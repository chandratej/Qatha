/**
 * Robust phonetic roman → Telugu converter.
 *
 * BENCHMARK for Telugu authors (end-user validated by writing real stories + incremental fixes).
 * Full Modern Telugu coverage: 16 అచ్చులు, all వర్గాలు (కంఠ్య/తాలవ్య/మూర్ధన్య/దంత్య/ఓష్ఠ్య + nasals),
 * గుణింతాలు, ఒత్తులు (live repeat), హలంతాలు (incl. న్ via space), అనుస్వారం/విసర్గ, ఉభయాక్షరాలు/conjuncts.
 *
 * Speed design (PramukhIME model):
 * - Keep full roman word while typing; convert on Space / punctuation (NOT mid-word doubles)
 * - Double consonants (mm, nn, kk) resolve when the *whole word* converts (amma → అమ్మ)
 * - Capitals for retroflex; longest clusters first; spoken-word overrides
 * - Suggestions: Space / Enter / Tab accept
 *
 * Never mid-commit on letter-repeat — that produced అమ్ంఅ when typing "amma".
 */

const cons: Record<string, string> = {
  kh: 'ఖ', gh: 'ఘ', chh: 'ఛ', jh: 'ఝ',
  th: 'థ', dh: 'ధ', ph: 'ఫ', bh: 'భ',
  k: 'క', g: 'గ', c: 'చ', ch: 'చ', j: 'జ',
  t: 'త', d: 'ద', n: 'న',
  p: 'ప', b: 'బ', m: 'మ',
  y: 'య', r: 'ర', l: 'ల', v: 'వ', w: 'వ',
  s: 'స', sh: 'శ', h: 'హ',
  // extras
  z: 'జ', f: 'ఫ', x: 'క్ష',
  ng: 'ఙ',
  ny: 'ఞ', nj: 'ఞ',
  ts: 'ౘ',
  dz: 'ౙ',
};

const vowels: Record<string, string> = {
  a: 'అ', aa: 'ఆ',
  i: 'ఇ', ii: 'ఈ',
  u: 'ఉ', uu: 'ఊ',
  e: 'ఎ', ee: 'ఏ', ae: 'ఏ',
  ai: 'ఐ',
  o: 'ఒ', oo: 'ఓ', au: 'ఔ',
  // Standalone vocalic R/L only via capital-R path or lru/lruu — not bare "ru"/"lu"
  // (bare "ru" at word start is ordinary రు — see word-start handling below)
  ruu: 'ౠ',
  lru: 'ఌ', lruu: 'ౡ',
};

const matras: Record<string, string> = {
  aa: 'ా',
  i: 'ి', ii: 'ీ',
  u: 'ు', uu: 'ూ',
  e: 'ె', ee: 'ే', ae: 'ే',
  ai: 'ై',
  o: 'ొ', oo: 'ో', au: 'ౌ',
  // Rare vocalic matras — only via explicit lru/lruu digraphs, NOT bare "lu" (plural -lu)
  lru: 'ౢ', lruu: 'ౣ',
  a: '', // implicit a
};

// Special clusters / yuktaksharas that are hard for naive char-by-char
// Order: longest first when checking
const clusters: Array<[string, string]> = [
  ['ksh', 'క్ష'],
  ['jny', 'జ్ఞ'],
  ['gny', 'జ్ఞ'],
  ['jn', 'జ్ఞ'],
  ['gn', 'జ్ఞ'],
  ['shr', 'శ్ర'],
  ['str', 'స్త్ర'],
  ['ntr', 'ంత్ర'],
  ['ndr', 'ంద్ర'],
  ['spr', 'స్ప్ర'],
  ['sph', 'స్ఫ'],
  // Expanded for Modern Telugu velocity & accuracy (common yuktaksharas / conjuncts)
  ['rst', 'ర్స్ట్'], ['rts', 'ర్ట్స్'],
  ['mb', 'మ్బ'], ['mp', 'మ్ప'], ['mv', 'మ్వ'], ['my', 'మ్య'], ['ms', 'మ్స'],
  ['nd', 'న్ద'], ['nt', 'న్త'], ['nj', 'న్జ'], ['nk', 'న్క'], ['nv', 'న్వ'], ['ny', 'న్య'], ['ns', 'న్స'],
  ['rv', 'ర్వ'], ['ry', 'ర్య'], ['rm', 'ర్మ'], ['rn', 'ర్న'], ['rd', 'ర్ద'], ['rt', 'ర్త'], ['rp', 'ర్ప'], ['rb', 'ర్బ'], ['rs', 'ర్స'],
  ['lv', 'ల్వ'], ['ly', 'ల్య'], ['lm', 'ల్మ'], ['ln', 'ల్న'], ['ls', 'ల్స'],
  ['tv', 'త్వ'], ['ty', 'త్య'], ['tm', 'త్మ'], ['tn', 'త్న'], ['ts', 'త్స'],
  ['dv', 'ద్వ'], ['dy', 'ద్య'], ['dm', 'ద్మ'], ['dn', 'ద్న'],
  ['sv', 'స్వ'], ['sy', 'స్య'], ['sm', 'స్మ'], ['sn', 'స్న'], ['sk', 'స్క'], ['st', 'స్త'], ['sp', 'స్ప'], ['sl', 'స్ల'], ['ss', 'స్స'],
  ['py', 'ప్య'], ['ps', 'ప్స'],
  ['by', 'బ్య'], ['bs', 'బ్స'],
  ['ky', 'క్య'], ['km', 'క్మ'], ['kn', 'క్న'], ['ks', 'క్స'],
  ['gy', 'గ్య'], ['gm', 'గ్మ'],
  ['fy', 'ఫ్య'],
  ['hy', 'హ్య'], ['hv', 'హ్వ'],
  ['vy', 'వ్య'], ['vs', 'వ్స'],
  ['tr', 'త్ర'],
  ['dr', 'ద్ర'],
  ['pr', 'ప్ర'],
  ['br', 'బ్ర'],
  ['kr', 'క్ర'],
  ['gr', 'గ్ర'],
  ['vr', 'వ్ర'],
  ['sr', 'స్ర'],
  ['hr', 'హ్ర'],
];

// Very common words that are "complex" in pure rules but users expect to just work.
// These win over the char converter. Matched as whole words (case-insensitive).
const wordOverrides: Record<string, string> = {
  nanna: 'నాన్న',
  amma: 'అమ్మ',
  nenu: 'నేను',
  neenu: 'నేను',
  me: 'మీ',
  mee: 'మీ',
  nuvvu: 'నువ్వు',
  nuvu: 'నువ్వు',
  krishna: 'కృష్ణ',
  krishn: 'కృష్ణ',
  krushna: 'కృష్ణ',
  krushn: 'కృష్ణ',
  vishnu: 'విష్ణు',
  lakshmi: 'లక్ష్మి',
  lakshm: 'లక్ష్మి',
  sankranti: 'సంక్రాంతి',
  sankranthi: 'సంక్రాంతి',
  sankramana: 'సంక్రమణ',
  kshatriya: 'క్షత్రియ',
  kshatriy: 'క్షత్రియ',
  sri: 'శ్రీ',
  sree: 'శ్రీ',
  shree: 'శ్రీ',
  shri: 'శ్రీ',
  rama: 'రాము',
  raamu: 'రాము',
  seetha: 'సీత',
  sita: 'సీత',
  radha: 'రాధ',
  andhra: 'ఆంధ్ర',
  telugu: 'తెలుగు',
  hyderabad: 'హైదరాబాదు',
  visakhapatnam: 'విశాఖపట్నం',
  vizag: 'విశాఖ',
  dharma: 'ధర్మ',
  karma: 'కర్మ',
  yoga: 'యోగ',
  bhakti: 'భక్తి',
  moksha: 'మోక్ష',
  prema: 'ప్రేమ',
  mantra: 'మంత్ర',
  yantra: 'యంత్ర',
  brahma: 'బ్రహ్మ',
  brahm: 'బ్రహ్మ',
  vishwa: 'విశ్వ',
  pranam: 'ప్రణామ్',
  pranamam: 'ప్రణామం',
  gnanam: 'జ్ఞానం',
  jnanam: 'జ్ఞానం',
  sravanam: 'శ్రవణం',
  shravanam: 'శ్రవణం',
  // Newly reported hard words
  venu: 'వేణు',
  rtuvu: 'ఋతువు',
  rituvu: 'ఋతువు',
  santosh: 'సంతోష్',
  santos: 'సంతోష్',
  thagore: 'ఠాగూర్',
  tagore: 'ఠాగూర్',
  thagur: 'ఠాగూర్',
  aura: 'ఔరా',
  aur: 'ఔర్',
  ah: 'అః',
  am: 'అం',
  lu: 'ఌ',
  luu: 'ౡ',
  ts: 'ౘ',
  dz: 'ౙ',
  // Expanded for Modern Telugu story writing & common usage (max speed + accuracy)
  telangana: 'తెలంగాణ',
  telangan: 'తెలంగాణ',
  srinivas: 'శ్రీనివాస్',
  srinivasu: 'శ్రీనివాసు',
  lakshman: 'లక్ష్మణ',
  lakshmana: 'లక్ష్మణ',
  goutham: 'గౌతమ్',
  gautam: 'గౌతమ్',
  prabhas: 'ప్రభాస్',
  prabha: 'ప్రభా',
  mahesh: 'మహేష్',
  maheshbabu: 'మహేష్ బాబు',
  samantha: 'సమంత',
  allu: 'అల్లు',
  arjun: 'అర్జున్',
  arjuna: 'అర్జున',
  ramcharan: 'రామ్‌చరణ్',
  chiranjeevi: 'చిరంజీవి',
  nagarjuna: 'నాగార్జున',
  venkatesh: 'వెంకటేష్',
  balakrishna: 'బాలకృష్ణ',
  andaru: 'అందరూ',
  evaru: 'ఎవరు',
  evary: 'ఎవరు',
  emi: 'ఏమి',
  ela: 'ఎలా',
  enduku: 'ఎందుకు',
  vastava: 'వస్తావా',
  vastundi: 'వస్తుంది',
  cheppu: 'చెప్పు',
  chudu: 'చూడు',
  velli: 'వెళ్లి',
  ostha: 'ఓస్తా',
  pelli: 'పెళ్లి',
  kurchi: 'కూర్చి',
  tinu: 'తిను',
  tragu: 'త్రాగు',
  chaduvu: 'చదువు',
  raayu: 'రాయు',
  vyasam: 'వ్యాసం',
  vyasa: 'వ్యాస',
  samskruthi: 'సంస్కృతి',
  samskruti: 'సంస్కృతి',
  // Essential for kids and "ఇల్లు"
  illu: 'ఇల్లు',
  illulo: 'ఇల్లులో',
  vanta: 'వంట',
  roju: 'రోజు',
  sare: 'సరే',
  kukka: 'కుక్క',
  kutti: 'కుట్టి',
  pillalu: 'పిల్లలు',
  chettu: 'చెట్టు',
  banti: 'బంతి',
  tho: 'తో',
  chesi: 'చేసి',
  chusaru: 'చూసారు',
  daniki: 'దానికి',
  petti: 'పెట్టి',
  pilicharu: 'పిలిచారు',
  chestharu: 'చేస్తారు',
  chaduvutaru: 'చదువుతారు',
  santosham: 'సంతోషం',
  office: 'ఆఫీసు',
  clean: 'క్లీన్',
  kurradu: 'కుర్రాడు',
  kurrada: 'కుర్రాడు',
  kurrad: 'కుర్రాడు',
  // High-frequency modern Telugu name / place overrides for drafting accuracy
  bheem: 'భీమ్',
  sitarama: 'సీతారామ',
  gond: 'గొండ',
  kutumbam: 'కుటుంబం',
  poor: 'పేద',
  bhadha: 'బాధ',
  pettedi: 'పెట్టేది',
  preminchadu: 'ప్రేమించాడు',
  ammayi: 'అమ్మాయి',
  kashtapadadu: 'కష్టపడ్డాడు',
  oppresed: 'అణచివేయబడిన',
  nizam: 'నిజాం',
  british: 'బ్రిటీష్',
  raj: 'రాజ్',
  freedom: 'స్వాతంత్ర్యం',
  fighter: 'పోరాటయోధుడు',
  tribal: 'గిరిజన',
  jungle: 'అడవి',
  village: 'గ్రామం',
  oppression: 'అణచివేత',
  revolt: 'తిరుగుబాటు',
  battle: 'యుద్ధం',
  fight: 'పోరాటం',
  hero: 'హీరో',
  sacrifice: 'త్యాగం',
  courage: 'ధైర్యం',
  forest: 'అడవి',
  police: 'పోలీసు',
  arrest: 'అరెస్టు',
  escape: 'తప్పించుకుని',
  attack: 'దాడి',
  people: 'ప్రజలు',
  meeting: 'సమావేశం',
  alliance: 'మైత్రి',
  betrayal: 'ద్రోహం',
  legacy: 'వారసత్వం',
  chapter: 'అధ్యాయం',
  scene: 'దృశ్యం',
  adhyayam: 'అధ్యాయం',
  drusyam: 'దృశ్యం',
  adavi: 'అడవి',
  pilupu: 'పిలుపు',
  // Do NOT blank "the"/"of" — authors mix English; empty overrides deleted text (worklog 30 Jul).
  and: 'మరియు',
  call: 'పిలుపు',
  okati: 'ఒకటి',
  one: 'ఒకటి',
  // Everyday money / frequency nouns (were rare-vocalic mis-parses)
  rupayalu: 'రూపాయలు',
  rupayi: 'రూపాయి',
  rupayaluu: 'రూపాయలు',
  sarlu: 'సార్లు',
  // High-frequency story words — Pramukh ease (override engine edge cases)
  namaste: 'నమస్తే',
  namasthe: 'నమస్తే',
  sneham: 'స్నేహం',
  sneha: 'స్నేహ',
  ganesh: 'గణేశ్',
  ganesha: 'గణేశ',
  ganes: 'గణేశ్',
  prashanth: 'ప్రశాంత్',
  prashant: 'ప్రశాంత్',
  prasanth: 'ప్రశాంత్',
  prasant: 'ప్రశాంత్',
  gnanesh: 'జ్ఞానేశ్',
  jnanesh: 'జ్ఞానేశ్',
  jyothi: 'జ్యోతి',
  jyoti: 'జ్యోతి',
  chaitanya: 'చైతన్య',
  chaithanya: 'చైతన్య',
  vaikuntapuram: 'వైకుంఠపురం',
  vaikunthapuram: 'వైకుంఠపురం',
  swasthi: 'స్వస్తి',
  swasti: 'స్వస్తి',
  thammudu: 'తమ్ముడు',
  tammudu: 'తమ్ముడు',
  prayanam: 'ప్రయాణం',
  prayaanam: 'ప్రయాణం',
  ananda: 'ఆనంద',
  aananda: 'ఆనంద',
  shanti: 'శాంతి',
  shaanthi: 'శాంతి',
  santhi: 'శాంతి',
  jagratha: 'జాగ్రత్త',
  jagrata: 'జాగ్రత్త',
  vidyarthi: 'విద్యార్థి',
  vishesham: 'విశేషం',
  vishesha: 'విశేష',
  miru: 'మీరు',
  meeru: 'మీరు',
  // Spoken present forms — natural roman (unnavu) must match Pramukh, not bare engine ఉన్నవు
  unnavu: 'ఉన్నావు',
  unnaavu: 'ఉన్నావు',
  unnaru: 'ఉన్నారు',
  unnaaru: 'ఉన్నారు',
  unnara: 'ఉన్నారా',
  unnaara: 'ఉన్నారా',
  unnava: 'ఉన్నావా',
  unnaava: 'ఉన్నావా',
  unnanu: 'ఉన్నాను',
  unnaanu: 'ఉన్నాను',
  unnamu: 'ఉన్నాము',
  unnaamu: 'ఉన్నాము',
  unnayi: 'ఉన్నాయి',
  unnaayi: 'ఉన్నాయి',
  unnadi: 'ఉన్నది',
  unnaadi: 'ఉన్నది',
  undi: 'ఉంది',
  undhi: 'ఉంది',
  undaa: 'ఉందా',
  unda: 'ఉందా',
  bagundi: 'బాగుంది',
  baagundi: 'బాగుంది',
  bagunnaru: 'బాగున్నారు',
  baagunnaru: 'బాగున్నారు',
  bagunnaava: 'బాగున్నావా',
  bagunnava: 'బాగున్నావా',
  yela: 'ఎలా',
  entha: 'ఎంత',
  enthaa: 'ఎంత',
  ikkada: 'ఇక్కడ',
  akkada: 'అక్కడ',
  ekkada: 'ఎక్కడ',
  ippudu: 'ఇప్పుడు',
  appudu: 'అప్పుడు',
  eppudu: 'ఎప్పుడు',
  // Family / address (long final aa is what authors type as ammaa)
  ammaa: 'అమ్మా',
  nannaa: 'నాన్నా',
  akkaa: 'అక్కా',
  babai: 'బాబాయ్',
  babayi: 'బాబాయ్',
  // Hindi / film phrases common in Telugu drafts (Pramukh gets these)
  kuch: 'కుచ్',
  kuc: 'కుచ్',
  kuchh: 'కుచ్',
  hota: 'హొతా',
  hotaa: 'హొతా',
  hotha: 'హొతా',
  hothaa: 'హొతా',
  hai: 'హై',
  he: 'హే',
  kya: 'క్యా',
  kyun: 'క్యూన్',
  pyar: 'ప్యార్',
  pyaar: 'ప్యార్',
  dil: 'దిల్',
  // Everyday verbs authors type without double vowels
  chestunnavu: 'చేస్తున్నావు',
  chestunnaavu: 'చేస్తున్నావు',
  vastunnavu: 'వస్తున్నావు',
  vastunnaavu: 'వస్తున్నావు',
  chustunnavu: 'చూస్తున్నావు',
  chustunnaavu: 'చూస్తున్నావు',
  unna: 'ఉన్న',
  // (common Telugu literary names covered earlier in this object)
};

// Returns true if the char at position is start of a word (for overrides)
function isWordBoundary(text: string, idx: number): boolean {
  if (idx <= 0) return true;
  return /[\s"'(\-–—]/.test(text[idx - 1]);
}

function endsWordBoundary(text: string, endIdx: number): boolean {
  if (endIdx >= text.length) return true;
  return /[\s"').,!?;:\-–—]/.test(text[endIdx]);
}

/** Apply known whole-word overrides. Leaves other text for the char engine. */
function applyWordOverrides(text: string): string {
  if (!text) return text;
  let result = text;

  // Sort by length desc so longer matches win (sankranthi before sankra...)
  const entries = Object.entries(wordOverrides).sort((a, b) => b[0].length - a[0].length);

  for (const [rom, tel] of entries) {
    // Build case-insensitive word-boundary aware replace
    // We scan manually to preserve surrounding characters exactly
    const lower = result.toLowerCase();
    let out = '';
    let i = 0;
    while (i < result.length) {
      const lowerSlice = lower.slice(i);
      if (lowerSlice.startsWith(rom) && isWordBoundary(lower, i) && endsWordBoundary(lower, i + rom.length)) {
        out += tel;
        i += rom.length;
      } else {
        out += result[i];
        i += 1;
      }
    }
    result = out;
  }
  return result;
}

/** Decide శ vs ష for "sh" sequences. */
function chooseSibilant(following: string, precedingContext: string): string {
  const f = following.toLowerCase();
  const prev = precedingContext.toLowerCase();

  // Common tatsama / names that prefer retroflex ష
  // after i, u, r, or in krishna/vishnu/laksh etc.
  if (/[iuṛṛi]/.test(prev.slice(-1)) || /kri|vi|lak|ksh/.test(prev)) {
    return 'ష';
  }
  if (f.startsWith('n') || f.startsWith('k') || f.startsWith('m') || f.startsWith('r') || f.startsWith('l') || f.startsWith('v')) {
    return 'ష';
  }
  return 'శ';
}

/**
 * Core converter. Now significantly more complete for complex words.
 */
export function phoneticToTelugu(input: string): string {
  if (!input) return input;

  // 1. Apply personal corrections then high-value whole word overrides
  let text = applyPersonalCorrections(input);
  text = applyWordOverrides(text);

  const original = text;
  const s = text.toLowerCase();
  let result = '';
  let i = 0;

  while (i < s.length) {
    let matched = false;

    // Top priority: nj → ఞ (palatal nasal). "ny" is ordinary న్య via clusters
    // (chaitanya → చైతన్య, not …తఞ). Keep nj for rare ఞ sandhi forms.
    if (s.startsWith('nj', i)) {
      result += 'ఞ';
      i += 2;
      let vlen=0, m='';
      for (let vl=3; vl>=1; vl--) { if(i+vl>s.length)continue; const v=s.slice(i,i+vl); if(matras[v]!==undefined){m=matras[v];vlen=vl;break;} }
      if (vlen>0) { result += m; i+=vlen; }
      matched = true;
    }
    if (matched) continue;

    // Special alt forms for rare vocalics per docs (lru / lruu for ఌ / ౡ)
    if (s.startsWith('lruu', i)) {
      result += 'ౡ';
      i += 4;
      matched = true;
    } else if (s.startsWith('lru', i)) {
      result += 'ఌ';
      i += 3;
      matched = true;
    }
    if (matched) continue;

    // Priority check: vocalic ృ/ౄ after consonant (e.g. "kru" → కృ).
    // Must run before generic clusters like "kr" → క్ర which would otherwise steal "kru" as క్రు.
    // Only "ru"/"ruu" (not ri) to keep "kri" → క్రి natural via cluster+matra.
    if (!matched) {
      const c = s[i];
      if (cons[c]) {
        const after = s.slice(i + 1);
        let base = cons[c];
        const origC = original.slice(i, i + 1);
        // retroflex capitals for base
        if (c === 'd' && /[D]/.test(origC)) base = 'డ';
        if (c === 't' && /[T]/.test(origC)) base = 'ట';
        if (c === 's' && /[S]/.test(origC)) base = 'ష';
        if (after.startsWith('ruu')) {
          result += base + 'ౄ';
          i += 1 + 3;
          matched = true;
        } else if (after.startsWith('ru')) {
          result += base + 'ృ';
          i += 1 + 2;
          matched = true;
        }
      }
    }
    if (matched) continue;

    // --- Special clusters (క్ష, జ్ఞ, శ్ర, స్త్ర...) ---
    for (const [rom, tel] of clusters) {
      if (s.startsWith(rom, i)) {
        result += tel;
        i += rom.length;

        // Optional following matra
        let vlen = 0;
        let m = '';
        for (let vl = 3; vl >= 1; vl--) {
          if (i + vl > s.length) continue;
          const v = s.slice(i, i + vl);
          if (matras[v] !== undefined) {
            m = matras[v];
            vlen = vl;
            break;
          }
        }
        if (vlen > 0) {
          result += m;
          i += vlen;
        }
        matched = true;
        break;
      }
    }
    if (matched) continue;

    // --- Special letters & combinations (for వేణు, ఋతువు, ఠాగూర్, ఱ, డ్, etc.) ---
    // Check these before regular cons so they take precedence.
    const origAtI = original.slice(i);
    const lowerAtI = s.slice(i);

    // ఱ (special alveolar r) - ONLY capital R / RR (prioritize modern Telugu frequency over grandhik: words like కుర్రాడు use ర్ర double regular r)
    // Lowercase "rr" falls through to regular cons → ర్ర
    if (lowerAtI[0] === 'r' && /[R]/.test(origAtI[0])) {
      const isDouble = lowerAtI.startsWith('rr') && /[R]/.test(origAtI[1] || '');
      result += 'ఱ';
      i += isDouble ? 2 : 1;
      // optional matra
      let vlen = 0; let m = '';
      for (let vl=3; vl>=1; vl--) { if (i+vl>s.length) continue; const v=s.slice(i,i+vl); if (matras[v]!==undefined){m=matras[v];vlen=vl;break;} }
      if (vlen>0) { result += m; i+=vlen; }
      matched = true;
    }

    if (matched) continue;

    // ష via capital S + h "Sh"
    if (lowerAtI.startsWith('sh') && /[S]/.test(origAtI.slice(0,2))) {
      result += 'ష';
      i += 2;
      let vlen=0, m='';
      for (let vl=3;vl>=1;vl--){if(i+vl>s.length)continue; const v=s.slice(i,i+vl);if(matras[v]!==undefined){m=matras[v];vlen=vl;break;}}
      if(vlen>0){result += m; i+=vlen;} else {result += '్';}
      matched = true;
    }
    if (matched) continue;

    // ఠ (retroflex aspirated t) - "Th" (capital T + h) or "tth"
    if (lowerAtI.startsWith('th') && /[T]/.test(origAtI.slice(0,2))) {
      result += 'ఠ';
      i += 2;
      let vlen = 0; let m = '';
      for (let vl=3; vl>=1; vl--) { if (i+vl>s.length) continue; const v=s.slice(i,i+vl); if (matras[v]!==undefined){m=matras[v];vlen=vl;break;} }
      if (vlen>0) { result += m; i+=vlen; } else { result += '్'; } // allow halant if needed
      matched = true;
    }
    // ఢ 
    if (!matched && lowerAtI.startsWith('dh') && /[D]/.test(origAtI.slice(0,2))) {
      result += 'ఢ';
      i += 2;
      let vlen = 0; let m = '';
      for (let vl=3; vl>=1; vl--) { if (i+vl>s.length) continue; const v=s.slice(i,i+vl); if (matras[v]!==undefined){m=matras[v];vlen=vl;break;} }
      if (vlen>0) { result += m; i+=vlen; } else { result += '్'; }
      matched = true;
    }

    if (matched) continue;

    // ణ (retroflex n) via capital N
    if (!matched && lowerAtI[0] === 'n' && /[N]/.test(origAtI[0])) {
      result += 'ణ';
      i += 1;
      // matra or halant
      let vlen = 0; let m = '';
      for (let vl=3; vl>=1; vl--) { if (i+vl>s.length) continue; const v=s.slice(i,i+vl); if (matras[v]!==undefined){m=matras[v];vlen=vl;break;} }
      if (vlen>0) { result += m; i+=vlen; }
      else if (s[i] && !/[aeiou]/.test(s[i])) result += '్';
      matched = true;
    }

    if (matched) continue;

    // Standalone vocalic ఋ / ౠ — capital R / RR or explicit "ruu" only.
    // Bare lowercase "ru" at word start is ordinary రు (rupayalu → రూపాయలు via override / r+uu).
    // "rtuvu" is covered by whole-word override.
    if (!matched && (lowerAtI.startsWith('ruu') || (lowerAtI[0] === 'r' && /[R]/.test(origAtI[0])))) {
      const charBefore = i > 0 ? s[i - 1] : ' ';
      const isWordStart = i === 0 || /[\s"'(\-–—]/.test(charBefore);
      if (isWordStart) {
        let isLong = false;
        let len = 1;
        if (lowerAtI.startsWith('ruu')) {
          isLong = true;
          len = 3;
        } else if (/[R]/.test(origAtI[0])) {
          if (/[R]/.test(origAtI[1] || '')) {
            isLong = true;
            len = 2;
          } else {
            isLong = false;
            len = 1;
          }
        }
        result += isLong ? 'ౠ' : 'ఋ';
        i += len;
        let vlen = 0;
        let m = '';
        for (let vl = 3; vl >= 1; vl--) {
          if (i + vl > s.length) continue;
          const v = s.slice(i, i + vl);
          if (matras[v] !== undefined) {
            m = matras[v];
            vlen = vl;
            break;
          }
        }
        if (vlen > 0) {
          result += m;
          i += vlen;
        }
        matched = true;
      }
    }

    if (matched) continue;

    // --- "ll" retroflex handling (unchanged core behavior) ---
    if (s.startsWith('ll', i)) {
      const origLL = original.slice(i, i + 2);
      const isRetroflex = /[L]/.test(origLL);
      i += 2;

      let vlen = 0;
      let m = '';
      for (let vl = 3; vl >= 1; vl--) {
        if (i + vl > s.length) continue;
        const v = s.slice(i, i + vl);
        if (matras[v] !== undefined) {
          m = matras[v];
          vlen = vl;
          break;
        }
      }
      const llStr = isRetroflex ? 'ళ్ళ' : 'ల్ల';
      if (vlen > 0) {
        result += llStr + m;
        i += vlen;
      } else {
        result += llStr + '్';
      }
      continue;
    }

    // --- Regular consonants ---
    for (let len = 3; len >= 1; len--) {
      if (i + len > s.length) continue;
      const chunk = s.slice(i, i + len);
      if (cons[chunk]) {
        let base = cons[chunk];
        const origChunk = original.slice(i, i + len);

        // Capital D/T/L already supported for retroflex
        if (chunk === 'd' && /[D]/.test(origChunk)) base = 'డ';
        if (chunk === 't' && /[T]/.test(origChunk)) base = 'ట';
        if (chunk === 's' && /[S]/.test(origChunk)) base = 'ష';

        i += len;

        // === Special: vocalic ృ / ౄ after consonant (కృ, కౄ) ===
        const peek = s.slice(i, i + 2);
        const peek3 = s.slice(i, i + 3);
        if (peek3 === 'ruu') {
          result += base + 'ౄ';
          i += 3;
          matched = true;
          break;
        } else if (peek === 'ru') {  // ru for vocalic; 'ri' left to allow 'kri' -> క్రి via cluster
          result += base + 'ృ';
          i += 2;
          matched = true;
          break;
        }

        // === Special: sh decision for this position ===
        if (chunk === 'sh' || chunk === 's' && s[i] === 'h') {
          // If we matched "sh" as 2-char
          if (chunk === 'sh') {
            // already consumed 2, base currently 'శ'
            const nextAfter = s[i] || '';
            const prevContext = result.slice(-3); // rough preceding
            const chosen = chooseSibilant(nextAfter, prevContext + chunk);
            base = chosen;
          }
        }

        // Look ahead for regular matra
        let vlen = 0;
        let m = '';
        for (let vl = 3; vl >= 1; vl--) {
          if (i + vl > s.length) continue;
          const v = s.slice(i, i + vl);
          if (matras[v] !== undefined) {
            m = matras[v];
            vlen = vl;
            break;
          }
        }

        if (vlen > 0) {
          result += base + m;
          i += vlen;
        } else {
          // All consonants (incl. nasals) default to explicit halant when no matra.
          // This enables "n " / "n." → న్  (and doubles like nn → న్న via strip).
          // Anusvara normalization for nasals-before-cons happens in post-pass below.
          result += base + '్';
        }
        // visarga after matra or halant
        if (s[i] === 'h' || s[i] === ':') {
          result += 'ః';
          i += 1;
        }
        matched = true;
        break;
      }
    }

    if (matched) continue;

    // --- Standalone vowels ---
    for (let len = 3; len >= 1; len--) {
      if (i + len > s.length) continue;
      const chunk = s.slice(i, i + len);
      if (vowels[chunk]) {
        // Never treat bare "lu"/"luu" as standalone vocalic ఌ mid-word (plural -lu is లు).
        if ((chunk === 'lu' || chunk === 'luu') && i > 0) {
          // fall through to consonant l + matra u
        } else {
          // If previous output char is a Telugu consonant, treat this Latin vowel as a matra (live mode after double)
          const lastOut = result[result.length - 1] || '';
          if (/[\u0C00-\u0C7F]/.test(lastOut) && /[aeiou]/i.test(chunk)) {
            const matraMap: Record<string, string> = {
              a: '', aa: 'ా', i: 'ి', ii: 'ీ', u: 'ు', uu: 'ూ',
              e: 'ె', ee: 'ే', ae: 'ే', ai: 'ై', o: 'ొ', oo: 'ో', au: 'ౌ',
            };
            if (Object.prototype.hasOwnProperty.call(matraMap, chunk)) {
              result += matraMap[chunk];
              i += len;
              matched = true;
              break;
            }
          }
          if (vowels[chunk]) {
            result += vowels[chunk];
            i += len;
            if (s[i] === 'h' || s[i] === ':') {
              result += 'ః';
              i += 1;
            }
            matched = true;
            break;
          }
        }
      }
    }

    if (!matched) {
      // Pass through (already-converted Telugu from overrides, punctuation, spaces, etc.)
      result += s[i];
      i++;
    }
  }

  // Anusvara for n/m before *varga stops* only (nk → ంక).
  // Do NOT fire before antastha/ushma (య ర ల వ శ ష స హ) — keeps న్య / మ్య intact
  // (chaitanya → చైతన్య, not చైతంయ). Skips geminates via (?!న) / (?!మ).
  const vargaStops = 'కఖగఘఙచఛజఝటఠడఢతథదధపఫబభ';
  result = result.replace(new RegExp(`న్(?!న)([${vargaStops}])`, 'g'), 'ం$1');
  result = result.replace(new RegExp(`మ్(?!మ)([${vargaStops}])`, 'g'), 'ం$1');

  // PramukhIME rule: never invent an implicit final 'a'.
  // Consonant with no following vowel matra keeps ్ — "k"→క్, "kuch"→కుచ్, "ka"→క.
  // (Older path stripped ్$ so "kuch" became కుచ and broke loanwords.)
  // Only remove virama when a matra immediately follows (normalization).
  result = result.replace(/్([ాిీుూెేైొోౌృౄ])/g, '$1');

  // Word/clause-boundary anusvara — NOT absolute string-end only.
  // Bare roman m/n at word end become మ్/న్ then, before space/punct/EOS, ం.
  // Fixes satyam. / satyam, / mid-sentence "satyam " (Defensibility worklog 30 Jul 2026).
  // Does NOT convert word-final మ from roman ...ma (prema, kshama stay ప్రేమ / క్షమ).
  result = applyWordFinalAnusvara(result, s);

  // Final polish for some endings (santosh etc.)
  result = result.replace(/సంతోష(?!్)/g, 'సంతోష్');
  result = result.replace(/ప్రభాస(?!్)/g, 'ప్రభాస్');
  result = result.replace(/శ్రీనివాస(?!్)/g, 'శ్రీనివాస్');
  result = result.replace(/సంతోష్ం/g, 'సంతోషం');
  result = result.replace(/సంతొశం/g, 'సంతోషం');

  // Do NOT glue stray Latin after Telugu (old ottu hack). Mid-word stays roman until Space.
  return result;
}

/**
 * Prefer anusvara (ం) for word-final bare nasals at clause boundaries.
 *
 * 1) మ్/న్ before space, punctuation, or EOS → ం (anywhere in the buffer).
 *    This is the satyam. / satyam, / "satyam " case — virama means roman ended on bare m/n.
 * 2) Bare మ/న at absolute end only when the latin stem ends with bare n/m
 *    (after ్$ strip on isolated "satyam"). Does not fire for "prema"/"kshama" (...ma).
 *
 * Skips geminates (మ్మ / న్న). Internal nk→ం is handled earlier.
 */
export function applyWordFinalAnusvara(telugu: string, latinSource = ''): string {
  if (!telugu) return telugu;

  const boundary = String.raw`(?:$|[\s.,!?;:…'"''""»)\]}।॥])`;

  // Explicit virama form at any clause boundary
  let out = telugu.replace(
    new RegExp(`([నమ])్(?![నమ])(?=${boundary})`, 'g'),
    'ం',
  );

  // Isolated-word path: latin stem ends with bare n/m, output bare న/మ after ్$ strip
  const stem = (latinSource || '').trim().replace(/[\s.,!?;:…'"''""»)\]}।॥]+$/g, '');
  const lastLatin = stem.slice(-1).toLowerCase();
  if (
    (lastLatin === 'n' || lastLatin === 'm')
    && /[నమ]\s*$/.test(out)
    && !/(మ్మ|న్న)\s*$/.test(out)
  ) {
    out = out.replace(/([నమ])(\s*)$/, 'ం$2');
  }

  return out;
}

/** Suggestion shape used by the floating UI. */
export interface Suggestion {
  display: string;
  value: string;
}

/** Return up to 6 useful alternatives for the current roman word being typed. */
export function getPhoneticSuggestions(roman: string): Suggestion[] {
  if (!roman || !/[a-zA-Z]/.test(roman)) return [];

  const seen = new Set<string>();
  const suggestions: Suggestion[] = [];

  const addVariant = (variantRoman: string, label?: string, front = false) => {
    const telugu = phoneticToTelugu(variantRoman);
    if (!telugu || seen.has(telugu) || telugu === roman) return;
    seen.add(telugu);

    const displayRoman = label || variantRoman;
    const item = {
      display: `${displayRoman} → ${telugu}`,
      value: telugu,
    };
    if (front) suggestions.unshift(item);
    else suggestions.push(item);
  };

  // Order matters: index 0 is what Space/Enter/Tab accept.
  // 1) personal dict  2) whole-word common  3) live conversion  4) variants
  const lower = roman.toLowerCase();
  const personal = personalCorrections[lower] || personalCorrections[roman];
  if (personal && !seen.has(personal)) {
    seen.add(personal);
    suggestions.push({ display: `${roman} (yours) → ${personal}`, value: personal });
  }

  if (wordOverrides[lower] && !seen.has(wordOverrides[lower])) {
    const tel = wordOverrides[lower];
    seen.add(tel);
    suggestions.push({ display: `${roman} (common) → ${tel}`, value: tel });
  }

  // Engine conversion (often same as common — skipped by seen)
  addVariant(roman, roman);

  // Vowel length alternates (most common need vs Pramukh)
  addVariant(roman.replace(/e(?!e)/gi, 'ee'), `${roman} (long ే)`);
  addVariant(roman.replace(/o(?!o)/gi, 'oo'), `${roman} (long ో)`);
  addVariant(roman.replace(/a(?!a)/gi, 'aa'), `${roman} (long ా)`);
  addVariant(roman.replace(/i(?!i)/gi, 'ii'), `${roman} (long ీ)`);
  addVariant(roman.replace(/u(?!u)/gi, 'uu'), `${roman} (long ూ)`);

  // Retroflex toggles (capital = murdhanya — Pramukh-compatible)
  addVariant(roman.replace(/d/g, 'D'), `${roman} (డ)`);
  addVariant(roman.replace(/t/g, 'T'), `${roman} (ట)`);
  addVariant(roman.replace(/n/g, 'N'), `${roman} (ణ)`);
  addVariant(roman.replace(/th/gi, 'Th'), `${roman} (ఠ)`);
  addVariant(roman.replace(/dh/gi, 'Dh'), `${roman} (ఢ)`);
  if (/l/i.test(roman)) {
    addVariant(roman.replace(/ll/gi, 'LL'), `${roman} (ళ్ళ)`);
  }

  // Nasal / cluster hints
  addVariant(roman.replace(/n/g, 'm'), `${roman} (m↔n)`);
  if (/ksh|ks|x/i.test(roman)) {
    addVariant(roman.replace(/ksh|ks|x/gi, 'ksh'), `${roman} (క్ష)`);
  }
  if (/jn|gn/i.test(roman)) {
    addVariant(roman.replace(/jn|gn/gi, 'jn'), `${roman} (జ్ఞ)`);
  }

  return suggestions.slice(0, 6);
}

/** Semantic alternatives (register / politeness). Same as before, kept here for cohesion. */
export function getSemanticAlternatives(word: string): Suggestion[] {
  if (!word) return [];
  const normalized = word.trim().toLowerCase().replace(/[^\p{L}\p{M}]+/gu, '');

  if (['nuvvu', 'నువ్వు'].some((w) => normalized.includes(w) || word.includes(w))) {
    return [
      { display: 'నువ్వు — informal / close', value: 'నువ్వు' },
      { display: 'మీరు — respectful / formal', value: 'మీరు' },
    ];
  }
  if (['ra', 'రా'].some((w) => normalized.includes(w) || word.includes(w))) {
    return [
      { display: 'రా — casual (come here)', value: 'రా' },
      { display: 'రండి — polite request', value: 'రండి' },
    ];
  }
  if (['cheppu', 'చెప్పు', 'chep'].some((w) => normalized.includes(w) || word.includes(w))) {
    return [
      { display: 'చెప్పు — direct / casual', value: 'చెప్పు' },
      { display: 'చెప్పండి — polite', value: 'చెప్పండి' },
    ];
  }
  if (['kurchu', 'కూర్చు', 'kurch'].some((w) => normalized.includes(w) || word.includes(w))) {
    return [
      { display: 'కూర్చో — casual', value: 'కూర్చో' },
      { display: 'కూర్చోండి — polite', value: 'కూర్చోండి' },
    ];
  }
  if (['po', 'పో', 'vellu', 'వెళ్ళు'].some((w) => normalized.includes(w) || word.includes(w))) {
    return [
      { display: 'పో / వెళ్ళు — casual', value: 'వెళ్ళు' },
      { display: 'వెళ్ళండి — polite / formal', value: 'వెళ్ళండి' },
    ];
  }
  return [];
}

// Personal phonetic correction dictionary (per-creator; Supabase is source of truth, localStorage is cache)
let personalCorrections: Record<string, string> = {};

function cachePersonalCorrections() {
  try {
    localStorage.setItem('katha-phonetic-corrections', JSON.stringify(personalCorrections));
  } catch {}
}

export function loadPersonalCorrections() {
  try {
    const saved = localStorage.getItem('katha-phonetic-corrections');
    if (saved) personalCorrections = JSON.parse(saved);
  } catch {}
}

/** Merge cloud corrections after login (Priority 3 cross-device sync). */
export async function syncPhoneticCorrectionsFromCloud() {
  try {
    const { sbLoadPhoneticCorrections } = await import('./supabaseData');
    const remote = await sbLoadPhoneticCorrections();
    if (Object.keys(remote).length) {
      personalCorrections = { ...personalCorrections, ...remote };
      cachePersonalCorrections();
    }
  } catch {
    // Non-blocking
  }
}

export function setPersonalCorrection(phoneticInput: string, correctedTelugu: string) {
  const key = phoneticInput.toLowerCase().trim();
  const value = correctedTelugu.trim();
  if (!key || !value) return;
  personalCorrections[key] = value;
  cachePersonalCorrections();
  import('./supabaseData')
    .then(({ sbUpsertPhoneticCorrection }) => sbUpsertPhoneticCorrection(key, value))
    .catch(() => {});
}

export function deletePersonalCorrection(phoneticInput: string) {
  const key = phoneticInput.toLowerCase().trim();
  if (!key || !(key in personalCorrections)) return;
  delete personalCorrections[key];
  cachePersonalCorrections();
  import('./supabaseData')
    .then(({ sbDeletePhoneticCorrection }) => sbDeletePhoneticCorrection(key))
    .catch(() => {});
}

/** Bulk-import map (e.g. Story Bible character names → Telugu spellings). */
export function importPersonalCorrections(map: Record<string, string>, opts?: { overwrite?: boolean }) {
  const overwrite = opts?.overwrite !== false;
  let added = 0;
  for (const [rawKey, rawVal] of Object.entries(map)) {
    const key = rawKey.toLowerCase().trim();
    const value = String(rawVal || '').trim();
    if (!key || !value) continue;
    if (!overwrite && personalCorrections[key]) continue;
    personalCorrections[key] = value;
    added += 1;
    import('./supabaseData')
      .then(({ sbUpsertPhoneticCorrection }) => sbUpsertPhoneticCorrection(key, value))
      .catch(() => {});
  }
  cachePersonalCorrections();
  return added;
}

/** Export personal dictionary as JSON (switching-cost asset — portable backup). */
export function exportPersonalCorrectionsJson(): string {
  return JSON.stringify(
    {
      version: 1,
      exported_at: new Date().toISOString(),
      corrections: getPersonalCorrections(),
    },
    null,
    2,
  );
}

export function getPersonalCorrections() {
  return { ...personalCorrections };
}

export function personalCorrectionCount(): number {
  return Object.keys(personalCorrections).length;
}

// Apply personal corrections (whole word or exact match first)
function applyPersonalCorrections(text: string): string {
  let result = text;
  // Simple whole-word corrections for now
  Object.keys(personalCorrections).forEach(key => {
    const re = new RegExp(`\\b${key}\\b`, 'gi');
    result = result.replace(re, personalCorrections[key]);
  });
  return result;
}

// Re-export for convenience in case other modules want the raw maps later
export const _internal = { cons, vowels, matras, clusters, wordOverrides, personalCorrections };
