"use client";
import { useState, useEffect } from "react";

export default function LoadingScreen({
  onFinished,
}: {
  onFinished: () => void;
}) {
  const [percent, setPercent] = useState(0);
  // const [logs, setLogs] = useState<string[]>([]);

  const bootMessages = [
    "Searching for BANANA_DRIVE...",
    "Memory Test: 640K OK",
    "Initializing Y2K_CORE.SYS",
    "Loading graphical interface...",
    "Bypassing security protocols...",
    "READY.",
  ];

  const visibleLogs = bootMessages.filter((_, i) => {
    // Every 16.7% of progress
    const threshold = (i + 1) * (100 / bootMessages.length);
    return percent >= threshold;
  });

  // useEffect(() => { ... }, [])
  // setInterval(function, delay);
  // setTimeout(function, delay); the function would be executed after 1s dealy
  useEffect(() => {
    const interval = setInterval(() => {
      //1. This is the "Function" part (run setPercent logic)
      setPercent((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(onFinished, 1000);
          return 100;
        }
        return prev + 1; // The increment: if current percent (referred to as prev) < 100
      });
    }, 40); // 2. This is the "Delay" part (40ms).

    return () => clearInterval(interval);
  }, [onFinished]);

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center font-mono p-4">
      <div className="w-full max-w-md">
        {/* Retro Header */}
        <div className="text-[#00FF00] mb-8 text-sm uppercase tracking-widest">
          Banana OS v1.0.2 - 2026
        </div>

        {/* Scrolling Logs */}
        <div className="h-32 mb-4 text-[#00FF00] text-xs overflow-hidden">
          {visibleLogs.map((log, i) => (
            <div key={i}>{log}</div>
          ))}
        </div>

        {/* 98.css Progress Bar */}
        <div className="window w-full">
          <div className="title-bar">
            <div className="title-bar-text">System Booting...</div>
          </div>
          <div className="window-body">
            <div role="progressbar" className="marquee">
              <div style={{ width: `${percent}%` }}></div>
            </div>
            <div className="mt-2 text-right text-xs uppercase">
              {percent}% Complete
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
