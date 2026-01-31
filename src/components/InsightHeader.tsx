'use client';

import type { DashboardData } from '@/types';
import ThemeToggle from './ThemeToggle';

interface Props {
  data: DashboardData;
}

export default function InsightHeader({ data }: Props) {
  const { account, summary } = data;
  const isProfit = account.todayPL >= 0;

  return (
    <section className="px-5 pt-10 pb-6">
      <div className="flex items-center justify-between mb-1">
        <p className="text-sm text-[var(--text-tertiary)]">오늘의 AI 트레이딩</p>
        <ThemeToggle />
      </div>
      <h1 className="text-[26px] font-bold text-[var(--text-primary)] leading-snug mb-5">
        총 자산{' '}
        <span className="text-[var(--text-primary)] tabular-nums">
          ${account.equity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      </h1>

      <div className="flex items-center gap-2 mb-6">
        <span
          className={`text-base font-semibold tabular-nums ${
            isProfit ? 'text-[var(--profit)]' : 'text-[var(--loss)]'
          }`}
        >
          {isProfit ? '+' : ''}
          ${account.todayPL.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
        <span
          className={`text-xs px-2 py-0.5 rounded-full tabular-nums ${
            isProfit
              ? 'bg-[var(--profit)]/20 text-[var(--profit)]'
              : 'bg-[var(--loss)]/20 text-[var(--loss)]'
          }`}
        >
          {isProfit ? '+' : ''}
          {account.todayPLPercent.toFixed(2)}%
        </span>
      </div>

      <div className="bg-[var(--card)] rounded-2xl p-4">
        <p className="text-[14px] text-[var(--text-secondary)] leading-relaxed">
          오늘 <strong className="text-[var(--text-primary)]">{summary.totalTargets}개</strong> 종목을 정찰했고, 그 중 <strong className="text-[var(--accent)]">{summary.totalBought}개</strong>를 매수했습니다.
        </p>
        {summary.totalSkipped > 0 && (
          <p className="text-[13px] text-[var(--text-tertiary)] mt-1.5">
            {summary.totalSkipped}개 종목은 조건 미충족으로 대기 중이에요.
          </p>
        )}
      </div>
    </section>
  );
}
