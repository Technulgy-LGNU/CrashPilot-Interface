import { useState, useCallback, useEffect } from "react";
import type { RobotState } from "../hooks/useVisionSocket";
import type { SentCommand } from "../hooks/useCommandSocket";

const STATE_OPTIONS = [
  { value: 0, label: "Unspecified" },
  { value: 1, label: "Halt" },
  { value: 2, label: "Stop" },
  { value: 3, label: "Free" },
  { value: 4, label: "Goalie" },
];

const TASK_OPTIONS = [
  { value: 0, label: "Unspecified" },
  { value: 1, label: "Position" },
  { value: 2, label: "Kick" },
  { value: 3, label: "Chip" },
  { value: 4, label: "Receive Kick" },
  { value: 5, label: "Steal" },
  { value: 6, label: "Dribble" },
  { value: 7, label: "Position Ball" },
  { value: 8, label: "Receive Ball" },
  { value: 9, label: "Kickoff" },
  { value: 10, label: "Ball Placement" },
  { value: 11, label: "Free Kick" },
];

interface RobotPanelProps {
  selectedRobotId: number | null;
  robotData: RobotState | undefined;
  onSendCommand: (
    robotId: number,
    state: number,
    task: number,
    posX?: number,
    posY?: number,
    orientation?: number,
    kickOrient?: number
  ) => void;
  commandHistory: SentCommand[];
  fieldClickPos: { x: number; y: number } | null;
}

const inputClasses =
  "w-full bg-slate-900/80 border border-slate-700/50 rounded-lg px-3 py-2 text-sm font-mono text-slate-200 placeholder-slate-600 focus-cyan transition-all duration-200";

const selectClasses =
  "w-full bg-slate-900/80 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-slate-200 focus-cyan transition-all duration-200 appearance-none cursor-pointer";

const labelClasses =
  "block text-[11px] font-medium text-slate-400 mb-1.5 tracking-wide";

