'use client';

import { useEffect, useState } from 'react';

interface NewsItem {
  headline: string;
  headlineOriginal: string;
  source: string;
  url: string;
  symbols: string[];
  createdAt: string;
}

export default function NewsFeed() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/news?limit=8');
        const json = await res.json();
        setNews(json.news || []);
      } catch {
        /* empty */
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <section className="px-5 pb-6">
        <h2 className="text-sm font-semibold text-[var(--text-secondary)] mb-3">
          시장 뉴스
        </h2>
        <div className="bg-[var(--card)] rounded-2xl p-4 animate-pulse-soft h-32" />
      </section>
    );
  }

  if (news.length === 0) return null;

  return (
    <section className="px-5 pb-6">
      <h2 className="text-sm font-semibold text-[var(--text-secondary)] mb-3 flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
        시장 뉴스
      </h2>
      <div className="bg-[var(--card)] rounded-2xl overflow-hidden">
        {news.map((item, i) => {
          const time = new Date(item.createdAt).toLocaleTimeString('ko-KR', {
            hour: '2-digit',
            minute: '2-digit',
          });
          return (
            <a
              key={`${item.createdAt}-${i}`}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`block px-4 py-3 hover:bg-[var(--bg-hover)] transition-colors ${
                i < news.length - 1 ? 'border-b border-[var(--border)]' : ''
              }`}
            >
              <p className="text-sm text-[var(--text-primary)] leading-snug mb-1">
                {item.headline}
              </p>
              <div className="flex items-center gap-2 text-xs text-[var(--text-tertiary)]">
                <span>{item.source}</span>
                <span>{time}</span>
                {item.symbols.length > 0 && (
                  <span className="ml-auto text-[var(--accent)]">
                    {item.symbols.slice(0, 3).join(', ')}
                  </span>
                )}
              </div>
            </a>
          );
        })}
      </div>
    </section>
  );
}
