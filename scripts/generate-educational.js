const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const OpenAI = require('openai');

require('dotenv').config({ path: path.resolve(__dirname, '..', '.env.local') });

const API_KEY = process.env.OPENAI_API_KEY;
if (!API_KEY) {
  console.error('❌ OPENAI_API_KEY bulunamadı!');
  process.exit(1);
}

const openai = new OpenAI({ apiKey: API_KEY });
const BASE_DIR = path.resolve(__dirname, '..', 'public', 'stock-coloring');

const STYLE = "children's coloring book page for ages 3-5, only thick black outlines on pure white background, every shape must be completely closed and enclosed, no open lines, no gaps in outlines, very simple shapes, cartoon style, no shading, no gradients, no gray";

// Inline post-processing
function dilateBlack(data, width, height) {
  const size = width * height;
  const output = new Uint8Array(size);
  output.fill(255);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[y * width + x] === 0) {
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const ny = y + dy, nx = x + dx;
            if (ny >= 0 && ny < height && nx >= 0 && nx < width) output[ny * width + nx] = 0;
          }
        }
      }
    }
  }
  return output;
}

function morphologicalClose(data, width, height, radius) {
  const size = width * height;
  const input = new Uint8Array(data);
  const dilated = new Uint8Array(size);
  const output = new Uint8Array(size);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let found = false;
      for (let dy = -radius; dy <= radius && !found; dy++)
        for (let dx = -radius; dx <= radius && !found; dx++) {
          const ny = y + dy, nx = x + dx;
          if (ny >= 0 && ny < height && nx >= 0 && nx < width && input[ny * width + nx] === 0) found = true;
        }
      dilated[y * width + x] = found ? 0 : 255;
    }
  }
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let all = true;
      for (let dy = -radius; dy <= radius && all; dy++)
        for (let dx = -radius; dx <= radius && all; dx++) {
          const ny = y + dy, nx = x + dx;
          if (ny >= 0 && ny < height && nx >= 0 && nx < width && dilated[ny * width + nx] !== 0) all = false;
        }
      output[y * width + x] = all ? 0 : 255;
    }
  }
  return output;
}

