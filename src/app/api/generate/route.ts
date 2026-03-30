import { NextResponse } from 'next/server';
import sharp from 'sharp';
import { buildImagePrompt } from '@/lib/ai/translatePrompt';
import { checkContentSafety } from '@/lib/ai/contentFilter';
import { dilateBlack, morphologicalClose } from '@/lib/canvas/imageProcessing';
import { MOCK_COLORING_IMAGES } from '@/constants/limits';

// In-memory daily rate limit per IP
const dailyUsage = new Map<string, { count: number; date: string }>();
const DAILY_LIMIT = 3;

function getTodayStr() {
  return new Date().toISOString().slice(0, 10);
}

function checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
  const today = getTodayStr();
  const entry = dailyUsage.get(ip);

  if (!entry || entry.date !== today) {
    dailyUsage.set(ip, { count: 0, date: today });
    return { allowed: true, remaining: DAILY_LIMIT };
  }

  if (entry.count >= DAILY_LIMIT) {
    return { allowed: false, remaining: 0 };
  }

  return { allowed: true, remaining: DAILY_LIMIT - entry.count };
}

function incrementUsage(ip: string) {
  const today = getTodayStr();
  const entry = dailyUsage.get(ip);
  if (entry && entry.date === today) {
    entry.count++;
  } else {
    dailyUsage.set(ip, { count: 1, date: today });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { prompt } = body;

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Lütfen bir açıklama girin.' },
        { status: 400 }
      );
    }

    // Rate limit check
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || 'unknown';
    const rateCheck = checkRateLimit(ip);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { success: false, error: 'Bugünkü hakkın doldu! Yarın tekrar gel 🌟' },
        { status: 429 }
      );
    }

    const safety = checkContentSafety(prompt);
    if (!safety.safe) {
      return NextResponse.json(
        { success: false, error: safety.reason },
        { status: 400 }
      );
    }

    const imagePrompt = buildImagePrompt(prompt.trim());
    console.log('[BoyaAI] Prompt:', imagePrompt.substring(0, 120) + '...');

    // Read API key from server environment
    const apiKey = process.env.POLLINATIONS_API_KEY?.trim();
    if (!apiKey) {
      console.warn('[BoyaAI] POLLINATIONS_API_KEY not set in .env.local — using mock images');
      return serveMock();
    }

    const encodedPrompt = encodeURIComponent(imagePrompt);

    // Try Pollinations.ai endpoints in order
    interface Endpoint {
      name: string;
      method: string;
      url: string;
      headers: Record<string, string>;
      body?: string;
      parseImage: (res: Response) => Promise<Buffer | null>;
    }

    const endpoints: Endpoint[] = [
      {
        name: 'Image API (key param)',
        method: 'GET',
        url: `https://image.pollinations.ai/prompt/${encodedPrompt}?width=512&height=512&nologo=true&model=flux&key=${encodeURIComponent(apiKey)}`,
        headers: {},
        parseImage: async (res: Response): Promise<Buffer | null> => {
          const ct = res.headers.get('content-type') || '';
          if (ct.startsWith('image/')) return Buffer.from(await res.arrayBuffer());
          return null;
        },
      },
      {
        name: 'Image API (Bearer)',
        method: 'GET',
        url: `https://image.pollinations.ai/prompt/${encodedPrompt}?width=512&height=512&nologo=true&model=flux`,
        headers: { 'Authorization': `Bearer ${apiKey}` },
        parseImage: async (res: Response): Promise<Buffer | null> => {
          const ct = res.headers.get('content-type') || '';
          if (ct.startsWith('image/')) return Buffer.from(await res.arrayBuffer());
          return null;
        },
      },
      {
        name: 'Image API (key param)',
        method: 'GET',
        url: `https://image.pollinations.ai/prompt/${encodedPrompt}?width=512&height=512&nologo=true&model=flux&key=${encodeURIComponent(apiKey)}`,
        headers: {},
        parseImage: async (res: Response): Promise<Buffer | null> => {
          const ct = res.headers.get('content-type') || '';
          if (ct.startsWith('image/')) return Buffer.from(await res.arrayBuffer());
          return null;
        },
      },
    ];

    for (const ep of endpoints) {
      console.log(`[BoyaAI] Trying: ${ep.name}`);
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 60000);

        const res = await fetch(ep.url, {
          method: ep.method,
          headers: ep.headers,
          body: ep.body,
          redirect: 'follow',
          signal: controller.signal,
        });
        clearTimeout(timeout);

        console.log(`[BoyaAI] ${ep.name}: status=${res.status} ct=${res.headers.get('content-type')}`);

        if (!res.ok) {
          const errText = await res.text().catch(() => '');
          console.log(`[BoyaAI] ${ep.name} error:`, errText.substring(0, 300));
          continue;
        }

        const rawBuffer = await ep.parseImage(res);
        if (!rawBuffer || rawBuffer.length < 1000) {
          console.log(`[BoyaAI] ${ep.name}: no valid image (${rawBuffer?.length || 0} bytes)`);
          continue;
        }

        console.log(`[BoyaAI] ${ep.name}: raw ${(rawBuffer.length / 1024).toFixed(0)} KB`);

        const processed = await postProcess(rawBuffer);
        console.log(`[BoyaAI] Processed: ${(processed.length / 1024).toFixed(0)} KB`);

        // Count successful generation
        incrementUsage(ip);

        const dataUrl = `data:image/png;base64,${processed.toString('base64')}`;
        return NextResponse.json({ success: true, imageUrl: dataUrl, source: 'ai' });
      } catch (err) {
        console.error(`[BoyaAI] ${ep.name} exception:`, err);
      }
    }

    console.log('[BoyaAI] All Pollinations endpoints failed, using mock');
    return serveMock();
  } catch (err) {
    console.error('[BoyaAI] Outer error:', err);
    return NextResponse.json(
      { success: false, error: 'Bir hata oluştu. Lütfen tekrar deneyin.' },
      { status: 500 }
    );
  }
}

async function postProcess(rawBuffer: Buffer): Promise<Buffer> {
  try {
    const thresholded = await sharp(rawBuffer)
      .grayscale()
      .threshold(160)
      .raw()
      .toBuffer({ resolveWithObject: true });

    const { width, height } = thresholded.info;
    const dilated = dilateBlack(thresholded.data, width, height);
    const closed = morphologicalClose(dilated, width, height, 2);

    return await sharp(Buffer.from(closed), {
      raw: { width, height, channels: 1 },
    }).png().toBuffer();
  } catch {
    return await sharp(rawBuffer).grayscale().png().toBuffer();
  }
}

function serveMock() {
  const idx = Math.floor(Math.random() * MOCK_COLORING_IMAGES.length);
  return NextResponse.json({ success: true, imageUrl: MOCK_COLORING_IMAGES[idx], source: 'mock' });
}
