'use client';

import type { TargetStory } from '@/types';

interface Props {
  targets: TargetStory[];
}

export default function ThemeCloud({ targets }: Props) {
  // 키워드 빈도 계산
  const kwMap = new Map<string, number>();
  for (const t of targets) {
    if (t.keyword) {
      const kw = t.keyword.replace(/^#/, '');
      kwMap.set(kw, (kwMap.get(kw) || 0) + 1);
    }
  }

  const keywords = Array.from(kwMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12);

  if (keywords.length === 0) return null;

  const maxCount = keywords[0][1];

  return (
    <section className="px-5 pb-6">
      <h2 className="text-sm font-semibold text-[var(--text-secondary)] mb-3 flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
        오늘의 테마
      </h2>
      <div className="flex flex-wrap gap-2">
        {keywords.map(([kw, count]) => {
          const intensity = count / maxCount;
          const isHot = intensity >= 0.7;
          const isMedium = intensity >= 0.4;
          return (
            <span
              key={kw}
              className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                isHot
                  ? 'bg-[var(--accent)]/20 text-[var(--accent)] font-semibold'
                  : isMedium
                    ? 'bg-purple-500/15 text-purple-400'
                    : 'bg-[var(--card)] text-[var(--text-tertiary)]'
              }`}
            >
              #{kw}
              {count > 1 && (
                <span className="ml-1 text-xs opacity-60">{count}</span>
              )}
            </span>
          );
        })}
      </div>
    </section>
  );
}
