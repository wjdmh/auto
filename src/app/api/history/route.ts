import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

interface DailyEquity {
  date: string;
  total_bought: number;
  total_sold: number;
  net_pl: number;
}

interface TradeResult {
  symbol: string;
  action: string;
  price: number;
  quantity: number;
  date: string;
  status: string;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');
    const symbol = searchParams.get('symbol');

    // 1. 일별 매매 요약 (누적 수익률 차트용)
    const dailySummary = await query<DailyEquity>(
      `SELECT
        date::text,
        COUNT(CASE WHEN action = 'BUY' THEN 1 END) as total_bought,
        COUNT(CASE WHEN action = 'SELL' THEN 1 END) as total_sold,
        COALESCE(SUM(CASE WHEN action = 'SELL' THEN price * quantity ELSE -price * quantity END), 0) as net_pl
      FROM trade_log
      WHERE date >= CURRENT_DATE - $1::int
      GROUP BY date
      ORDER BY date ASC`,
      [days]
    );

    // 2. 승률 통계
    const winRate = await query<{ total: number; wins: number; losses: number }>(
      `SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'WIN' OR (action = 'SELL' AND price > 0) THEN 1 END) as wins,
        COUNT(CASE WHEN status = 'LOSS' THEN 1 END) as losses
      FROM trade_log
      WHERE date >= CURRENT_DATE - $1::int
        AND action = 'BUY'`,
      [days]
    );

    // 3. 종목별 히스토리 (특정 종목 또는 전체)
    let symbolHistory: TradeResult[] = [];
    if (symbol) {
      symbolHistory = await query<TradeResult>(
        `SELECT symbol, action, price::float, quantity, date::text, status
        FROM trade_log
        WHERE symbol = $1
        ORDER BY created_at DESC
        LIMIT 50`,
        [symbol]
      );
    } else {
      symbolHistory = await query<TradeResult>(
        `SELECT symbol,
          COUNT(*) as trade_count,
          COUNT(CASE WHEN status = 'WIN' THEN 1 END) as wins,
          ROUND(AVG(price)::numeric, 2) as avg_price
        FROM trade_log
        WHERE date >= CURRENT_DATE - $1::int
        GROUP BY symbol
        ORDER BY COUNT(*) DESC
        LIMIT 20` as unknown as string,
        [days]
      );
    }

    return NextResponse.json({
      dailySummary,
      winRate: winRate[0] || { total: 0, wins: 0, losses: 0 },
      symbolHistory,
    });
  } catch (error) {
    console.error('History API Error:', error);
    return NextResponse.json({ error: 'Failed to load history' }, { status: 500 });
  }
}
