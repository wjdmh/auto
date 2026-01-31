'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
import ReviewMode from '@/components/ReviewMode';
import WorkflowGuide from '@/components/WorkflowGuide';
import MarketOpenGuide from '@/components/MarketOpenGuide';

const REFRESH_INTERVAL = 15_000;

type FilterTab = 'all' | 'bought' | 'watching';

/** 상대 시간 포맷 */
function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 10) return '방금';
  if (sec < 60) return `${sec}초 전`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}분 전`;
  const hr = Math.floor(min / 60);
  return `${hr}시간 전`;
}

/** 위험도 기준 정렬 (손실 큰 종목 → SL근접 → 일반) */
function sortByRisk(targets: TargetStory[]): TargetStory[] {
  return [...targets].sort((a, b) => {
    // 1순위: 매수 종목 먼저
    if (a.status === 'BOUGHT' && b.status !== 'BOUGHT') return -1;
    if (a.status !== 'BOUGHT' && b.status === 'BOUGHT') return 1;
    // 2순위: 매수 종목 중 손실 큰 순서
    const plA = a.position?.unrealizedPL ?? 0;
    const plB = b.position?.unrealizedPL ?? 0;
    if (a.status === 'BOUGHT' && b.status === 'BOUGHT') {
      return plA - plB; // 손실이 큰 것이 먼저
    }
    return 0;
  });
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState<TargetStory | null>(null);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [filterTab, setFilterTab] = useState<FilterTab>('all');
  const [isMarketOpen, setIsMarketOpen] = useState<boolean | null>(null);
  const [relTime, setRelTime] = useState('');

  // Pull-to-refresh
  const mainRef = useRef<HTMLDivElement>(null);
  const [pullDistance, setPullDistance] = useState(0);
  const touchStartY = useRef(0);
  const isPulling = useRef(false);

  const isToday = selectedDate === new Date().toISOString().split('T')[0];

  // 장 상태 조회
  useEffect(() => {
    async function checkMarket() {
      try {
        const res = await fetch('/api/market-status');
        const json = await res.json();
        setIsMarketOpen(json.isOpen);
      } catch (err) {
        console.error('Page Market Check Error:', err);
        setIsMarketOpen(null);
      }
    }
    checkMarket();
    const t = setInterval(checkMarket, 60_000);
    return () => clearInterval(t);
  }, []);

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

  // 상대 시간 업데이트
  useEffect(() => {
    if (!data) return;
    setRelTime(relativeTime(data.lastUpdated));
    const t = setInterval(() => setRelTime(relativeTime(data.lastUpdated)), 10_000);
    return () => clearInterval(t);
  }, [data?.lastUpdated]);

  // 필터 + 위험도 정렬
  const filteredTargets = useMemo(() => {
    if (!data) return [];
    let targets = data.targets;
    if (filterTab === 'bought') targets = targets.filter((t) => t.status === 'BOUGHT');
    else if (filterTab === 'watching') targets = targets.filter((t) => t.status === 'WATCHING');
    return sortByRisk(targets);
  }, [data, filterTab]);

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
    if (dy > 0 && dy < 120) setPullDistance(dy);
  }
  function handleTouchEnd() {
    if (pullDistance > 60) fetchData();
    setPullDistance(0);
    isPulling.current = false;
  }

  if (loading) return <SkeletonLoader />;
  if (error && !data) return <EmptyState type="error" message={error} onRetry={fetchData} />;
  if (!data) return <EmptyState type="no-data" />;

  // 장 마감 + 오늘 + 타겟 없음 → 복기 모드
  const showReviewMode = isToday && isMarketOpen === false && data.targets.length === 0;

  const boughtCount = data.targets.filter((t) => t.status === 'BOUGHT').length;
  const watchingCount = data.targets.filter((t) => t.status === 'WATCHING').length;

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
        <div className="flex items-center justify-center transition-all" style={{ height: pullDistance }}>
          <div className={`w-6 h-6 border-2 border-[var(--accent)] border-t-transparent rounded-full ${pullDistance > 60 ? 'animate-spin' : ''
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
        <InsightHeader data={data} />
        <SystemInfoBanner />
        <SafetyBanner safety={data.safety} />
        <MarketStatus />

        {/* 날짜 선택 + 상대 시간 + 새로고침 */}
        <div className="flex items-center gap-2 px-5 pb-2">
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
        {relTime && (
          <p className="px-5 pb-4 text-[11px] text-[var(--text-tertiary)]">{relTime} 업데이트</p>
        )}

        <div className="h-1.5 bg-[var(--background)]" />

        {showReviewMode ? (
          /* ===== 복기 모드 ===== */
          <div className="pt-4">
            <MarketOpenGuide />
            <div className="h-1.5 bg-[var(--background)]" />
            <div className="pt-4">
              <ReviewMode />
            </div>
          </div>
        ) : (
          /* ===== 실시간 모드 ===== */
          <>
            {/* 주간 요약 */}
            <div className="pt-5">
              <WeeklySummary />
            </div>

            <PnLChart />
            <WinRateStats />

            <div className="h-1.5 bg-[var(--background)]" />

            <div className="pt-5">
              <ThemeCloud targets={data.targets} />
            </div>

            {/* 필터 탭 + 종목 리스트 */}
            <div>
              <div className="px-5 flex items-center justify-between mb-3">
                <h2 className="text-[15px] font-bold text-[var(--text-primary)]">
                  정찰 &amp; 매매 스토리
                </h2>
              </div>

              {/* 필터 탭 */}
              {data.targets.length > 0 && (
                <div className="px-5 flex gap-1.5 mb-3">
                  {([
                    { key: 'all' as FilterTab, label: '전체', count: data.targets.length },
                    { key: 'bought' as FilterTab, label: '보유중', count: boughtCount },
                    { key: 'watching' as FilterTab, label: '대기', count: watchingCount },
                  ]).map(({ key, label, count }) => (
                    <button
                      key={key}
                      onClick={() => setFilterTab(key)}
                      className={`text-[12px] px-3 py-1.5 rounded-full transition-colors ${filterTab === key
                          ? 'bg-[var(--accent)] text-white'
                          : 'bg-[var(--card)] text-[var(--text-tertiary)]'
                        }`}
                    >
                      {label}{count > 0 && <span className="ml-0.5 opacity-70">{count}</span>}
                    </button>
                  ))}
                </div>
              )}

              {filteredTargets.length > 0 ? (
                <MissionTimeline
                  targets={filteredTargets}
                  onSelectTarget={setSelectedTarget}
                />
              ) : data.targets.length > 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-[var(--text-tertiary)]">해당 조건의 종목이 없습니다.</p>
                </div>
              ) : (
                <EmptyState type="no-data" />
              )}
            </div>

            <div className="h-1.5 bg-[var(--background)]" />

            <div className="pt-5">
              <LiveLog logs={data.logs} />
            </div>

            <div className="h-1.5 bg-[var(--background)]" />

            {/* 워크플로우 안내 (장 열림 시에도 하단에) */}
            <div className="pt-5">
              <WorkflowGuide />
            </div>

            <div className="h-1.5 bg-[var(--background)]" />

            <div className="pt-5">
              <NewsFeed />
            </div>
          </>
        )}

        {/* Footer */}
        <footer className="px-5 py-6 text-center">
          <p className="text-[11px] text-[var(--text-tertiary)]">
            {relTime ? `${relTime} 업데이트` : new Date(data.lastUpdated).toLocaleTimeString('ko-KR')}
          </p>
          <p className="text-[11px] text-[var(--text-tertiary)] mt-1 opacity-50">
            AI Trading Dashboard v2.0
          </p>
        </footer>
      </main>

      <DetailSheet
        target={selectedTarget}
        onClose={() => setSelectedTarget(null)}
      />
    </div>
  );
}