async function postProcess(rawBuffer) {
  try {
    const t = await sharp(rawBuffer).grayscale().threshold(160).raw().toBuffer({ resolveWithObject: true });
    const d = dilateBlack(t.data, t.info.width, t.info.height);
    const c = morphologicalClose(d, t.info.width, t.info.height, 2);
    return sharp(Buffer.from(c), { raw: { width: t.info.width, height: t.info.height, channels: 1 } }).png().toBuffer();
  } catch {
    return sharp(rawBuffer).grayscale().png().toBuffer();
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ===== CATEGORIES =====

const ALFABE_LETTERS = [
  { letter: 'A', obj: 'lion', titleTr: 'A - Aslan', titleEn: 'A - Lion' },
  { letter: 'B', obj: 'balloon', titleTr: 'B - Balon', titleEn: 'B - Balloon' },
  { letter: 'C', obj: 'wallet', titleTr: 'C - Cüzdan', titleEn: 'C - Wallet' },
  { letter: 'Ç', obj: 'flower', titleTr: 'Ç - Çiçek', titleEn: 'Ç - Flower' },
  { letter: 'D', obj: 'drum', titleTr: 'D - Davul', titleEn: 'D - Drum' },
  { letter: 'E', obj: 'apple', titleTr: 'E - Elma', titleEn: 'E - Apple' },
  { letter: 'F', obj: 'elephant', titleTr: 'F - Fil', titleEn: 'F - Elephant' },
  { letter: 'G', obj: 'ship', titleTr: 'G - Gemi', titleEn: 'G - Ship' },
  { letter: 'Ğ', obj: null, titleTr: 'Ğ', titleEn: 'Ğ' },
  { letter: 'H', obj: 'rooster', titleTr: 'H - Horoz', titleEn: 'H - Rooster' },
  { letter: 'I', obj: 'iguana', titleTr: 'I - Iguana', titleEn: 'I - Iguana' },
  { letter: 'İ', obj: 'cow', titleTr: 'İ - İnek', titleEn: 'İ - Cow' },
  { letter: 'J', obj: 'jeep', titleTr: 'J - Jip', titleEn: 'J - Jeep' },
  { letter: 'K', obj: 'cat', titleTr: 'K - Kedi', titleEn: 'K - Cat' },
  { letter: 'L', obj: 'tulip', titleTr: 'L - Lale', titleEn: 'L - Tulip' },
  { letter: 'M', obj: 'monkey', titleTr: 'M - Maymun', titleEn: 'M - Monkey' },
  { letter: 'N', obj: 'pomegranate', titleTr: 'N - Nar', titleEn: 'N - Pomegranate' },
  { letter: 'O', obj: 'bus', titleTr: 'O - Otobüs', titleEn: 'O - Bus' },
  { letter: 'Ö', obj: 'duck', titleTr: 'Ö - Ördek', titleEn: 'Ö - Duck' },
  { letter: 'P', obj: 'parrot', titleTr: 'P - Papağan', titleEn: 'P - Parrot' },
  { letter: 'R', obj: 'robot', titleTr: 'R - Robot', titleEn: 'R - Robot' },
  { letter: 'S', obj: 'snail', titleTr: 'S - Salyangoz', titleEn: 'S - Snail' },
  { letter: 'Ş', obj: 'umbrella', titleTr: 'Ş - Şemsiye', titleEn: 'Ş - Umbrella' },
  { letter: 'T', obj: 'rabbit', titleTr: 'T - Tavşan', titleEn: 'T - Rabbit' },
  { letter: 'U', obj: 'airplane', titleTr: 'U - Uçak', titleEn: 'U - Airplane' },
  { letter: 'Ü', obj: 'grapes', titleTr: 'Ü - Üzüm', titleEn: 'Ü - Grapes' },
  { letter: 'V', obj: 'vase with flowers', titleTr: 'V - Vazo', titleEn: 'V - Vase' },
  { letter: 'Y', obj: 'star', titleTr: 'Y - Yıldız', titleEn: 'Y - Star' },
  { letter: 'Z', obj: 'giraffe', titleTr: 'Z - Zürafa', titleEn: 'Z - Giraffe' },
];

const SAYILAR = [
  { num: 1, obj: '1 apple', titleTr: '1 - Bir', titleEn: '1 - One' },
  { num: 2, obj: '2 birds', titleTr: '2 - İki', titleEn: '2 - Two' },
  { num: 3, obj: '3 fish', titleTr: '3 - Üç', titleEn: '3 - Three' },
  { num: 4, obj: '4 flowers', titleTr: '4 - Dört', titleEn: '4 - Four' },
  { num: 5, obj: '5 stars', titleTr: '5 - Beş', titleEn: '5 - Five' },
  { num: 6, obj: '6 butterflies', titleTr: '6 - Altı', titleEn: '6 - Six' },
  { num: 7, obj: '7 balloons', titleTr: '7 - Yedi', titleEn: '7 - Seven' },
  { num: 8, obj: '8 leaves', titleTr: '8 - Sekiz', titleEn: '8 - Eight' },
  { num: 9, obj: '9 hearts', titleTr: '9 - Dokuz', titleEn: '9 - Nine' },
  { num: 10, obj: '10 small circles', titleTr: '10 - On', titleEn: '10 - Ten' },
];

const GEZEGENLER = [
  { name: 'Sun', prompt: 'cute smiling sun with rays', titleTr: 'Güneş', titleEn: 'Sun' },
  { name: 'Mercury', prompt: 'small planet Mercury with craters', titleTr: 'Merkür', titleEn: 'Mercury' },
  { name: 'Venus', prompt: 'planet Venus with thick clouds', titleTr: 'Venüs', titleEn: 'Venus' },
  { name: 'Earth', prompt: 'planet Earth with continents and oceans', titleTr: 'Dünya', titleEn: 'Earth' },
  { name: 'Mars', prompt: 'red planet Mars with surface details', titleTr: 'Mars', titleEn: 'Mars' },
  { name: 'Jupiter', prompt: 'large planet Jupiter with bands and great red spot', titleTr: 'Jüpiter', titleEn: 'Jupiter' },
  { name: 'Saturn', prompt: 'planet Saturn with prominent rings', titleTr: 'Satürn', titleEn: 'Saturn' },
  { name: 'Uranus', prompt: 'planet Uranus tilted on its side with rings', titleTr: 'Uranüs', titleEn: 'Uranus' },
  { name: 'Neptune', prompt: 'planet Neptune with stormy surface', titleTr: 'Neptün', titleEn: 'Neptune' },
  { name: 'Moon', prompt: 'earths moon with craters and stars', titleTr: 'Ay', titleEn: 'Moon' },
];

async function generateImage(prompt, outputPath) {
  const response = await openai.images.generate({
    model: 'gpt-image-1-mini',
    prompt: `adorable ${prompt}, ${STYLE}`,
    n: 1,
    size: '1024x1024',
    quality: 'low',
  });

  const imageData = response.data?.[0];
  if (!imageData?.b64_json && !imageData?.url) throw new Error('No image data');

  let rawBuffer;
  if (imageData.b64_json) {
    rawBuffer = Buffer.from(imageData.b64_json, 'base64');
  } else {
    const res = await fetch(imageData.url);
    rawBuffer = Buffer.from(await res.arrayBuffer());
  }

  const processed = await postProcess(rawBuffer);
  fs.writeFileSync(outputPath, processed);
  return processed.length;
}

async function main() {
  console.log('🎓 BoyaAI Eğitsel Görsel Üretici');
  console.log('==================================\n');

  let total = 0, failed = 0;
  const catalogEntries = [];

  // ===== ALFABE =====
  console.log('🔤 Alfabe (29 görsel)');
  console.log('-'.repeat(40));
  const alfabeImages = [];
  for (let i = 0; i < ALFABE_LETTERS.length; i++) {
    const item = ALFABE_LETTERS[i];
    const filename = `alfabe-${item.letter.replace('İ', 'I-dot').replace('Ğ', 'G-soft').replace('Ç', 'C-ced').replace('Ş', 'S-ced').replace('Ö', 'O-uml').replace('Ü', 'U-uml')}.png`;
    const outputPath = path.join(BASE_DIR, 'alfabe', filename);

    if (fs.existsSync(outputPath) && fs.statSync(outputPath).size > 1000) {
      console.log(`  ⏭️  ${filename} zaten var`);
      alfabeImages.push({ id: `al${String(i+1).padStart(2,'0')}`, filename, path: `/stock-coloring/alfabe/${filename}`, category: 'alfabe', title: item.titleTr });
      total++;
      continue;
    }

    const prompt = item.obj
      ? `large letter ${item.letter} and a cute ${item.obj} next to it, large simple letter form`
      : `large letter ${item.letter} in bold decorative style`;

    try {
      const size = await generateImage(prompt, outputPath);
      console.log(`  ✅ ${filename} — "${item.titleTr}" (${(size/1024).toFixed(0)} KB)`);
      alfabeImages.push({ id: `al${String(i+1).padStart(2,'0')}`, filename, path: `/stock-coloring/alfabe/${filename}`, category: 'alfabe', title: item.titleTr });
      total++;
    } catch (err) {
      console.log(`  ❌ ${filename} — hata: ${err.message}`);
      failed++;
    }
    await sleep(3000);
  }
  catalogEntries.push({ id: 'alfabe', name: 'Alfabe', emoji: '🔤', images: alfabeImages });

  // ===== SAYILAR =====
  console.log('\n🔢 Sayılar (10 görsel)');
  console.log('-'.repeat(40));
  const sayilarImages = [];
  for (let i = 0; i < SAYILAR.length; i++) {
    const item = SAYILAR[i];
    const idx = String(i + 1).padStart(2, '0');
    const filename = `sayilar-${idx}.png`;
    const outputPath = path.join(BASE_DIR, 'sayilar', filename);

    if (fs.existsSync(outputPath) && fs.statSync(outputPath).size > 1000) {
      console.log(`  ⏭️  ${filename} zaten var`);
      sayilarImages.push({ id: `sa${idx}`, filename, path: `/stock-coloring/sayilar/${filename}`, category: 'sayilar', title: item.titleTr });
      total++;
      continue;
    }

    const prompt = `large number ${item.num} with ${item.obj} next to it for counting`;
    try {
      const size = await generateImage(prompt, outputPath);
      console.log(`  ✅ ${filename} — "${item.titleTr}" (${(size/1024).toFixed(0)} KB)`);
      sayilarImages.push({ id: `sa${idx}`, filename, path: `/stock-coloring/sayilar/${filename}`, category: 'sayilar', title: item.titleTr });
      total++;
    } catch (err) {
      console.log(`  ❌ ${filename} — hata: ${err.message}`);
      failed++;
    }
    await sleep(3000);
  }
  catalogEntries.push({ id: 'sayilar', name: 'Sayılar', emoji: '🔢', images: sayilarImages });

  // ===== GEZEGENLER =====
  console.log('\n🪐 Gezegenler (10 görsel)');
  console.log('-'.repeat(40));
  const gezegenlerImages = [];
  for (let i = 0; i < GEZEGENLER.length; i++) {
    const item = GEZEGENLER[i];
    const idx = String(i + 1).padStart(2, '0');
    const filename = `gezegenler-${idx}.png`;
    const outputPath = path.join(BASE_DIR, 'gezegenler', filename);

    if (fs.existsSync(outputPath) && fs.statSync(outputPath).size > 1000) {
      console.log(`  ⏭️  ${filename} zaten var`);
      gezegenlerImages.push({ id: `ge${idx}`, filename, path: `/stock-coloring/gezegenler/${filename}`, category: 'gezegenler', title: item.titleTr });
      total++;
      continue;
    }

    try {
      const size = await generateImage(item.prompt, outputPath);
      console.log(`  ✅ ${filename} — "${item.titleTr}" (${(size/1024).toFixed(0)} KB)`);
      gezegenlerImages.push({ id: `ge${idx}`, filename, path: `/stock-coloring/gezegenler/${filename}`, category: 'gezegenler', title: item.titleTr });
      total++;
    } catch (err) {
      console.log(`  ❌ ${filename} — hata: ${err.message}`);
      failed++;
    }
    await sleep(3000);
  }
  catalogEntries.push({ id: 'gezegenler', name: 'Gezegenler', emoji: '🪐', images: gezegenlerImages });

  // ===== Update stockLibrary.ts (append new categories) =====
  const stockPath = path.resolve(__dirname, '..', 'src', 'constants', 'stockLibrary.ts');
  let stockContent = fs.readFileSync(stockPath, 'utf-8');

  // Find the closing of STOCK_CATEGORIES array and insert before it
  const closingIdx = stockContent.lastIndexOf('];');
  if (closingIdx > -1) {
    // Check if categories already exist
    if (!stockContent.includes("'alfabe'")) {
      const newEntries = catalogEntries.map(c => JSON.stringify(c, null, 2)).join(',\n  ');
      stockContent = stockContent.slice(0, closingIdx) + ',\n  ' + newEntries + '\n' + stockContent.slice(closingIdx);
      fs.writeFileSync(stockPath, stockContent, 'utf-8');
      console.log('\n📄 stockLibrary.ts güncellendi');
    } else {
      console.log('\n📄 stockLibrary.ts zaten güncel');
    }
  }

  // ===== Add EN translations =====
  // Add to CATEGORY_NAMES_EN
  if (!stockContent.includes("alfabe: 'Alphabet'")) {
    stockContent = fs.readFileSync(stockPath, 'utf-8');
    stockContent = stockContent.replace(
      "tatil: 'Holidays',",
      "tatil: 'Holidays',\n  alfabe: 'Alphabet',\n  sayilar: 'Numbers',\n  gezegenler: 'Planets',"
    );
    // Add IMAGE_TITLES_EN for new categories
    const newTitles = {};
    ALFABE_LETTERS.forEach(l => { newTitles[l.titleTr] = l.titleEn; });
    SAYILAR.forEach(s => { newTitles[s.titleTr] = s.titleEn; });
    GEZEGENLER.forEach(g => { newTitles[g.titleTr] = g.titleEn; });

    const titleEntries = Object.entries(newTitles).map(([k, v]) => `  '${k}': '${v}'`).join(',\n');
    stockContent = stockContent.replace(
      "'Hediye Kutusu': 'Gift Box',",
      `'Hediye Kutusu': 'Gift Box',\n${titleEntries},`
    );
    fs.writeFileSync(stockPath, stockContent, 'utf-8');
    console.log('📄 EN çeviriler eklendi');
  }

  console.log('\n==================================');
  console.log(`📊 Sonuç: ${total} üretildi, ${failed} başarısız`);
  console.log(`📁 Toplam: ${total}/${total + failed}`);
}

main().catch((err) => {
  console.error('Fatal hata:', err);
  process.exit(1);
});
