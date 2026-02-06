'use client';

import { useState, useEffect, useCallback } from 'react';
import type { DashboardData } from '@/types';
import ThemeToggle from '@/components/ThemeToggle';

const REFRESH_INTERVAL = 30_000;

interface AIAnalysis {
  summary: string;
  strategy: string;
  reason: string;
  decision: string;
  direction: string;
}

interface AIInsight {
  analysis: AIAnalysis;
  generatedAt: string;
  isNew?: boolean;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showHow, setShowHow] = useState(false);
  const [showWhy, setShowWhy] = useState(false);
  const [showZScore, setShowZScore] = useState(false);
  const [aiInsight, setAiInsight] = useState<AIInsight | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [showAiDetail, setShowAiDetail] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard');
      if (!res.ok) throw new Error();
      setData(await res.json());
    } catch {
      // silent fail
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAIInsight = useCallback(async () => {
    setAiLoading(true);
    try {
      const res = await fetch('/api/ai-insight');
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (data.analysis) {
        setAiInsight(data);
      }
    } catch {
      // silent fail
    } finally {
      setAiLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    fetchAIInsight();
    const t = setInterval(fetchData, REFRESH_INTERVAL);
    return () => clearInterval(t);
  }, [fetchData, fetchAIInsight]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-[var(--text-muted)] border-t-[var(--text-strong)] rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center px-6">
        <div className="text-center">
          <p className="text-[var(--text-subtle)] mb-4">연결할 수 없어요</p>
          <button
            onClick={fetchData}
            className="px-5 py-2.5 rounded-lg bg-[var(--blue)] text-white text-[14px] font-medium"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  const { account, holding, lastDecision, market, history } = data;
  const isPositive = account.todayPL >= 0;

  const holdingText = holding.status === 'CASH' ? '현금' : holding.status;
  const holdingColor = holding.status === 'NVDA' ? '#76B900' : holding.status === 'AMD' ? '#ED1C24' : 'var(--text-subtle)';

  const position = holding.position;
  const unrealizedPL = position ? parseFloat(position.unrealized_pl) : 0;
  const unrealizedPLPC = position ? parseFloat(position.unrealized_plpc) * 100 : 0;
  const positionIsPositive = unrealizedPL >= 0;

  return (
    <div className="min-h-screen bg-[var(--bg-base)] pb-safe">
      {/* Header */}
      <header className="flex items-center justify-between px-5 py-4">
        <span className="text-[var(--text-muted)] text-[13px]">자동매매</span>
        <ThemeToggle />
      </header>

      {/* 시스템 안내 */}
      <section className="px-5 pb-5 animate-in">
        <div className="p-4 rounded-2xl bg-[var(--bg-surface)]">
          <p className="text-[var(--text-normal)] text-[14px] leading-relaxed">
            가상 계좌로 투자 중이에요.<br />
            매일 아침 <strong className="text-[var(--text-strong)]">5시 40분</strong>에 자동으로 판단하고 매매해요.
          </p>

          {/* 왜 5시 40분? 버튼 */}
          <button
            onClick={() => setShowWhy(!showWhy)}
            className="mt-3 flex items-center gap-1.5 text-[var(--blue)] text-[13px] font-medium active:opacity-70 transition-opacity"
          >
            <span>왜 5시 40분인가요?</span>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className={`transition-transform ${showWhy ? 'rotate-180' : ''}`}
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>

          {showWhy && (
            <p className="mt-2 text-[var(--text-subtle)] text-[13px] leading-relaxed">
              미국 증시 마감 직전이에요. 하루 동안의 시장 움직임을 모두 반영한 시점에서 판단해요.
            </p>
          )}
        </div>

        {/* 어떻게 작동하나요? 버튼 */}
        <button
          onClick={() => setShowHow(!showHow)}
          className="w-full mt-3 p-4 rounded-2xl bg-[var(--bg-surface)] flex items-center justify-between active:bg-[var(--divider)] transition-colors"
        >
          <span className="text-[var(--text-normal)] text-[14px]">어떻게 작동하나요?</span>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--text-muted)"
            strokeWidth="2"
            className={`transition-transform ${showHow ? 'rotate-180' : ''}`}
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>

        {showHow && (
          <div className="mt-3 rounded-2xl bg-[var(--bg-surface)] overflow-hidden">
            {/* Step 1: 시장 필터 */}
            <div className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <span className="w-6 h-6 rounded-full bg-[var(--blue)] text-white flex items-center justify-center text-[12px] font-semibold">1</span>
                <p className="text-[var(--text-strong)] font-semibold text-[15px]">시장이 괜찮은지 확인해요</p>
              </div>
              <p className="text-[var(--text-normal)] text-[14px] leading-relaxed mb-4 pl-9">
                미국 전체 시장(SPY)이 최근 200일 평균보다 아래면 위험 신호예요.
              </p>
              <div className="pl-9 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--red)]" />
                  <span className="text-[var(--text-subtle)] text-[13px]">위험 → 전부 팔고 현금 대피</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--green)]" />
                  <span className="text-[var(--text-subtle)] text-[13px]">안전 → 다음 단계로</span>
                </div>
              </div>
            </div>

            <div className="h-[1px] bg-[var(--divider)] mx-5" />

            {/* Step 2: 종목 선택 */}
            <div className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <span className="w-6 h-6 rounded-full bg-[var(--blue)] text-white flex items-center justify-center text-[12px] font-semibold">2</span>
                <p className="text-[var(--text-strong)] font-semibold text-[15px]">NVDA와 AMD 중 고르기</p>
              </div>
              <p className="text-[var(--text-normal)] text-[14px] leading-relaxed mb-4 pl-9">
                둘 다 AI 반도체 회사라 비슷하게 움직여요. Z-Score로 어느 쪽이 저평가인지 판단해요.
              </p>
              <div className="pl-9 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-[#ED1C24] bg-[rgba(237,28,36,0.1)] px-1.5 py-0.5 rounded">+1↑</span>
                  <span className="text-[var(--text-subtle)] text-[13px]">NVDA가 비싸요 → AMD 매수</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-[#76B900] bg-[rgba(118,185,0,0.1)] px-1.5 py-0.5 rounded">-1↓</span>
                  <span className="text-[var(--text-subtle)] text-[13px]">AMD가 비싸요 → NVDA 매수</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-[var(--text-muted)] bg-[var(--divider)] px-1.5 py-0.5 rounded">±1</span>
                  <span className="text-[var(--text-subtle)] text-[13px]">정상 범위 → 유지</span>
                </div>
              </div>
            </div>

            <div className="h-[1px] bg-[var(--divider)] mx-5" />

            {/* 왜 이 전략인가 */}
            <div className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <span className="w-6 h-6 rounded-full bg-[var(--blue-light)] text-[var(--blue)] flex items-center justify-center text-[12px] font-semibold">?</span>
                <p className="text-[var(--text-strong)] font-semibold text-[15px]">왜 이 전략인가요?</p>
              </div>
              <div className="pl-9 space-y-2 text-[13px] text-[var(--text-subtle)] leading-relaxed">
                <p><strong className="text-[var(--text-normal)]">AI 핵심에 투자</strong> — GPU는 NVDA와 AMD가 만들어요</p>
                <p><strong className="text-[var(--text-normal)]">자동 대피</strong> — 하락장엔 현금으로 피해요</p>
                <p><strong className="text-[var(--text-normal)]">순환매 포착</strong> — 둘이 번갈아 오를 때 수익 내요</p>
              </div>
            </div>

            {/* 하단 닫기 버튼 */}
            <button
              onClick={() => setShowHow(false)}
              className="w-full py-4 text-[var(--blue)] text-[14px] font-medium border-t border-[var(--divider)] active:bg-[var(--divider-light)] transition-colors"
            >
              닫기
            </button>
          </div>
        )}
      </section>

      {/* 구분선 */}
      <div className="h-[1px] bg-[var(--divider)]" />

      {/* 자산 섹션 */}
      <section className="px-5 py-6 animate-in" style={{ animationDelay: '50ms' }}>
        <p className="text-[var(--text-muted)] text-[12px] mb-1">내 투자</p>
        <p className="text-display text-[var(--text-strong)]">
          ${account.equity.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </p>
        <div className="flex items-center gap-2 mt-2">
          <span className={`text-[15px] font-medium ${isPositive ? 'text-[var(--green)]' : 'text-[var(--red)]'}`}>
            {isPositive ? '+' : ''}{account.todayPLPercent.toFixed(2)}%
          </span>
          <span className="text-[var(--text-subtle)] text-[14px]">
            {isPositive ? '+' : ''}${Math.abs(account.todayPL).toFixed(2)} 오늘
          </span>
        </div>
      </section>

      {/* AI 감독관 */}
      <section className="px-5 py-5 animate-in" style={{ animationDelay: '75ms' }}>
        {aiLoading ? (
          <div className="p-5 rounded-2xl bg-[var(--bg-surface)]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[var(--blue-light)] flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-[var(--blue)]/30 border-t-[var(--blue)] rounded-full animate-spin" />
              </div>
              <div>
                <p className="text-[var(--text-strong)] text-[15px] font-medium">AI 감독관</p>
                <p className="text-[var(--text-muted)] text-[13px]">오늘의 분석을 준비하고 있어요</p>
              </div>
            </div>
          </div>
        ) : aiInsight?.analysis ? (
          <div className="rounded-2xl bg-[var(--bg-surface)] overflow-hidden">
            {/* 메인: 요약 */}
            <div className="p-5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-[var(--blue-light)] flex items-center justify-center flex-shrink-0">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth="2">
                    <path d="M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z" />
                    <path d="M6 10v1a6 6 0 0 0 12 0v-1" />
                    <path d="M12 17v4" />
                    <path d="M8 21h8" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <p className="text-[var(--text-strong)] text-[15px] font-semibold">AI 감독관</p>
                    <span className="text-[var(--text-muted)] text-[11px]">오늘 오전 6시</span>
                  </div>
                  <p className="text-[var(--text-strong)] text-[17px] font-medium leading-snug">
                    {aiInsight.analysis.summary}
                  </p>
                </div>
              </div>

              {/* 더보기 버튼 */}
              <button
                onClick={() => setShowAiDetail(!showAiDetail)}
                className="mt-4 w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[var(--bg-base)] text-[var(--blue)] text-[14px] font-medium active:bg-[var(--divider)] transition-colors"
              >
                <span>{showAiDetail ? '접기' : '자세히 보기'}</span>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className={`transition-transform ${showAiDetail ? 'rotate-180' : ''}`}
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>
            </div>

            {/* 상세 분석 (펼쳤을 때) */}
            {showAiDetail && (
              <div className="px-5 pb-5 pt-2 space-y-4 border-t border-[var(--divider)]">
                {/* 전략 평가 */}
                {aiInsight.analysis.strategy && (
                  <div className="flex gap-3">
                    <div className="w-5 h-5 rounded-full bg-[var(--green-light)] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="3">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-[var(--text-muted)] text-[11px] mb-0.5">전략 평가</p>
                      <p className="text-[var(--text-normal)] text-[14px] leading-relaxed">{aiInsight.analysis.strategy}</p>
                    </div>
                  </div>
                )}

                {/* 손익 이유 */}
                {aiInsight.analysis.reason && (
                  <div className="flex gap-3">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${isPositive ? 'bg-[var(--green-light)]' : 'bg-[var(--red-light)]'}`}>
                      <span className={`text-[10px] font-bold ${isPositive ? 'text-[var(--green)]' : 'text-[var(--red)]'}`}>
                        {isPositive ? '↑' : '↓'}
                      </span>
                    </div>
                    <div>
                      <p className="text-[var(--text-muted)] text-[11px] mb-0.5">손익 이유</p>
                      <p className="text-[var(--text-normal)] text-[14px] leading-relaxed">{aiInsight.analysis.reason}</p>
                    </div>
                  </div>
                )}

                {/* 판단 근거 */}
                {aiInsight.analysis.decision && (
                  <div className="flex gap-3">
                    <div className="w-5 h-5 rounded-full bg-[var(--blue-light)] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth="3">
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-[var(--text-muted)] text-[11px] mb-0.5">판단 근거</p>
                      <p className="text-[var(--text-normal)] text-[14px] leading-relaxed">{aiInsight.analysis.decision}</p>
                    </div>
                  </div>
                )}

                {/* 전략 방향 */}
                {aiInsight.analysis.direction && (
                  <div className="flex gap-3">
                    <div className="w-5 h-5 rounded-full bg-[var(--blue-light)] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth="3">
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-[var(--text-muted)] text-[11px] mb-0.5">전략 방향</p>
                      <p className="text-[var(--text-normal)] text-[14px] leading-relaxed">{aiInsight.analysis.direction}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="p-5 rounded-2xl bg-[var(--bg-surface)]">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-[var(--bg-base)] flex items-center justify-center flex-shrink-0">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2">
                  <path d="M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z" />
                  <path d="M6 10v1a6 6 0 0 0 12 0v-1" />
                  <path d="M12 17v4" />
                  <path d="M8 21h8" />
                </svg>
              </div>
              <div>
                <p className="text-[var(--text-strong)] text-[15px] font-medium">AI 감독관</p>
                <p className="text-[var(--text-subtle)] text-[13px] mt-1 leading-relaxed">
                  매일 아침 6시에 어제의 매매 결과를<br />분석해서 알려드려요
                </p>
              </div>
            </div>
          </div>
        )}
      </section>

      <div className="h-[1px] bg-[var(--divider)]" />

      {/* 보유 종목 */}
      <section className="px-5 py-5 animate-in" style={{ animationDelay: '100ms' }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[var(--text-muted)] text-[12px] mb-1">보유 중</p>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: holdingColor }} />
              <span className="text-title text-[var(--text-strong)]">{holdingText}</span>
            </div>
          </div>
          {position && holding.status !== 'CASH' && (
            <div className="text-right">
              <p className={`text-title ${positionIsPositive ? 'text-[var(--green)]' : 'text-[var(--red)]'}`}>
                {positionIsPositive ? '+' : ''}{unrealizedPLPC.toFixed(2)}%
              </p>
              <p className="text-[var(--text-muted)] text-[12px] mt-0.5">
                {positionIsPositive ? '+' : ''}${unrealizedPL.toFixed(2)}
              </p>
            </div>
          )}
        </div>

        {position && holding.status !== 'CASH' && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-[var(--divider-light)]">
            <div>
              <p className="text-[var(--text-muted)] text-[11px]">수량</p>
              <p className="text-[var(--text-normal)] text-[14px] mt-0.5">{parseFloat(position.qty).toFixed(0)}주</p>
            </div>
            <div>
              <p className="text-[var(--text-muted)] text-[11px]">평균 단가</p>
              <p className="text-[var(--text-normal)] text-[14px] mt-0.5">${parseFloat(position.avg_entry_price).toFixed(2)}</p>
            </div>
            <div>
              <p className="text-[var(--text-muted)] text-[11px]">현재가</p>
              <p className="text-[var(--text-normal)] text-[14px] mt-0.5">${parseFloat(position.current_price).toFixed(2)}</p>
            </div>
          </div>
        )}

        {holding.status === 'CASH' && (
          <p className="text-[var(--text-subtle)] text-[13px] mt-2">시장 상황을 지켜보고 있어요</p>
        )}
      </section>

      <div className="h-2 bg-[var(--bg-surface)]" />

      {/* 실시간 분석 */}
      {market && (
        <section className="px-5 py-5 animate-in" style={{ animationDelay: '150ms' }}>
          <p className="text-[var(--text-muted)] text-[12px] mb-4">실시간 분석</p>

          <div className="flex items-center justify-between mb-2">
            <span className="text-[var(--text-subtle)] text-[14px]">Z-Score</span>
            <span className="text-title text-[var(--text-strong)]">
              {market.zScore > 0 ? '+' : ''}{market.zScore.toFixed(2)}
            </span>
          </div>

          {/* Z-Score 설명 버튼 */}
          <button
            onClick={() => setShowZScore(!showZScore)}
            className="mb-4 flex items-center gap-1 text-[var(--blue)] text-[13px] font-medium active:opacity-70 transition-opacity"
          >
            <span>Z-Score가 무엇인가요?</span>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className={`transition-transform ${showZScore ? 'rotate-180' : ''}`}
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>

          {showZScore && (
            <div className="mb-4 p-4 rounded-xl bg-[var(--bg-surface)] text-[14px] leading-relaxed">
              <p className="text-[var(--text-normal)] mb-3">
                <strong className="text-[var(--text-strong)]">Z-Score</strong>는 NVDA와 AMD의 가격 비율이 평소와 얼마나 다른지 보여주는 숫자예요.
              </p>
              <p className="text-[var(--text-subtle)] mb-3">
                두 회사는 같은 AI 반도체 업종이라 보통 비슷하게 움직여요. 그런데 가끔 한쪽이 너무 올랐거나 너무 떨어질 때가 있어요.
              </p>
              <div className="space-y-2 mt-3">
                <div className="flex items-center gap-2">
                  <span className="text-[12px] font-bold text-[#ED1C24] bg-[rgba(237,28,36,0.1)] px-2 py-0.5 rounded">+1.0 이상</span>
                  <span className="text-[var(--text-subtle)] text-[13px]">NVDA가 비싸요 → AMD 매수</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[12px] font-bold text-[#76B900] bg-[rgba(118,185,0,0.1)] px-2 py-0.5 rounded">-1.0 이하</span>
                  <span className="text-[var(--text-subtle)] text-[13px]">AMD가 비싸요 → NVDA 매수</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[12px] font-bold text-[var(--text-muted)] bg-[var(--divider)] px-2 py-0.5 rounded">-1 ~ +1</span>
                  <span className="text-[var(--text-subtle)] text-[13px]">정상 범위 → 유지</span>
                </div>
              </div>
            </div>
          )}

          <div className="relative h-1.5 bg-[var(--bg-surface)] rounded-full mb-2">
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-[var(--text-strong)] transition-all duration-500"
              style={{ left: `calc(${Math.max(0, Math.min(100, ((market.zScore + 2) / 4) * 100))}% - 6px)` }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-[var(--text-muted)]">
            <span>NVDA 저평가</span>
            <span>AMD 저평가</span>
          </div>

          <div className="flex items-center justify-between mt-4 pt-4 border-t border-[var(--divider-light)]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#76B900]" />
              <span className="text-[var(--text-subtle)] text-[12px]">NVDA</span>
              <span className="text-[var(--text-normal)] text-[14px] font-medium">${market.nvdaPrice.toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[var(--text-normal)] text-[14px] font-medium">${market.amdPrice.toFixed(2)}</span>
              <span className="text-[var(--text-subtle)] text-[12px]">AMD</span>
              <span className="w-2 h-2 rounded-full bg-[#ED1C24]" />
            </div>
          </div>
        </section>
      )}

      <div className="h-2 bg-[var(--bg-surface)]" />

      {/* 최근 판단 */}
      {lastDecision && (
        <section className="px-5 py-5 animate-in" style={{ animationDelay: '200ms' }}>
          <p className="text-[var(--text-muted)] text-[12px] mb-2">최근 판단</p>
          <p className="text-[var(--text-normal)] text-[14px] leading-relaxed">{lastDecision.memo}</p>
          <p className="text-[var(--text-muted)] text-[11px] mt-2">
            {new Date(lastDecision.timestamp).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })}
            {' '}
            {new Date(lastDecision.timestamp).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </section>
      )}

      <div className="h-2 bg-[var(--bg-surface)]" />

      {/* 기록 */}
      {history.length > 0 && (
        <section className="px-5 py-5 animate-in" style={{ animationDelay: '250ms' }}>
          <p className="text-[var(--text-muted)] text-[12px] mb-3">기록</p>
          {history.slice(0, 5).map((record, i) => {
            const actionLabel =
              record.action_taken === 'BUY_NVDA' ? 'NVDA 매수' :
              record.action_taken === 'BUY_AMD' ? 'AMD 매수' :
              record.action_taken === 'SELL_ALL' ? '전량 매도' : '유지';
            const actionColor =
              record.action_taken === 'BUY_NVDA' ? '#76B900' :
              record.action_taken === 'BUY_AMD' ? '#ED1C24' :
              'var(--text-subtle)';

            return (
              <div
                key={record.id}
                className={`flex items-center justify-between py-3 ${i !== history.slice(0, 5).length - 1 ? 'border-b border-[var(--divider-light)]' : ''}`}
              >
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: actionColor }} />
                  <span className="text-[var(--text-normal)] text-[13px]">{actionLabel}</span>
                </div>
                <span className="text-[var(--text-muted)] text-[11px]">
                  {new Date(record.timestamp).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                </span>
              </div>
            );
          })}
        </section>
      )}

      {/* Footer */}
      <footer className="px-5 py-8 text-center">
        <p className="text-[11px] text-[var(--text-muted)]">Alpaca Paper Trading · n8n 자동화</p>
      </footer>
    </div>
  );
}
