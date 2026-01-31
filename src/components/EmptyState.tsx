'use client';

interface Props {
  type: 'no-data' | 'market-closed' | 'error';
  message?: string;
  onRetry?: () => void;
}

export default function EmptyState({ type, message, onRetry }: Props) {
  const config = {
    'no-data': {
      icon: (
        <svg width="64" height="64" viewBox="0 0 64 64" fill="none" className="mx-auto mb-4">
          <circle cx="32" cy="32" r="28" stroke="var(--border)" strokeWidth="2" strokeDasharray="4 4" />
          <path d="M24 28h16M24 36h10" stroke="var(--text-tertiary)" strokeWidth="2" strokeLinecap="round" />
        </svg>
      ),
      title: '아직 데이터가 없어요',
      subtitle: '장이 열리면 AI가 종목을 분석하기 시작합니다.',
    },
    'market-closed': {
      icon: (
        <svg width="64" height="64" viewBox="0 0 64 64" fill="none" className="mx-auto mb-4">
          <circle cx="32" cy="32" r="28" stroke="var(--border)" strokeWidth="2" />
          <circle cx="32" cy="32" r="4" fill="var(--text-tertiary)" />
          <path d="M32 18v10M32 36v10" stroke="var(--text-tertiary)" strokeWidth="2" strokeLinecap="round" />
          <path d="M18 32h10M36 32h10" stroke="var(--text-tertiary)" strokeWidth="2" strokeLinecap="round" />
        </svg>
      ),
      title: '장이 마감되었어요',
      subtitle: '내일 장이 열리면 다시 매매를 시작합니다.',
    },
    error: {
      icon: (
        <svg width="64" height="64" viewBox="0 0 64 64" fill="none" className="mx-auto mb-4">
          <circle cx="32" cy="32" r="28" stroke="var(--loss)" strokeWidth="2" opacity="0.3" />
          <path d="M24 24l16 16M40 24L24 40" stroke="var(--loss)" strokeWidth="2" strokeLinecap="round" />
        </svg>
      ),
      title: '연결에 실패했어요',
      subtitle: message || '잠시 후 다시 시도해주세요.',
    },
  };

  const c = config[type];

  return (
    <div className="flex flex-col items-center justify-center py-16 px-6">
      {c.icon}
      <p className="text-[15px] font-semibold text-[var(--text-primary)] mb-1">{c.title}</p>
      <p className="text-sm text-[var(--text-tertiary)] text-center">{c.subtitle}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-5 px-5 py-2.5 text-sm font-medium bg-[var(--accent)] text-white rounded-xl hover:opacity-90 transition-opacity"
        >
          다시 시도
        </button>
      )}
    </div>
  );
}
