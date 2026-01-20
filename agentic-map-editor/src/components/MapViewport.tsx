'use client';

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import type { Feature, FeatureCollection, MultiPolygon, Polygon } from "geojson";
import type { Map as MapLibreMap, GeoJSONSource, MapOptions } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { getStyle } from "@/lib/mapStyles";
import { getValueAtTime } from "@/lib/animation";
import { useEditorStore } from "@/store/useEditorStore";

type CountryFeature = Feature<Polygon | MultiPolygon, { ADMIN?: string; ISO_A3?: string }>;

const HIGHLIGHT_SOURCE_ID = "highlighted-countries";
const HIGHLIGHT_FILL_LAYER = "highlighted-countries-fill";
const HIGHLIGHT_OUTLINE_LAYER = "highlighted-countries-outline";
const LABEL_SOURCE_ID = "country-centroids";
const LABEL_LAYER_ID = "country-centroids-labels";

const PARTICLE_COUNT = 600;

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  size: number;
}

const createParticles = (width: number, height: number, size: number): Particle[] =>
  new Array(PARTICLE_COUNT).fill(0).map(() => ({
    x: Math.random() * width,
    y: Math.random() * height,
    vx: (Math.random() - 0.5) * 0.2,
    vy: (Math.random() - 0.5) * 0.2,
    life: Math.random(),
    size: size + Math.random() * size,
  }));

