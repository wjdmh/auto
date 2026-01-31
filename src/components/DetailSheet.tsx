'use client';

import { useEffect, useState } from 'react';
import type { TargetStory } from '@/types';
import MiniChart from './MiniChart';

interface Props {
  target: TargetStory | null;
  onClose: () => void;
}

interface HistoryItem {
  symbol: string;
  action: string;
  price: number;
  quantity: number;
  date: string;
  status: string;
}

export default function DetailSheet({ target, onClose }: Props) {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    if (target) {
      document.body.style.overflow = 'hidden';
      // 종목별 히스토리 로드
      setHistoryLoading(true);
      fetch(`/api/history?symbol=${target.symbol}&days=90`)
        .then((r) => r.json())
        .then((json) => setHistory(json.symbolHistory || []))
        .catch(() => setHistory([]))
        .finally(() => setHistoryLoading(false));
    } else {
      document.body.style.overflow = '';
      setHistory([]);
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [target]);

  if (!target) return null;

  const isBought = target.status === 'BOUGHT';
  const isProfit = target.position ? target.position.unrealizedPL >= 0 : true;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 max-w-[480px] mx-auto animate-slide-up">
        <div className="bg-[var(--sheet-bg)] rounded-t-3xl px-5 pt-4 pb-8 max-h-[80vh] overflow-y-auto scrollbar-hide">
          {/* Handle */}
          <div className="w-10 h-1 rounded-full bg-[var(--text-tertiary)] mx-auto mb-5" />

          {/* Symbol Header */}
          <div className="flex items-center justify-between gap-2 mb-4">
            <div className="min-w-0">
              <h2 className="text-xl font-bold text-[var(--text-primary)]">{target.symbol}</h2>
              {target.keyword && (
                <span className="text-[13px] text-[var(--text-tertiary)]">#{target.keyword}</span>
              )}
            </div>
            <span
              className={`text-[12px] font-medium px-3 py-1.5 rounded-full shrink-0 ${
                isBought
                  ? 'bg-[var(--accent)]/20 text-[var(--accent)]'
                  : 'bg-[var(--border)] text-[var(--text-tertiary)]'
              }`}
            >
              {isBought ? '보유중' : '조건 대기'}
            </span>
          </div>

          {/* Mini Chart (당일 가격 흐름) */}
          {isBought && (
            <div className="mb-5 bg-[var(--card-inner)] rounded-xl p-3 flex items-center justify-center">
              <MiniChart symbol={target.symbol} width={260} height={55} />
            </div>
          )}

          {/* AI 분석 리포트 */}
          <div className="mb-5">
            <h3 className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-2">
              AI 분석 리포트
            </h3>
            <div className="bg-[var(--card-inner)] rounded-xl p-4">
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                {target.reason || '분석 데이터가 없습니다.'}
              </p>
            </div>
          </div>

          {/* 기술지표 */}
          {target.technical && (target.technical.rsi != null || target.technical.volRatio != null) && (
            <div className="mb-5">
              <h3 className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-2">
                {isBought ? '매수 시점 기술지표' : '실시간 기술지표'}
              </h3>
              <div className="bg-[var(--card-inner)] rounded-xl p-4 grid grid-cols-3 gap-2 text-center">
                {target.technical.rsi != null && (
                  <div>
                    <p className="text-[11px] text-[var(--text-tertiary)] mb-1">RSI</p>
                    <p className={`text-[15px] font-bold tabular-nums ${
                      target.technical.rsi < 40 ? 'text-[var(--profit)]' :
                      target.technical.rsi > 60 ? 'text-[var(--loss)]' :
                      'text-[var(--text-primary)]'
                    }`}>
                      {target.technical.rsi.toFixed(1)}
                    </p>
                  </div>
                )}
                {target.technical.volRatio != null && (
                  <div>
                    <p className="text-[11px] text-[var(--text-tertiary)] mb-1">거래량 배율</p>
                    <p className={`text-[15px] font-bold tabular-nums ${
                      target.technical.volRatio >= 1.5 ? 'text-amber-400' : 'text-[var(--text-primary)]'
                    }`}>
                      x{target.technical.volRatio.toFixed(2)}
                    </p>
                  </div>
                )}
                {target.technical.volume != null && (
                  <div>
                    <p className="text-[11px] text-[var(--text-tertiary)] mb-1">거래량</p>
                    <p className="text-[15px] font-bold tabular-nums text-[var(--text-primary)]">
                      {target.technical.volume >= 1_000_000
                        ? `${(target.technical.volume / 1_000_000).toFixed(1)}M`
                        : target.technical.volume >= 1_000
                        ? `${(target.technical.volume / 1_000).toFixed(0)}K`
                        : target.technical.volume.toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 매매 정보 */}
          {isBought && target.trade && (
            <div className="mb-5">
              <h3 className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-2">
                매매 정보
              </h3>
              <div className="bg-[var(--card-inner)] rounded-xl p-4 space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-[13px] text-[var(--text-tertiary)]">진입 시각</span>
                  <span className="text-[13px] text-[var(--text-primary)] tabular-nums">{target.trade.time} (ET)</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[13px] text-[var(--text-tertiary)]">진입가</span>
                  <span className="text-[13px] text-[var(--text-primary)] tabular-nums">
                    ${target.trade.price.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[13px] text-[var(--text-tertiary)]">수량</span>
                  <span className="text-[13px] text-[var(--text-primary)]">
                    {target.trade.quantity}주
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 현재 포지션 */}
          {isBought && target.position && (
            <div className="mb-5">
              <h3 className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-2">
                현재 포지션
              </h3>
              <div className="bg-[var(--card-inner)] rounded-xl p-4 space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-[13px] text-[var(--text-tertiary)]">현재가</span>
                  <span className="text-[13px] text-[var(--text-primary)] tabular-nums">
                    ${target.position.currentPrice.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[13px] text-[var(--text-tertiary)]">평가손익</span>
                  <span
                    className={`text-[13px] font-semibold tabular-nums ${
                      isProfit ? 'text-[var(--profit)]' : 'text-[var(--loss)]'
                    }`}
                  >
                    {isProfit ? '+' : ''}${target.position.unrealizedPL.toFixed(2)} ({isProfit ? '+' : ''}{target.position.unrealizedPLPercent.toFixed(2)}%)
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 대응 계획 */}
          {isBought && target.order && (target.order.stopLoss || target.order.takeProfit) && (
            <div className="mb-5">
              <h3 className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-2">
                대응 계획
              </h3>
              <div className="bg-[var(--card-inner)] rounded-xl p-4 space-y-3">
                {target.order.takeProfit && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-[var(--text-tertiary)]">익절 목표</span>
                    <span className="text-sm font-medium text-[var(--accent)]">
                      ${target.order.takeProfit.toFixed(2)}
                    </span>
                  </div>
                )}
                {target.order.stopLoss && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-[var(--text-tertiary)]">손절 라인</span>
                    <span className="text-sm font-medium text-[var(--loss)]">
                      ${target.order.stopLoss.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 종목별 히스토리 */}
          <div className="mb-6">
            <h3 className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-2">
              과거 매매 기록
            </h3>
            <div className="bg-[var(--card-inner)] rounded-xl overflow-hidden">
              {historyLoading ? (
                <div className="p-4 text-center text-xs text-[var(--text-tertiary)]">
                  불러오는 중...
                </div>
              ) : history.length === 0 ? (
                <div className="p-4 text-center text-xs text-[var(--text-tertiary)]">
                  이전 매매 기록이 없습니다.
                </div>
              ) : (
                history.slice(0, 10).map((h, i) => (
                  <div
                    key={`${h.date}-${h.action}-${i}`}
                    className={`flex items-center justify-between px-4 py-2.5 ${
                      i < Math.min(history.length, 10) - 1 ? 'border-b border-[var(--border)]' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                          h.action === 'BUY'
                            ? 'bg-[var(--accent)]/15 text-[var(--accent)]'
                            : 'bg-[var(--loss)]/15 text-[var(--loss)]'
                        }`}
                      >
                        {h.action === 'BUY' ? '매수' : '매도'}
                      </span>
                      <span className="text-xs text-[var(--text-tertiary)]">{h.date}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-[var(--text-secondary)]">{h.quantity}주</span>
                      <span className="text-[var(--text-primary)]">${Number(h.price).toFixed(2)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="w-full py-3.5 rounded-xl bg-[var(--card-inner)] text-[var(--text-secondary)] text-sm font-medium hover:opacity-80 transition-opacity"
          >
            닫기
          </button>
        </div>
      </div>
    </>
  );
}
