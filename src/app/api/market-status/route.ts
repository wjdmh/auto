import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const BASE_URL = process.env.ALPACA_BASE_URL || 'https://paper-api.alpaca.markets';
const headers: HeadersInit = {
  'APCA-API-KEY-ID': process.env.ALPACA_API_KEY || '',
  'APCA-API-SECRET-KEY': process.env.ALPACA_SECRET_KEY || '',
};

export async function GET() {
  try {
    const res = await fetch(`${BASE_URL}/v2/clock`, {
      headers,
      cache: 'no-store',
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'Clock fetch failed' }, { status: res.status });
    }

    const clock = await res.json();

    return NextResponse.json({
      isOpen: clock.is_open,
      nextOpen: clock.next_open,
      nextClose: clock.next_close,
      timestamp: clock.timestamp,
    });
  } catch (error) {
    console.error('Market Status Error:', error);
    return NextResponse.json({ error: 'Failed to load market status' }, { status: 500 });
  }
}
