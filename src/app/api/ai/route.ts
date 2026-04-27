import { NextRequest, NextResponse } from 'next/server';

// Note: AI features require z-ai-web-dev-sdk (sandbox-only).
// On Vercel, you can replace this with OpenAI, Google Gemini, etc.
export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();

    return NextResponse.json(
      {
        error: `AI features (${action || 'unknown'}) are not available on this deployment. To enable them, configure an AI API (e.g., OpenAI) in /api/ai/route.ts.`,
      },
      { status: 503 }
    );
  } catch {
    return NextResponse.json(
      { error: 'AI service is not configured.' },
      { status: 503 }
    );
  }
}
