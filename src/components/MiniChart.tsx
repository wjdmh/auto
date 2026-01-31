'use client';

import { useEffect, useState } from 'react';

interface Bar {
  time: string;
  price: number;
}

interface Props {
  symbol: string;
  width?: number;
  height?: number;
}

export default function MiniChart({ symbol, width = 120, height = 40 }: Props) {
  const [bars, setBars] = useState<Bar[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/bars?symbol=${symbol}`);
        const json = await res.json();
        setBars(json.bars || []);
      } catch {
        /* empty */
      }
    }
    load();
  }, [symbol]);

  if (bars.length < 2) return null;

  const prices = bars.map((b) => b.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;

  const isUp = prices[prices.length - 1] >= prices[0];

  const points = prices
    .map((p, i) => {
      const x = (i / (prices.length - 1)) * width;
      const y = height - ((p - min) / range) * (height - 4) - 2;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="block"
    >
      <polyline
        points={points}
        fill="none"
        stroke={isUp ? 'var(--profit)' : 'var(--loss)'}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
