import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import sharp from 'sharp';
import { buildImagePrompt } from '@/lib/ai/translatePrompt';
import { checkContentSafety } from '@/lib/ai/contentFilter';
import { dilateBlack, morphologicalClose } from '@/lib/canvas/imageProcessing';
import { MOCK_COLORING_IMAGES } from '@/constants/limits';

// In-memory daily rate limit per IP
const dailyUsage = new Map<string, { count: number; date: string }>();
const DAILY_LIMIT = 20;

function getTodayStr() {
  return new Date().toISOString().slice(0, 10);
}

function checkRateLimit(ip: string): boolean {
  const today = getTodayStr();
  const entry = dailyUsage.get(ip);
  if (!entry || entry.date !== today) {
    dailyUsage.set(ip, { count: 0, date: today });
    return true;
  }
  return entry.count < DAILY_LIMIT;
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

    // Rate limit
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || 'unknown';
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { success: false, error: 'Bugünkü hakkın doldu! Yarın tekrar gel 🌟' },
        { status: 429 }
      );
    }

    // Content safety
    const safety = checkContentSafety(prompt);
    if (!safety.safe) {
      return NextResponse.json(
        { success: false, error: safety.reason },
        { status: 400 }
      );
    }

    const imagePrompt = buildImagePrompt(prompt.trim());
    console.log('[ColorWish] Prompt:', imagePrompt);

    // Check API key
    const apiKey = process.env.OPENAI_API_KEY?.trim();
    if (!apiKey) {
      console.warn('[ColorWish] OPENAI_API_KEY not set — using mock images');
      return serveMock();
    }

    // Generate image with OpenAI (with 1 retry on rate limit)
    const openai = new OpenAI({ apiKey });

    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        console.log(`[ColorWish] Calling OpenAI gpt-image-1-mini (attempt ${attempt + 1})...`);
        const response = await openai.images.generate({
          model: 'gpt-image-1-mini',
          prompt: imagePrompt,
          n: 1,
          size: '1024x1024',
          quality: 'low',
        });

        const imageData = response.data?.[0];
        if (!imageData) {
          console.error('[ColorWish] No image data in response');
          return serveMock();
        }

        let rawBuffer: Buffer;

        if (imageData.b64_json) {
          rawBuffer = Buffer.from(imageData.b64_json, 'base64');
          console.log('[ColorWish] Got base64 image:', (rawBuffer.length / 1024).toFixed(0), 'KB');
        } else if (imageData.url) {
          console.log('[ColorWish] Got image URL, fetching...');
          const imgRes = await fetch(imageData.url);
          if (!imgRes.ok) {
            console.error('[ColorWish] Failed to fetch image URL:', imgRes.status);
            return serveMock();
          }
          rawBuffer = Buffer.from(await imgRes.arrayBuffer());
          console.log('[ColorWish] Fetched image:', (rawBuffer.length / 1024).toFixed(0), 'KB');
        } else {
          console.error('[ColorWish] No image URL or b64_json in response');
          return serveMock();
        }

        const processed = await postProcess(rawBuffer);
        console.log('[ColorWish] Processed:', (processed.length / 1024).toFixed(0), 'KB');

        incrementUsage(ip);

        const dataUrl = `data:image/png;base64,${processed.toString('base64')}`;
        return NextResponse.json({ success: true, imageUrl: dataUrl, source: 'ai' });
      } catch (err) {
        if (err instanceof OpenAI.APIError) {
          console.error(`[ColorWish] OpenAI API hatası: ${err.status} ${err.message}`);

          if (err.status === 429) {
            if (attempt === 0) {
              console.log('[ColorWish] Rate limited, 10 saniye bekleyip tekrar deneniyor...');
              await new Promise((r) => setTimeout(r, 10000));
              continue; // retry
            }
            return NextResponse.json(
              { success: false, error: 'Çok hızlısın! 30 saniye bekle ve tekrar dene ⏳' },
              { status: 429 }
            );
          }

          if (err.status === 402) {
            return NextResponse.json(
              { success: false, error: 'API bakiyesi bitti 💰' },
              { status: 502 }
            );
          }

          if (err.status === 400) {
            return NextResponse.json(
              { success: false, error: 'Bu prompt ile görsel üretilemedi, başka bir şey dene 🔄' },
              { status: 400 }
            );
          }

          return NextResponse.json(
            { success: false, error: 'Bir şeyler ters gitti, tekrar dene 🔄' },
            { status: 502 }
          );
        }

        console.error('[ColorWish] Beklenmeyen hata:', err);
        return serveMock();
      }
    }

    return serveMock();
  } catch (err) {
    console.error('[ColorWish] Outer error:', err);
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
  console.log('[ColorWish] Mock fallback:', MOCK_COLORING_IMAGES[idx]);
  return NextResponse.json({ success: true, imageUrl: MOCK_COLORING_IMAGES[idx], source: 'mock' });
}
