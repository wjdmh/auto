import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getAccount, getPositions } from '@/lib/alpaca';
import type { TradeLog, DashboardData, MarketData } from '@/types';

export const dynamic = 'force-dynamic';

// Yahoo Finance에서 가격 데이터 가져오기
async function fetchPriceData(symbol: string): Promise<number[]> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1y`;
    const res = await fetch(url, { next: { revalidate: 300 } });
    const data = await res.json();
    const quotes = data.chart.result[0].indicators.quote[0].close;
    return quotes.filter((q: number | null) => q !== null);
  } catch {
    return [];
  }
}

// SMA 계산
function calculateSMA(data: number[], period: number): number {
  if (data.length < period) return 0;
  const slice = data.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / period;
}

// 표준편차 계산
function calculateStd(data: number[], period: number): number {
  if (data.length < period) return 0;
  const mean = calculateSMA(data, period);
  const slice = data.slice(-period);
  const variance = slice.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / period;
  return Math.sqrt(variance);
}

// 실시간 시장 데이터 계산
async function getMarketData(): Promise<MarketData | null> {
  try {
    const [spyPrices, nvdaPrices, amdPrices] = await Promise.all([
      fetchPriceData('SPY'),
      fetchPriceData('NVDA'),
      fetchPriceData('AMD'),
    ]);

    if (!spyPrices.length || !nvdaPrices.length || !amdPrices.length) {
      return null;
    }

    const spyPrice = spyPrices[spyPrices.length - 1];
    const spy200MA = calculateSMA(spyPrices, 200);
    const nvdaPrice = nvdaPrices[nvdaPrices.length - 1];
    const amdPrice = amdPrices[amdPrices.length - 1];

    // NVDA/AMD 비율 계산
    const minLen = Math.min(nvdaPrices.length, amdPrices.length);
    const nvdaSlice = nvdaPrices.slice(-minLen);
    const amdSlice = amdPrices.slice(-minLen);
    const ratios = nvdaSlice.map((n, i) => n / amdSlice[i]);

    const ratio = ratios[ratios.length - 1];
    const ratioMean = calculateSMA(ratios, 20);
    const ratioStd = calculateStd(ratios, 20);
    const zScore = ratioStd !== 0 ? (ratio - ratioMean) / ratioStd : 0;

    return {
      spyPrice,
      spy200MA,
      nvdaPrice,
      amdPrice,
      zScore,
      ratio,
      ratioMean,
    };
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    // 1. DB에서 최근 기록 조회
    const history = await query<TradeLog>(
      `SELECT * FROM trade_log ORDER BY id DESC LIMIT 20`
    );

    // 2. 가장 최근 판단 (INIT 제외)
    const lastDecision = history.find(h => h.action_taken !== 'INIT') || null;

    // 3. 현재 보유 상태 (가장 최근 레코드 기준)
    const currentHolding = history[0]?.current_holding || 'CASH';

    // 4. Alpaca 계좌 정보
    const [account, positions] = await Promise.all([
      getAccount().catch(() => null),
      getPositions().catch(() => []),
    ]);

    // 5. 현재 포지션 찾기
    const holdingPosition = positions.find(
      (p) => p.symbol === currentHolding
    ) || null;

    // 6. 실시간 시장 데이터
    const market = await getMarketData();

    // 7. 계좌 정보 계산
    const equity = account ? parseFloat(account.equity) : 0;
    const lastEquity = account ? parseFloat(account.last_equity) : 0;
    const todayPL = equity - lastEquity;
    const todayPLPercent = lastEquity > 0 ? (todayPL / lastEquity) * 100 : 0;

    const data: DashboardData = {
      account: {
        equity,
        cash: account ? parseFloat(account.cash) : 0,
        todayPL,
        todayPLPercent,
      },
      holding: {
        status: currentHolding as 'NVDA' | 'AMD' | 'CASH',
        position: holdingPosition,
      },
      lastDecision,
      market,
      history: history.filter(h => h.action_taken !== 'INIT'),
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
