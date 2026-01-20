'use client';

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { nanoid } from "nanoid";
import type {
  Asset,
  AssetType,
  CameraSnapshot,
  Keyframe,
  KeyframeProperty,
  MapStyleId,
  ProjectState,
  RendererType,
  TimelineLayer,
} from "@/types/editor";

type EditorStore = ProjectState & {
  setRenderer: (renderer: RendererType) => void;
  setMapStyle: (style: MapStyleId) => void;
  toggleLabels: () => void;
  setHighlightCountries: (isoCodes: string[]) => void;
  setHighlightColor: (color: string) => void;
  toggleHighlightGlow: () => void;
  setBlur: (blur: number) => void;
  toggleParticles: (enabled: boolean) => void;
  setParticleDensity: (density: number) => void;
  setParticleSize: (size: number) => void;
  toggleCameraShake: (enabled: boolean) => void;
  setCameraShakeIntensity: (value: number) => void;
  setCameraShakeFrequency: (value: number) => void;
  toggleAdaptiveQuality: () => void;
  addAsset: (file: File, typeOverride?: AssetType) => Promise<Asset>;
  removeAsset: (assetId: string) => void;
  attachAssetToLayer: (layerId: string, assetId: string) => void;
  addLayer: (kind: TimelineLayer["kind"], name?: string) => TimelineLayer;
  removeLayer: (layerId: string) => void;
  addKeyframe: (layerId: string, property: KeyframeProperty, time: number, value: unknown) => Keyframe;
  updateKeyframe: (layerId: string, keyframeId: string, partial: Partial<Keyframe>) => void;
  removeKeyframe: (layerId: string, keyframeId: string) => void;
  setDuration: (duration: number) => void;
  seek: (time: number) => void;
  play: () => void;
  pause: () => void;
  setPlaybackRate: (rate: number) => void;
  markTutorialComplete: (id: string) => void;
  hydrate: (project: ProjectState) => void;
  updateCameraSnapshot: (snapshot: CameraSnapshot) => void;
};

const colors = ["#4da8ff", "#42f59e", "#ffd166", "#f77f00", "#c792ea", "#6c5ce7"];

