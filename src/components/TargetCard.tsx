'use client';

import { useRef, useEffect } from 'react';
import type { TargetStory } from '@/types';
import MiniChart from './MiniChart';

interface Props {
  target: TargetStory;
  onClick: () => void;
}

function getSlTpAlert(
  currentPrice: number,
  stopLoss: number | null,
  takeProfit: number | null,
  entryPrice: number
): { type: 'sl' | 'tp'; percent: number } | null {
  if (!stopLoss && !takeProfit) return null;

  if (stopLoss) {
    const range = entryPrice - stopLoss;
    if (range > 0) {
      const progress = (entryPrice - currentPrice) / range;
      if (progress >= 0.8) return { type: 'sl', percent: Math.round(progress * 100) };
    }
  }

  if (takeProfit) {
    const range = takeProfit - entryPrice;
    if (range > 0) {
      const progress = (currentPrice - entryPrice) / range;
      if (progress >= 0.8) return { type: 'tp', percent: Math.round(progress * 100) };
    }
  }

  return null;
}

export default function TargetCard({ target, onClick }: Props) {
  const isBought = target.status === 'BOUGHT';
  const isProfit = target.position ? target.position.unrealizedPL >= 0 : true;
  const isAtRisk = isBought && target.position && target.position.unrealizedPL < 0;

  // 가격 변동 하이라이트
  const prevPrice = useRef(target.position?.currentPrice);
  const priceRef = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (!target.position || !priceRef.current) return;
    const prev = prevPrice.current;
    const curr = target.position.currentPrice;
    if (prev != null && prev !== curr) {
      const cls = curr > prev ? 'flash-profit' : 'flash-loss';
      priceRef.current.classList.add(cls);
      const t = setTimeout(() => priceRef.current?.classList.remove(cls), 600);
      return () => clearTimeout(t);
    }
    prevPrice.current = curr;
  }, [target.position?.currentPrice]);

  // SL/TP 근접 알림
  const alert =
    isBought && target.position && target.order && target.trade
      ? getSlTpAlert(
          target.position.currentPrice,
          target.order.stopLoss,
          target.order.takeProfit,
          target.trade.price
        )
      : null;

  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-2xl p-5 transition-all active:scale-[0.98] ${
        isBought
          ? 'bg-[var(--card)] border border-[var(--accent)]/30'
          : 'bg-[var(--card)]/60 border border-[var(--border)] opacity-70'
      } ${alert ? (alert.type === 'sl' ? 'ring-1 ring-[var(--loss)]/40' : 'ring-1 ring-[var(--profit)]/40') : ''}`}
    >
      {/* SL/TP 근접 경고 */}
      {alert && (
        <div
          className={`mb-3 px-3 py-1.5 rounded-lg text-xs font-medium ${
            alert.type === 'sl'
              ? 'bg-[var(--loss)]/10 text-[var(--loss)]'
              : 'bg-[var(--profit)]/10 text-[var(--profit)]'
          }`}
        >
          {alert.type === 'sl'
            ? `손절가 근접 (${alert.percent}% 도달)`
            : `익절가 근접 (${alert.percent}% 도달)`}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <span className="text-[17px] font-bold text-[var(--text-primary)]">
            {target.symbol}
          </span>
          {target.keyword && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--border)] text-[var(--text-tertiary)]">
              #{target.keyword}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {isAtRisk && (
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-[var(--loss)]/15 text-[var(--loss)]">
              손실
            </span>
          )}
          <span
            className={`text-xs font-medium px-2.5 py-1 rounded-full ${
              isBought
                ? 'bg-[var(--accent)]/20 text-[var(--accent)]'
                : 'bg-[var(--border)] text-[var(--text-tertiary)]'
            }`}
          >
            {isBought ? '보유중' : '조건 대기'}
          </span>
        </div>
      </div>

      {/* Storytelling */}
      <div className="space-y-1.5">
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
          &quot;아침에{' '}
          <strong className="text-[var(--text-primary)]">{target.reason || '시장 분석'}</strong>
          으로 포착했어요.&quot;
        </p>

        {isBought && target.trade && (
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            &quot;{target.trade.time}에{' '}
            <strong className="text-[var(--text-primary)]">
              ${target.trade.price.toFixed(2)}
            </strong>
            에 {target.trade.quantity}주 진입했습니다.&quot;
          </p>
        )}

        {!isBought && (
          <p className="text-sm text-[var(--text-tertiary)] leading-relaxed">
            &quot;아직 매수 타이밍이 오지 않았습니다.&quot;
          </p>
        )}
      </div>

      {/* Technical Indicators (모든 종목에 표시) */}
      {target.technical && (target.technical.rsi != null || target.technical.volRatio != null) && (
        <div className="mt-3 pt-3 border-t border-[var(--border)]">
          <div className="flex items-center gap-1.5 text-xs flex-wrap">
            {!isBought && (
              <span className="text-[10px] text-[var(--text-tertiary)] mr-1">실시간</span>
            )}
            {target.technical.rsi != null && (
              <span className={`px-2 py-1 rounded-md ${
                target.technical.rsi < 40 ? 'bg-[var(--profit)]/10 text-[var(--profit)]' :
                target.technical.rsi > 60 ? 'bg-[var(--loss)]/10 text-[var(--loss)]' :
                'bg-[var(--border)] text-[var(--text-tertiary)]'
              }`}>
                RSI {target.technical.rsi.toFixed(0)}
              </span>
            )}
            {target.technical.volRatio != null && (
              <span className={`px-2 py-1 rounded-md ${
                target.technical.volRatio >= 1.5 ? 'bg-amber-500/10 text-amber-400' :
                'bg-[var(--border)] text-[var(--text-tertiary)]'
              }`}>
                거래량 x{target.technical.volRatio.toFixed(1)}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Position Info (Active only) */}
      {isBought && target.position && (
        <div className="mt-3 pt-3 border-t border-[var(--border)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-[var(--text-tertiary)] mb-0.5">현재가</p>
              <p ref={priceRef} className="text-[15px] font-semibold text-[var(--text-primary)] rounded px-1 -mx-1 transition-colors">
                ${target.position.currentPrice.toFixed(2)}
              </p>
            </div>

            {/* Mini Chart */}
            <div className="mx-2">
              <MiniChart symbol={target.symbol} width={80} height={32} />
            </div>

            <div className="text-right">
              <p className="text-xs text-[var(--text-tertiary)] mb-0.5">수익률</p>
              <p
                className={`text-[15px] font-semibold ${
                  isProfit ? 'text-[var(--profit)]' : 'text-[var(--loss)]'
                }`}
              >
                {isProfit ? '+' : ''}
                {target.position.unrealizedPLPercent.toFixed(2)}%
              </p>
            </div>
          </div>

          {/* SL / TP Bar */}
          {target.order && (target.order.stopLoss || target.order.takeProfit) && (
            <div className="mt-2 flex items-center gap-1.5 text-xs">
              {target.order.stopLoss && (
                <span className="px-2 py-1 rounded-md bg-[var(--loss)]/10 text-[var(--loss)]">
                  손절 ${target.order.stopLoss.toFixed(2)}
                </span>
              )}
              {target.order.takeProfit && (
                <span className="px-2 py-1 rounded-md bg-[var(--accent)]/10 text-[var(--accent)]">
                  익절 ${target.order.takeProfit.toFixed(2)}
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </button>
  );
}
