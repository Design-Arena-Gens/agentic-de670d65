export type RendererType = "webgl" | "webgpu";

export type MapStyleId = "satellite" | "hybrid" | "terrain";

export type AssetType = "image" | "video" | "gif" | "model" | "audio";

export interface Asset {
  id: string;
  name: string;
  type: AssetType;
  size: number;
  createdAt: number;
  objectUrl?: string;
  src?: string;
  metadata?: Record<string, unknown>;
}

export type KeyframeProperty =
  | "map:zoom"
  | "map:center"
  | "map:pitch"
  | "map:bearing"
  | "map:highlightIntensity"
  | "effect:blur"
  | "effect:particles"
  | "effect:camera"
  | "asset:opacity"
  | "asset:position"
  | "asset:scale"
  | "asset:rotation";

export interface Keyframe {
  id: string;
  time: number;
  property: KeyframeProperty;
  value: unknown;
  easing?: "linear" | "easeIn" | "easeOut" | "easeInOut";
}

export type TimelineLayerKind = "map" | "effect" | "asset" | "audio";

export interface TimelineLayer {
  id: string;
  name: string;
  kind: TimelineLayerKind;
  muted: boolean;
  solo: boolean;
  visible: boolean;
  color: string;
  keyframes: Keyframe[];
  assetId?: string;
}

export interface MapHighlight {
  isoCodes: string[];
  color: string;
  glow: boolean;
}

export interface EffectSettings {
  blur: number;
  particles: {
    enabled: boolean;
    density: number;
    size: number;
  };
  cameraShake: {
    enabled: boolean;
    intensity: number;
    frequency: number;
  };
}

export interface MapSettings {
  renderer: RendererType;
  style: MapStyleId;
  showLabels: boolean;
  highlight: MapHighlight;
  adaptiveQuality: boolean;
}

export interface TimelineState {
  duration: number;
  currentTime: number;
  isPlaying: boolean;
  playbackRate: number;
}

export interface CameraSnapshot {
  center: [number, number];
  zoom: number;
  pitch: number;
  bearing: number;
}

export interface ProjectMeta {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  description?: string;
}

export interface ProjectState {
  meta: ProjectMeta;
  map: MapSettings;
  effects: EffectSettings;
  assets: Asset[];
  timeline: TimelineState;
  layers: TimelineLayer[];
  tutorialsCompleted: string[];
  cameraSnapshot: CameraSnapshot;
}
