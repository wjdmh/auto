const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

// 간단한 인메모리 캐시 (서버리스 환경에서 콜드스타트 시 초기화됨)
const cache = new Map<string, string>();

export async function translateToKorean(texts: string[]): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  const toTranslate: string[] = [];

  // 캐시 확인
  for (const text of texts) {
    if (!text) continue;
    const cached = cache.get(text);
    if (cached) {
      result.set(text, cached);
    } else {
      toTranslate.push(text);
    }
  }

  if (toTranslate.length === 0 || !GEMINI_API_KEY) {
    return result;
  }

  try {
    const prompt = `아래 영어 문장들을 자연스러운 한국어로 번역해주세요.
각 줄을 번역하고, 번역 결과만 줄바꿈으로 구분해서 출력하세요.
원문의 줄 수와 번역 결과의 줄 수가 정확히 같아야 합니다.
금융/주식 용어는 한국 투자자에게 익숙한 표현을 사용하세요.

${toTranslate.map((t, i) => `${i + 1}. ${t}`).join('\n')}`;

    const res = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 1024,
        },
      }),
    });

    if (!res.ok) {
      console.error('Gemini translate error:', res.status);
      return result;
    }

    const json = await res.json();
    const output: string = json.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // "1. 번역문" 형식 파싱
    const lines = output
      .split('\n')
      .map((line: string) => line.replace(/^\d+\.\s*/, '').trim())
      .filter((line: string) => line.length > 0);

    for (let i = 0; i < toTranslate.length && i < lines.length; i++) {
      cache.set(toTranslate[i], lines[i]);
      result.set(toTranslate[i], lines[i]);
    }
  } catch (err) {
    console.error('Translation failed:', err);
  }

  return result;
}
