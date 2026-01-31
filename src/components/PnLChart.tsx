'use client';

import { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

interface DailySummary {
  date: string;
  total_bought: number;
  total_sold: number;
  net_pl: number;
}

interface ChartPoint {
  date: string;
  label: string;
  pl: number;
  cumulative: number;
}

export default function PnLChart() {
  const [data, setData] = useState<ChartPoint[]>([]);
  const [period, setPeriod] = useState(30);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/history?days=${period}`);
        const json = await res.json();
        const daily: DailySummary[] = json.dailySummary || [];

        let cumulative = 0;
        const points: ChartPoint[] = daily.map((d) => {
          cumulative += Number(d.net_pl);
          return {
            date: d.date,
            label: new Date(d.date).toLocaleDateString('ko-KR', {
              month: 'short',
              day: 'numeric',
            }),
            pl: Number(d.net_pl),
            cumulative: Math.round(cumulative * 100) / 100,
          };
        });
        setData(points);
      } catch {
        /* empty */
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [period]);

  const latestCum = data.length > 0 ? data[data.length - 1].cumulative : 0;
  const isProfit = latestCum >= 0;

  return (
    <section className="px-5 pb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-[var(--text-secondary)]">
          누적 수익률
        </h2>
        <div className="flex gap-1">
          {[7, 14, 30].map((d) => (
            <button
              key={d}
              onClick={() => setPeriod(d)}
              className={`text-xs px-2.5 py-1 rounded-full transition-colors ${
                period === d
                  ? 'bg-[var(--accent)] text-white'
                  : 'bg-[var(--card)] text-[var(--text-tertiary)]'
              }`}
            >
              {d}일
            </button>
          ))}
        </div>
      </div>

      <div className="bg-[var(--card)] rounded-2xl p-4">
        {loading ? (
          <div className="h-[180px] flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : data.length === 0 ? (
          <div className="h-[180px] flex items-center justify-center text-sm text-[var(--text-tertiary)]">
            매매 기록이 없습니다.
          </div>
        ) : (
          <>
            <p
              className={`text-2xl font-bold mb-3 ${
                isProfit ? 'text-[var(--profit)]' : 'text-[var(--loss)]'
              }`}
            >
              {isProfit ? '+' : ''}${latestCum.toFixed(2)}
            </p>
            <ResponsiveContainer width="100%" height={150}>
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="plGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="0%"
                      stopColor={isProfit ? '#3182f6' : '#f04452'}
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="100%"
                      stopColor={isProfit ? '#3182f6' : '#f04452'}
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--border)"
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: 'var(--text-tertiary)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis hide />
                <Tooltip
                  contentStyle={{
                    background: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: 'var(--text-primary)',
                  }}
                  formatter={(value) => [`$${Number(value).toFixed(2)}`, '누적 P&L']}
                  labelFormatter={(label) => `${label}`}
                />
                <Area
                  type="monotone"
                  dataKey="cumulative"
                  stroke={isProfit ? '#3182f6' : '#f04452'}
                  strokeWidth={2}
                  fill="url(#plGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </>
        )}
      </div>
    </section>
  );
}
