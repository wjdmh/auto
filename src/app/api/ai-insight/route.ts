import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getAccount, getPositions } from '@/lib/alpaca';
import type { TradeLog } from '@/types';

export const dynamic = 'force-dynamic';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

interface AIInsightRow {
  id: number;
  date: string;
  summary: string;
  strategy: string;
  reason: string;
  decision: string;
  direction: string;
  created_at: string;
}

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
}

// 테이블 생성 (없으면)
async function ensureTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS ai_insights (
      id SERIAL PRIMARY KEY,
      date DATE UNIQUE NOT NULL,
      summary TEXT,
      strategy TEXT,
      reason TEXT,
      decision TEXT,
      direction TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
}

// 오늘 날짜 (KST 기준, 6시 이전이면 어제)
function getTodayDateKST(): string {
  const now = new Date();
  const kstOffset = 9 * 60 * 60 * 1000;
  const kstNow = new Date(now.getTime() + kstOffset);

  // 6시 이전이면 어제 날짜
  if (kstNow.getHours() < 6) {
    kstNow.setDate(kstNow.getDate() - 1);
  }

  return kstNow.toISOString().split('T')[0];
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
          maxOutputTokens: 800,
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
    await ensureTable();

    const todayDate = getTodayDateKST();

    // 1. 오늘 분석이 있는지 확인
    const existing = await query<AIInsightRow>(
      `SELECT * FROM ai_insights WHERE date = $1`,
      [todayDate]
    );

    if (existing.length > 0) {
      // 이미 오늘 분석이 있으면 반환
      const row = existing[0];
      return NextResponse.json({
        analysis: {
          summary: row.summary,
          strategy: row.strategy,
          reason: row.reason,
          decision: row.decision,
          direction: row.direction,
        },
        generatedAt: row.created_at,
        isNew: false,
      });
    }

    // 2. 새로 생성 필요 - 데이터 수집
    const history = await query<TradeLog>(
      `SELECT * FROM trade_log ORDER BY id DESC LIMIT 10`
    );

    const lastTrade = history.find(h => h.action_taken !== 'INIT');
    const currentHolding = history[0]?.current_holding || 'CASH';

    const [account, positions] = await Promise.all([
      getAccount().catch(() => null),
      getPositions().catch(() => []),
    ]);

    const position = positions.find(p => p.symbol === currentHolding);
    const unrealizedPL = position ? parseFloat(position.unrealized_pl) : 0;
    const unrealizedPLPC = position ? parseFloat(position.unrealized_plpc) * 100 : 0;

    const [spyPrices, nvdaPrices, amdPrices] = await Promise.all([
      fetchPriceData('SPY'),
      fetchPriceData('NVDA'),
      fetchPriceData('AMD'),
    ]);

    const spyPrice = spyPrices[spyPrices.length - 1] || 0;
    const spy200MA = calculateSMA(spyPrices, 200);
    const nvdaPrice = nvdaPrices[nvdaPrices.length - 1] || 0;
    const amdPrice = amdPrices[amdPrices.length - 1] || 0;

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

    // 3. Gemini 프롬프트
    const prompt = `당신은 투자 AI 감독관입니다. 매일 아침 6시에 자동매매 결과를 분석해서 투자자에게 알려주는 역할이에요.

## 현재 상황
- 보유 종목: ${currentHolding === 'CASH' ? '현금 (미보유)' : currentHolding}
- 계좌 평가액: $${equity.toFixed(2)}
- 오늘 손익: ${todayPL >= 0 ? '+' : ''}$${todayPL.toFixed(2)} (${todayPLPC >= 0 ? '+' : ''}${todayPLPC.toFixed(2)}%)
${position ? `- ${currentHolding} 미실현 손익: ${unrealizedPL >= 0 ? '+' : ''}$${unrealizedPL.toFixed(2)} (${unrealizedPLPC >= 0 ? '+' : ''}${unrealizedPLPC.toFixed(2)}%)` : ''}

## 시장 지표
- SPY: $${spyPrice.toFixed(2)} (200일 이평: $${spy200MA.toFixed(2)}) → ${marketCondition}
- NVDA: $${nvdaPrice.toFixed(2)}
- AMD: $${amdPrice.toFixed(2)}
- Z-Score: ${zScore.toFixed(2)}

## 최근 판단
${lastTrade ? `- 액션: ${lastTrade.action_taken}
- 이유: ${lastTrade.memo}` : '- 아직 거래 기록 없음'}

## 매매 전략
1. SPY < 200일 이평선 → 전량 매도 후 현금 대피
2. 상승장 + Z-Score > +1 → AMD 매수
3. 상승장 + Z-Score < -1 → NVDA 매수
4. -1 ≤ Z-Score ≤ +1 → 유지

---

아래 JSON 형식으로 응답해주세요:
{
  "summary": "오늘의 핵심 상황 요약. 예: 'AMD 주가 하락으로 손실이 발생했어요' 또는 'NVDA 상승으로 수익이 났어요' (40자 이내)",
  "strategy": "현재 전략이 잘 작동하고 있는지 평가 (60자 이내)",
  "reason": "오늘 손익이 발생한 구체적인 이유 (60자 이내)",
  "decision": "자동매매가 이렇게 판단한 근거 설명 (60자 이내)",
  "direction": "앞으로의 전략 방향과 조언. 이 전략이 계속 유효한지, 주의할 점은 무엇인지 (80자 이내)"
}

작성 원칙:
- 토스 앱처럼 친근하고 쉬운 말투 사용
- "~해요", "~예요" 체로 작성
- 전문용어 없이 누구나 이해할 수 있게
- 이모지 사용 금지
- 반드시 유효한 JSON만 출력`;

    const analysisRaw = await callGemini(prompt);

    let parsedAnalysis = {
      summary: '',
      strategy: '',
      reason: '',
      decision: '',
      direction: '',
    };

    try {
      const jsonMatch = analysisRaw.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedAnalysis = JSON.parse(jsonMatch[0]);
      }
    } catch {
      parsedAnalysis.summary = '분석을 불러오는 중 문제가 발생했어요';
    }

    // 4. DB에 저장
    await query(
      `INSERT INTO ai_insights (date, summary, strategy, reason, decision, direction)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (date) DO UPDATE SET
         summary = $2, strategy = $3, reason = $4, decision = $5, direction = $6, created_at = NOW()`,
      [todayDate, parsedAnalysis.summary, parsedAnalysis.strategy, parsedAnalysis.reason, parsedAnalysis.decision, parsedAnalysis.direction]
    );

    return NextResponse.json({
      analysis: parsedAnalysis,
      generatedAt: new Date().toISOString(),
      isNew: true,
    });
  } catch (error) {
    console.error('AI Insight API Error:', error);
    return NextResponse.json(
      { error: 'AI 분석을 불러올 수 없습니다', analysis: null },
      { status: 500 }
    );
  }
}
