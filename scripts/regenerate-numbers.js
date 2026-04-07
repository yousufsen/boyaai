const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const OpenAI = require('openai');

require('dotenv').config({ path: path.resolve(__dirname, '..', '.env.local') });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const DIR = path.resolve(__dirname, '..', 'public', 'stock-coloring', 'sayilar');

function dilateBlack(d, w, h) {
  const o = new Uint8Array(w * h); o.fill(255);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (d[y * w + x] === 0)
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const ny = y + dy, nx = x + dx;
      if (ny >= 0 && ny < h && nx >= 0 && nx < w) o[ny * w + nx] = 0;
    }
  return o;
}
function morphClose(d, w, h, r) {
  const inp = new Uint8Array(d), dil = new Uint8Array(w*h), out = new Uint8Array(w*h);
  for (let y=0;y<h;y++) for (let x=0;x<w;x++) { let f=false; for (let dy=-r;dy<=r&&!f;dy++) for (let dx=-r;dx<=r&&!f;dx++) { const ny=y+dy,nx=x+dx; if(ny>=0&&ny<h&&nx>=0&&nx<w&&inp[ny*w+nx]===0) f=true; } dil[y*w+x]=f?0:255; }
  for (let y=0;y<h;y++) for (let x=0;x<w;x++) { let a=true; for (let dy=-r;dy<=r&&a;dy++) for (let dx=-r;dx<=r&&a;dx++) { const ny=y+dy,nx=x+dx; if(ny>=0&&ny<h&&nx>=0&&nx<w&&dil[ny*w+nx]!==0) a=false; } out[y*w+x]=a?0:255; }
  return out;
}
async function postProcess(buf) {
  const t = await sharp(buf).grayscale().threshold(160).raw().toBuffer({ resolveWithObject: true });
  return sharp(Buffer.from(morphClose(dilateBlack(t.data, t.info.width, t.info.height), t.info.width, t.info.height, 2)),
    { raw: { width: t.info.width, height: t.info.height, channels: 1 } }).png().toBuffer();
}

const ITEMS = [
  { file: 'sayilar-06.png', prompt: "a children's coloring book page with a large bold number 6 on the left side. On the right side there are exactly 6 complete butterflies, arranged neatly in 2 rows of 3. Each butterfly must be fully visible with both wings shown, not cut off at any edge. The butterflies should be centered on the page with plenty of margin around them. Simple cartoon style, thick black outlines on pure white background, no shading, no gray, every shape fully closed" },
  { file: 'sayilar-09.png', prompt: "a children's coloring book page with a large bold number 9 on the left side. On the right side there are exactly 9 simple heart shapes arranged in a neat 3x3 grid (3 rows, 3 columns). Each heart is the same size. Count: row 1 has 3 hearts, row 2 has 3 hearts, row 3 has 3 hearts, total 9 hearts. Simple cartoon style, thick black outlines on pure white background, no shading, no gray, every shape fully closed" },
  { file: 'sayilar-10.png', prompt: "a children's coloring book page with a large bold number 10 on the left side. On the right side there are exactly 10 simple round balls arranged in 2 rows of 5 each. Each ball is a simple circle with a small curved line inside to show it is a ball. Count: top row has 5 balls, bottom row has 5 balls, total 10 balls. Simple cartoon style, thick black outlines on pure white background, no shading, no gray, every shape fully closed" },
];

async function main() {
  console.log('🔢 Sayılar düzeltme (3 görsel)\n');
  for (const item of ITEMS) {
    const out = path.join(DIR, item.file);
    if (fs.existsSync(out)) fs.unlinkSync(out);
    try {
      const r = await openai.images.generate({ model: 'gpt-image-1-mini', prompt: item.prompt, n: 1, size: '1024x1024', quality: 'low' });
      const buf = Buffer.from(r.data[0].b64_json, 'base64');
      const processed = await postProcess(buf);
      fs.writeFileSync(out, processed);
      console.log(`✅ ${item.file} — ${(processed.length/1024).toFixed(0)} KB`);
    } catch (e) { console.log(`❌ ${item.file} — ${e.message}`); }
    await new Promise(r => setTimeout(r, 2000));
  }
  console.log('\nBitti!');
}
main();
