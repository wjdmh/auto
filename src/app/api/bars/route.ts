import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const ALPACA_DATA_URL = process.env.ALPACA_DATA_URL || 'https://data.alpaca.markets';
const headers: HeadersInit = {
  'APCA-API-KEY-ID': process.env.ALPACA_API_KEY || '',
  'APCA-API-SECRET-KEY': process.env.ALPACA_SECRET_KEY || '',
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');

    if (!symbol) {
      return NextResponse.json({ error: 'symbol required' }, { status: 400 });
    }

    // 당일 5분봉 데이터 조회
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const res = await fetch(
      `${ALPACA_DATA_URL}/v2/stocks/${symbol}/bars?timeframe=5Min&limit=78&sort=asc&feed=iex`,
      { headers, cache: 'no-store' }
    );

    if (!res.ok) {
      return NextResponse.json({ error: 'Alpaca bars error' }, { status: res.status });
    }

    const data = await res.json();
    const bars = (data.bars || []).map((bar: { t: string; c: number; v: number }) => ({
      time: bar.t,
      price: bar.c,
      volume: bar.v,
    }));

    return NextResponse.json({ symbol, bars });
  } catch (error) {
    console.error('Bars API Error:', error);
    return NextResponse.json({ error: 'Failed to load bars' }, { status: 500 });
  }
}
