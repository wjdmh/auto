const BASE_URL = process.env.ALPACA_BASE_URL || 'https://paper-api.alpaca.markets';

const headers: HeadersInit = {
  'APCA-API-KEY-ID': process.env.ALPACA_API_KEY || '',
  'APCA-API-SECRET-KEY': process.env.ALPACA_SECRET_KEY || '',
  'Content-Type': 'application/json',
};

async function alpacaFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers,
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error(`Alpaca API error: ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export async function getAccount() {
  return alpacaFetch<{
    equity: string;
    cash: string;
    buying_power: string;
    last_equity: string;
    portfolio_value: string;
  }>('/v2/account');
}

export async function getPositions() {
  return alpacaFetch<Array<{
    symbol: string;
    qty: string;
    avg_entry_price: string;
    current_price: string;
    market_value: string;
    unrealized_pl: string;
    unrealized_plpc: string;
    side: string;
  }>>('/v2/positions');
}

const DATA_URL = process.env.ALPACA_DATA_URL || 'https://data.alpaca.markets';

async function alpacaDataFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${DATA_URL}${path}`, {
    headers,
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error(`Alpaca Data API error: ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export interface BarData {
  t: string;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
}

/** 여러 심볼의 15분봉을 한번에 가져옴 (IEX 피드, 페이지네이션 처리) */
export async function getMultiBars(symbols: string[]): Promise<Map<string, BarData[]>> {
  const unique = [...new Set(symbols)];
  if (unique.length === 0) return new Map();
  const symbolStr = unique.join(',');
  const totalLimit = unique.length * 30; // 심볼당 30봉

  const result = new Map<string, BarData[]>();
  let pageToken: string | null = null;

  // 페이지네이션 순회 (최대 3회)
  for (let page = 0; page < 3; page++) {
    const base = `/v2/stocks/bars?symbols=${symbolStr}&timeframe=15Min&limit=${totalLimit}&sort=asc&feed=iex`;
    const url: string = pageToken ? `${base}&page_token=${pageToken}` : base;
    const data = await alpacaDataFetch<{ bars: Record<string, BarData[]>; next_page_token?: string }>(url);

    for (const [sym, bars] of Object.entries(data.bars || {})) {
      const existing = result.get(sym) || [];
      result.set(sym, [...existing, ...bars]);
    }

    if (!data.next_page_token) break;
    pageToken = data.next_page_token;
  }

  return result;
}

/** RSI(14) 계산 */
export function computeRSI(bars: BarData[], period = 14): number | null {
  if (bars.length < period + 1) return null;
  const closes = bars.map((b) => b.c);
  let gainSum = 0;
  let lossSum = 0;

  for (let i = closes.length - period; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff > 0) gainSum += diff;
    else lossSum += Math.abs(diff);
  }

  const avgGain = gainSum / period;
  const avgLoss = lossSum / period;
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

/** 거래량 배율 (최근 봉 vs 평균) */
export function computeVolRatio(bars: BarData[]): number | null {
  if (bars.length < 3) return null;
  const latest = bars[bars.length - 1].v;
  const avgVol = bars.slice(0, -1).reduce((s, b) => s + b.v, 0) / (bars.length - 1);
  if (avgVol === 0) return null;
  return latest / avgVol;
}

export async function getOrders() {
  return alpacaFetch<Array<{
    id: string;
    symbol: string;
    qty: string;
    side: string;
    type: string;
    status: string;
    filled_avg_price: string | null;
    order_class: string;
    legs?: Array<{
      side: string;
      type: string;
      stop_price?: string;
      limit_price?: string;
    }>;
    created_at: string;
    filled_at: string | null;
  }>>('/v2/orders?status=open&limit=100');
}
