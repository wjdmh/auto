import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getAccount, getPositions, getOrders, getMultiBars, computeRSI, computeVolRatio } from '@/lib/alpaca';
import { translateToKorean } from '@/lib/translate';
import type { DailyTarget, TradeLog, TargetStory, DashboardData, SafetyStatus, TechnicalData } from '@/types';

export const dynamic = 'force-dynamic';

const PROFIT_LIMIT = 100;
const LOSS_LIMIT = -30;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');
    const isToday = !dateParam || dateParam === new Date().toISOString().split('T')[0];
    const dateSQL = isToday ? 'CURRENT_DATE' : `'${dateParam}'::date`;

    // 1. DB: daily_targets (status=ACTIVE 필터)
    const targets = await query<DailyTarget>(
      `SELECT * FROM daily_targets WHERE date = ${dateSQL} AND status = 'ACTIVE' ORDER BY created_at DESC`
    );

    // 2. DB: trade_log (vol_ratio, volume, rsi 포함)
    const trades = await query<TradeLog>(
      `SELECT * FROM trade_log WHERE date = ${dateSQL} ORDER BY created_at DESC`
    );

    // 3. Alpaca API (오늘만)
    const [account, positions, orders] = isToday
      ? await Promise.all([
          getAccount().catch(() => null),
          getPositions().catch(() => []),
          getOrders().catch(() => []),
        ])
      : [null, [], []];

    // 4. Symbol 기준 병합
    const tradeMap = new Map<string, TradeLog>();
    for (const trade of trades) {
      if (trade.action === 'BUY') {
        tradeMap.set(trade.symbol, trade);
      }
    }

    const positionMap = new Map<string, typeof positions extends (infer T)[] ? T : never>();
    for (const pos of positions) {
      positionMap.set(pos.symbol, pos);
    }

    const orderMap = new Map<string, { takeProfit: number | null; stopLoss: number | null }>();
    for (const order of orders) {
      if (order.legs && order.legs.length > 0) {
        let tp: number | null = null;
        let sl: number | null = null;
        for (const leg of order.legs) {
          if (leg.type === 'limit' && leg.limit_price) tp = parseFloat(leg.limit_price);
          if (leg.type === 'stop' && leg.stop_price) sl = parseFloat(leg.stop_price);
        }
        orderMap.set(order.symbol, { takeProfit: tp, stopLoss: sl });
      }
    }

    // 5. WATCHING 종목의 실시간 기술지표 계산
    const watchingSymbols = targets
      .filter((t) => !tradeMap.has(t.symbol))
      .map((t) => t.symbol);

    let liveTechnicals = new Map<string, TechnicalData>();
    if (isToday && watchingSymbols.length > 0) {
      try {
        const barsMap = await getMultiBars(watchingSymbols);
        for (const [symbol, bars] of barsMap) {
          const rsi = computeRSI(bars);
          const volRatio = computeVolRatio(bars);
          const latestVol = bars.length > 0 ? bars[bars.length - 1].v : null;
          liveTechnicals.set(symbol, { rsi, volRatio, volume: latestVol });
        }
      } catch {
        // 실시간 기술지표 실패 시 무시
      }
    }

    // 6. 번역
    const textsToTranslate = targets.flatMap((t) => [t.reason, t.keyword].filter(Boolean));
    const translations = await translateToKorean(textsToTranslate);

    // 7. Full Story Objects
    const targetStories: TargetStory[] = targets.map((target) => {
      const trade = tradeMap.get(target.symbol);
      const position = positionMap.get(target.symbol);
      const orderInfo = orderMap.get(target.symbol);
      const isBought = !!trade;

      // 기술지표: 매수 종목은 trade_log에서, 대기 종목은 실시간 계산
      let technical: TechnicalData | null = null;
      if (trade) {
        technical = {
          rsi: trade.rsi != null ? Number(trade.rsi) : null,
          volRatio: trade.vol_ratio != null ? Number(trade.vol_ratio) : null,
          volume: trade.volume != null ? Number(trade.volume) : null,
        };
      } else if (liveTechnicals.has(target.symbol)) {
        technical = liveTechnicals.get(target.symbol)!;
      }

      return {
        symbol: target.symbol,
        keyword: translations.get(target.keyword) || target.keyword || '',
        reason: translations.get(target.reason) || target.reason || '',
        status: isBought ? 'BOUGHT' : 'WATCHING',
        trade: trade
          ? {
              price: Number(trade.price),
              quantity: Number(trade.quantity),
              time: new Date(trade.created_at).toLocaleTimeString('ko-KR', {
                hour: '2-digit',
                minute: '2-digit',
                timeZone: 'America/New_York',
              }),
            }
          : null,
        order: orderInfo || null,
        position: position
          ? {
              currentPrice: parseFloat(position.current_price),
              unrealizedPL: parseFloat(position.unrealized_pl),
              unrealizedPLPercent: parseFloat(position.unrealized_plpc) * 100,
            }
          : null,
        technical,
      };
    });

    targetStories.sort((a, b) => {
      if (a.status === 'BOUGHT' && b.status !== 'BOUGHT') return -1;
      if (a.status !== 'BOUGHT' && b.status === 'BOUGHT') return 1;
      return 0;
    });

    const equity = account ? parseFloat(account.equity) : 0;
    const lastEquity = account ? parseFloat(account.last_equity) : 0;
    const todayPL = equity - lastEquity;
    const todayPLPercent = lastEquity > 0 ? (todayPL / lastEquity) * 100 : 0;

    // 8. 안전 차단기 상태
    const safety: SafetyStatus = {
      isTriggered: todayPL > PROFIT_LIMIT || todayPL < LOSS_LIMIT,
      type: todayPL > PROFIT_LIMIT ? 'profit_cap' : todayPL < LOSS_LIMIT ? 'loss_cap' : null,
      todayPL,
      profitLimit: PROFIT_LIMIT,
      lossLimit: LOSS_LIMIT,
    };

    const data: DashboardData = {
      account: {
        equity,
        cash: account ? parseFloat(account.cash) : 0,
        todayPL,
        todayPLPercent,
      },
      summary: {
        totalTargets: targets.length,
        totalBought: targetStories.filter((t) => t.status === 'BOUGHT').length,
        totalSkipped: targetStories.filter((t) => t.status === 'WATCHING').length,
      },
      safety,
      targets: targetStories,
      logs: trades,
      lastUpdated: new Date().toISOString(),
    };

    return NextResponse.json(data);
  } catch (error) {
    console.error('Dashboard API Error:', error);
    return NextResponse.json(
      { error: 'Failed to load dashboard data' },
      { status: 500 }
    );
  }
}
