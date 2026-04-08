# 🎨 ColorWish — Wish it. Color it.

AI-powered coloring app for kids. Describe a scene, AI creates a coloring page, kids color it on canvas.

Çocuklar için yapay zeka destekli boyama uygulaması. Hayal et, dile, boya!

## Features

- 🤖 AI-generated coloring pages (OpenAI gpt-image-1-mini)
- 🖌️ Canvas painting engine (brush, fill, eraser, zoom)
- 📚 100+ stock coloring pages (10 categories)
- 🔤 Educational categories (Alphabet TR/EN, Numbers, Planets)
- ✏️ Free drawing mode
- 🎤 Voice input (Web Speech API)
- 👨‍👩‍👧 Parent panel with PIN protection
- 🌍 Bilingual (Turkish + English)
- 📱 Responsive (mobile + desktop)

## Tech Stack

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS + Framer Motion
- Zustand (state management)
- OpenAI API (image generation)
- Sharp (image post-processing)
- Web Speech API (voice input)
- Canvas API (painting engine)

## Getting Started

```bash
npm install
cp .env.example .env.local  # Add your OpenAI API key
npm run dev
```

## Generate Stock Coloring Pages

```bash
node scripts/generate-stock.js          # 100 base images
node scripts/generate-educational.js    # Alphabet, Numbers, Planets
```

## License

MIT