const createInitialState = (): ProjectState => ({
  meta: {
    id: nanoid(),
    name: "Untitled Map Video",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  map: {
    renderer: typeof window !== "undefined" && navigator.gpu ? "webgpu" : "webgl",
    style: "satellite",
    showLabels: true,
    highlight: {
      isoCodes: [],
      color: "#4da8ff",
      glow: true,
    },
    adaptiveQuality: true,
  },
  effects: {
    blur: 0,
    particles: {
      enabled: false,
      density: 0.5,
      size: 2,
    },
    cameraShake: {
      enabled: false,
      intensity: 0.4,
      frequency: 0.6,
    },
  },
  timeline: {
    duration: 30,
    currentTime: 0,
    isPlaying: false,
    playbackRate: 1,
  },
  cameraSnapshot: {
    center: [0, 20],
    zoom: 1.8,
    pitch: 40,
    bearing: -10,
  },
  assets: [],
  layers: [
    {
      id: nanoid(),
      name: "Camera",
      kind: "map",
      muted: false,
      solo: false,
      visible: true,
      color: colors[0],
      keyframes: [
        {
          id: nanoid(),
          time: 0,
          property: "map:center",
          value: [0, 20],
          easing: "easeInOut",
        },
        {
          id: nanoid(),
          time: 30,
          property: "map:center",
          value: [120, 10],
          easing: "easeInOut",
        },
      ],
    },
  ],
  tutorialsCompleted: [],
});

const detectAssetType = (file: File, override?: AssetType): AssetType => {
  if (override) return override;
  if (file.type.startsWith("image/")) return file.type === "image/gif" ? "gif" : "image";
  if (file.type.startsWith("video/")) return "video";
  if (file.type.startsWith("audio/")) return "audio";
  if (file.name.endsWith(".gltf") || file.name.endsWith(".glb") || file.name.endsWith(".obj")) {
    return "model";
  }
  return "image";
};

export const useEditorStore = create<EditorStore>()(
  devtools((set, get) => ({
    ...createInitialState(),
    setRenderer: (renderer) =>
      set((state) => ({
        map: {
          ...state.map,
          renderer,
        },
      })),
    setMapStyle: (style) =>
      set((state) => ({
        map: {
          ...state.map,
          style,
        },
      })),
    toggleLabels: () =>
      set((state) => ({
        map: {
          ...state.map,
          showLabels: !state.map.showLabels,
        },
      })),
    setHighlightCountries: (isoCodes) =>
      set((state) => ({
        map: {
          ...state.map,
          highlight: {
            ...state.map.highlight,
            isoCodes,
          },
        },
      })),
    setHighlightColor: (color) =>
      set((state) => ({
        map: {
          ...state.map,
          highlight: {
            ...state.map.highlight,
            color,
          },
        },
      })),
    toggleHighlightGlow: () =>
      set((state) => ({
        map: {
          ...state.map,
          highlight: {
            ...state.map.highlight,
            glow: !state.map.highlight.glow,
          },
        },
      })),
    setBlur: (blur) =>
      set((state) => ({
        effects: {
          ...state.effects,
          blur,
        },
      })),
    toggleParticles: (enabled) =>
      set((state) => ({
        effects: {
          ...state.effects,
          particles: {
            ...state.effects.particles,
            enabled,
          },
        },
      })),
    setParticleDensity: (density) =>
      set((state) => ({
        effects: {
          ...state.effects,
          particles: {
            ...state.effects.particles,
            density,
          },
        },
      })),
    setParticleSize: (size) =>
      set((state) => ({
        effects: {
          ...state.effects,
          particles: {
            ...state.effects.particles,
            size,
          },
        },
      })),
    toggleCameraShake: (enabled) =>
      set((state) => ({
        effects: {
          ...state.effects,
          cameraShake: {
            ...state.effects.cameraShake,
            enabled,
          },
        },
      })),
    setCameraShakeIntensity: (value) =>
      set((state) => ({
        effects: {
          ...state.effects,
          cameraShake: {
            ...state.effects.cameraShake,
            intensity: value,
          },
        },
      })),
    setCameraShakeFrequency: (value) =>
      set((state) => ({
        effects: {
          ...state.effects,
          cameraShake: {
            ...state.effects.cameraShake,
            frequency: value,
          },
        },
      })),
    toggleAdaptiveQuality: () =>
      set((state) => ({
        map: {
          ...state.map,
          adaptiveQuality: !state.map.adaptiveQuality,
        },
      })),
    addAsset: async (file, typeOverride) => {
      const type = detectAssetType(file, typeOverride);
      const objectUrl = URL.createObjectURL(file);
      const asset: Asset = {
        id: nanoid(),
        name: file.name,
        type,
        size: file.size,
        createdAt: Date.now(),
        objectUrl,
      };

      set((state) => ({
        assets: [...state.assets, asset],
        meta: {
          ...state.meta,
          updatedAt: Date.now(),
        },
      }));

      return asset;
    },
    removeAsset: (assetId) => {
      const asset = get().assets.find((a) => a.id === assetId);
      if (asset?.objectUrl) {
        URL.revokeObjectURL(asset.objectUrl);
      }

      set((state) => ({
        assets: state.assets.filter((a) => a.id !== assetId),
        layers: state.layers.map((layer) =>
          layer.assetId === assetId ? { ...layer, assetId: undefined } : layer,
        ),
        meta: {
          ...state.meta,
          updatedAt: Date.now(),
        },
      }));
    },
    attachAssetToLayer: (layerId, assetId) =>
      set((state) => ({
        layers: state.layers.map((layer) =>
          layer.id === layerId
            ? {
                ...layer,
                assetId,
              }
            : layer,
        ),
      })),
    addLayer: (kind, name) => {
      const layer: TimelineLayer = {
        id: nanoid(),
        name: name ?? `${kind.charAt(0).toUpperCase()}${kind.slice(1)} ${get().layers.length + 1}`,
        kind,
        muted: false,
        solo: false,
        visible: true,
        color: colors[get().layers.length % colors.length],
        keyframes: [],
      };
      set((state) => ({
        layers: [...state.layers, layer],
        meta: {
          ...state.meta,
          updatedAt: Date.now(),
        },
      }));
      return layer;
    },
    removeLayer: (layerId) =>
      set((state) => ({
        layers: state.layers.filter((layer) => layer.id !== layerId),
        meta: {
          ...state.meta,
          updatedAt: Date.now(),
        },
      })),
    addKeyframe: (layerId, property, time, value) => {
      const keyframe: Keyframe = {
        id: nanoid(),
        time,
        property,
        value,
        easing: "easeInOut",
      };
      set((state) => ({
        layers: state.layers.map((layer) =>
          layer.id === layerId
            ? {
                ...layer,
                keyframes: [...layer.keyframes.filter((k) => k.time !== time), keyframe].sort(
                  (a, b) => a.time - b.time,
                ),
              }
            : layer,
        ),
        meta: {
          ...state.meta,
          updatedAt: Date.now(),
        },
      }));
      return keyframe;
    },
    updateKeyframe: (layerId, keyframeId, partial) =>
      set((state) => ({
        layers: state.layers.map((layer) =>
          layer.id === layerId
            ? {
                ...layer,
                keyframes: layer.keyframes.map((kf) =>
                  kf.id === keyframeId
                    ? { ...kf, ...partial }
                    : kf,
                ),
              }
            : layer,
        ),
        meta: {
          ...state.meta,
          updatedAt: Date.now(),
        },
      })),
    removeKeyframe: (layerId, keyframeId) =>
      set((state) => ({
        layers: state.layers.map((layer) =>
          layer.id === layerId
            ? {
                ...layer,
                keyframes: layer.keyframes.filter((kf) => kf.id !== keyframeId),
              }
            : layer,
        ),
        meta: {
          ...state.meta,
          updatedAt: Date.now(),
        },
      })),
    setDuration: (duration) =>
      set((state) => ({
        timeline: {
          ...state.timeline,
          duration,
        },
      })),
    seek: (time) =>
      set((state) => ({
        timeline: {
          ...state.timeline,
          currentTime: Math.max(0, Math.min(state.timeline.duration, time)),
        },
      })),
    play: () =>
      set((state) => ({
        timeline: {
          ...state.timeline,
          isPlaying: true,
        },
      })),
    pause: () =>
      set((state) => ({
        timeline: {
          ...state.timeline,
          isPlaying: false,
        },
      })),
    setPlaybackRate: (rate) =>
      set((state) => ({
        timeline: {
          ...state.timeline,
          playbackRate: rate,
        },
      })),
    markTutorialComplete: (id) =>
      set((state) => ({
        tutorialsCompleted: Array.from(new Set([...state.tutorialsCompleted, id])),
      })),
    updateCameraSnapshot: (snapshot) =>
      set((state) => ({
        cameraSnapshot: snapshot,
        meta: {
          ...state.meta,
          updatedAt: Date.now(),
        },
      })),
    hydrate: (project) =>
      set(() => ({
        ...project,
      })),
  })),
);
