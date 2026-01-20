'use client';

import { useCallback, useMemo, useState } from "react";
import clsx from "clsx";
import { useDropzone } from "react-dropzone";
import { useEditorStore } from "@/store/useEditorStore";
import type { Asset } from "@/types/editor";

const renderAssetIcon = (asset: Asset) => {
  switch (asset.type) {
    case "image":
      return "🖼️";
    case "gif":
      return "🎞️";
    case "video":
      return "📹";
    case "model":
      return "🛰️";
    case "audio":
      return "🔊";
    default:
      return "📁";
  }
};

export const LeftSidebar = () => {
  const {
    map,
    assets,
    setRenderer,
    setMapStyle,
    toggleLabels,
    setHighlightCountries,
    setHighlightColor,
    toggleHighlightGlow,
    addAsset,
    removeAsset,
  } = useEditorStore((state) => ({
    map: state.map,
    assets: state.assets,
    setRenderer: state.setRenderer,
    setMapStyle: state.setMapStyle,
    toggleLabels: state.toggleLabels,
    setHighlightCountries: state.setHighlightCountries,
    setHighlightColor: state.setHighlightColor,
    toggleHighlightGlow: state.toggleHighlightGlow,
    addAsset: state.addAsset,
    removeAsset: state.removeAsset,
  }));

  const [isoInput, setIsoInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const styles = useMemo(
    () => [
      { id: "satellite", label: "Satellite" },
      { id: "hybrid", label: "Hybrid" },
      { id: "terrain", label: "Terrain" },
    ],
    [],
  );

  const onDrop = useCallback(
    async (files: File[]) => {
      setIsUploading(true);
      try {
        await Promise.all(files.map((file) => addAsset(file)));
      } finally {
        setIsUploading(false);
      }
    },
    [addAsset],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
  });

  const handleIsoSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const codes = isoInput
      .split(/[,\s]+/)
      .map((code) => code.trim().toUpperCase())
      .filter(Boolean);
    if (!codes.length) return;
    const next = Array.from(new Set([...map.highlight.isoCodes, ...codes]));
    setHighlightCountries(next);
    setIsoInput("");
  };

  return (
    <aside
      className={clsx("panel", "scroll-y")}
      style={{
        gridArea: "sidebar-left",
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
          Map Rendering
        </h2>
        <div
          style={{
            display: "grid",
            gap: 12,
          }}
        >
          <label
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 6,
            }}
          >
            <span style={{ fontSize: 12, color: "var(--text-secondary)", letterSpacing: 1 }}>
              Renderer
            </span>
            <select
              value={map.renderer}
              onChange={(event) => setRenderer(event.target.value as typeof map.renderer)}
              style={{
                background: "rgba(9, 15, 25, 0.9)",
                border: "1px solid var(--border)",
                borderRadius: 12,
                padding: "10px 12px",
                color: "var(--text-primary)",
              }}
            >
              <option value="webgpu">WebGPU</option>
              <option value="webgl">WebGL Fallback</option>
            </select>
          </label>

          <label
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 6,
            }}
          >
            <span style={{ fontSize: 12, color: "var(--text-secondary)", letterSpacing: 1 }}>
              Style
            </span>
            <div
              style={{
                display: "flex",
                gap: 8,
              }}
            >
              {styles.map((style) => (
                <button
                  key={style.id}
                  onClick={() => setMapStyle(style.id as typeof map.style)}
                  style={{
                    flex: 1,
                    padding: "10px 12px",
                    borderRadius: 12,
                    background:
                      map.style === style.id
                        ? "linear-gradient(140deg, rgba(77,168,255,0.8), rgba(109,213,250,0.6))"
                        : "rgba(10,17,26,0.7)",
                    color: map.style === style.id ? "#08111f" : "var(--text-primary)",
                    fontWeight: 600,
                    border: "1px solid rgba(77,168,255,0.3)",
                    boxShadow:
                      map.style === style.id
                        ? "0 6px 18px rgba(77,168,255,0.25)"
                        : "none",
                  }}
                >
                  {style.label}
                </button>
              ))}
            </div>
          </label>

          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              fontSize: 13,
            }}
          >
            <input
              type="checkbox"
              checked={map.showLabels}
              onChange={() => toggleLabels()}
            />
            Country labels
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
          Highlights
        </h2>
        <form
          onSubmit={handleIsoSubmit}
          style={{ display: "grid", gap: 10 }}
        >
          <label style={{ fontSize: 12, color: "var(--text-secondary)", letterSpacing: 1 }}>
            ISO codes (comma or space separated)
          </label>
          <input
            value={isoInput}
            onChange={(event) => setIsoInput(event.target.value)}
            placeholder="USA, FRA, BRA"
            style={{
              background: "rgba(11, 18, 30, 0.9)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              padding: "10px 12px",
              color: "var(--text-primary)",
            }}
          />
          <button
            type="submit"
            style={{
              background: "rgba(77,168,255,0.15)",
              borderRadius: 12,
              padding: "10px 12px",
              color: "var(--accent)",
              border: "1px solid rgba(77,168,255,0.3)",
              fontWeight: 600,
            }}
          >
            Add Highlights
          </button>
        </form>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            marginTop: 12,
          }}
        >
          {map.highlight.isoCodes.map((code) => (
            <button
              key={code}
              onClick={() =>
                setHighlightCountries(map.highlight.isoCodes.filter((next) => next !== code))
              }
              style={{
                borderRadius: 999,
                border: "1px solid rgba(77,168,255,0.4)",
                background: "rgba(9, 16, 26, 0.6)",
                padding: "6px 12px",
                color: "var(--text-primary)",
                fontSize: 12,
              }}
            >
              {code} ✕
            </button>
          ))}
          {!map.highlight.isoCodes.length && (
            <p style={{ fontSize: 12, color: "var(--text-secondary)" }}>
              No countries highlighted yet.
            </p>
          )}
        </div>

        <label
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 6,
            marginTop: 16,
          }}
        >
          <span style={{ fontSize: 12, color: "var(--text-secondary)", letterSpacing: 1 }}>
            Highlight Color
          </span>
          <input
            type="color"
            value={map.highlight.color}
            onChange={(event) => setHighlightColor(event.target.value)}
            style={{
              width: 60,
              height: 36,
              borderRadius: 12,
              border: "1px solid var(--border)",
              background: "transparent",
            }}
          />
        </label>
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginTop: 12,
            fontSize: 13,
          }}
        >
          <input
            type="checkbox"
            checked={map.highlight.glow}
            onChange={() => toggleHighlightGlow()}
          />
          Glow effect
        </label>
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
          Imports
        </h2>

        <div
          {...getRootProps()}
          style={{
            border: "1px dashed rgba(77,168,255,0.4)",
            borderRadius: 16,
            padding: 20,
            textAlign: "center",
            background: isDragActive
              ? "rgba(77,168,255,0.12)"
              : "rgba(11,18,28,0.7)",
            transition: "background 0.2s ease",
            cursor: "pointer",
          }}
        >
          <input {...getInputProps()} />
          <p style={{ fontSize: 13, marginBottom: 4 }}>Drag & drop files</p>
          <p style={{ fontSize: 12, color: "var(--text-secondary)" }}>
            OBJ, GLTF, images, videos, GIFs, audio
          </p>
          {isUploading && (
            <p style={{ fontSize: 12, marginTop: 8, color: "var(--accent)" }}>
              Importing assets…
            </p>
          )}
        </div>

        <ul
          style={{
            marginTop: 12,
            display: "grid",
            gap: 8,
          }}
        >
          {assets.map((asset) => (
            <li
              key={asset.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "rgba(9, 14, 24, 0.6)",
                border: "1px solid rgba(77,168,255,0.2)",
                borderRadius: 12,
                padding: "10px 12px",
              }}
            >
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <span style={{ fontSize: 18 }}>{renderAssetIcon(asset)}</span>
                <span>
                  <strong style={{ fontSize: 13 }}>{asset.name}</strong>
                  <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>
                    {(asset.size / 1024 / 1024).toFixed(2)} MB
                  </div>
                </span>
              </span>
              <button
                onClick={() => removeAsset(asset.id)}
                style={{
                  background: "rgba(255, 107, 107, 0.12)",
                  color: "var(--danger)",
                  borderRadius: 10,
                  padding: "6px 10px",
                  fontSize: 12,
                  border: "1px solid rgba(255,107,107,0.4)",
                }}
              >
                Remove
              </button>
            </li>
          ))}
          {!assets.length && (
            <li style={{ fontSize: 12, color: "var(--text-secondary)" }}>
              No assets imported yet.
            </li>
          )}
        </ul>
      </section>
    </aside>
  );
};
