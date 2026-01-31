'use client';

import { useEffect, useState } from 'react';

interface ClockData {
  isOpen: boolean;
  nextOpen: string;
  nextClose: string;
  timestamp: string;
}

function formatCountdown(targetISO: string): string {
  const diff = new Date(targetISO).getTime() - Date.now();
  if (diff <= 0) return '잠시 후';

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) return `${hours}시간 ${minutes}분`;
  return `${minutes}분`;
}

/** 다음 15분 주기까지 남은 시간 계산 */
function getNextScanInfo(): { minutesLeft: number; progress: number } {
  const now = new Date();
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();
  // n8n 스캐너: 30분 간격, 트레이딩: 15분 간격
  const cycleMinutes = 15;
  const elapsed = (minutes % cycleMinutes) + seconds / 60;
  const remaining = cycleMinutes - elapsed;
  return {
    minutesLeft: Math.ceil(remaining),
    progress: (elapsed / cycleMinutes) * 100,
  };
}

export default function MarketStatus() {
  const [clock, setClock] = useState<ClockData | null>(null);
  const [countdown, setCountdown] = useState('');
  const [scanInfo, setScanInfo] = useState(getNextScanInfo());

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/market-status');
        const json = await res.json();
        setClock(json);
      } catch {
        /* empty */
      }
    }
    load();
    const interval = setInterval(load, 60_000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!clock) return;
    const target = clock.isOpen ? clock.nextClose : clock.nextOpen;

    function tick() {
      setCountdown(formatCountdown(target));
    }
    tick();
    const timer = setInterval(tick, 30_000);
    return () => clearInterval(timer);
  }, [clock]);

  // 스캔 주기 카운트다운
  useEffect(() => {
    const timer = setInterval(() => {
      setScanInfo(getNextScanInfo());
    }, 10_000);
    return () => clearInterval(timer);
  }, []);

  if (!clock) return null;

  return (
    <div className="mx-5 mb-4 space-y-2">
      {/* 장 상태 */}
      <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--card)]">
        <span
          className={`w-2 h-2 rounded-full ${
            clock.isOpen ? 'bg-green-400 animate-pulse' : 'bg-gray-500'
          }`}
        />
        <span className="text-sm text-[var(--text-secondary)]">
          {clock.isOpen ? '장 열림' : '장 마감'}
        </span>
        <span className="text-xs text-[var(--text-tertiary)] ml-auto">
          {clock.isOpen
            ? `마감까지 ${countdown}`
            : `개장까지 ${countdown}`}
        </span>
      </div>

      {/* AI 스캔 주기 (장이 열려있을 때만) */}
      {clock.isOpen && (
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-[var(--card)]">
          <div className="flex items-center gap-2 shrink-0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--accent)]">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span className="text-xs text-[var(--text-secondary)]">AI 스캔 주기</span>
          </div>
          {/* 프로그레스 바 */}
          <div className="flex-1 h-1.5 rounded-full bg-[var(--border)] overflow-hidden">
            <div
              className="h-full rounded-full bg-[var(--accent)] transition-all duration-1000"
              style={{ width: `${scanInfo.progress}%` }}
            />
          </div>
          <span className="text-xs text-[var(--text-tertiary)] shrink-0 tabular-nums">
            {scanInfo.minutesLeft}분 후
          </span>
        </div>
      )}
    </div>
  );
}
