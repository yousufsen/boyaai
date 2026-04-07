const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const OpenAI = require('openai');

require('dotenv').config({ path: path.resolve(__dirname, '..', '.env.local') });

const API_KEY = process.env.OPENAI_API_KEY;
if (!API_KEY) { console.error('❌ OPENAI_API_KEY bulunamadı!'); process.exit(1); }

const openai = new OpenAI({ apiKey: API_KEY });
const BASE_DIR = path.resolve(__dirname, '..', 'public', 'stock-coloring');
const STYLE = "children's coloring book page for ages 3-5, only thick black outlines on pure white background, every shape must be completely closed and enclosed, no open lines, very simple shapes, cartoon style, no shading, no gradients, no gray";

function dilateBlack(data, w, h) {
  const out = new Uint8Array(w * h); out.fill(255);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (data[y * w + x] === 0)
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const ny = y + dy, nx = x + dx;
      if (ny >= 0 && ny < h && nx >= 0 && nx < w) out[ny * w + nx] = 0;
    }
  return out;
}

function morphClose(data, w, h, r) {
  const inp = new Uint8Array(data), dil = new Uint8Array(w * h), out = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let f = false;
    for (let dy = -r; dy <= r && !f; dy++) for (let dx = -r; dx <= r && !f; dx++) {
      const ny = y + dy, nx = x + dx;
      if (ny >= 0 && ny < h && nx >= 0 && nx < w && inp[ny * w + nx] === 0) f = true;
    }
    dil[y * w + x] = f ? 0 : 255;
  }
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let a = true;
    for (let dy = -r; dy <= r && a; dy++) for (let dx = -r; dx <= r && a; dx++) {
      const ny = y + dy, nx = x + dx;
      if (ny >= 0 && ny < h && nx >= 0 && nx < w && dil[ny * w + nx] !== 0) a = false;
    }
    out[y * w + x] = a ? 0 : 255;
  }
  return out;
}

