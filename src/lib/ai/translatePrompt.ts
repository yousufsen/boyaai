// --- Word dictionary ---
const NOUNS: Record<string, string> = {
  // Animals
  kedi: 'cat', köpek: 'dog', aslan: 'lion', kaplan: 'tiger', fil: 'elephant',
  zürafa: 'giraffe', maymun: 'monkey', tavşan: 'rabbit', ayı: 'bear', kurt: 'wolf',
  tilki: 'fox', balık: 'fish', kuş: 'bird', papağan: 'parrot', kartal: 'eagle',
  kelebek: 'butterfly', arı: 'bee', karınca: 'ant', kaplumbağa: 'turtle',
  yılan: 'snake', timsah: 'crocodile', penguen: 'penguin', panda: 'panda',
  koala: 'koala', inek: 'cow', at: 'horse', eşek: 'donkey', koyun: 'sheep',
  keçi: 'goat', tavuk: 'chicken', ördek: 'duck', yunus: 'dolphin', balina: 'whale',
  ahtapot: 'octopus', yengeç: 'crab', denizanası: 'jellyfish', köpekbalığı: 'shark',
  dinozor: 'dinosaur', ejderha: 'dragon', unicorn: 'unicorn', fare: 'mouse',
  sincap: 'squirrel', kirpi: 'hedgehog', baykuş: 'owl', flamingo: 'flamingo',
  gergedan: 'rhinoceros', hipopotam: 'hippopotamus', deve: 'camel', kanguru: 'kangaroo',
  // Nature
  ağaç: 'tree', çiçek: 'flower', orman: 'forest', deniz: 'sea', okyanus: 'ocean',
  göl: 'lake', nehir: 'river', dağ: 'mountain', yanardağ: 'volcano', ada: 'island',
  çöl: 'desert', bulut: 'cloud', güneş: 'sun', ay: 'moon', yıldız: 'star',
  gökkuşağı: 'rainbow', kar: 'snow', yağmur: 'rain', fırtına: 'storm',
  gök: 'sky', bahçe: 'garden', park: 'park', çimen: 'grass', yaprak: 'leaf',
  çalı: 'bush', tepe: 'hill', mağara: 'cave', şelale: 'waterfall',
  // Space
  uzay: 'space', gezegen: 'planet', roket: 'rocket', astronot: 'astronaut',
  uzaylı: 'alien', galaksi: 'galaxy', meteor: 'meteor',
  // Fantasy & Characters
  prenses: 'princess', prens: 'prince', kral: 'king', kraliçe: 'queen',
  şövalye: 'knight', korsan: 'pirate', ninja: 'ninja', peri: 'fairy',
  büyücü: 'wizard', cadı: 'witch', dev: 'giant', cüce: 'dwarf',
  robot: 'robot', süpermen: 'superman', kahraman: 'hero',
  // Buildings & Places
  kale: 'castle', ev: 'house', okul: 'school', hastane: 'hospital',
  köprü: 'bridge', kule: 'tower', saray: 'palace', kulübe: 'hut',
  şehir: 'city', köy: 'village', lunapark: 'amusement park',
  // Vehicles
  araba: 'car', otobüs: 'bus', tren: 'train', uçak: 'airplane',
  helikopter: 'helicopter', gemi: 'ship', tekne: 'boat', bisiklet: 'bicycle',
  motosiklet: 'motorcycle', kamyon: 'truck',
  // Food
  pasta: 'cake', dondurma: 'ice cream', pizza: 'pizza', çikolata: 'chocolate',
  meyve: 'fruit', elma: 'apple', muz: 'banana', çilek: 'strawberry',
  portakal: 'orange', karpuz: 'watermelon', kurabiye: 'cookie',
  // Professions
  balerin: 'ballerina', futbolcu: 'soccer player', müzisyen: 'musician',
  ressam: 'painter', aşçı: 'chef', doktor: 'doctor', pilot: 'pilot',
  itfaiyeci: 'firefighter', polis: 'police officer',
  // Misc
  şapka: 'hat', taç: 'crown', kanat: 'wings', kuyruk: 'tail',
  gözlük: 'glasses', paten: 'roller skates', patin: 'ice skates',
  balon: 'balloon', hediye: 'gift', hazine: 'treasure',
  harita: 'map', kitap: 'book', müzik: 'music', top: 'ball',
  kalp: 'heart', yüzük: 'ring', ateş: 'fire', su: 'water', buz: 'ice',
  kabarcık: 'bubble', yosun: 'seaweed', mercan: 'coral', kum: 'sand',
};

