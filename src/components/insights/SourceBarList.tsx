interface Entry {
  source: string;
  hex: string;
  count: number;
}

interface Props {
  entries: Entry[];
}

export function SourceBarList({ entries }: Props) {
  const max = Math.max(...entries.map((e) => e.count), 1);

  return (
    <div className="flex flex-col gap-2.5">
      {entries.map((entry) => (
        <div key={entry.source} className="flex items-center gap-3" title={`${entry.source}: ${entry.count}`}>
          <span className="w-32 shrink-0 truncate text-xs text-[#c3c2b7]">{entry.source}</span>
          <div className="h-2 flex-1 rounded-full bg-white/10">
            <div
              className="h-2 rounded-r-[4px]"
              style={{ width: `${(entry.count / max) * 100}%`, backgroundColor: entry.hex }}
            />
          </div>
          <span className="w-6 shrink-0 text-right text-xs font-semibold text-white">{entry.count}</span>
        </div>
      ))}
    </div>
  );
}
