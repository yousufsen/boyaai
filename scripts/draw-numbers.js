const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const DIR = path.resolve(__dirname, '..', 'public', 'stock-coloring', 'sayilar');

function butterfly(cx, cy, size = 130) {
  const s = size;
  return `
    <ellipse cx="${cx - s*0.35}" cy="${cy - s*0.25}" rx="${s*0.4}" ry="${s*0.35}" stroke="black" stroke-width="5" fill="none"/>
    <ellipse cx="${cx + s*0.35}" cy="${cy - s*0.25}" rx="${s*0.4}" ry="${s*0.35}" stroke="black" stroke-width="5" fill="none"/>
    <ellipse cx="${cx - s*0.28}" cy="${cy + s*0.25}" rx="${s*0.3}" ry="${s*0.28}" stroke="black" stroke-width="5" fill="none"/>
    <ellipse cx="${cx + s*0.28}" cy="${cy + s*0.25}" rx="${s*0.3}" ry="${s*0.28}" stroke="black" stroke-width="5" fill="none"/>
    <ellipse cx="${cx}" cy="${cy}" rx="${s*0.06}" ry="${s*0.45}" stroke="black" stroke-width="5" fill="none"/>
    <path d="M ${cx - s*0.03} ${cy - s*0.45} Q ${cx - s*0.15} ${cy - s*0.6} ${cx - s*0.2} ${cy - s*0.55}" stroke="black" stroke-width="4" fill="none"/>
    <path d="M ${cx + s*0.03} ${cy - s*0.45} Q ${cx + s*0.15} ${cy - s*0.6} ${cx + s*0.2} ${cy - s*0.55}" stroke="black" stroke-width="4" fill="none"/>
  `;
}

function heart(cx, cy, size = 130) {
  const s = size;
  return `
    <path d="M ${cx} ${cy + s*0.3}
             C ${cx - s*0.8} ${cy - s*0.1}, ${cx - s*0.7} ${cy - s*0.8}, ${cx} ${cy - s*0.2}
             C ${cx + s*0.7} ${cy - s*0.8}, ${cx + s*0.8} ${cy - s*0.1}, ${cx} ${cy + s*0.3} Z"
          stroke="black" stroke-width="6" fill="none"/>
  `;
}

function circle(cx, cy, s = 60) {
  return `<circle cx="${cx}" cy="${cy}" r="${s}" stroke="black" stroke-width="5" fill="none"/>`;
}

function buildSvg(numText, objectsSvg, fontSize = 600, numX = 280) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <rect width="1024" height="1024" fill="white"/>
  <text x="${numX}" y="540" font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="900" fill="none" stroke="black" stroke-width="10" text-anchor="middle" dominant-baseline="middle">${numText}</text>
  ${objectsSvg}
</svg>`;
}

async function saveSvgAsPng(svg, outputPath) {
  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  fs.writeFileSync(outputPath, png);
  return png.length;
}

async function main() {
  console.log('🔢 Sayılar düzeltme (3 görsel)\n');

  // === 6: 6 kelebek ===
  const bPos = [
    { x: 620, y: 280 }, { x: 850, y: 280 },
    { x: 620, y: 500 }, { x: 850, y: 500 },
    { x: 620, y: 720 }, { x: 850, y: 720 },
  ];
  const svg6 = buildSvg('6', bPos.map(p => butterfly(p.x, p.y, 130)).join('\n'));
  const s6 = await saveSvgAsPng(svg6, path.join(DIR, 'sayilar-06.png'));
  console.log(`✅ sayilar-06.png — 6 butterflies (${(s6/1024).toFixed(0)} KB)`);

  // === 9: 9 kalp ===
  const hPos = [
    { x: 600, y: 260 }, { x: 750, y: 260 }, { x: 900, y: 260 },
    { x: 600, y: 500 }, { x: 750, y: 500 }, { x: 900, y: 500 },
    { x: 600, y: 740 }, { x: 750, y: 740 }, { x: 900, y: 740 },
  ];
  const svg9 = buildSvg('9', hPos.map(p => heart(p.x, p.y, 130)).join('\n'));
  const s9 = await saveSvgAsPng(svg9, path.join(DIR, 'sayilar-09.png'));
  console.log(`✅ sayilar-09.png — 9 hearts (${(s9/1024).toFixed(0)} KB)`);

  // === 10: 10 daire (sayı sağa, daireler daha sağa, taşma yok) ===
  const cPos = [
    { x: 640, y: 180 }, { x: 820, y: 180 },
    { x: 640, y: 340 }, { x: 820, y: 340 },
    { x: 640, y: 500 }, { x: 820, y: 500 },
    { x: 640, y: 660 }, { x: 820, y: 660 },
    { x: 640, y: 820 }, { x: 820, y: 820 },
  ];
  // numX=300 ve fontSize=420 ile 10 sayısı taşmaz
  const svg10 = buildSvg('10', cPos.map(p => circle(p.x, p.y, 60)).join('\n'), 420, 300);
  const s10 = await saveSvgAsPng(svg10, path.join(DIR, 'sayilar-10.png'));
  console.log(`✅ sayilar-10.png — 10 circles (${(s10/1024).toFixed(0)} KB)`);

  console.log('\nBitti!');
}

main().catch(e => console.error(e));
