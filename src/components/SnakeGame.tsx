"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Cell = {
  x: number;
  y: number;
};

type Direction = {
  x: number;
  y: number;
};

const GRID_SIZE = 16;
const TICK_MS = 150;
const INITIAL_SNAKE: Cell[] = [
  { x: 8, y: 8 },
  { x: 7, y: 8 },
  { x: 6, y: 8 },
];
const INITIAL_DIRECTION: Direction = { x: 1, y: 0 };

function isSameCell(a: Cell, b: Cell): boolean {
  return a.x === b.x && a.y === b.y;
}

function randomFood(snake: Cell[]): Cell {
  let next: Cell = { x: 0, y: 0 };

  do {
    next = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    };
  } while (snake.some((segment) => isSameCell(segment, next)));

  return next;
}

export default function SnakeGame() {
  const [snake, setSnake] = useState<Cell[]>(INITIAL_SNAKE);
  const [food, setFood] = useState<Cell>(() => randomFood(INITIAL_SNAKE));
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(() => {
    if (typeof window === "undefined") {
      return 0;
    }
    const storedBestScore = window.localStorage.getItem("snake-best-score");
    if (!storedBestScore) {
      return 0;
    }
    const parsed = Number(storedBestScore);
    return Number.isNaN(parsed) ? 0 : parsed;
  });
  const [status, setStatus] = useState<"idle" | "running" | "paused" | "over">(
    "idle",
  );

  const [bgMusicOn, setBgMusicOn] = useState(true);

  const directionRef = useRef<Direction>(INITIAL_DIRECTION);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const bgIntervalRef = useRef<number | null>(null);
  const bgNoteIndexRef = useRef(0);
  const bgMusicOnRef = useRef(bgMusicOn);
  bgMusicOnRef.current = bgMusicOn;

  const gameAreaRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const getAudioCtx = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
    }
    return audioCtxRef.current;
  }, []);

  const playEatSound = useCallback(() => {
    try {
      const ctx = getAudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = "square";
      osc.frequency.setValueAtTime(400, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.12);
    } catch {
      // audio not supported
    }
  }, [getAudioCtx]);

  const playGameOverSound = useCallback(() => {
    try {
      const ctx = getAudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.4);

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.4);
    } catch {
      // audio not supported
    }
  }, [getAudioCtx]);

  const BG_MELODY: number[] = useMemo(() => [
    659, 659,   0, 659,   0, 523, 659,   0,
    784,   0,   0,   0, 392,   0,   0,   0,
    523,   0,   0, 392,   0,   0, 330,   0,
      0, 440,   0, 494,   0, 466, 440,   0,
    392, 659, 784, 880,   0, 698, 784,   0,
    659,   0, 523, 587, 494,   0,   0,   0,
  ], []);

  const playBgNote = useCallback((freq: number) => {
    if (freq === 0) return;
    try {
      const ctx = getAudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = "square";
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      gain.gain.setValueAtTime(0.07, ctx.currentTime);
      gain.gain.setValueAtTime(0.07, ctx.currentTime + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.13);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.13);
    } catch {
      // audio not supported
    }
  }, [getAudioCtx]);

  const stopBgMusic = useCallback(() => {
    if (bgIntervalRef.current !== null) {
      window.clearInterval(bgIntervalRef.current);
      bgIntervalRef.current = null;
    }
  }, []);

  const startBgMusic = useCallback(() => {
    stopBgMusic();
    bgNoteIndexRef.current = 0;

    bgIntervalRef.current = window.setInterval(() => {
      if (!bgMusicOnRef.current) return;
      const note = BG_MELODY[bgNoteIndexRef.current % BG_MELODY.length];
      playBgNote(note);
      bgNoteIndexRef.current += 1;
    }, 150);
  }, [BG_MELODY, playBgNote, stopBgMusic]);

  const cellIndexes = useMemo(
    () => Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, index) => index),
    [],
  );

  const updateDirection = (nextDirection: Direction) => {
    const currentDirection = directionRef.current;
    const isReverse =
      currentDirection.x + nextDirection.x === 0 &&
      currentDirection.y + nextDirection.y === 0;

    if (isReverse) {
      return;
    }

    directionRef.current = nextDirection;
  };

  const resetGame = () => {
    directionRef.current = INITIAL_DIRECTION;
    setSnake(INITIAL_SNAKE);
    setFood(randomFood(INITIAL_SNAKE));
    setScore(0);
    setStatus("running");
    startBgMusic();
  };

  useEffect(() => {
    if (status === "over" || status === "idle") {
      stopBgMusic();
    }
    return () => {
      if (status === "running") stopBgMusic();
    };
  }, [status, stopBgMusic]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(event.key)) {
        event.preventDefault();
      }

      switch (event.key) {
        case "ArrowUp":
        case "w":
        case "W":
          updateDirection({ x: 0, y: -1 });
          break;
        case "ArrowDown":
        case "s":
        case "S":
          updateDirection({ x: 0, y: 1 });
          break;
        case "ArrowLeft":
        case "a":
        case "A":
          updateDirection({ x: -1, y: 0 });
          break;
        case "ArrowRight":
        case "d":
        case "D":
          updateDirection({ x: 1, y: 0 });
          break;
        case " ":
          if (status === "running") {
            setStatus("paused");
          } else if (status === "paused") {
            setStatus("running");
          } else {
            resetGame();
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [status]);

  useEffect(() => {
    const el = gameAreaRef.current;
    if (!el) return;

    const SWIPE_THRESHOLD = 20;

    const onTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (!touchStartRef.current) return;
      const touch = e.changedTouches[0];
      const dx = touch.clientX - touchStartRef.current.x;
      const dy = touch.clientY - touchStartRef.current.y;
      touchStartRef.current = null;

      if (Math.abs(dx) < SWIPE_THRESHOLD && Math.abs(dy) < SWIPE_THRESHOLD) return;

      if (Math.abs(dx) > Math.abs(dy)) {
        updateDirection(dx > 0 ? { x: 1, y: 0 } : { x: -1, y: 0 });
      } else {
        updateDirection(dy > 0 ? { x: 0, y: 1 } : { x: 0, y: -1 });
      }
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, []);

  useEffect(() => {
    if (status !== "running") {
      return;
    }

    const timer = window.setInterval(() => {
      setSnake((previousSnake) => {
        const head = previousSnake[0];
        const direction = directionRef.current;
        const nextHead: Cell = {
          x: (head.x + direction.x + GRID_SIZE) % GRID_SIZE,
          y: (head.y + direction.y + GRID_SIZE) % GRID_SIZE,
        };

        const willEat = isSameCell(nextHead, food);
        const bodyToCheck = willEat ? previousSnake : previousSnake.slice(0, -1);
        const collidedWithSelf = bodyToCheck.some((segment) =>
          isSameCell(segment, nextHead),
        );

        if (collidedWithSelf) {
          playGameOverSound();
          setStatus("over");
          return previousSnake;
        }

        const nextSnake = [nextHead, ...previousSnake];

        if (willEat) {
          playEatSound();
          const nextScore = score + 1;
          setScore(nextScore);
          if (nextScore > bestScore) {
            setBestScore(nextScore);
            window.localStorage.setItem("snake-best-score", String(nextScore));
          }
          setFood(randomFood(nextSnake));
          return nextSnake;
        }

        nextSnake.pop();
        return nextSnake;
      });
    }, TICK_MS);

    return () => window.clearInterval(timer);
  }, [bestScore, food, score, status]);

  const snakeCellSet = useMemo(
    () => new Set(snake.map((segment) => `${segment.x}-${segment.y}`)),
    [snake],
  );
  const snakeHead = snake[0];

  return (
    <div
      className="p-2 sm:p-3"
      style={{
        border: "2px inset #ffffff",
        backgroundColor: "#c0c0c0",
        width: "100%",
        maxWidth: "480px",
        margin: "0 auto",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "6px",
          fontSize: "clamp(12px, 3.2vw, 14px)",
        }}
      >
        <div>Score: {score}</div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span>Best: {bestScore}</span>
          <button
            onClick={() => setBgMusicOn((v) => !v)}
            title={bgMusicOn ? "Mute music" : "Unmute music"}
            style={{ fontSize: "clamp(10px, 2.8vw, 11px)", padding: "1px 6px", minWidth: 0 }}
          >
            {bgMusicOn ? "♪ On" : "♪ Off"}
          </button>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "6px",
          fontSize: "clamp(11px, 3vw, 14px)",
        }}
      >
        <div>
          Status:{" "}
          {status === "idle" && "Ready"}
          {status === "running" && "Running"}
          {status === "paused" && "Paused"}
          {status === "over" && "Game Over"}
        </div>
        <div style={{ fontSize: "clamp(9px, 2.5vw, 11px)" }}>Swipe or Arrow keys</div>
      </div>

      <div
        ref={gameAreaRef}
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: "1 / 1",
          touchAction: "none",
        }}
      >
        <div
          className="border-2 border-inset bg-black"
          style={{
            width: "100%",
            height: "100%",
            display: "grid",
            gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
            gap: "1px",
            padding: "2px",
          }}
        >
          {cellIndexes.map((index) => {
            const x = index % GRID_SIZE;
            const y = Math.floor(index / GRID_SIZE);
            const key = `${x}-${y}`;
            const isHead = snakeHead.x === x && snakeHead.y === y;
            const isSnake = snakeCellSet.has(key);
            const isFood = food.x === x && food.y === y;

            let background = "#101010";
            if (isSnake) {
              background = isHead ? "#34d399" : "#10b981";
            }
            if (isFood) {
              background = "#f97316";
            }

            return <div key={key} style={{ backgroundColor: background }} />;
          })}
        </div>

        {status === "over" && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgba(0, 0, 0, 0.7)",
              animation: "bump-fade-in 0.3s ease-out, screen-shake 0.4s 0.3s ease-out",
            }}
          >
            <div
              style={{
                color: "#ff4444",
                fontSize: "clamp(28px, 8vw, 48px)",
                fontWeight: "bold",
                fontFamily: '"MS Sans Serif", Arial, sans-serif',
                textShadow: "2px 2px 0 #000, -1px -1px 0 #000, 0 0 20px rgba(255,68,68,0.5)",
                letterSpacing: "3px",
                animation: "slam-in 0.6s cubic-bezier(0.22, 1, 0.36, 1), screen-shake 0.4s 0.3s ease-out",
              }}
            >
              GAME OVER
            </div>
            <div
              style={{
                color: "#fbbf24",
                fontSize: "clamp(14px, 4vw, 20px)",
                marginTop: "8px",
                fontFamily: '"MS Sans Serif", Arial, sans-serif',
                textShadow: "1px 1px 0 #000",
                animation: "bump-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.15s both",
              }}
            >
              Score: {score}
            </div>
            <div
              style={{
                color: "#9ca3af",
                fontSize: "clamp(11px, 3vw, 14px)",
                marginTop: "16px",
                fontFamily: '"MS Sans Serif", Arial, sans-serif',
                animation: "bump-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s both",
              }}
            >
              Press Space or click Play Again
            </div>
          </div>
        )}

        <style>{`
          @keyframes slam-in {
            0% { transform: translateY(-300%) scale(2.5) rotate(-5deg); opacity: 0; }
            50% { transform: translateY(8%) scale(1.05) rotate(1deg); opacity: 1; }
            70% { transform: translateY(-3%) scale(0.98) rotate(-0.5deg); }
            85% { transform: translateY(1%) scale(1.01); }
            100% { transform: translateY(0) scale(1) rotate(0deg); opacity: 1; }
          }
          @keyframes screen-shake {
            0%, 100% { transform: translate(0, 0); }
            10% { transform: translate(-4px, 2px); }
            20% { transform: translate(4px, -2px); }
            30% { transform: translate(-3px, -1px); }
            40% { transform: translate(3px, 2px); }
            50% { transform: translate(-2px, -1px); }
            60% { transform: translate(2px, 1px); }
            70% { transform: translate(-1px, 1px); }
            80% { transform: translate(1px, -1px); }
          }
          @keyframes bump-in {
            0% { transform: scale(0); opacity: 0; }
            60% { transform: scale(1.2); opacity: 1; }
            80% { transform: scale(0.9); }
            100% { transform: scale(1); opacity: 1; }
          }
          @keyframes bump-fade-in {
            0% { opacity: 0; }
            100% { opacity: 1; }
          }
        `}</style>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "8px",
          marginTop: "10px",
          flexWrap: "wrap",
        }}
      >
        {(status === "idle" || status === "over") && (
          <button
            onClick={resetGame}
            style={{ minHeight: "32px", padding: "4px 16px", fontSize: "clamp(12px, 3vw, 14px)" }}
          >
            {status === "over" ? "Play Again" : "Start Game"}
          </button>
        )}
        {status === "running" && (
          <button
            onClick={() => setStatus("paused")}
            style={{ minHeight: "32px", padding: "4px 16px", fontSize: "clamp(12px, 3vw, 14px)" }}
          >
            Pause
          </button>
        )}
        {status === "paused" && (
          <button
            onClick={() => setStatus("running")}
            style={{ minHeight: "32px", padding: "4px 16px", fontSize: "clamp(12px, 3vw, 14px)" }}
          >
            Resume
          </button>
        )}
        {status !== "idle" && (
          <button
            onClick={resetGame}
            style={{ minHeight: "32px", padding: "4px 16px", fontSize: "clamp(12px, 3vw, 14px)" }}
          >
            Restart
          </button>
        )}
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "4px",
          marginTop: "10px",
        }}
      >
        <button
          onClick={() => updateDirection({ x: 0, y: -1 })}
          style={{ minWidth: "48px", minHeight: "40px", fontSize: "clamp(14px, 4vw, 18px)" }}
        >
          ▲
        </button>
        <div style={{ display: "flex", gap: "4px" }}>
          <button
            onClick={() => updateDirection({ x: -1, y: 0 })}
            style={{ minWidth: "48px", minHeight: "40px", fontSize: "clamp(14px, 4vw, 18px)" }}
          >
            ◄
          </button>
          <button
            onClick={() => updateDirection({ x: 1, y: 0 })}
            style={{ minWidth: "48px", minHeight: "40px", fontSize: "clamp(14px, 4vw, 18px)" }}
          >
            ►
          </button>
        </div>
        <button
          onClick={() => updateDirection({ x: 0, y: 1 })}
          style={{ minWidth: "48px", minHeight: "40px", fontSize: "clamp(14px, 4vw, 18px)" }}
        >
          ▼
        </button>
      </div>
    </div>
  );
}