async function postProcess(buf) {
  try {
    const t = await sharp(buf).grayscale().threshold(160).raw().toBuffer({ resolveWithObject: true });
    const d = dilateBlack(t.data, t.info.width, t.info.height);
    const c = morphClose(d, t.info.width, t.info.height, 2);
    return sharp(Buffer.from(c), { raw: { width: t.info.width, height: t.info.height, channels: 1 } }).png().toBuffer();
  } catch { return sharp(buf).grayscale().png().toBuffer(); }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function gen(prompt, outputPath) {
  const r = await openai.images.generate({ model: 'gpt-image-1-mini', prompt: `adorable ${prompt}, ${STYLE}`, n: 1, size: '1024x1024', quality: 'low' });
  const d = r.data?.[0];
  let buf;
  if (d?.b64_json) buf = Buffer.from(d.b64_json, 'base64');
  else if (d?.url) { const res = await fetch(d.url); buf = Buffer.from(await res.arrayBuffer()); }
  else throw new Error('No image data');
  const processed = await postProcess(buf);
  fs.writeFileSync(outputPath, processed);
  return processed.length;
}

// ===== ENGLISH ALPHABET =====
const EN_ALPHABET = [
  { letter: 'A', obj: 'apple', title: 'A - Apple' },
  { letter: 'B', obj: 'ball', title: 'B - Ball' },
  { letter: 'C', obj: 'cat', title: 'C - Cat' },
  { letter: 'D', obj: 'dog', title: 'D - Dog' },
  { letter: 'E', obj: 'elephant', title: 'E - Elephant' },
  { letter: 'F', obj: 'fish', title: 'F - Fish' },
  { letter: 'G', obj: 'giraffe', title: 'G - Giraffe' },
  { letter: 'H', obj: 'house', title: 'H - House' },
  { letter: 'I', obj: 'ice cream cone', title: 'I - Ice Cream' },
  { letter: 'J', obj: 'jellyfish', title: 'J - Jellyfish' },
  { letter: 'K', obj: 'kite flying', title: 'K - Kite' },
  { letter: 'L', obj: 'lion', title: 'L - Lion' },
  { letter: 'M', obj: 'monkey', title: 'M - Monkey' },
  { letter: 'N', obj: 'bird nest with eggs', title: 'N - Nest' },
  { letter: 'O', obj: 'orange fruit', title: 'O - Orange' },
  { letter: 'P', obj: 'pizza slice', title: 'P - Pizza' },
  { letter: 'Q', obj: 'queen with crown', title: 'Q - Queen' },
  { letter: 'R', obj: 'rabbit', title: 'R - Rabbit' },
  { letter: 'S', obj: 'smiling sun', title: 'S - Sun' },
  { letter: 'T', obj: 'tree', title: 'T - Tree' },
  { letter: 'U', obj: 'umbrella', title: 'U - Umbrella' },
  { letter: 'V', obj: 'violin', title: 'V - Violin' },
  { letter: 'W', obj: 'whale', title: 'W - Whale' },
  { letter: 'X', obj: 'xylophone', title: 'X - Xylophone' },
  { letter: 'Y', obj: 'yacht boat', title: 'Y - Yacht' },
  { letter: 'Z', obj: 'zebra', title: 'Z - Zebra' },
];

// ===== SAYILAR FIXES =====
const SAYILAR_FIXES = [
  { num: 5, obj: 'exactly 5 stars arranged in a row', idx: '05' },
  { num: 6, obj: 'exactly 6 butterflies arranged in 2 rows of 3', idx: '06' },
  { num: 7, obj: 'exactly 7 balloons in a group', idx: '07' },
  { num: 9, obj: 'exactly 9 hearts arranged in 3 rows of 3', idx: '09' },
  { num: 10, obj: 'exactly 10 small circles arranged in 2 rows of 5', idx: '10' },
];

// ===== GEZEGENLER FIXES =====
const GEZEGEN_FIXES = [
  { idx: '06', prompt: 'giant planet Jupiter with horizontal stripes and bands across it, the great red spot storm visible, largest planet' },
  { idx: '07', prompt: 'planet Saturn with very prominent wide rings, detailed ring system surrounding it, rings clearly visible' },
  { idx: '08', prompt: 'planet Uranus tilted on its side at 90 degrees angle, lying horizontally, smooth blue-green surface, thin faint rings' },
  { idx: '09', prompt: 'planet Neptune with swirling storm patterns on surface, windy stormy dark blue appearance, no visible rings' },
];

async function main() {
  console.log('🔧 BoyaAI Eğitsel Görseller — Düzeltmeler & İngilizce Alfabe');
  console.log('='.repeat(55) + '\n');

  let total = 0, failed = 0;

  // ===== 1. English Alphabet (26 images) =====
  console.log('🔤 English Alphabet (26 görsel)');
  console.log('-'.repeat(40));
  const alphabetImages = [];
  for (let i = 0; i < EN_ALPHABET.length; i++) {
    const item = EN_ALPHABET[i];
    const filename = `alphabet-${item.letter}.png`;
    const outputPath = path.join(BASE_DIR, 'alphabet', filename);

    if (fs.existsSync(outputPath) && fs.statSync(outputPath).size > 1000) {
      console.log(`  ⏭️  ${filename} zaten var`);
      alphabetImages.push({ id: `en${item.letter}`, filename, path: `/stock-coloring/alphabet/${filename}`, category: 'alphabet', title: item.title });
      total++; continue;
    }

    try {
      const size = await gen(`large letter ${item.letter} and a cute ${item.obj} next to it, large simple letter form`, outputPath);
      console.log(`  ✅ ${filename} — "${item.title}" (${(size/1024).toFixed(0)} KB)`);
      alphabetImages.push({ id: `en${item.letter}`, filename, path: `/stock-coloring/alphabet/${filename}`, category: 'alphabet', title: item.title });
      total++;
    } catch (err) {
      console.log(`  ❌ ${filename} — hata: ${err.message}`);
      failed++;
    }
    await sleep(3000);
  }

  // ===== 2. Sayılar Fixes (5 images) =====
  console.log('\n🔢 Sayılar Düzeltmeleri (5 görsel)');
  console.log('-'.repeat(40));
  for (const fix of SAYILAR_FIXES) {
    const filename = `sayilar-${fix.idx}.png`;
    const outputPath = path.join(BASE_DIR, 'sayilar', filename);

    // Delete old version
    if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);

    const prompt = `large number ${fix.num} on the left side, ${fix.obj} on the right side, count them carefully: ${Array.from({length: fix.num}, (_,i) => i+1).join(' ')}`;
    try {
      const size = await gen(prompt, outputPath);
      console.log(`  ✅ ${filename} — yeniden üretildi (${(size/1024).toFixed(0)} KB)`);
      total++;
    } catch (err) {
      console.log(`  ❌ ${filename} — hata: ${err.message}`);
      failed++;
    }
    await sleep(3000);
  }

  // ===== 3. Gezegenler Fixes (4 images) =====
  console.log('\n🪐 Gezegen Düzeltmeleri (4 görsel)');
  console.log('-'.repeat(40));
  for (const fix of GEZEGEN_FIXES) {
    const filename = `gezegenler-${fix.idx}.png`;
    const outputPath = path.join(BASE_DIR, 'gezegenler', filename);

    if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);

    try {
      const size = await gen(fix.prompt, outputPath);
      console.log(`  ✅ ${filename} — yeniden üretildi (${(size/1024).toFixed(0)} KB)`);
      total++;
    } catch (err) {
      console.log(`  ❌ ${filename} — hata: ${err.message}`);
      failed++;
    }
    await sleep(3000);
  }

  // ===== 4. Update stockLibrary.ts =====
  const stockPath = path.resolve(__dirname, '..', 'src', 'constants', 'stockLibrary.ts');
  let stockContent = fs.readFileSync(stockPath, 'utf-8');

  // Add alphabet category if not exists
  if (!stockContent.includes("'alphabet'")) {
    const alphabetCategory = JSON.stringify({
      id: 'alphabet',
      name: 'Alphabet',
      emoji: '🔤',
      images: alphabetImages,
    }, null, 2);

    const closingIdx = stockContent.lastIndexOf('];');
    if (closingIdx > -1) {
      stockContent = stockContent.slice(0, closingIdx) + ',\n  ' + alphabetCategory + '\n' + stockContent.slice(closingIdx);
    }

    // Add EN translations
    if (!stockContent.includes("alphabet: 'Alphabet'")) {
      stockContent = stockContent.replace(
        "gezegenler: 'Planets',",
        "gezegenler: 'Planets',\n  alphabet: 'Alphabet',"
      );
    }

    // Add image title translations
    const enTitles = EN_ALPHABET.map(l => `  '${l.title}': '${l.title}'`).join(',\n');
    stockContent = stockContent.replace(
      /('Z - Zürafa': 'Z - Giraffe',?\n?)/,
      `$1${enTitles},\n`
    );

    fs.writeFileSync(stockPath, stockContent, 'utf-8');
    console.log('\n📄 stockLibrary.ts güncellendi (alphabet kategorisi eklendi)');
  } else {
    console.log('\n📄 stockLibrary.ts zaten güncel');
  }

  console.log('\n' + '='.repeat(55));
  console.log(`📊 Sonuç: ${total} üretildi, ${failed} başarısız`);
}

main().catch((err) => { console.error('Fatal:', err); process.exit(1); });
