import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getAccount, getPositions } from '@/lib/alpaca';
import type { TradeLog } from '@/types';

export const dynamic = 'force-dynamic';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
}

// Yahoo Finance에서 가격 데이터 가져오기
async function fetchPriceData(symbol: string): Promise<number[]> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1y`;
    const res = await fetch(url, { next: { revalidate: 300 } });
    const data = await res.json();
    const quotes = data.chart.result[0].indicators.quote[0].close;
    return quotes.filter((q: number | null) => q !== null);
  } catch {
    return [];
  }
}

function calculateSMA(data: number[], period: number): number {
  if (data.length < period) return 0;
  const slice = data.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / period;
}

function calculateStd(data: number[], period: number): number {
  if (data.length < period) return 0;
  const mean = calculateSMA(data, period);
  const slice = data.slice(-period);
  const variance = slice.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / period;
  return Math.sqrt(variance);
}

async function callGemini(prompt: string): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 500,
        },
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data: GeminiResponse = await response.json();
  return data.candidates[0]?.content?.parts[0]?.text || '';
}

export async function GET() {
  try {
    // 1. 최근 거래 기록 조회
    const history = await query<TradeLog>(
      `SELECT * FROM trade_log ORDER BY id DESC LIMIT 10`
    );

    const lastTrade = history.find(h => h.action_taken !== 'INIT');
    const currentHolding = history[0]?.current_holding || 'CASH';

    // 2. Alpaca 계좌 정보
    const [account, positions] = await Promise.all([
      getAccount().catch(() => null),
      getPositions().catch(() => []),
    ]);

    const position = positions.find(p => p.symbol === currentHolding);
    const unrealizedPL = position ? parseFloat(position.unrealized_pl) : 0;
    const unrealizedPLPC = position ? parseFloat(position.unrealized_plpc) * 100 : 0;

    // 3. 시장 데이터
    const [spyPrices, nvdaPrices, amdPrices] = await Promise.all([
      fetchPriceData('SPY'),
      fetchPriceData('NVDA'),
      fetchPriceData('AMD'),
    ]);

    const spyPrice = spyPrices[spyPrices.length - 1] || 0;
    const spy200MA = calculateSMA(spyPrices, 200);
    const nvdaPrice = nvdaPrices[nvdaPrices.length - 1] || 0;
    const amdPrice = amdPrices[amdPrices.length - 1] || 0;

    // Z-Score 계산
    const minLen = Math.min(nvdaPrices.length, amdPrices.length);
    const ratios = nvdaPrices.slice(-minLen).map((n, i) => n / amdPrices.slice(-minLen)[i]);
    const ratio = ratios[ratios.length - 1] || 0;
    const ratioMean = calculateSMA(ratios, 20);
    const ratioStd = calculateStd(ratios, 20);
    const zScore = ratioStd !== 0 ? (ratio - ratioMean) / ratioStd : 0;

    const marketCondition = spyPrice > spy200MA ? '상승장(BULL)' : '하락장(BEAR)';
    const equity = account ? parseFloat(account.equity) : 0;
    const lastEquity = account ? parseFloat(account.last_equity) : 0;
    const todayPL = equity - lastEquity;
    const todayPLPC = lastEquity > 0 ? (todayPL / lastEquity) * 100 : 0;

    // 4. Gemini 프롬프트 구성
    const prompt = `당신은 투자 AI 감독관입니다. 아래 데이터를 바탕으로 오늘의 자동매매 현황을 분석해주세요.

## 현재 상황
- 보유 종목: ${currentHolding === 'CASH' ? '현금 (미보유)' : currentHolding}
- 계좌 평가액: $${equity.toFixed(2)}
- 오늘 손익: ${todayPL >= 0 ? '+' : ''}$${todayPL.toFixed(2)} (${todayPLPC >= 0 ? '+' : ''}${todayPLPC.toFixed(2)}%)
${position ? `- ${currentHolding} 미실현 손익: ${unrealizedPL >= 0 ? '+' : ''}$${unrealizedPL.toFixed(2)} (${unrealizedPLPC >= 0 ? '+' : ''}${unrealizedPLPC.toFixed(2)}%)` : ''}

## 시장 지표
- SPY: $${spyPrice.toFixed(2)} (200일 이평: $${spy200MA.toFixed(2)}) → ${marketCondition}
- NVDA: $${nvdaPrice.toFixed(2)}
- AMD: $${amdPrice.toFixed(2)}
- Z-Score: ${zScore.toFixed(2)} (NVDA/AMD 비율의 표준편차)

## 최근 판단
${lastTrade ? `- 액션: ${lastTrade.action_taken}
- 이유: ${lastTrade.memo}
- 시점: ${new Date(lastTrade.timestamp).toLocaleString('ko-KR')}` : '- 아직 거래 기록 없음'}

## 매매 전략 요약
1. SPY가 200일 이평선 아래면 → 전량 매도 후 현금 대피
2. 상승장에서 Z-Score > +1 → AMD 매수 (NVDA 고평가)
3. 상승장에서 Z-Score < -1 → NVDA 매수 (AMD 고평가)
4. -1 ≤ Z-Score ≤ +1 → 현재 포지션 유지

---

아래 JSON 형식으로 정확히 응답해주세요:
{
  "summary": "한 줄 요약 (30자 이내, 현재 상황을 한마디로)",
  "strategy": "전략 평가 (80자 이내, 현재 전략이 타당한지)",
  "reason": "손익 이유 (80자 이내, 오늘 손익이 왜 발생했는지)",
  "decision": "판단 근거 (80자 이내, 자동매매가 왜 이렇게 판단했는지)"
}

톤: 친근하고 이해하기 쉽게, 토스 앱처럼 간결하게. 전문용어 최소화. 이모지 사용 금지.
반드시 유효한 JSON만 출력하세요. 다른 텍스트 없이 JSON만.`;

    const analysisRaw = await callGemini(prompt);

    // JSON 파싱 시도
    let parsedAnalysis = {
      summary: '',
      strategy: '',
      reason: '',
      decision: '',
    };

    try {
      // JSON 블록 추출 (```json ... ``` 형식 처리)
      const jsonMatch = analysisRaw.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedAnalysis = JSON.parse(jsonMatch[0]);
      }
    } catch {
      // JSON 파싱 실패 시 원본 텍스트 사용
      parsedAnalysis.summary = analysisRaw.trim().slice(0, 100);
    }

    // 5. 마지막 분석 시간 (한국 시간 기준 오늘 6시)
    const now = new Date();
    const kstOffset = 9 * 60 * 60 * 1000;
    const kstNow = new Date(now.getTime() + kstOffset);
    const today6AM = new Date(kstNow);
    today6AM.setHours(6, 0, 0, 0);

    // 현재 시간이 6시 이전이면 어제 6시
    if (kstNow < today6AM) {
      today6AM.setDate(today6AM.getDate() - 1);
    }

    return NextResponse.json({
      analysis: parsedAnalysis,
      generatedAt: today6AM.toISOString(),
      data: {
        holding: currentHolding,
        equity,
        todayPL,
        todayPLPC,
        unrealizedPL,
        unrealizedPLPC,
        zScore,
        marketCondition,
      },
    });
  } catch (error) {
    console.error('AI Insight API Error:', error);
    return NextResponse.json(
      { error: 'AI 분석을 불러올 수 없습니다', analysis: null },
      { status: 500 }
    );
  }
}
