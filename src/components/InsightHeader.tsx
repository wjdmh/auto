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
    <section className="px-5 pt-10 pb-8">
      <div className="flex items-center justify-between mb-1">
        <p className="text-sm text-[var(--text-tertiary)]">오늘의 AI 트레이딩</p>
        <ThemeToggle />
      </div>
      <h1 className="text-[28px] font-bold text-[var(--text-primary)] leading-tight mb-6">
        총 자산{' '}
        <span className="text-[var(--text-primary)]">
          ${account.equity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      </h1>

      <div className="flex items-center gap-2 mb-8">
        <span
          className={`text-lg font-semibold ${
            isProfit ? 'text-[var(--profit)]' : 'text-[var(--loss)]'
          }`}
        >
          {isProfit ? '+' : ''}
          ${account.todayPL.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
        <span
          className={`text-sm px-2 py-0.5 rounded-full ${
            isProfit
              ? 'bg-[var(--profit)]/20 text-[var(--profit)]'
              : 'bg-[var(--loss)]/20 text-[var(--loss)]'
          }`}
        >
          {isProfit ? '+' : ''}
          {account.todayPLPercent.toFixed(2)}%
        </span>
      </div>

      <div className="bg-[var(--card)] rounded-2xl p-5">
        <p className="text-[15px] text-[var(--text-secondary)] leading-relaxed">
          오늘{' '}
          <strong className="text-[var(--text-primary)]">{summary.totalTargets}개</strong> 종목을
          정찰했고, 그 중{' '}
          <strong className="text-[var(--accent)]">{summary.totalBought}개</strong>를
          매수했습니다.
        </p>
        {summary.totalSkipped > 0 && (
          <p className="text-sm text-[var(--text-tertiary)] mt-2">
            {summary.totalSkipped}개 종목은 매수 조건을 충족하지 않아 대기 중이에요.
          </p>
        )}
      </div>
    </section>
  );
}
