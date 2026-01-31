'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { DashboardData, TargetStory } from '@/types';
import SkeletonLoader from '@/components/SkeletonLoader';
import EmptyState from '@/components/EmptyState';
import InsightHeader from '@/components/InsightHeader';
import SafetyBanner from '@/components/SafetyBanner';
import SystemInfoBanner from '@/components/SystemInfoBanner';
import MarketStatus from '@/components/MarketStatus';
import DatePicker from '@/components/DatePicker';
import WeeklySummary from '@/components/WeeklySummary';
import PnLChart from '@/components/PnLChart';
import WinRateStats from '@/components/WinRateStats';
import ThemeCloud from '@/components/ThemeCloud';
import MissionTimeline from '@/components/MissionTimeline';
import LiveLog from '@/components/LiveLog';
import NewsFeed from '@/components/NewsFeed';
import DetailSheet from '@/components/DetailSheet';

const REFRESH_INTERVAL = 15_000;

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState<TargetStory | null>(null);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  // Pull-to-refresh
  const mainRef = useRef<HTMLDivElement>(null);
  const [pullDistance, setPullDistance] = useState(0);
  const touchStartY = useRef(0);
  const isPulling = useRef(false);

  const isToday = selectedDate === new Date().toISOString().split('T')[0];

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setRefreshing(true);
    try {
      const url = isToday
        ? '/api/dashboard'
        : `/api/dashboard?date=${selectedDate}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch');
      const json: DashboardData = await res.json();
      setData(json);
      setError(null);
    } catch {
      setError('데이터를 불러오는 데 실패했습니다.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedDate, isToday]);

  useEffect(() => {
    setLoading(true);
    fetchData();
    if (isToday) {
      const interval = setInterval(() => fetchData(true), REFRESH_INTERVAL);
      return () => clearInterval(interval);
    }
  }, [fetchData, isToday]);

  // Pull-to-refresh handlers
  function handleTouchStart(e: React.TouchEvent) {
    if (mainRef.current && mainRef.current.scrollTop === 0) {
      touchStartY.current = e.touches[0].clientY;
      isPulling.current = true;
    }
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (!isPulling.current) return;
    const dy = e.touches[0].clientY - touchStartY.current;
    if (dy > 0 && dy < 120) {
      setPullDistance(dy);
    }
  }

  function handleTouchEnd() {
    if (pullDistance > 60) {
      fetchData();
    }
    setPullDistance(0);
    isPulling.current = false;
  }

  // Skeleton loading
  if (loading) {
    return <SkeletonLoader />;
  }

  // Error state
  if (error && !data) {
    return <EmptyState type="error" message={error} onRetry={fetchData} />;
  }

  // No data
  if (!data) {
    return <EmptyState type="no-data" />;
  }

  return (
    <div
      ref={mainRef}
      className="min-h-screen overflow-y-auto scrollbar-hide"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull-to-refresh indicator */}
      {pullDistance > 0 && (
        <div
          className="flex items-center justify-center transition-all"
          style={{ height: pullDistance }}
        >
          <div className={`w-6 h-6 border-2 border-[var(--accent)] border-t-transparent rounded-full ${
            pullDistance > 60 ? 'animate-spin' : ''
          }`} style={{ transform: `rotate(${pullDistance * 3}deg)` }} />
        </div>
      )}

      {/* Refreshing indicator */}
      {refreshing && !loading && (
        <div className="fixed top-0 left-0 right-0 z-30 max-w-[480px] mx-auto">
          <div className="h-0.5 bg-[var(--accent)] animate-pulse" />
        </div>
      )}

      <main className="pb-safe">
        {/* Header + 테마 토글 */}
        <InsightHeader data={data} />

        {/* 시스템 정보 배너 (가상계좌 + 자동매매 안내) */}
        <SystemInfoBanner />

        {/* 안전 차단기 배너 */}
        <SafetyBanner safety={data.safety} />

        {/* 장 상태 + AI 스캔 주기 */}
        <MarketStatus />

        {/* 날짜 선택 + 수동 새로고침 */}
        <div className="flex items-center gap-2 px-5 pb-4">
          <div className="flex-1">
            <DatePicker selectedDate={selectedDate} onChange={setSelectedDate} />
          </div>
          <button
            onClick={() => fetchData()}
            disabled={refreshing}
            className="shrink-0 w-9 h-9 flex items-center justify-center rounded-xl bg-[var(--card)] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors disabled:opacity-50"
            aria-label="새로고침"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={refreshing ? 'animate-spin' : ''}>
              <polyline points="23 4 23 10 17 10" />
              <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" />
            </svg>
          </button>
        </div>

        <div className="h-1.5 bg-[var(--background)]" />

        {/* 주간 요약 */}
        <div className="pt-5">
          <WeeklySummary />
        </div>

        {/* 누적 수익률 차트 */}
        <PnLChart />

        {/* 승률 통계 */}
        <WinRateStats />

        <div className="h-1.5 bg-[var(--background)]" />

        {/* 테마 태그 클라우드 */}
        <div className="pt-5">
          <ThemeCloud targets={data.targets} />
        </div>

        {/* 정찰 & 매매 스토리 */}
        <div>
          <h2 className="px-5 text-lg font-bold text-[var(--text-primary)] mb-4">
            정찰 &amp; 매매 스토리
          </h2>
          {data.targets.length > 0 ? (
            <MissionTimeline
              targets={data.targets}
              onSelectTarget={setSelectedTarget}
            />
          ) : (
            <EmptyState type="no-data" />
          )}
        </div>

        <div className="h-1.5 bg-[var(--background)]" />

        {/* 실전 기록 */}
        <div className="pt-5">
          <LiveLog logs={data.logs} />
        </div>

        <div className="h-1.5 bg-[var(--background)]" />

        {/* 뉴스 피드 */}
        <div className="pt-5">
          <NewsFeed />
        </div>

        {/* Footer */}
        <footer className="px-5 pb-8 text-center">
          <p className="text-xs text-[var(--text-tertiary)]">
            마지막 업데이트:{' '}
            {new Date(data.lastUpdated).toLocaleTimeString('ko-KR')}
          </p>
          <p className="text-xs text-[var(--text-tertiary)] mt-1 opacity-50">
            AI Trading Dashboard v2.0
          </p>
        </footer>
      </main>

      {/* Detail Bottom Sheet */}
      <DetailSheet
        target={selectedTarget}
        onClose={() => setSelectedTarget(null)}
      />
    </div>
  );
}
