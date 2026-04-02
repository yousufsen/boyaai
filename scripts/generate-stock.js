const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const OpenAI = require('openai');

// Load .env.local
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env.local') });

const API_KEY = process.env.OPENAI_API_KEY;
if (!API_KEY) {
  console.error('❌ OPENAI_API_KEY bulunamadı! .env.local dosyasına ekleyin.');
  process.exit(1);
}

const openai = new OpenAI({ apiKey: API_KEY });
const BASE_DIR = path.resolve(__dirname, '..', 'public', 'stock-coloring');

const STYLE_SUFFIX = "children's coloring book page for ages 3-5, only thick black outlines on pure white background, every shape must be completely closed and enclosed, no open lines, no gaps in outlines, very simple shapes with minimal detail, maximum 8-10 large shapes, no shading, no gradients, no gray tones, no texture, no crosshatching, cute cartoon style, lines must be thick enough that a child can color inside them easily";

const CATEGORIES = [
  {
    id: 'hayvanlar', name: 'Hayvanlar', emoji: '🦁',
    subjects: [
      { title: 'Sevimli Kedi', prompt: 'cute cat sitting' },
      { title: 'Neşeli Köpek', prompt: 'happy puppy playing' },
      { title: 'Cesur Aslan', prompt: 'friendly lion cub' },
      { title: 'Kocaman Fil', prompt: 'baby elephant with big ears' },
      { title: 'Güzel Kelebek', prompt: 'beautiful butterfly with big wings' },
      { title: 'Şirin Tavşan', prompt: 'cute bunny rabbit with carrot' },
      { title: 'Renkli Balık', prompt: 'tropical fish in water with bubbles' },
      { title: 'Ötücü Kuş', prompt: 'cute bird sitting on a branch' },
      { title: 'Zarif At', prompt: 'beautiful horse running in meadow' },
      { title: 'Tatlı Ayı', prompt: 'cute bear cub with honey pot' },
    ]
  },
  {
    id: 'uzay', name: 'Uzay', emoji: '🚀',
    subjects: [
      { title: 'Roket', prompt: 'rocket ship flying in space with stars' },
      { title: 'Astronot', prompt: 'cute astronaut floating in space' },
      { title: 'Gezegen', prompt: 'planet saturn with rings and stars' },
      { title: 'Yıldızlar', prompt: 'smiling stars and moon in night sky' },
      { title: 'Uzaylı', prompt: 'friendly cute alien waving hello' },
      { title: 'Uzay Gemisi', prompt: 'spaceship with windows and stars' },
      { title: 'Ay', prompt: 'crescent moon with sleeping face and stars' },
      { title: 'Güneş', prompt: 'happy smiling sun with rays' },
      { title: 'Satürn', prompt: 'planet with rings surrounded by stars' },
      { title: 'UFO', prompt: 'cute flying saucer ufo with alien inside' },
    ]
  },
  {
    id: 'deniz', name: 'Deniz & Okyanus', emoji: '🌊',
    subjects: [
      { title: 'Balina', prompt: 'happy whale swimming in ocean' },
      { title: 'Yunus', prompt: 'dolphin jumping over waves' },
      { title: 'Ahtapot', prompt: 'cute octopus with hat underwater' },
      { title: 'Deniz Atı', prompt: 'seahorse among seaweed and bubbles' },
      { title: 'Kaplumbağa', prompt: 'sea turtle swimming underwater' },
      { title: 'Yengeç', prompt: 'cute crab on sandy beach' },
      { title: 'Denizanası', prompt: 'jellyfish with flowing tentacles' },
      { title: 'Köpekbalığı', prompt: 'friendly smiling baby shark' },
      { title: 'Deniz Kızı', prompt: 'cute mermaid with long hair underwater' },
      { title: 'Deniz Yıldızı', prompt: 'starfish on beach with shells' },
    ]
  },
  {
    id: 'masallar', name: 'Masallar & Fantazi', emoji: '🏰',
    subjects: [
      { title: 'Prenses', prompt: 'beautiful princess with crown and dress' },
      { title: 'Kale', prompt: 'fairy tale castle with towers and flags' },
      { title: 'Ejderha', prompt: 'cute baby dragon breathing small fire' },
      { title: 'Unicorn', prompt: 'magical unicorn with rainbow mane' },
      { title: 'Peri', prompt: 'fairy with wings and magic wand' },
      { title: 'Şövalye', prompt: 'brave knight with sword and shield' },
      { title: 'Büyücü', prompt: 'wizard with hat and magic staff' },
      { title: 'Taç', prompt: 'royal crown with jewels and gems' },
      { title: 'Sihirli Lamba', prompt: 'magic genie lamp with sparkles' },
      { title: 'Korsan', prompt: 'pirate with hat and treasure map' },
    ]
  },
  {
    id: 'araclar', name: 'Araçlar & Taşıtlar', emoji: '🚗',
    subjects: [
      { title: 'Araba', prompt: 'cute cartoon car on road' },
      { title: 'Kamyon', prompt: 'big truck driving on highway' },
      { title: 'Uçak', prompt: 'airplane flying through clouds' },
      { title: 'Tren', prompt: 'steam train on railroad tracks' },
      { title: 'Helikopter', prompt: 'helicopter flying in sky' },
      { title: 'Gemi', prompt: 'sailing ship on ocean waves' },
      { title: 'Bisiklet', prompt: 'bicycle with basket of flowers' },
      { title: 'Otobüs', prompt: 'school bus with happy windows' },
      { title: 'Motosiklet', prompt: 'motorcycle with cool design' },
      { title: 'İtfaiye', prompt: 'fire truck with ladder and lights' },
    ]
  },
  {
    id: 'doga', name: 'Doğa & Çiçekler', emoji: '🌸',
    subjects: [
      { title: 'Çiçek Bahçesi', prompt: 'garden with flowers and butterflies' },
      { title: 'Büyük Ağaç', prompt: 'big tree with leaves and birds' },
      { title: 'Gökkuşağı', prompt: 'rainbow over hills with clouds' },
      { title: 'Dağ Manzarası', prompt: 'mountains with trees and river' },
      { title: 'Şelale', prompt: 'waterfall in forest with rocks' },
      { title: 'Mantar', prompt: 'cute mushroom house with door and windows' },
      { title: 'Yaprak', prompt: 'autumn leaves falling from tree' },
      { title: 'Gül', prompt: 'beautiful rose flower with stem and leaves' },
      { title: 'Ayçiçeği', prompt: 'big sunflower with happy face' },
      { title: 'Orman', prompt: 'forest with tall trees and path' },
    ]
  },
  {
    id: 'dinozorlar', name: 'Dinozorlar', emoji: '🦕',
    subjects: [
      { title: 'T-Rex', prompt: 'cute t-rex dinosaur roaring' },
      { title: 'Triceratops', prompt: 'triceratops with three horns' },
      { title: 'Stegosaurus', prompt: 'stegosaurus with plates on back' },
      { title: 'Pterodactyl', prompt: 'pterodactyl flying in sky' },
      { title: 'Brontosaurus', prompt: 'long neck brontosaurus eating leaves' },
      { title: 'Raptor', prompt: 'cute velociraptor running' },
      { title: 'Dinozor Yumurtası', prompt: 'dinosaur egg hatching with baby inside' },
      { title: 'Yanardağ', prompt: 'volcano erupting with dinosaur watching' },
      { title: 'Bebek Dino', prompt: 'adorable baby dinosaur playing' },
      { title: 'Dino Ailesi', prompt: 'dinosaur family mother and baby' },
    ]
  },
  {
    id: 'yiyecekler', name: 'Yiyecekler', emoji: '🍕',
    subjects: [
      { title: 'Pasta', prompt: 'birthday cake with candles' },
      { title: 'Dondurma', prompt: 'ice cream cone with three scoops' },
      { title: 'Pizza', prompt: 'pizza slice with toppings' },
      { title: 'Meyveler', prompt: 'fruits basket with apple banana grapes' },
      { title: 'Cupcake', prompt: 'cupcake with frosting and cherry on top' },
      { title: 'Kurabiye', prompt: 'gingerbread cookie man smiling' },
      { title: 'Donut', prompt: 'donut with sprinkles and frosting' },
      { title: 'Şeker', prompt: 'candy and lollipop collection' },
      { title: 'Hamburger', prompt: 'big hamburger with cheese and lettuce' },
      { title: 'Karpuz', prompt: 'watermelon slice with seeds' },
    ]
  },
  {
    id: 'sehir', name: 'Ev & Şehir', emoji: '🏠',
    subjects: [
      { title: 'Ev', prompt: 'cute house with garden and fence' },
      { title: 'Binalar', prompt: 'city buildings and skyscrapers' },
      { title: 'Okul', prompt: 'school building with clock and flag' },
      { title: 'Oyun Parkı', prompt: 'playground with slide and swings' },
      { title: 'Park', prompt: 'park with bench trees and fountain' },
      { title: 'Köprü', prompt: 'bridge over river with boats' },
      { title: 'Deniz Feneri', prompt: 'lighthouse on rocky shore with waves' },
      { title: 'Yel Değirmeni', prompt: 'windmill in flower field' },
      { title: 'Çiftlik', prompt: 'farm barn with animals and tractor' },
      { title: 'Tren İstasyonu', prompt: 'train station with platform and clock' },
    ]
  },
  {
    id: 'tatil', name: 'Tatil & Özel Günler', emoji: '🎄',
    subjects: [
      { title: 'Noel Ağacı', prompt: 'christmas tree with ornaments and star' },
      { title: 'Cadılar Bayramı', prompt: 'halloween pumpkin with hat smiling' },
      { title: 'Paskalya', prompt: 'easter eggs in basket with bunny' },
      { title: 'Doğum Günü', prompt: 'birthday party with balloons and cake' },
      { title: 'Kardan Adam', prompt: 'snowman with scarf and hat in winter' },
      { title: 'Noel Baba', prompt: 'santa claus with gift bag smiling' },
      { title: 'Balkabağı', prompt: 'cute pumpkin with face' },
      { title: 'Sevgililer Günü', prompt: 'hearts and flowers valentine' },
      { title: 'Havai Fişek', prompt: 'fireworks in night sky celebration' },
      { title: 'Hediye Kutusu', prompt: 'gift box with ribbon and bow' },
    ]
  },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Inline post-processing (same logic as API route)
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
            if (ny >= 0 && ny < height && nx >= 0 && nx < width) {
              output[ny * width + nx] = 0;
            }
          }
        }
      }
    }
  }
  return output;
}

