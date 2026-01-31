'use client';

import { useState } from 'react';

const STEPS = [
  {
    icon: '📰',
    title: '뉴스 스캔',
    desc: '30분마다 Google News에서 시장 키워드를 탐색하고, AI(Gemini)가 유망 종목 5개를 선별합니다.',
    detail: 'RSS 피드 → Gemini 2.5 Pro 분석 → daily_targets 저장',
  },
  {
    icon: '📊',
    title: '차트 분석',
    desc: '15분마다 선별된 종목의 15분봉 차트 데이터를 Alpaca API에서 가져옵니다.',
    detail: 'Alpaca Bars API → 15분봉 20개 조회',
  },
  {
    icon: '📈',
    title: '기술 지표 계산',
    desc: 'RSI(14), 20일 이동평균선(SMA20), 거래량 배율을 계산하여 매수 적합성을 판단합니다.',
    detail: 'RSI < 40: 과매도 → 매수 신호\nSMA20 위: 상승 추세\n거래량 1.5배↑: 관심 급증',
  },
  {
    icon: '🤖',
    title: 'AI 매매 판단',
    desc: 'Gemini 2.5 Pro가 기술 지표 + 뉴스 맥락을 종합하여 BUY/HOLD 판단을 내립니다.',
    detail: '기술지표 + 뉴스 감성 + 시장 컨텍스트 → BUY/HOLD 결정',
  },
  {
    icon: '💰',
    title: '자동 주문',
    desc: 'BUY 판단 시 현금의 10%(최대 10주)를 브라켓 주문으로 매수합니다.',
    detail: '시장가 매수 → 익절(+3%) + 손절(-2%) 자동 설정',
  },
  {
    icon: '🛡️',
    title: '안전 차단기',
    desc: '일일 수익 +$100 또는 손실 -$30 도달 시 자동으로 매매를 중단합니다.',
    detail: '장 마감 시 미체결 주문 자동 정리 (5:50 PM ET)',
  },
];

export default function WorkflowGuide() {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  return (
    <div className="px-5 pb-6">
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
          AI 매매 워크플로우
        </h2>
        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 font-medium">
          테스트 중
        </span>
      </div>
      <p className="text-xs text-[var(--text-tertiary)] mb-3 leading-relaxed">
        현재 가상 계좌로 테스트 중이며, 전략을 구체적으로 설계하고 있어요.
      </p>
      <div className="bg-[var(--card)] rounded-2xl overflow-hidden">
        {STEPS.map((step, i) => (
          <button
            key={i}
            onClick={() => setExpandedIdx(expandedIdx === i ? null : i)}
            className={`w-full text-left px-4 py-3.5 flex items-start gap-3 transition-colors ${
              i < STEPS.length - 1 ? 'border-b border-[var(--border)]' : ''
            } ${expandedIdx === i ? 'bg-[var(--bg-hover)]' : ''}`}
          >
            {/* 스텝 연결선 */}
            <div className="shrink-0 flex flex-col items-center">
              <span className="text-base">{step.icon}</span>
              {i < STEPS.length - 1 && (
                <div className="w-px h-full min-h-[8px] bg-[var(--border)] mt-1" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-[var(--accent)] font-mono">STEP {i + 1}</span>
                <span className="text-sm font-semibold text-[var(--text-primary)]">{step.title}</span>
                <svg
                  width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  className={`ml-auto shrink-0 text-[var(--text-tertiary)] transition-transform duration-200 ${
                    expandedIdx === i ? 'rotate-180' : ''
                  }`}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
              <p className="text-xs text-[var(--text-tertiary)] mt-1 leading-relaxed">{step.desc}</p>

              {/* 상세 (아코디언) */}
              <div className={`overflow-hidden transition-all duration-200 ${
                expandedIdx === i ? 'max-h-24 opacity-100 mt-2' : 'max-h-0 opacity-0'
              }`}>
                <p className="text-[11px] text-[var(--text-tertiary)] bg-[var(--card-inner)] rounded-lg px-3 py-2 whitespace-pre-line leading-relaxed">
                  {step.detail}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
