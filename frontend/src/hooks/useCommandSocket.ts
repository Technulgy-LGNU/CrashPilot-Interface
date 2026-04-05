import { useState, useEffect, useRef, useCallback } from "react";
import protobuf from "protobufjs";

export interface SentCommand {
  robotId: number;
  state: number;
  task: number;
  posX?: number;
  posY?: number;
  orientation?: number;
  kickOrient?: number;
  timestamp: number;
}

const root = protobuf.Root.fromJSON({
  nested: {
    Vector2: {
      fields: {
        x: { type: "float", id: 1, rule: "required" },
        y: { type: "float", id: 2, rule: "required" },
      },
    },
    CP_State: {
      values: {
        STATE_UNSPECIFIED: 0,
        STATE_HALT: 1,
        STATE_STOP: 2,
        STATE_FREE: 3,
        STATE_GOALIE: 4,
      },
    },
    CP_Task: {
      values: {
        TASK_UNSPECIFIED: 0,
        TASK_POS: 1,
        TASK_KICK: 2,
        TASK_CHIP: 3,
        TASK_REC_KICK: 4,
        TASK_STEAL: 5,
        TASK_DRIBBLE: 6,
        TASK_PosBall: 7,
        TASK_RecBall: 8,
        STATE_KICKOFF: 9,
        STATE_BALLPLACEMENT: 10,
        STATE_FREEKICK: 11,
      },
    },
    CP_Command: {
      fields: {
        state: { type: "CP_State", id: 1, rule: "required" },
        task: { type: "CP_Task", id: 2, rule: "required" },
        pos: { type: "Vector2", id: 3 },
        orientation: { type: "float", id: 4 },
        kick_orient: { type: "float", id: 5 },
      },
    },
    CP_Interface: {
      fields: {
        robot_id: { type: "uint32", id: 1, rule: "required" },
        command: { type: "CP_Command", id: 2, rule: "required" },
      },
    },
  },
});

const CP_Interface = root.lookupType("CP_Interface");

const RECONNECT_DELAY = 2000;
const MAX_HISTORY = 10;

export function useCommandSocket() {
  const [connected, setConnected] = useState(false);
  const [lastSentCommand, setLastSentCommand] = useState<SentCommand | null>(
    null
  );
  const [commandHistory, setCommandHistory] = useState<SentCommand[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const url = `${protocol}//${window.location.host}/ws/command`;

    try {
      const ws = new WebSocket(url);
      ws.binaryType = "arraybuffer";
      wsRef.current = ws;

      ws.onopen = () => setConnected(true);
      ws.onerror = () => console.error("Command WebSocket error");
      ws.onclose = () => {
        setConnected(false);
        wsRef.current = null;
        reconnectTimerRef.current = setTimeout(connect, RECONNECT_DELAY);
      };
    } catch {
      reconnectTimerRef.current = setTimeout(connect, RECONNECT_DELAY);
    }
  }, []);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, [connect]);

  const sendCommand = useCallback(
    (
      robotId: number,
      state: number,
      task: number,
      posX?: number,
      posY?: number,
      orientation?: number,
      kickOrient?: number
    ) => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        console.error("Command WebSocket not connected");
        return;
      }

      const command: Record<string, unknown> = { state, task };
      if (posX !== undefined && posY !== undefined) {
        command.pos = { x: posX, y: posY };
      }
      if (orientation !== undefined) {
        command.orientation = orientation;
      }
      if (kickOrient !== undefined) {
        command.kick_orient = kickOrient;
      }

      const payload = {
        robot_id: robotId,
        command,
      };

      const errMsg = CP_Interface.verify(payload);
      if (errMsg) {
        console.error("Protobuf verification failed:", errMsg);
        return;
      }

      const message = CP_Interface.create(payload);
      const buffer = CP_Interface.encode(message).finish();
      wsRef.current.send(buffer);

      const sent: SentCommand = {
        robotId,
        state,
        task,
        posX,
        posY,
        orientation,
        kickOrient,
        timestamp: Date.now(),
      };

      setLastSentCommand(sent);
      setCommandHistory((prev) => [sent, ...prev].slice(0, MAX_HISTORY));
    },
    []
  );

  return { sendCommand, connected, lastSentCommand, commandHistory };
}
