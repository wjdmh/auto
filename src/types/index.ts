// 새로운 trade_log 스키마 기반 타입
export interface TradeLog {
  id: number;
  timestamp: string;
  market_condition: 'BULL' | 'BEAR' | 'INIT';
  current_holding: 'NVDA' | 'AMD' | 'CASH';
  action_taken: 'BUY_NVDA' | 'BUY_AMD' | 'SELL_ALL' | 'HOLD' | 'INIT';
  memo: string;
  nvda_price: number;
  amd_price: number;
}

// Alpaca API 타입
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

// 실시간 시장 데이터
export interface MarketData {
  spyPrice: number;
  spy200MA: number;
  nvdaPrice: number;
  amdPrice: number;
  zScore: number;
  ratio: number;
  ratioMean: number;
}

// 대시보드 메인 데이터
export interface DashboardData {
  // 계좌 정보
  account: {
    equity: number;
    cash: number;
    todayPL: number;
    todayPLPercent: number;
  };
  // 현재 보유 상태
  holding: {
    status: 'NVDA' | 'AMD' | 'CASH';
    position: AlpacaPosition | null;
  };
  // 최근 판단 (어젯밤)
  lastDecision: TradeLog | null;
  // 시장 상황 (실시간 계산)
  market: MarketData | null;
  // 최근 기록
  history: TradeLog[];
  // 업데이트 시간
  lastUpdated: string;
}

// 히스토리 통계
export interface HistoryStats {
  totalTrades: number;
  holdingDays: {
    NVDA: number;
    AMD: number;
    CASH: number;
  };
  switches: number;
}