function morphologicalClose(data, width, height, radius) {
  const size = width * height;
  const input = new Uint8Array(size);
  const dilated = new Uint8Array(size);
  const output = new Uint8Array(size);
  for (let i = 0; i < size; i++) input[i] = data[i];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      let foundBlack = false;
      for (let dy = -radius; dy <= radius && !foundBlack; dy++) {
        for (let dx = -radius; dx <= radius && !foundBlack; dx++) {
          const ny = y + dy, nx = x + dx;
          if (ny >= 0 && ny < height && nx >= 0 && nx < width && input[ny * width + nx] === 0) foundBlack = true;
        }
      }
      dilated[idx] = foundBlack ? 0 : 255;
    }
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      let allBlack = true;
      for (let dy = -radius; dy <= radius && allBlack; dy++) {
        for (let dx = -radius; dx <= radius && allBlack; dx++) {
          const ny = y + dy, nx = x + dx;
          if (ny >= 0 && ny < height && nx >= 0 && nx < width && dilated[ny * width + nx] !== 0) allBlack = false;
        }
      }
      output[idx] = allBlack ? 0 : 255;
    }
  }
  return output;
}

async function postProcess(rawBuffer) {
  try {
    const thresholded = await sharp(rawBuffer)
      .grayscale()
      .threshold(160)
      .raw()
      .toBuffer({ resolveWithObject: true });

    const { width, height } = thresholded.info;
    const dilated = dilateBlack(thresholded.data, width, height);
    const closed = morphologicalClose(dilated, width, height, 2);

    return sharp(Buffer.from(closed), {
      raw: { width, height, channels: 1 },
    }).png().toBuffer();
  } catch {
    return sharp(rawBuffer).grayscale().png().toBuffer();
  }
}

