'use client';

import { useMemo } from "react";
import { useEditorStore } from "@/store/useEditorStore";

const formatTimecode = (seconds: number) => {
  const total = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(total / 60)
    .toString()
    .padStart(2, "0");
  const secs = (total % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
};

export const TopToolbar = () => {
  const {
    meta,
    timeline,
    play,
    pause,
    seek,
    setPlaybackRate,
    setDuration,
  } = useEditorStore((state) => ({
    meta: state.meta,
    timeline: state.timeline,
    play: state.play,
    pause: state.pause,
    seek: state.seek,
    setPlaybackRate: state.setPlaybackRate,
    setDuration: state.setDuration,
  }));

  const playButtonLabel = useMemo(
    () => (timeline.isPlaying ? "Pause" : "Play"),
    [timeline.isPlaying],
  );

  return (
    <header
      className="panel"
      style={{
        gridArea: "toolbar",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 20px",
        gap: 16,
        backdropFilter: "blur(20px)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: "linear-gradient(140deg, #4da8ff, #6dd5fa)",
            display: "grid",
            placeItems: "center",
            fontWeight: 700,
            letterSpacing: -0.5,
          }}
        >
          MAP
        </div>
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: 18,
              fontWeight: 600,
            }}
          >
            {meta.name}
          </h1>
          <p
            style={{
              margin: 0,
              fontSize: 12,
              color: "var(--text-secondary)",
              letterSpacing: 0.5,
            }}
          >
            Satellite Video Editor · {timeline.duration}s
          </p>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <button
          onClick={() => (timeline.isPlaying ? pause() : play())}
          style={{
            background: "var(--accent)",
            color: "#020817",
            padding: "10px 18px",
            borderRadius: 12,
            fontWeight: 600,
            boxShadow: "0 8px 24px rgba(77, 168, 255, 0.25)",
          }}
        >
          {playButtonLabel}
        </button>
        <button
          onClick={() => seek(Math.max(0, timeline.currentTime - 1))}
          style={{
            background: "rgba(77,168,255,0.12)",
            color: "var(--text-primary)",
            padding: "8px 14px",
            borderRadius: 12,
          }}
        >
          -1s
        </button>
        <button
          onClick={() => seek(Math.min(timeline.duration, timeline.currentTime + 1))}
          style={{
            background: "rgba(77,168,255,0.12)",
            color: "var(--text-primary)",
            padding: "8px 14px",
            borderRadius: 12,
          }}
        >
          +1s
        </button>
        <div
          style={{
            minWidth: 140,
            padding: "10px 16px",
            borderRadius: 12,
            background: "rgba(10,16,24,0.8)",
            border: "1px solid var(--border)",
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          <span
            style={{
              fontSize: 11,
              textTransform: "uppercase",
              color: "var(--text-secondary)",
              letterSpacing: 1,
            }}
          >
            Timecode
          </span>
          <strong style={{ fontSize: 18, letterSpacing: 1 }}>
            {formatTimecode(timeline.currentTime)}
          </strong>
        </div>
        <div
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
          }}
        >
          <label
            style={{
              fontSize: 11,
              textTransform: "uppercase",
              color: "var(--text-secondary)",
              letterSpacing: 1,
            }}
          >
            FPS
            <input
              type="number"
              min={12}
              max={120}
              value={timeline.playbackRate * 24}
              onChange={(event) => setPlaybackRate(Number(event.target.value) / 24)}
              style={{
                marginLeft: 8,
                width: 64,
                background: "transparent",
                border: "1px solid var(--border)",
                borderRadius: 10,
                padding: "6px 8px",
                color: "var(--text-primary)",
              }}
            />
          </label>
        </div>
        <div
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
          }}
        >
          <label
            style={{
              fontSize: 11,
              textTransform: "uppercase",
              color: "var(--text-secondary)",
              letterSpacing: 1,
            }}
          >
            Duration
            <input
              type="number"
              min={5}
              max={180}
              value={timeline.duration}
              onChange={(event) => setDuration(Number(event.target.value))}
              style={{
                marginLeft: 8,
                width: 80,
                background: "transparent",
                border: "1px solid var(--border)",
                borderRadius: 10,
                padding: "6px 8px",
                color: "var(--text-primary)",
              }}
            />
          </label>
        </div>
      </div>
    </header>
  );
};
