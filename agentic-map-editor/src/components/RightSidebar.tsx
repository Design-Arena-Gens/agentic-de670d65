'use client';

import { useMemo } from "react";
import { useEditorStore } from "@/store/useEditorStore";
import { useRecorder } from "@/hooks/useRecorder";
import { AssetPreview } from "@/components/AssetPreview";

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

export const RightSidebar = () => {
  const {
    map,
    effects,
    timeline,
    meta,
    setBlur,
    toggleParticles,
    setParticleDensity,
    setParticleSize,
    toggleCameraShake,
    setCameraShakeIntensity,
    setCameraShakeFrequency,
    toggleAdaptiveQuality,
    hydrate,
  } = useEditorStore((state) => ({
    map: state.map,
    effects: state.effects,
    timeline: state.timeline,
    meta: state.meta,
    setBlur: state.setBlur,
    toggleParticles: state.toggleParticles,
    setParticleDensity: state.setParticleDensity,
    setParticleSize: state.setParticleSize,
    toggleCameraShake: state.toggleCameraShake,
    setCameraShakeIntensity: state.setCameraShakeIntensity,
    setCameraShakeFrequency: state.setCameraShakeFrequency,
    toggleAdaptiveQuality: state.toggleAdaptiveQuality,
    hydrate: state.hydrate,
  }));

  const { isRecording, downloadUrl, error, startRecording, stopRecording, reset } = useRecorder();

  const exportProject = () => {
    const state = useEditorStore.getState();
    const blob = new Blob([JSON.stringify(state, null, 2)], {
      type: "application/json",
    });
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    downloadBlob(blob, `${meta.name.replace(/\s+/g, "-").toLowerCase()}-${timestamp}.json`);
  };

  const onImportProject = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    try {
      const data = JSON.parse(text);
      hydrate(data);
    } catch (caught) {
      console.error("Failed to import project", caught);
    }
  };

  const tutorials = useMemo(
    () => [
      {
        id: "intro",
        title: "Orbiting a location",
        steps: ["Set two keyframes on Camera layer", "Adjust bearing and pitch", "Preview animation"],
      },
      {
        id: "highlight",
        title: "Highlight countries",
        steps: ["Enter ISO codes", "Customize color & glow", "Add camera dolly"],
      },
      {
        id: "export",
        title: "Render video",
        steps: ["Press Record", "Play the timeline", "Download WebM file"],
      },
    ],
    [],
  );

  return (
    <aside
      className="panel scroll-y"
      style={{
        gridArea: "sidebar-right",
        padding: 20,
        display: "flex",
        flexDirection: "column",
        gap: 24,
      }}
    >
      <section>
        <h2
          style={{
            marginBottom: 12,
            fontSize: 14,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: 1.2,
            color: "var(--text-secondary)",
          }}
        >
          Model Preview
        </h2>
        <AssetPreview />
      </section>

      <section>
        <h2
          style={{
            marginBottom: 12,
            fontSize: 14,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: 1.2,
            color: "var(--text-secondary)",
          }}
        >
          Effects
        </h2>
        <label
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}
        >
          <span style={{ fontSize: 12, color: "var(--text-secondary)", letterSpacing: 1 }}>
            Blur
          </span>
          <input
            type="range"
            min={0}
            max={30}
            value={effects.blur}
            onChange={(event) => setBlur(Number(event.target.value))}
          />
        </label>

        <div
          style={{
            marginTop: 16,
            display: "grid",
            gap: 10,
          }}
        >
          <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}>
            <input
              type="checkbox"
              checked={effects.particles.enabled}
              onChange={(event) => toggleParticles(event.target.checked)}
            />
            Particle overlay
          </label>
          <label
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 6,
            }}
          >
            <span style={{ fontSize: 12, color: "var(--text-secondary)", letterSpacing: 1 }}>
              Density
            </span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={effects.particles.density}
              onChange={(event) => setParticleDensity(Number(event.target.value))}
            />
          </label>
          <label
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 6,
            }}
          >
            <span style={{ fontSize: 12, color: "var(--text-secondary)", letterSpacing: 1 }}>
              Particle size
            </span>
            <input
              type="range"
              min={1}
              max={4}
              step={0.1}
              value={effects.particles.size}
              onChange={(event) => setParticleSize(Number(event.target.value))}
            />
          </label>
        </div>

        <div
          style={{
            marginTop: 16,
            display: "grid",
            gap: 10,
          }}
        >
          <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}>
            <input
              type="checkbox"
              checked={effects.cameraShake.enabled}
              onChange={(event) => toggleCameraShake(event.target.checked)}
            />
            Camera shake
          </label>
          <label
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 6,
            }}
          >
            <span style={{ fontSize: 12, color: "var(--text-secondary)", letterSpacing: 1 }}>
              Intensity
            </span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={effects.cameraShake.intensity}
              onChange={(event) => setCameraShakeIntensity(Number(event.target.value))}
            />
          </label>
          <label
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 6,
            }}
          >
            <span style={{ fontSize: 12, color: "var(--text-secondary)", letterSpacing: 1 }}>
              Frequency
            </span>
            <input
              type="range"
              min={0}
              max={2}
              step={0.05}
              value={effects.cameraShake.frequency}
              onChange={(event) => setCameraShakeFrequency(Number(event.target.value))}
            />
          </label>

          <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}>
            <input
              type="checkbox"
              checked={map.adaptiveQuality}
              onChange={() => toggleAdaptiveQuality()}
            />
            Adaptive quality
          </label>
        </div>
      </section>

      <section>
        <h2
          style={{
            marginBottom: 12,
            fontSize: 14,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: 1.2,
            color: "var(--text-secondary)",
          }}
        >
          Export
        </h2>
        <div
          style={{
            display: "grid",
            gap: 12,
          }}
        >
          <button
            onClick={() => (isRecording ? stopRecording() : startRecording())}
            style={{
              borderRadius: 14,
              padding: "12px 16px",
              background: isRecording ? "rgba(255, 107, 107, 0.2)" : "var(--accent)",
              color: isRecording ? "var(--danger)" : "#021126",
              fontWeight: 600,
              border: "1px solid rgba(77,168,255,0.3)",
              boxShadow: "0 12px 32px rgba(77,168,255,0.25)",
            }}
          >
            {isRecording ? "Stop Recording" : "Record WebM"}
          </button>
          {downloadUrl && (
            <div
              style={{
                background: "rgba(9, 16, 26, 0.6)",
                borderRadius: 12,
                border: "1px solid rgba(77,168,255,0.3)",
                padding: 12,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <span style={{ fontSize: 12 }}>Recording ready</span>
              <div style={{ display: "flex", gap: 8 }}>
                <a
                  href={downloadUrl}
                  download={`${meta.name.replace(/\s+/g, "-").toLowerCase()}.webm`}
                  style={{
                    background: "rgba(77,168,255,0.15)",
                    borderRadius: 10,
                    padding: "8px 12px",
                    color: "var(--accent)",
                    fontSize: 12,
                  }}
                  onClick={() => setTimeout(() => reset(), 100)}
                >
                  Download
                </a>
                <button
                  onClick={() => reset()}
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    borderRadius: 10,
                    padding: "8px 12px",
                    fontSize: 12,
                  }}
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}
          {error && (
            <div
              style={{
                fontSize: 12,
                color: "var(--danger)",
              }}
            >
              {error}
            </div>
          )}

          <button
            onClick={() => exportProject()}
            style={{
              borderRadius: 14,
              padding: "12px 16px",
              background: "rgba(77,168,255,0.12)",
              color: "var(--accent)",
              border: "1px solid rgba(77,168,255,0.3)",
              fontWeight: 600,
            }}
          >
            Export Project JSON
          </button>
          <label
            style={{
              borderRadius: 14,
              padding: "12px 16px",
              background: "rgba(8,13,23,0.7)",
              border: "1px solid rgba(77,168,255,0.2)",
              color: "var(--text-secondary)",
              fontSize: 12,
              display: "flex",
              justifyContent: "space-between",
              cursor: "pointer",
            }}
          >
            Import JSON
            <input
              type="file"
              accept="application/json"
              onChange={onImportProject}
              style={{ display: "none" }}
            />
          </label>

          <button
            onClick={() => {
              const element = document.querySelector("[data-capture-target]");
              if (element instanceof HTMLElement) {
                const canvas = element.querySelector("canvas") as HTMLCanvasElement | null;
                if (!canvas) return;
                canvas.toBlob((blob) => {
                  if (!blob) return;
                  downloadBlob(blob, `${meta.name.replace(/\s+/g, "-").toLowerCase()}-frame.png`);
                });
              }
            }}
            style={{
              borderRadius: 14,
              padding: "12px 16px",
              background: "rgba(77,168,255,0.08)",
              color: "var(--accent)",
              border: "1px solid rgba(77,168,255,0.2)",
              fontWeight: 600,
            }}
          >
            Capture Frame
          </button>
        </div>
      </section>

      <section>
        <h2
          style={{
            marginBottom: 12,
            fontSize: 14,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: 1.2,
            color: "var(--text-secondary)",
          }}
        >
          Tutorials
        </h2>
        <ul style={{ display: "grid", gap: 12 }}>
          {tutorials.map((tutorial) => (
            <li
              key={tutorial.id}
              style={{
                borderRadius: 16,
                background: "rgba(8, 13, 22, 0.7)",
                border: "1px solid rgba(77,168,255,0.25)",
                padding: 16,
              }}
            >
              <strong style={{ fontSize: 13, letterSpacing: 0.5 }}>{tutorial.title}</strong>
              <ul style={{ marginTop: 8, display: "grid", gap: 4 }}>
                {tutorial.steps.map((step) => (
                  <li
                    key={step}
                    style={{
                      fontSize: 12,
                      color: "var(--text-secondary)",
                      display: "flex",
                      gap: 6,
                    }}
                  >
                    <span style={{ color: "var(--accent)" }}>•</span> {step}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </section>
    </aside>
  );
};
