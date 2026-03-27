import { NextResponse } from 'next/server';
import { MOCK_COLORING_IMAGES } from '@/constants/limits';

// TODO: Replace this mock implementation with actual AI image generation API
// Planned integration: OpenAI DALL-E or Stability AI for generating coloring pages
// The API will receive a prompt and return a black-and-white coloring page image

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { prompt } = body;

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Lütfen bir açıklama girin.' },
        { status: 400 }
      );
    }

    // Simulate API delay (2 seconds)
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Pick a random mock image
    const randomIndex = Math.floor(Math.random() * MOCK_COLORING_IMAGES.length);
    const imageUrl = MOCK_COLORING_IMAGES[randomIndex];

    return NextResponse.json({
      success: true,
      imageUrl,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Bir hata oluştu. Lütfen tekrar deneyin.' },
      { status: 500 }
    );
  }
}
