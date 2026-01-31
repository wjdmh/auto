'use client';

import type { TargetStory } from '@/types';
import TargetCard from './TargetCard';

interface Props {
  targets: TargetStory[];
  onSelectTarget: (target: TargetStory) => void;
}

export default function MissionTimeline({ targets, onSelectTarget }: Props) {
  const bought = targets.filter((t) => t.status === 'BOUGHT');
  const watching = targets.filter((t) => t.status === 'WATCHING');

  return (
    <section className="px-5 pb-6">
      {bought.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-[var(--text-secondary)] mb-3 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
            매수 종목
          </h2>
          <div className="space-y-3">
            {bought.map((target) => (
              <TargetCard
                key={target.symbol}
                target={target}
                onClick={() => onSelectTarget(target)}
              />
            ))}
          </div>
        </div>
      )}

      {watching.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-[var(--text-secondary)] mb-3 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-tertiary)]" />
            정찰만 한 종목
          </h2>
          <div className="space-y-3">
            {watching.map((target) => (
              <TargetCard
                key={target.symbol}
                target={target}
                onClick={() => onSelectTarget(target)}
              />
            ))}
          </div>
        </div>
      )}

      {targets.length === 0 && (
        <div className="text-center py-12">
          <p className="text-[var(--text-tertiary)] text-sm">
            아직 오늘의 정찰 데이터가 없습니다.
          </p>
          <p className="text-[var(--text-tertiary)] text-xs mt-1 opacity-60">
            장이 열리면 AI가 종목을 분석합니다.
          </p>
        </div>
      )}
    </section>
  );
}
