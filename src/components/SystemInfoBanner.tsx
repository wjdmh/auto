'use client';

import { useState } from 'react';

export default function SystemInfoBanner() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="mx-5 mb-4">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full px-4 py-3 rounded-xl bg-[var(--card)] border border-[var(--border)] text-left transition-all active:scale-[0.98]"
      >
        {/* 항상 보이는 헤더 */}
        <div className="flex items-center gap-3">
          <div className="shrink-0 w-8 h-8 rounded-lg bg-[var(--accent)]/10 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--accent)]">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
          </div>
          <div className="flex-1 min-w-0 flex items-center gap-2">
            <span className="text-xs font-semibold text-[var(--text-primary)]">AI 자동매매 시스템</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 font-medium">Paper Trading</span>
          </div>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`shrink-0 text-[var(--text-tertiary)] transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>

        {/* 접히는 상세 영역 */}
        <div
          className={`overflow-hidden transition-all duration-200 ease-out ${
            expanded ? 'max-h-40 opacity-100 mt-3' : 'max-h-0 opacity-0 mt-0'
          }`}
        >
          <div className="pt-3 border-t border-[var(--border)] space-y-2">
            <p className="text-xs text-[var(--text-tertiary)] leading-relaxed">
              현재 <strong className="text-[var(--text-secondary)]">가상 계좌</strong>로 운영 중이며, 테스트 완료 후 실제 계좌로 전환 예정이에요.
            </p>
            <div className="flex flex-wrap gap-x-3 gap-y-1">
              <span className="text-[11px] text-[var(--text-tertiary)] flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-[var(--accent)]" />
                매매 분석 15분 간격
              </span>
              <span className="text-[11px] text-[var(--text-tertiary)] flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-[var(--accent)]" />
                뉴스 스캔 30분 간격
              </span>
              <span className="text-[11px] text-[var(--text-tertiary)] flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-[var(--accent)]" />
                장 시작 30분 전 자동 가동
              </span>
            </div>
          </div>
        </div>
      </button>
    </div>
  );
}
