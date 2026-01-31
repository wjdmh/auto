'use client';

const FEATURES = [
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--accent)]">
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </svg>
    ),
    title: '실시간 종목 정찰',
    desc: 'AI가 뉴스 기반으로 유망 종목을 선별하고, 매수 조건을 실시간으로 분석해요.',
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--profit)]">
        <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
        <polyline points="16 7 22 7 22 13" />
      </svg>
    ),
    title: '자동 매매 현황',
    desc: '매수/매도 내역, 수익률, 손절/익절 설정을 한눈에 확인할 수 있어요.',
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    title: '15분 주기 업데이트',
    desc: '기술지표(RSI, 거래량)와 차트 데이터가 15분마다 자동으로 갱신돼요.',
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-purple-400">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0110 0v4" />
      </svg>
    ),
    title: '안전 차단기',
    desc: '일일 손익 한도에 도달하면 자동으로 매매를 중단하여 리스크를 관리해요.',
  },
];

export default function MarketOpenGuide() {
  return (
    <div className="px-5 pb-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse" />
        <span className="text-[11px] font-semibold text-[var(--text-tertiary)]">장이 열리면</span>
      </div>
      <p className="text-[14px] text-[var(--text-secondary)] leading-relaxed mb-4">
        미국 주식 시장이 열리면 AI 시스템이 자동으로 시작되며, 아래 항목들을 실시간으로 확인할 수 있어요.
      </p>
      <div className="bg-[var(--card)] rounded-2xl overflow-hidden">
        {FEATURES.map((feat, i) => (
          <div
            key={i}
            className={`flex items-start gap-3 px-4 py-3.5 ${
              i < FEATURES.length - 1 ? 'border-b border-[var(--border)]' : ''
            }`}
          >
            <div className="shrink-0 w-8 h-8 rounded-lg bg-[var(--card-inner)] flex items-center justify-center mt-0.5">
              {feat.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-[var(--text-primary)] mb-0.5">
                {feat.title}
              </p>
              <p className="text-[12px] text-[var(--text-tertiary)] leading-relaxed">
                {feat.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
