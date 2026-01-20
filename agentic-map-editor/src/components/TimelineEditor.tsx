'use client';

import { useEffect, useMemo, useRef } from "react";
import { gsap } from "gsap";
import { useEditorStore } from "@/store/useEditorStore";
import { useTimelineDriver } from "@/hooks/useTimelineDriver";

export function TimelineEditor() {
  const {
    layers,
    timeline,
    addKeyframe,
    removeKeyframe,
    seek,
    cameraSnapshot,
  } = useEditorStore((state) => ({
    layers: state.layers,
    timeline: state.timeline,
    addKeyframe: state.addKeyframe,
    removeKeyframe: state.removeKeyframe,
    seek: state.seek,
    cameraSnapshot: state.cameraSnapshot,
  }));

  useTimelineDriver();

  const trackRef = useRef<HTMLDivElement>(null);
  const playheadRef = useRef<HTMLDivElement>(null);

  const safeDuration = Math.max(timeline.duration, 0.0001);

  const scaleMarks = useMemo(() => {
    const marks: number[] = [];
    const total = Math.ceil(safeDuration);
    for (let i = 0; i <= total; i += 1) {
      marks.push(i);
    }
    return marks;
  }, [safeDuration]);

  useEffect(() => {
    if (!trackRef.current || !playheadRef.current) return;
    const width = trackRef.current.scrollWidth;
    const fraction = Math.min(1, timeline.currentTime / safeDuration);
    gsap.to(playheadRef.current, {
      x: fraction * width,
      duration: 0.12,
      ease: "power1.out",
    });
  }, [safeDuration, timeline.currentTime]);

  return (
    <section
      className="panel"
      style={{
        gridArea: "timeline",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "10px 20px",
          borderBottom: "1px solid rgba(77,168,255,0.16)",
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <input
          type="range"
          min={0}
          max={safeDuration}
          step={0.01}
          value={timeline.currentTime}
          onChange={(event) => seek(Number(event.target.value))}
          style={{ width: "100%" }}
        />
        <button
          onClick={() => {
            if (!layers.length) return;
            const activeLayer = layers[0];
            addKeyframe(activeLayer.id, "map:center", timeline.currentTime, cameraSnapshot.center);
          }}
          style={{
            padding: "8px 12px",
            borderRadius: 10,
            background: "rgba(77,168,255,0.12)",
            color: "var(--accent)",
            border: "1px solid rgba(77,168,255,0.3)",
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          Add Keyframe
        </button>
      </div>
      <div
        style={{
          flex: 1,
          display: "grid",
          gridTemplateColumns: "220px 1fr",
          height: "100%",
        }}
      >
        <aside
          style={{
            borderRight: "1px solid rgba(77,168,255,0.12)",
            padding: "12px 16px",
            display: "grid",
            alignContent: "start",
            gap: 12,
            background: "rgba(8, 13, 22, 0.5)",
          }}
        >
          {layers.map((layer) => (
            <div
              key={layer.id}
              style={{
                borderRadius: 12,
                padding: "10px 12px",
                background: "rgba(6, 12, 20, 0.8)",
                border: `1px solid ${layer.color}33`,
                color: "var(--text-secondary)",
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  letterSpacing: 0.4,
                }}
              >
                {layer.name}
              </div>
              <div style={{ fontSize: 11, marginTop: 4 }}>
                {layer.keyframes.length} keyframe{layer.keyframes.length !== 1 ? "s" : ""}
              </div>
            </div>
          ))}
        </aside>
        <div
          style={{
            position: "relative",
            overflow: "auto",
            padding: "12px 0",
          }}
        >
          <div
            style={{
              position: "sticky",
              top: 0,
              left: 0,
              right: 0,
              background: "rgba(8, 13, 22, 0.8)",
              backdropFilter: "blur(12px)",
              borderBottom: "1px solid rgba(77,168,255,0.1)",
              padding: "0 20px",
              display: "flex",
              gap: 20,
            }}
          >
            {scaleMarks.map((mark) => (
              <div
                key={mark}
                style={{
                  flex: "0 0 60px",
                  fontSize: 11,
                  color: "var(--text-secondary)",
                  textAlign: "center",
                  padding: "6px 0",
                }}
              >
                {mark}s
              </div>
            ))}
          </div>
          <div
            ref={trackRef}
            style={{
              position: "relative",
              padding: "20px 10px 20px 20px",
            }}
          >
            <div
              ref={playheadRef}
              style={{
                position: "absolute",
                top: 0,
                bottom: 0,
                width: 2,
                background: "var(--accent)",
                pointerEvents: "none",
                transform: "translateX(0px)",
                willChange: "transform",
              }}
            />
            <div
              style={{
                display: "grid",
                gap: 12,
              }}
            >
              {layers.map((layer) => (
                <div
                  key={layer.id}
                  style={{
                    height: 56,
                    borderRadius: 12,
                    background: "rgba(9, 14, 24, 0.6)",
                    border: `1px solid ${layer.color}33`,
                    position: "relative",
                  }}
                >
                  {layer.keyframes.map((keyframe) => (
                    <button
                      key={keyframe.id}
                      onClick={() => removeKeyframe(layer.id, keyframe.id)}
                      style={{
                        position: "absolute",
                        left: `${(keyframe.time / safeDuration) * 100}%`,
                        top: "50%",
                        transform: "translate(-50%, -50%)",
                        width: 18,
                        height: 18,
                        borderRadius: "50%",
                        background: layer.color,
                        border: "none",
                        boxShadow: "0 0 12px rgba(77,168,255,0.4)",
                        cursor: "pointer",
                      }}
                      title={`Remove keyframe @ ${keyframe.time.toFixed(2)}s`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
