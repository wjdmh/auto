'use client';

import { useEffect, useState } from 'react';

interface Stats {
  total: number;
  wins: number;
  losses: number;
}

export default function WinRateStats() {
  const [stats, setStats] = useState<Stats>({ total: 0, wins: 0, losses: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/history?days=7');
        const json = await res.json();
        setStats(json.winRate || { total: 0, wins: 0, losses: 0 });
      } catch {
        /* empty */
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return null;

  const winPercent = stats.total > 0 ? Math.round((stats.wins / stats.total) * 100) : 0;
  const circumference = 2 * Math.PI * 36;
  const dashOffset = circumference - (circumference * winPercent) / 100;

  return (
    <section className="px-5 pb-6">
      <h2 className="text-sm font-semibold text-[var(--text-secondary)] mb-3">
        이번 주 성과
      </h2>
      <div className="bg-[var(--card)] rounded-2xl p-5 flex items-center gap-6">
        {/* Donut */}
        <div className="relative w-20 h-20 shrink-0">
          <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
            <circle
              cx="40"
              cy="40"
              r="36"
              fill="none"
              stroke="var(--border)"
              strokeWidth="6"
            />
            <circle
              cx="40"
              cy="40"
              r="36"
              fill="none"
              stroke="var(--accent)"
              strokeWidth="6"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              className="transition-all duration-700"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-[var(--text-primary)]">
            {winPercent}%
          </span>
        </div>

        {/* Stats */}
        <div className="flex-1 space-y-2">
          <p className="text-[15px] text-[var(--text-primary)] leading-relaxed">
            이번 주 매매{' '}
            <strong className="text-[var(--text-primary)]">{stats.total}건</strong> 중{' '}
            <strong className="text-[var(--profit)]">{stats.wins}건</strong> 수익
          </p>
          <div className="flex gap-3 text-xs">
            <span className="text-[var(--profit)]">
              수익 {stats.wins}건
            </span>
            <span className="text-[var(--loss)]">
              손실 {stats.losses}건
            </span>
            <span className="text-[var(--text-tertiary)]">
              대기 {stats.total - stats.wins - stats.losses}건
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
