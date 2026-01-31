'use client';

import { useState, useEffect } from 'react';
import WorkflowGuide from './WorkflowGuide';

interface LastDayRecap {
  date: string;
  targets: number;
  bought: number;
  netPL: number;
}

interface DailyBar {
  date: string;
  net_pl: number;
  total_bought: number;
}

interface ReviewData {
  lastDay: LastDayRecap | null;
  weeklyBars: DailyBar[];
  totalTrades: number;
}

export default function ReviewMode() {
  const [data, setData] = useState<ReviewData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/history?days=7');
        const json = await res.json();
        const daily = (json.dailySummary || []) as DailyBar[];
        const totalTrades = daily.reduce((s, d) => s + Number(d.total_bought || 0), 0);

        let lastDay: LastDayRecap | null = null;
        if (daily.length > 0) {
          const last = daily[daily.length - 1];
          lastDay = {
            date: last.date,
            targets: Number(last.total_bought) + Number(last.total_bought), // approx
            bought: Number(last.total_bought),
            netPL: Number(last.net_pl),
          };
        }

        setData({ lastDay, weeklyBars: daily, totalTrades });
      } catch {
        setData({ lastDay: null, weeklyBars: [], totalTrades: 0 });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="px-5 py-8">
        <div className="space-y-4">
          <div className="h-20 rounded-2xl bg-[var(--card)] animate-pulse-soft" />
          <div className="h-32 rounded-2xl bg-[var(--card)] animate-pulse-soft" />
        </div>
      </div>
    );
  }

  const hasHistory = data && data.totalTrades > 0;

  return (
    <div>
      {/* 복기 모드 헤더 */}
      <div className="px-5 pb-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="w-2 h-2 rounded-full bg-gray-500" />
          <span className="text-xs font-semibold text-[var(--text-tertiary)]">장 마감</span>
        </div>
        <p className="text-[15px] text-[var(--text-secondary)] leading-relaxed">
          현재는 미국 주식 시장이 열려있지 않아요.
        </p>
        <p className="text-sm text-[var(--text-tertiary)] mt-1">
          그동안 지난 매매 기록을 보여드릴게요.
        </p>
      </div>

      {hasHistory && data.lastDay ? (
        <>
          {/* 마지막 거래일 리캡 */}
          <div className="px-5 pb-4">
            <h2 className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-3">
              마지막 거래일 리캡
            </h2>
            <div className="bg-[var(--card)] rounded-2xl p-5">
              <p className="text-[15px] text-[var(--text-secondary)] leading-relaxed">
                <strong className="text-[var(--text-primary)]">{formatDate(data.lastDay.date)}</strong>에{' '}
                <strong className="text-[var(--accent)]">{data.lastDay.bought}건</strong> 매수했고,{' '}
                <span className={data.lastDay.netPL >= 0 ? 'text-[var(--profit)]' : 'text-[var(--loss)]'}>
                  {data.lastDay.netPL >= 0 ? '+' : ''}${data.lastDay.netPL.toFixed(2)}
                </span>
                {' '}결과였습니다.
              </p>
            </div>
          </div>

          {/* 주간 일별 성과 바 차트 */}
          {data.weeklyBars.length > 1 && (
            <div className="px-5 pb-4">
              <h2 className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-3">
                이번 주 일별 성과
              </h2>
              <div className="bg-[var(--card)] rounded-2xl p-4">
                <DailyBarChart bars={data.weeklyBars} />
              </div>
            </div>
          )}
        </>
      ) : (
        /* 매매 기록 없을 때 - 온보딩 */
        <div className="px-5 pb-4">
          <div className="bg-[var(--card)] rounded-2xl p-6 text-center">
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-[var(--accent)]/10 flex items-center justify-center">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--accent)]">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <h3 className="text-[15px] font-semibold text-[var(--text-primary)] mb-2">
              아직 매매 기록이 없어요
            </h3>
            <p className="text-xs text-[var(--text-tertiary)] leading-relaxed mb-1">
              다음 장이 열리면 AI가 자동으로 종목을 분석하고 매매를 시작합니다.
            </p>
            <p className="text-xs text-[var(--text-tertiary)] leading-relaxed">
              아래에서 매매 원리를 확인해보세요.
            </p>
          </div>
        </div>
      )}

      {/* AI 매매 워크플로우 안내 (항상 표시) */}
      <div className="h-1.5 bg-[var(--background)]" />
      <div className="pt-5">
        <WorkflowGuide />
      </div>
    </div>
  );
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
  return `${month}/${day}(${weekdays[d.getDay()]})`;
}

/** 간단한 일별 막대 차트 */
function DailyBarChart({ bars }: { bars: DailyBar[] }) {
  const maxAbs = Math.max(...bars.map((b) => Math.abs(Number(b.net_pl))), 1);

  return (
    <div className="flex items-end justify-between gap-2" style={{ height: 80 }}>
      {bars.map((bar) => {
        const pl = Number(bar.net_pl);
        const isProfit = pl >= 0;
        const pct = Math.abs(pl) / maxAbs;
        const height = Math.max(pct * 60, 4);
        const d = new Date(bar.date + 'T00:00:00');
        const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
        const label = weekdays[d.getDay()];

        return (
          <div key={bar.date} className="flex-1 flex flex-col items-center gap-1">
            <span className={`text-[10px] tabular-nums ${isProfit ? 'text-[var(--profit)]' : 'text-[var(--loss)]'}`}>
              {isProfit ? '+' : ''}{pl.toFixed(0)}
            </span>
            <div className="w-full flex justify-center">
              <div
                className={`w-5 rounded-sm transition-all ${isProfit ? 'bg-[var(--profit)]' : 'bg-[var(--loss)]'}`}
                style={{ height, opacity: 0.7 + pct * 0.3 }}
              />
            </div>
            <span className="text-[10px] text-[var(--text-tertiary)]">{label}</span>
          </div>
        );
      })}
    </div>
  );
}
