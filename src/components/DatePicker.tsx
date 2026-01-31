'use client';

interface Props {
  selectedDate: string; // YYYY-MM-DD
  onChange: (date: string) => void;
}

export default function DatePicker({ selectedDate, onChange }: Props) {
  const today = new Date().toISOString().split('T')[0];
  const isToday = selectedDate === today;

  return (
    <div className="flex items-center gap-2 w-full">
      <button
        onClick={() => onChange(today)}
        className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
          isToday
            ? 'bg-[var(--accent)] text-white'
            : 'bg-[var(--card)] text-[var(--text-tertiary)]'
        }`}
      >
        오늘
      </button>
      <button
        onClick={() => {
          const d = new Date(selectedDate);
          d.setDate(d.getDate() - 1);
          onChange(d.toISOString().split('T')[0]);
        }}
        className="text-xs px-2.5 py-1.5 rounded-full bg-[var(--card)] text-[var(--text-tertiary)]"
      >
        ←
      </button>
      <input
        type="date"
        value={selectedDate}
        max={today}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 text-sm bg-[var(--card)] text-[var(--text-primary)] border-none rounded-xl px-3 py-1.5 outline-none"
      />
      <button
        onClick={() => {
          const d = new Date(selectedDate);
          d.setDate(d.getDate() + 1);
          const next = d.toISOString().split('T')[0];
          if (next <= today) onChange(next);
        }}
        className="text-xs px-2.5 py-1.5 rounded-full bg-[var(--card)] text-[var(--text-tertiary)]"
        disabled={selectedDate === today}
      >
        →
      </button>
    </div>
  );
}