const ADJECTIVES: Record<string, string> = {
  büyük: 'big', küçük: 'small', mutlu: 'happy', sevimli: 'cute',
  güzel: 'beautiful', renkli: 'colorful', büyülü: 'magical', sihirli: 'magical',
  komik: 'funny', cesur: 'brave', kızgın: 'angry', üzgün: 'sad',
  tatlı: 'sweet', şirin: 'adorable', güçlü: 'strong', hızlı: 'fast',
  yavaş: 'slow', yaşlı: 'old', genç: 'young', korkak: 'scared',
  neşeli: 'cheerful', havalı: 'cool', dev: 'giant', minik: 'tiny',
};

const VERBS: Record<string, string> = {
  uçan: 'flying', koşan: 'running', yüzen: 'swimming', oynayan: 'playing',
  uyuyan: 'sleeping', gülen: 'smiling', ağlayan: 'crying', yiyen: 'eating',
  dans: 'dancing', oturan: 'sitting', atlayan: 'jumping', sörf: 'surfing',
  paten: 'skating', bisiklet: 'riding a bicycle', şarkı: 'singing',
  boyayan: 'painting', okuyan: 'reading', tırmanan: 'climbing',
  sürüklenen: 'drifting', kayan: 'sliding', sallanan: 'swinging',
  püskürten: 'breathing', eden: 'doing', yapan: 'making',
};

// Locative patterns: "Xda/Xde/Xta/Xte" → "in a X"
// "üzerinde/üstünde" → "on top of", "altında" → "under", etc.
const LOCATIVE_SUFFIXES = ['da', 'de', 'ta', 'te'];
const PREPOSITIONS: Record<string, string> = {
  üzerinde: 'on top of', üstünde: 'on top of',
  altında: 'under', altındaki: 'under',
  yanında: 'next to', yanındaki: 'next to',
  içinde: 'inside', içindeki: 'inside',
  arasında: 'between', arasındaki: 'between',
  önünde: 'in front of', arkasında: 'behind',
  etrafında: 'around',
};

const SKIP_WORDS = new Set([
  'bir', 've', 'ile', 'olan', 'ki', 'bu', 'şu', 'o',
  'için', 'gibi', 'kadar', 'en', 'çok', 'daha', 'hem',
  'ama', 'fakat', 'veya', 'ya', 'da', 'de',
]);

const ALL_DICT = { ...NOUNS, ...ADJECTIVES, ...VERBS };

function stripAndLookup(word: string): string | null {
  if (ALL_DICT[word]) return ALL_DICT[word];

  // Try stripping Turkish suffixes to find root
  const suffixes = [
    'ların', 'lerin', 'ları', 'leri', 'lar', 'ler',
    'nın', 'nin', 'nun', 'nün',
    'yla', 'yle', 'ını', 'ini',
    'lı', 'li', 'lu', 'lü',
    'sız', 'siz', 'suz', 'süz',
    'si', 'sı', 'su', 'sü',
    'ın', 'in', 'un', 'ün',
  ];
  for (const s of suffixes) {
    if (word.length > s.length + 2 && word.endsWith(s)) {
      const root = word.slice(0, -s.length);
      if (ALL_DICT[root]) return ALL_DICT[root];
    }
  }
  return null;
}

// Words that don't take "a/an" article
const NO_ARTICLE = new Set(['space', 'sky', 'heaven', 'hell']);

function articleFor(noun: string): string {
  if (NO_ARTICLE.has(noun)) return '';
  if (/^[aeiou]/i.test(noun)) return 'an ';
  return 'a ';
}

function tryLocative(word: string): { noun: string; prep: string } | null {
  // "ormanda" → orman + da → "in a forest"
  for (const suf of LOCATIVE_SUFFIXES) {
    if (word.endsWith(suf) && word.length > suf.length + 2) {
      const root = word.slice(0, -suf.length);
      const eng = stripAndLookup(root);
      if (eng) return { noun: eng, prep: 'in' };
    }
  }
  return null;
}

