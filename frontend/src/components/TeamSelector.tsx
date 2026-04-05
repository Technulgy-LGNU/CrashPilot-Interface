interface TeamSelectorProps {
  team: "blue" | "yellow";
  onTeamChange: (team: "blue" | "yellow") => void;
}

export default function TeamSelector({
  team,
  onTeamChange,
}: TeamSelectorProps) {
  return (
    <div className="flex rounded-xl overflow-hidden border border-slate-700/40 bg-slate-900/50 p-0.5 gap-0.5">
      <button
        onClick={() => onTeamChange("blue")}
        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
          team === "blue"
            ? "segment-active-blue text-white"
            : "bg-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
        }`}
      >
        <span
          className={`inline-block w-2.5 h-2.5 rounded-full transition-all duration-200 ${
            team === "blue"
              ? "bg-blue-300 shadow-[0_0_6px_rgba(147,197,253,0.6)]"
              : "bg-blue-500/40"
          }`}
        />
        Blue
      </button>
      <button
        onClick={() => onTeamChange("yellow")}
        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
          team === "yellow"
            ? "segment-active-yellow text-slate-900"
            : "bg-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
        }`}
      >
        <span
          className={`inline-block w-2.5 h-2.5 rounded-full transition-all duration-200 ${
            team === "yellow"
              ? "bg-amber-200 shadow-[0_0_6px_rgba(253,230,138,0.6)]"
              : "bg-amber-500/40"
          }`}
        />
        Yellow
      </button>
    </div>
  );
}
