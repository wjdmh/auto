'use client';

import type { SafetyStatus } from '@/types';

interface Props {
  safety: SafetyStatus;
}

export default function SafetyBanner({ safety }: Props) {
  if (!safety.isTriggered) {
    // 차단기 미발동: 한도 근접 시 경고만
    const profitPct = (safety.todayPL / safety.profitLimit) * 100;
    const lossPct = (safety.todayPL / safety.lossLimit) * 100;
    const nearLimit = profitPct >= 70 || lossPct >= 70;

    if (!nearLimit) return null;

    return (
      <div className="mx-5 mb-4 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
        <div className="flex items-center gap-2 mb-1">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-400 shrink-0">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <span className="text-xs font-semibold text-amber-400">일일 한도 근접</span>
        </div>
        <p className="text-xs text-amber-400/80">
          오늘 손익 ${safety.todayPL >= 0 ? '+' : ''}{safety.todayPL.toFixed(2)} / 한도 +${safety.profitLimit} ~ ${safety.lossLimit}
        </p>
      </div>
    );
  }

  // 차단기 발동
  const isProfit = safety.type === 'profit_cap';
  return (
    <div className={`mx-5 mb-4 px-4 py-3 rounded-xl border ${
      isProfit ? 'bg-[var(--accent)]/10 border-[var(--accent)]/20' : 'bg-[var(--loss)]/10 border-[var(--loss)]/20'
    }`}>
      <div className="flex items-center gap-2 mb-1">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`shrink-0 ${isProfit ? 'text-[var(--accent)]' : 'text-[var(--loss)]'}`}>
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0110 0v4" />
        </svg>
        <span className={`text-xs font-semibold ${isProfit ? 'text-[var(--accent)]' : 'text-[var(--loss)]'}`}>
          {isProfit ? '목표 수익 달성 - 봇 일시정지' : '손실 한도 도달 - 봇 일시정지'}
        </span>
      </div>
      <p className={`text-xs ${isProfit ? 'text-[var(--accent)]/70' : 'text-[var(--loss)]/70'}`}>
        오늘 {isProfit ? '수익' : '손실'} ${Math.abs(safety.todayPL).toFixed(2)}으로 안전 차단기가 작동했습니다.
      </p>
    </div>
  );
}
