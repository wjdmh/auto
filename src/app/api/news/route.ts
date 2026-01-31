import { NextResponse } from 'next/server';
import { translateToKorean } from '@/lib/translate';

export const dynamic = 'force-dynamic';

const ALPACA_DATA_URL = process.env.ALPACA_DATA_URL || 'https://data.alpaca.markets';
const headers: HeadersInit = {
  'APCA-API-KEY-ID': process.env.ALPACA_API_KEY || '',
  'APCA-API-SECRET-KEY': process.env.ALPACA_SECRET_KEY || '',
};

interface AlpacaNewsItem {
  headline: string;
  summary: string;
  source: string;
  url: string;
  symbols: string[];
  created_at: string;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const symbols = searchParams.get('symbols') || '';
    const limit = searchParams.get('limit') || '10';

    const params = new URLSearchParams({ limit });
    if (symbols) params.set('symbols', symbols);

    const res = await fetch(
      `${ALPACA_DATA_URL}/v1beta1/news?${params.toString()}`,
      { headers, cache: 'no-store' }
    );

    if (!res.ok) {
      return NextResponse.json({ error: 'News fetch failed' }, { status: res.status });
    }

    const data = await res.json();
    const newsItems: AlpacaNewsItem[] = data.news || [];

    // 헤드라인 한글 번역
    const headlines = newsItems.map((n) => n.headline).filter(Boolean);
    const translations = await translateToKorean(headlines);

    const news = newsItems.map((item) => ({
      headline: translations.get(item.headline) || item.headline,
      headlineOriginal: item.headline,
      source: item.source,
      url: item.url,
      symbols: item.symbols || [],
      createdAt: item.created_at,
    }));

    return NextResponse.json({ news });
  } catch (error) {
    console.error('News API Error:', error);
    return NextResponse.json({ error: 'Failed to load news' }, { status: 500 });
  }
}