async function generateImage(subject, outputPath) {
  const fullPrompt = `adorable ${subject.prompt}, ${STYLE_SUFFIX}`;

  const response = await openai.images.generate({
    model: 'gpt-image-1-mini',
    prompt: fullPrompt,
    n: 1,
    size: '1024x1024',
    quality: 'low',
  });

  const imageData = response.data?.[0];
  if (!imageData) throw new Error('No image data in response');

  let rawBuffer;
  if (imageData.b64_json) {
    rawBuffer = Buffer.from(imageData.b64_json, 'base64');
  } else if (imageData.url) {
    const res = await fetch(imageData.url);
    if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
    rawBuffer = Buffer.from(await res.arrayBuffer());
  } else {
    throw new Error('No image data');
  }

  const processed = await postProcess(rawBuffer);
  fs.writeFileSync(outputPath, processed);
  return processed.length;
}

async function main() {
  console.log('🎨 BoyaAI Stok Boyama Kütüphanesi Üretici (OpenAI)');
  console.log('===================================================\n');

  let totalGenerated = 0;
  let totalFailed = 0;
  const catalogData = [];

  for (const cat of CATEGORIES) {
    console.log(`\n${cat.emoji} ${cat.name} (${cat.id})`);
    console.log('-'.repeat(40));

    const catDir = path.join(BASE_DIR, cat.id);
    fs.mkdirSync(catDir, { recursive: true });

    const images = [];

    for (let i = 0; i < cat.subjects.length; i++) {
      const subject = cat.subjects[i];
      const idx = String(i + 1).padStart(2, '0');
      const filename = `${cat.id}-${idx}.png`;
      const outputPath = path.join(catDir, filename);

      // Skip if already exists
      if (fs.existsSync(outputPath)) {
        const stats = fs.statSync(outputPath);
        if (stats.size > 1000) {
          console.log(`  ⏭️  ${filename} zaten var (${(stats.size / 1024).toFixed(0)} KB), atlanıyor`);
          images.push({
            id: `${cat.id[0]}${idx}`,
            filename,
            path: `/stock-coloring/${cat.id}/${filename}`,
            category: cat.id,
            title: subject.title,
          });
          totalGenerated++;
          continue;
        }
      }

      try {
        const size = await generateImage(subject, outputPath);
        console.log(`  ✅ ${filename} — "${subject.title}" üretildi (${(size / 1024).toFixed(0)} KB)`);
        images.push({
          id: `${cat.id[0]}${idx}`,
          filename,
          path: `/stock-coloring/${cat.id}/${filename}`,
          category: cat.id,
          title: subject.title,
        });
        totalGenerated++;
      } catch (err) {
        console.log(`  ❌ ${filename} — "${subject.title}" hata: ${err.message}`);
        totalFailed++;
      }

      // Rate limit: wait between requests
      await sleep(3000);
    }

    catalogData.push({
      id: cat.id,
      name: cat.name,
      emoji: cat.emoji,
      images,
    });
  }

  // Generate TypeScript catalog file
  const tsContent = `// Auto-generated by scripts/generate-stock.js
// Do not edit manually

export interface StockImage {
  id: string;
  filename: string;
  path: string;
  category: string;
  title: string;
}

export interface StockCategory {
  id: string;
  name: string;
  emoji: string;
  images: StockImage[];
}

export const STOCK_CATEGORIES: StockCategory[] = ${JSON.stringify(catalogData, null, 2)};

export function getStockCategory(id: string): StockCategory | undefined {
  return STOCK_CATEGORIES.find((c) => c.id === id);
}

export function getAllStockImages(): StockImage[] {
  return STOCK_CATEGORIES.flatMap((c) => c.images);
}
`;

  const tsPath = path.resolve(__dirname, '..', 'src', 'constants', 'stockLibrary.ts');
  fs.writeFileSync(tsPath, tsContent, 'utf-8');
  console.log(`\n📄 Katalog dosyası oluşturuldu: src/constants/stockLibrary.ts`);

  console.log('\n===================================================');
  console.log(`📊 Sonuç: ${totalGenerated} üretildi, ${totalFailed} başarısız`);
  console.log(`📁 Toplam: ${totalGenerated}/${totalGenerated + totalFailed}`);
}

main().catch((err) => {
  console.error('Fatal hata:', err);
  process.exit(1);
});
