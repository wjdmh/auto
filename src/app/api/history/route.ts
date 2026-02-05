import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import type { TradeLog, HistoryStats } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');

    // 전체 기록 조회
    const history = await query<TradeLog>(
      `SELECT * FROM trade_log
       WHERE timestamp >= NOW() - INTERVAL '${days} days'
       AND action_taken != 'INIT'
       ORDER BY timestamp DESC`
    );

    // 통계 계산
    const holdingDays = { NVDA: 0, AMD: 0, CASH: 0 };
    let switches = 0;
    let prevHolding: string | null = null;

    for (const record of [...history].reverse()) {
      if (record.current_holding in holdingDays) {
        holdingDays[record.current_holding as keyof typeof holdingDays]++;
      }
      if (prevHolding && prevHolding !== record.current_holding) {
        switches++;
      }
      prevHolding = record.current_holding;
    }

    const stats: HistoryStats = {
      totalTrades: history.length,
      holdingDays,
      switches,
    };

    return NextResponse.json({ history, stats });
  } catch (error) {
    console.error('History API Error:', error);
    return NextResponse.json({ error: 'Failed to load history' }, { status: 500 });
  }
}
