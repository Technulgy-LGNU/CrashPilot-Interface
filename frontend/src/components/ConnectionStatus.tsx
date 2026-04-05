interface ConnectionStatusProps {
  label: string;
  connected: boolean;
}

export default function ConnectionStatus({
  label,
  connected,
}: ConnectionStatusProps) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={`inline-block w-2 h-2 rounded-full transition-all duration-300 ${
          connected
            ? "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)] animate-pulse-dot"
            : "bg-red-500/80 shadow-[0_0_4px_rgba(239,68,68,0.3)]"
        }`}
        style={{ color: connected ? "#34d399" : "#ef4444" }}
      />
      <span className="text-[11px] text-slate-400">{label}</span>
      <span
        className={`text-[10px] font-mono font-semibold tracking-wide ${
          connected ? "text-emerald-400/80" : "text-red-400/70"
        }`}
      >
        {connected ? "OK" : "OFF"}
      </span>
    </div>
  );
}
