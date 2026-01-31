'use client';

import { useState, useEffect } from 'react';

interface WeeklyData {
  totalPL: number;
  totalTrades: number;
  winCount: number;
  winRate: number;
  bestDay: { date: string; pl: number } | null;
  worstDay: { date: string; pl: number } | null;
}

export default function WeeklySummary() {
  const [data, setData] = useState<WeeklyData | null>(null);

  useEffect(() => {
    fetch('/api/history?days=7')
      .then((r) => r.json())
      .then((json) => {
        if (json.daily && json.daily.length > 0) {
          const daily = json.daily as Array<{ date: string; total_pl: number; trade_count: number; win_count: number }>;
          const totalPL = daily.reduce((s: number, d) => s + Number(d.total_pl || 0), 0);
          const totalTrades = daily.reduce((s: number, d) => s + Number(d.trade_count || 0), 0);
          const winCount = daily.reduce((s: number, d) => s + Number(d.win_count || 0), 0);
          const sorted = [...daily].sort((a, b) => Number(a.total_pl) - Number(b.total_pl));

          setData({
            totalPL,
            totalTrades,
            winCount,
            winRate: totalTrades > 0 ? (winCount / totalTrades) * 100 : 0,
            bestDay: sorted.length > 0 ? { date: sorted[sorted.length - 1].date, pl: Number(sorted[sorted.length - 1].total_pl) } : null,
            worstDay: sorted.length > 0 ? { date: sorted[0].date, pl: Number(sorted[0].total_pl) } : null,
          });
        }
      })
      .catch(() => {});
  }, []);

  if (!data || data.totalTrades === 0) return null;

  const isProfit = data.totalPL >= 0;

  return (
    <div className="px-5 pb-4">
      <h2 className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-3">
        최근 7일 요약
      </h2>
      <div className="bg-[var(--card)] rounded-2xl p-4">
        <div className="grid grid-cols-3 gap-3 text-center mb-3">
          <div>
            <p className="text-xs text-[var(--text-tertiary)] mb-1">총 수익</p>
            <p className={`text-[15px] font-bold ${isProfit ? 'text-[var(--profit)]' : 'text-[var(--loss)]'}`}>
              {isProfit ? '+' : ''}${data.totalPL.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-xs text-[var(--text-tertiary)] mb-1">총 매매</p>
            <p className="text-[15px] font-bold text-[var(--text-primary)]">
              {data.totalTrades}건
            </p>
          </div>
          <div>
            <p className="text-xs text-[var(--text-tertiary)] mb-1">승률</p>
            <p className={`text-[15px] font-bold ${data.winRate >= 50 ? 'text-[var(--profit)]' : 'text-[var(--loss)]'}`}>
              {data.winRate.toFixed(0)}%
            </p>
          </div>
        </div>
        {(data.bestDay || data.worstDay) && (
          <div className="pt-3 border-t border-[var(--border)] flex justify-between text-xs text-[var(--text-tertiary)]">
            {data.bestDay && (
              <span>최고일 <span className="text-[var(--profit)]">+${data.bestDay.pl.toFixed(2)}</span></span>
            )}
            {data.worstDay && data.worstDay.pl < 0 && (
              <span>최악일 <span className="text-[var(--loss)]">${data.worstDay.pl.toFixed(2)}</span></span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
