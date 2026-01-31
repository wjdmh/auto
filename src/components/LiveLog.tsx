'use client';

import type { TradeLog } from '@/types';

interface Props {
  logs: TradeLog[];
}

export default function LiveLog({ logs }: Props) {
  if (logs.length === 0) return null;

  return (
    <section className="px-5 pb-8">
      <h2 className="text-sm font-semibold text-[var(--text-secondary)] mb-3 flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
        실전 기록
      </h2>
      <div className="bg-[var(--card)] rounded-2xl overflow-hidden">
        {logs.map((log, i) => {
          const time = new Date(log.created_at).toLocaleTimeString('ko-KR', {
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'America/New_York',
          });
          const isBuy = log.action === 'BUY';

          return (
            <div
              key={`${log.symbol}-${log.created_at}-${i}`}
              className={`px-4 py-2.5 ${
                i < logs.length - 1 ? 'border-b border-[var(--border)]' : ''
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[11px] text-[var(--text-tertiary)] shrink-0 tabular-nums w-11">
                    {time}
                  </span>
                  <span
                    className={`text-[11px] font-medium px-1.5 py-0.5 rounded shrink-0 ${
                      isBuy
                        ? 'bg-[var(--accent)]/15 text-[var(--accent)]'
                        : 'bg-[var(--loss)]/15 text-[var(--loss)]'
                    }`}
                  >
                    {isBuy ? '매수' : '매도'}
                  </span>
                  <span className="text-[13px] text-[var(--text-primary)] font-medium shrink-0">
                    {log.symbol}
                  </span>
                  <span className="text-[11px] text-[var(--text-tertiary)] shrink-0">
                    {log.quantity}주
                  </span>
                </div>
                <span className="text-[13px] text-[var(--text-secondary)] tabular-nums shrink-0">
                  ${Number(log.price).toFixed(2)}
                </span>
              </div>
              {(log.rsi != null || (log.vol_ratio != null && log.vol_ratio >= 1.5)) && (
                <div className="flex items-center gap-1.5 mt-1 pl-11">
                  {log.rsi != null && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                      log.rsi < 40 ? 'bg-[var(--profit)]/15 text-[var(--profit)]' :
                      log.rsi > 60 ? 'bg-[var(--loss)]/15 text-[var(--loss)]' :
                      'bg-[var(--border)] text-[var(--text-tertiary)]'
                    }`}>
                      RSI {log.rsi.toFixed(0)}
                    </span>
                  )}
                  {log.vol_ratio != null && log.vol_ratio >= 1.5 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-400/15 text-amber-400">
                      x{log.vol_ratio.toFixed(1)}
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