export default function RobotPanel({
  selectedRobotId,
  robotData,
  onSendCommand,
  commandHistory,
  fieldClickPos,
}: RobotPanelProps) {
  const [state, setState] = useState(1);
  const [task, setTask] = useState(1);
  const [posX, setPosX] = useState("");
  const [posY, setPosY] = useState("");
  const [orientation, setOrientation] = useState("");
  const [kickOrient, setKickOrient] = useState("");

  useEffect(() => {
    if (fieldClickPos) {
      setPosX(String(fieldClickPos.x));
      setPosY(String(fieldClickPos.y));
    }
  }, [fieldClickPos]);

  const handleSend = useCallback(() => {
    if (selectedRobotId === null) return;

    const px = posX !== "" ? parseFloat(posX) : undefined;
    const py = posY !== "" ? parseFloat(posY) : undefined;
    const orient =
      orientation !== ""
        ? (parseFloat(orientation) * Math.PI) / 180
        : undefined;
    const ko =
      kickOrient !== ""
        ? (parseFloat(kickOrient) * Math.PI) / 180
        : undefined;

    onSendCommand(
      selectedRobotId,
      state,
      task,
      px !== undefined && py !== undefined ? px : undefined,
      px !== undefined && py !== undefined ? py : undefined,
      orient,
      ko
    );
  }, [
    selectedRobotId,
    state,
    task,
    posX,
    posY,
    orientation,
    kickOrient,
    onSendCommand,
  ]);

  const stateLabel = (v: number) =>
    STATE_OPTIONS.find((s) => s.value === v)?.label ?? "?";
  const taskLabel = (v: number) =>
    TASK_OPTIONS.find((t) => t.value === v)?.label ?? "?";

  if (selectedRobotId === null) {
    return (
      <div className="p-6 text-center animate-fade-in">
        <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-slate-800/60 border border-slate-700/40 flex items-center justify-center">
          <svg
            className="w-6 h-6 text-slate-500"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <circle cx="12" cy="5" r="4" />
          </svg>
        </div>
        <p className="text-sm text-slate-500">Select a robot to send commands</p>
        <p className="text-xs text-slate-600 mt-1">
          Click on the field or use robot buttons above
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 p-3 overflow-y-auto animate-fade-in">
      {/* Robot info card */}
      <div className="bg-slate-800/40 rounded-xl p-3 border border-slate-700/40 hover-lift">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 rounded-md bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center">
            <span className="text-xs font-bold text-cyan-400 font-mono">
              {selectedRobotId}
            </span>
          </div>
          <h3 className="text-sm font-semibold text-slate-200">
            Robot #{selectedRobotId}
          </h3>
        </div>
        {robotData ? (
          <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs font-mono">
            <span className="text-cyan-400/70">X</span>
            <span className="text-slate-300 text-right">
              {robotData.x.toFixed(0)} mm
            </span>
            <span className="text-cyan-400/70">Y</span>
            <span className="text-slate-300 text-right">
              {robotData.y.toFixed(0)} mm
            </span>
            <span className="text-cyan-400/70">Orient</span>
            <span className="text-slate-300 text-right">
              {((robotData.orientation * 180) / Math.PI).toFixed(1)}&deg;
            </span>
            <span className="text-cyan-400/70">Conf</span>
            <span className="text-slate-300 text-right">
              {(robotData.confidence * 100).toFixed(0)}%
            </span>
          </div>
        ) : (
          <span className="text-xs text-slate-500 italic">
            No telemetry data
          </span>
        )}
      </div>

      {/* Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-slate-700/40 to-transparent" />

      {/* State selector */}
      <div>
        <label className={labelClasses}>State</label>
        <div className="relative">
          <select
            value={state}
            onChange={(e) => setState(Number(e.target.value))}
            className={selectClasses}
          >
            {STATE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
            <svg
              className="w-3.5 h-3.5 text-slate-500"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </div>
        </div>
      </div>

      {/* Task selector */}
      <div>
        <label className={labelClasses}>Task</label>
        <div className="relative">
          <select
            value={task}
            onChange={(e) => setTask(Number(e.target.value))}
            className={selectClasses}
          >
            {TASK_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
            <svg
              className="w-3.5 h-3.5 text-slate-500"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-slate-700/40 to-transparent" />

      {/* Position */}
      <div>
        <label className={labelClasses}>
          Position (mm) &mdash;{" "}
          <span className="text-cyan-400/60">click field to set</span>
        </label>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="X"
            value={posX}
            onChange={(e) => setPosX(e.target.value)}
            className={inputClasses}
          />
          <input
            type="number"
            placeholder="Y"
            value={posY}
            onChange={(e) => setPosY(e.target.value)}
            className={inputClasses}
          />
        </div>
      </div>

      {/* Orientation */}
      <div>
        <label className={labelClasses}>Orientation (deg)</label>
        <input
          type="number"
          placeholder="0 - 360"
          value={orientation}
          onChange={(e) => setOrientation(e.target.value)}
          className={inputClasses}
        />
      </div>

      {/* Kick Orientation */}
      <div>
        <label className={labelClasses}>Kick Orientation (deg)</label>
        <input
          type="number"
          placeholder="0 - 360"
          value={kickOrient}
          onChange={(e) => setKickOrient(e.target.value)}
          className={inputClasses}
        />
      </div>

      {/* Send button */}
      <button
        onClick={handleSend}
        className="btn-glow w-full text-white font-semibold py-2.5 rounded-xl text-sm tracking-wide mt-1"
      >
        Send Command
      </button>

      {/* Command history */}
      {commandHistory.length > 0 && (
        <div className="mt-1">
          <div className="h-px bg-gradient-to-r from-transparent via-slate-700/40 to-transparent mb-2" />
          <h4 className="text-[10px] text-cyan-400/60 mb-2 uppercase tracking-[0.15em] font-semibold flex items-center gap-1.5">
            <svg
              className="w-3 h-3"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="12 8 12 12 14 14" />
              <circle cx="12" cy="12" r="10" />
            </svg>
            History
          </h4>
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {commandHistory.map((cmd, i) => (
              <div
                key={`${cmd.timestamp}-${i}`}
                className={`rounded-lg px-2.5 py-2 text-xs font-mono border transition-all duration-200 ${
                  i % 2 === 0
                    ? "bg-slate-800/30 border-slate-700/30"
                    : "bg-slate-800/50 border-slate-700/40"
                }`}
              >
                <div className="flex justify-between text-slate-500 mb-0.5">
                  <span className="text-cyan-400/50">#{cmd.robotId}</span>
                  <span>
                    {new Date(cmd.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <div className="text-slate-300">
                  {stateLabel(cmd.state)}{" "}
                  <span className="text-slate-600">/</span>{" "}
                  {taskLabel(cmd.task)}
                  {cmd.posX !== undefined && (
                    <span className="text-slate-500 ml-1">
                      pos({cmd.posX}, {cmd.posY})
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