export function translatePrompt(turkishPrompt: string): string {
  const words = turkishPrompt
    .toLowerCase()
    .replace(/[.,!?;:'"()]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 0);

  // Separate into subject parts and location/preposition parts
  const subjectParts: string[] = [];
  const locationParts: string[] = [];
  let i = 0;

  while (i < words.length) {
    const word = words[i];

    // Skip pure stopwords
    if (SKIP_WORDS.has(word)) { i++; continue; }

    // Check standalone prepositions: "üzerinde", "altında" etc.
    // In Turkish: "X'in üstünde Y" — the preceding word is the reference
    if (PREPOSITIONS[word]) {
      const prep = PREPOSITIONS[word];
      // The reference object is the PREVIOUS subject part (Turkish postposition)
      const refObj = subjectParts.length > 0 ? subjectParts.pop() : null;
      if (refObj) {
        locationParts.push(`${prep} ${refObj}`);
      } else {
        locationParts.push(prep);
      }
      i++;
      continue;
    }

    // Check locative form: "ormanda" → "in a forest"
    const loc = tryLocative(word);
    if (loc) {
      locationParts.push(`${loc.prep} ${articleFor(loc.noun)}${loc.noun}`);
      i++;
      continue;
    }

    // Check two-word compounds
    if (i + 1 < words.length) {
      const compound = word + ' ' + words[i + 1];
      if (ALL_DICT[compound]) {
        subjectParts.push(ALL_DICT[compound]);
        i += 2;
        continue;
      }
    }

    // Direct lookup
    const translated = stripAndLookup(word);
    if (translated) {
      subjectParts.push(translated);
      i++;
      continue;
    }

    // Keep original
    subjectParts.push(word);
    i++;
  }

  // Build natural sentence: "a [adjectives] [subject] [verbs] [location]"
  const subject = subjectParts.join(' ');
  const location = locationParts.join(' ');

  let result = subject;
  if (location) {
    result = result + ' ' + location;
  }

  // Add article if missing
  if (result && !result.startsWith('a ') && !result.startsWith('an ') && !result.startsWith('the ')) {
    result = 'a ' + result;
  }

  return result;
}

// Scene enrichment: add context details based on keywords in the translated text
const SCENE_ENRICHMENTS: { keywords: string[]; addition: string }[] = [
  { keywords: ['space', 'galaxy', 'astronaut', 'rocket', 'planet'], addition: 'surrounded by stars, planets, moon, galaxy background' },
  { keywords: ['sea', 'ocean', 'underwater', 'fish', 'whale', 'dolphin', 'octopus', 'shark', 'jellyfish', 'crab'], addition: 'underwater scene with bubbles, seaweed, coral' },
  { keywords: ['forest', 'jungle'], addition: 'forest scene with trees, bushes, flowers, grass' },
  { keywords: ['sky', 'flying', 'cloud', 'bird', 'airplane'], addition: 'sky scene with clouds, sun, birds' },
  { keywords: ['city', 'building'], addition: 'city scene with buildings, cars, road' },
  { keywords: ['house', 'home', 'hut'], addition: 'house with windows, door, garden, fence' },
  { keywords: ['garden', 'park'], addition: 'garden with flowers, trees, butterflies' },
  { keywords: ['beach', 'sand'], addition: 'beach scene with sand, waves, seashells, palm tree' },
  { keywords: ['snow', 'winter', 'ice'], addition: 'winter scene with snowflakes, snowman, pine trees' },
  { keywords: ['mountain', 'volcano', 'hill'], addition: 'mountain landscape with clouds and trees' },
  { keywords: ['castle', 'palace', 'tower'], addition: 'castle scene with flags, clouds, path' },
  { keywords: ['pirate', 'ship', 'treasure'], addition: 'pirate scene with waves, island, treasure chest' },
];

function enrichScene(translated: string): string {
  const lower = translated.toLowerCase();
  const additions: string[] = [];

  for (const scene of SCENE_ENRICHMENTS) {
    if (scene.keywords.some((kw) => lower.includes(kw))) {
      additions.push(scene.addition);
      break; // Only add one scene enrichment to avoid clutter
    }
  }

  if (additions.length > 0) {
    return `${translated}, ${additions.join(', ')}`;
  }
  return translated;
}

export const COLORING_STYLE_SUFFIX =
  "children's coloring book page for ages 3-5, only thick black outlines on pure white background, every shape must be completely closed and enclosed, no open lines, no gaps in outlines, very simple shapes with minimal detail, maximum 8-10 large shapes, no shading, no gradients, no gray tones, no texture, no crosshatching, cute cartoon style, lines must be thick enough that a child can color inside them easily";

export function buildImagePrompt(turkishPrompt: string): string {
  const englishCore = translatePrompt(turkishPrompt);
  const enriched = enrichScene(englishCore);
  // Add "adorable" prefix for cuter results, remove leading "a "
  const core = enriched.startsWith('a ') ? enriched.slice(2) : enriched;
  return `adorable ${core}, ${COLORING_STYLE_SUFFIX}`;
}