export const MapViewport = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationFrameRef = useRef<number | null>(null);

  const {
    map: mapSettings,
    layers,
    timeline,
    effects,
    updateCameraSnapshot,
  } = useEditorStore((state) => ({
    map: state.map,
    layers: state.layers,
    timeline: state.timeline,
    effects: state.effects,
    updateCameraSnapshot: state.updateCameraSnapshot,
  }));

  const mapLayer = useMemo(
    () => layers.find((layer) => layer.kind === "map"),
    [layers],
  );

  const [countries, setCountries] = useState<
    FeatureCollection<Polygon | MultiPolygon> | null
  >(null);

  const fetchCountries = useCallback(async () => {
    try {
      const response = await fetch("/data/countries.geojson");
      if (!response.ok) {
        throw new Error("Unable to fetch countries dataset");
      }
      const data = (await response.json()) as FeatureCollection<Polygon | MultiPolygon>;
      setCountries(data);
    } catch (error) {
      console.error("Failed to load countries dataset", error);
    }
  }, []);

  useEffect(() => {
    fetchCountries();
  }, [fetchCountries]);

  const ensureHighlightLayers = useCallback(async () => {
    const map = mapRef.current;
    if (!map) return;
    if (!map.getSource(HIGHLIGHT_SOURCE_ID)) {
      map.addSource(HIGHLIGHT_SOURCE_ID, {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [],
        },
      });
    }

    if (!map.getLayer(HIGHLIGHT_FILL_LAYER)) {
      map.addLayer({
        id: HIGHLIGHT_FILL_LAYER,
        type: "fill",
        source: HIGHLIGHT_SOURCE_ID,
        paint: {
          "fill-color": ["coalesce", ["get", "fillColor"], "#4da8ff"],
          "fill-opacity": ["coalesce", ["get", "fillOpacity"], 0.35],
        },
      });
    }

    if (!map.getLayer(HIGHLIGHT_OUTLINE_LAYER)) {
      map.addLayer({
        id: HIGHLIGHT_OUTLINE_LAYER,
        type: "line",
        source: HIGHLIGHT_SOURCE_ID,
        paint: {
          "line-color": ["coalesce", ["get", "strokeColor"], "#76c4ff"],
          "line-width": 2,
          "line-blur": 0.5,
        },
      });
    }
  }, []);

  const ensureLabelLayer = useCallback(
    (showLabels: boolean) => {
      const map = mapRef.current;
      if (!map) return;
      const hasSource = !!map.getSource(LABEL_SOURCE_ID);
      if (!showLabels) {
        if (hasSource) {
          map.removeLayer(LABEL_LAYER_ID);
          map.removeSource(LABEL_SOURCE_ID);
        }
        return;
      }

      if (!countries) return;

      const features: Feature[] = countries.features
        .map((feature) => {
          if (!feature.properties?.ISO_A3) return null;
          if (feature.geometry.type === "Polygon" || feature.geometry.type === "MultiPolygon") {
            let coordinates: number[];
            if (feature.geometry.type === "Polygon") {
              coordinates = feature.geometry.coordinates[0][0];
            } else {
              coordinates = feature.geometry.coordinates[0][0][0];
            }
            if (!coordinates) return null;
            return {
              type: "Feature",
              properties: {
                name: feature.properties?.ADMIN ?? feature.properties?.ISO_A3,
                iso: feature.properties?.ISO_A3,
              },
              geometry: {
                type: "Point",
                coordinates,
              },
            } satisfies Feature;
          }
          return null;
        })
        .filter(Boolean) as Feature[];

      if (map.getLayer(LABEL_LAYER_ID)) {
        (map.getSource(LABEL_SOURCE_ID) as GeoJSONSource).setData({
          type: "FeatureCollection",
          features,
        });
      } else {
        map.addSource(LABEL_SOURCE_ID, {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features,
          },
        });
        map.addLayer({
          id: LABEL_LAYER_ID,
          type: "symbol",
          source: LABEL_SOURCE_ID,
          layout: {
            "text-field": ["get", "name"],
            "text-font": ["Open Sans Bold"],
            "text-size": 12,
          },
          paint: {
            "text-color": "#f5f9ff",
            "text-halo-color": "rgba(9,12,20,0.8)",
            "text-halo-width": 1.6,
          },
        });
      }
    },
    [countries],
  );

  const updateHighlights = useCallback(() => {
    const { isoCodes, color, glow } = mapSettings.highlight;
    const map = mapRef.current;
    if (!map || !countries) return;
    const source = map.getSource(HIGHLIGHT_SOURCE_ID) as GeoJSONSource | undefined;
    if (!source) return;

    const features = countries.features.filter((feature) =>
      isoCodes.includes(feature.properties?.ISO_A3 ?? ""),
    ) as CountryFeature[];

    source.setData({
      type: "FeatureCollection",
      features: features.map((feature) => ({
        ...feature,
        properties: {
          ...feature.properties,
          fillColor: color,
          fillOpacity: glow ? 0.55 : 0.35,
          strokeColor: glow ? "#ffffff" : color,
        },
      })),
    });

    const outline = map.getLayer(HIGHLIGHT_OUTLINE_LAYER);
    if (outline) {
      map.setPaintProperty(
        HIGHLIGHT_OUTLINE_LAYER,
        "line-color",
        glow ? "rgba(255,255,255,0.9)" : color,
      );
      map.setPaintProperty(
        HIGHLIGHT_OUTLINE_LAYER,
        "line-blur",
        glow ? 4 : 0.5,
      );
      map.setPaintProperty(
        HIGHLIGHT_OUTLINE_LAYER,
        "line-width",
        glow ? 4 : 2,
      );
    }
  }, [countries, mapSettings.highlight]);

  const handleResize = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    map.resize();
    const canvas = overlayCanvasRef.current;
    if (!canvas) return;
    const { clientWidth, clientHeight } = canvas;
    canvas.width = clientWidth * window.devicePixelRatio;
    canvas.height = clientHeight * window.devicePixelRatio;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
    }
    particlesRef.current = createParticles(clientWidth, clientHeight, effects.particles.size);
  }, [effects.particles.size]);

  useEffect(() => {
    const init = async () => {
      if (!containerRef.current || mapRef.current) return;
      const maplibregl = await import("maplibre-gl");
      const instance = new maplibregl.Map({
        container: containerRef.current,
        style: getStyle(mapSettings.style, {
          renderer: mapSettings.renderer,
          showLabels: mapSettings.showLabels,
        }),
        cooperativeGestures: true,
        hash: false,
        center: [0, 20],
        zoom: 1.8,
        bearing: -10,
        pitch: 40,
        attributionControl: false,
      } as MapOptions);
      instance.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "top-right");
      mapRef.current = instance;

      instance.on("style.load", async () => {
        await ensureHighlightLayers();
        ensureLabelLayer(mapSettings.showLabels);
        updateHighlights();
      });

      const syncSnapshot = () => {
        const center = instance.getCenter();
        updateCameraSnapshot({
          center: [center.lng, center.lat],
          zoom: instance.getZoom(),
          pitch: instance.getPitch(),
          bearing: instance.getBearing(),
        });
      };

      instance.on("move", syncSnapshot);
      instance.on("moveend", syncSnapshot);
      syncSnapshot();
    };

    init();

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [ensureHighlightLayers, ensureLabelLayer, mapSettings.renderer, mapSettings.showLabels, mapSettings.style, updateHighlights]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.setStyle(
      getStyle(mapSettings.style, {
        renderer: mapSettings.renderer,
        showLabels: mapSettings.showLabels,
      }),
    );
    const onLoad = () => {
      ensureHighlightLayers();
      ensureLabelLayer(mapSettings.showLabels);
      updateHighlights();
    };
    map.once("style.load", onLoad);
  }, [ensureHighlightLayers, ensureLabelLayer, mapSettings.renderer, mapSettings.showLabels, mapSettings.style, updateHighlights]);

  useEffect(() => {
    ensureLabelLayer(mapSettings.showLabels);
  }, [ensureLabelLayer, mapSettings.showLabels]);

  useEffect(() => {
    if (!countries) return;
    if (mapSettings.showLabels) {
      ensureLabelLayer(true);
    }
  }, [countries, ensureLabelLayer, mapSettings.showLabels]);

  useEffect(() => {
    updateHighlights();
  }, [updateHighlights]);

  useEffect(() => {
    const handle = () => handleResize();
    window.addEventListener("resize", handle);
    handle();
    return () => window.removeEventListener("resize", handle);
  }, [handleResize]);

  useEffect(() => {
    const canvas = overlayCanvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const animate = () => {
      const { enabled, density, size } = effects.particles;
      const blur = effects.blur;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (blur > 0) {
        ctx.fillStyle = `rgba(17, 24, 39, ${blur / 100})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      if (enabled) {
        const particles = particlesRef.current;
        const particleCount = Math.floor(PARTICLE_COUNT * density);
        for (let i = 0; i < particleCount; i += 1) {
          const particle = particles[i];
          particle.x += particle.vx;
          particle.y += particle.vy;
          particle.life += 0.002;
          if (particle.x < -20) particle.x = canvas.width / window.devicePixelRatio + 20;
          if (particle.x > canvas.width / window.devicePixelRatio + 20) particle.x = -20;
          if (particle.y < -20) particle.y = canvas.height / window.devicePixelRatio + 20;
          if (particle.y > canvas.height / window.devicePixelRatio + 20) particle.y = -20;

          const alpha = 0.4 + Math.sin(particle.life * Math.PI * 2) * 0.2;
          ctx.fillStyle = `rgba(77,168,255,${alpha})`;
          const radius = (particle.size * size) / 2;
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, radius, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [effects.blur, effects.particles]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLayer) return;
    const centerKeyframes = mapLayer.keyframes.filter((kf) => kf.property === "map:center");
    const zoomKeyframes = mapLayer.keyframes.filter((kf) => kf.property === "map:zoom");
    const pitchKeyframes = mapLayer.keyframes.filter((kf) => kf.property === "map:pitch");
    const bearingKeyframes = mapLayer.keyframes.filter((kf) => kf.property === "map:bearing");

    const center = getValueAtTime<[number, number]>(centerKeyframes, timeline.currentTime);
    const zoom = getValueAtTime<number>(zoomKeyframes, timeline.currentTime);
    const pitch = getValueAtTime<number>(pitchKeyframes, timeline.currentTime);
    const bearing = getValueAtTime<number>(bearingKeyframes, timeline.currentTime);

    if (center) {
      map.easeTo({
        center,
        duration: mapSettings.adaptiveQuality ? 200 : 120,
        easing: (t) => t,
      });
    }
    if (typeof zoom === "number") {
      map.easeTo({
        zoom,
        duration: mapSettings.adaptiveQuality ? 200 : 120,
        easing: (t) => t,
      });
    }
    if (typeof pitch === "number") {
      map.easeTo({
        pitch,
        duration: mapSettings.adaptiveQuality ? 200 : 120,
        easing: (t) => t,
      });
    }
    if (typeof bearing === "number") {
      map.easeTo({
        bearing,
        duration: mapSettings.adaptiveQuality ? 200 : 120,
        easing: (t) => t,
      });
    }
  }, [mapLayer, mapSettings.adaptiveQuality, timeline.currentTime]);

  useEffect(() => {
    if (!mapSettings.adaptiveQuality) return;
    const canvas = containerRef.current?.querySelector("canvas") as HTMLCanvasElement | null;
    if (!canvas) return;
    canvas.style.willChange = timeline.isPlaying ? "transform" : "auto";
    return () => {
      canvas.style.willChange = "auto";
    };
  }, [mapSettings.adaptiveQuality, timeline.isPlaying]);

  return (
    <div className="panel" style={{ gridArea: "viewport", position: "relative" }}>
      <div
        ref={containerRef}
        data-capture-target
        style={{
          width: "100%",
          height: "100%",
          filter: `blur(${effects.blur / 10}px)`,
          transition: "filter 120ms ease",
        }}
      />
      <canvas
        ref={overlayCanvasRef}
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          mixBlendMode: "screen",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 16,
          bottom: 16,
          padding: "8px 16px",
          borderRadius: 999,
          background: "rgba(9, 14, 24, 0.7)",
          border: "1px solid rgba(77, 168, 255, 0.2)",
          backdropFilter: "blur(12px)",
          fontSize: 12,
          letterSpacing: 2,
          textTransform: "uppercase",
        }}
      >
        WEBGPU {mapSettings.renderer === "webgpu" ? "ENABLED" : "FALLBACK"}
      </div>
    </div>
  );
};
