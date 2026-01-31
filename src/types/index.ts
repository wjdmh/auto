export interface DailyTarget {
  id: number;
  date: string;
  symbol: string;
  keyword: string;
  reason: string;
  status: string;
  created_at: string;
}

export interface TradeLog {
  id?: number;
  date: string;
  symbol: string;
  action: string;
  quantity: number;
  price: number;
  status: string;
  created_at: string;
  vol_ratio?: number;
  volume?: number;
  rsi?: number;
}

export interface AlpacaAccount {
  equity: string;
  cash: string;
  buying_power: string;
  last_equity: string;
  portfolio_value: string;
}

export interface AlpacaPosition {
  symbol: string;
  qty: string;
  avg_entry_price: string;
  current_price: string;
  market_value: string;
  unrealized_pl: string;
  unrealized_plpc: string;
  side: string;
}

export interface AlpacaOrder {
  id: string;
  symbol: string;
  qty: string;
  side: string;
  type: string;
  status: string;
  filled_avg_price: string | null;
  order_class: string;
  legs?: AlpacaOrder[];
  stop_price?: string;
  limit_price?: string;
  created_at: string;
  filled_at: string | null;
}

export type TargetStatus = 'BOUGHT' | 'WATCHING';

export interface TechnicalData {
  rsi: number | null;
  volRatio: number | null;
  volume: number | null;
}

export interface TargetStory {
  symbol: string;
  keyword: string;
  reason: string;
  status: TargetStatus;
  trade: {
    price: number;
    quantity: number;
    time: string;
  } | null;
  order: {
    takeProfit: number | null;
    stopLoss: number | null;
  } | null;
  position: {
    currentPrice: number;
    unrealizedPL: number;
    unrealizedPLPercent: number;
  } | null;
  technical: TechnicalData | null;
}

export interface SafetyStatus {
  isTriggered: boolean;
  type: 'profit_cap' | 'loss_cap' | null;
  todayPL: number;
  profitLimit: number;
  lossLimit: number;
}

export interface DashboardData {
  account: {
    equity: number;
    cash: number;
    todayPL: number;
    todayPLPercent: number;
  };
  summary: {
    totalTargets: number;
    totalBought: number;
    totalSkipped: number;
  };
  safety: SafetyStatus;
  targets: TargetStory[];
  logs: TradeLog[];
  lastUpdated: string;
}
