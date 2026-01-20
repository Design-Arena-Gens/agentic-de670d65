'use client';

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader";
import { useEditorStore } from "@/store/useEditorStore";

export const AssetPreview = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const asset = useEditorStore((state) => state.assets.find((item) => item.type === "model"));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      45,
      canvas.clientWidth / canvas.clientHeight,
      0.1,
      100,
    );
    camera.position.set(3, 2, 3.5);

    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    const directional = new THREE.DirectionalLight(0xffffff, 1.2);
    directional.position.set(4, 6, 4);

    scene.add(ambient);
    scene.add(directional);

    const grid = new THREE.GridHelper(8, 16, 0x4da8ff, 0x1a2437);
    scene.add(grid);

    let currentObject: THREE.Object3D | null = null;
    let frameId: number;

    const resize = () => {
      if (!canvas) return;
      const { clientWidth, clientHeight } = canvas;
      renderer.setSize(clientWidth, clientHeight, false);
      camera.aspect = clientWidth / clientHeight;
      camera.updateProjectionMatrix();
    };

    const render = () => {
      frameId = requestAnimationFrame(render);
      if (currentObject) {
        currentObject.rotation.y += 0.004;
      }
      renderer.render(scene, camera);
    };

    const loadAsset = async () => {
      if (!asset?.objectUrl) return;
      if (currentObject) {
        scene.remove(currentObject);
        currentObject.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.geometry.dispose();
            if (Array.isArray(child.material)) {
              child.material.forEach((material) => material.dispose());
            } else {
              child.material.dispose();
            }
          }
        });
      }

      let object: THREE.Object3D | null = null;
      if (asset.name.endsWith(".gltf") || asset.name.endsWith(".glb")) {
        const loader = new GLTFLoader();
        const gltf = await loader.loadAsync(asset.objectUrl);
        object = gltf.scene;
      } else if (asset.name.endsWith(".obj")) {
        const loader = new OBJLoader();
        object = await loader.loadAsync(asset.objectUrl);
      }

      if (object) {
        const box = new THREE.Box3().setFromObject(object);
        const size = new THREE.Vector3();
        box.getSize(size);
        const maxDimension = Math.max(size.x, size.y, size.z);
        const scale = 2 / maxDimension;
        object.scale.set(scale, scale, scale);
        object.position.set(0, -size.y * scale * 0.5, 0);
        scene.add(object);
        currentObject = object;
      }
    };

    loadAsset();
    resize();
    render();
    window.addEventListener("resize", resize);

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(frameId);
      renderer.dispose();
      scene.clear();
    };
  }, [asset]);

  if (!asset) {
    return (
      <div
        style={{
          borderRadius: 16,
          border: "1px solid rgba(77,168,255,0.2)",
          background: "rgba(9, 16, 25, 0.6)",
          padding: 16,
          textAlign: "center",
          fontSize: 12,
          color: "var(--text-secondary)",
        }}
      >
        Import a GLTF/GLB/OBJ model to preview it here.
      </div>
    );
  }

  return (
    <div
      style={{
        borderRadius: 16,
        border: "1px solid rgba(77,168,255,0.2)",
        background: "rgba(9, 16, 25, 0.6)",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          height: 220,
          display: "block",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 12,
          left: 16,
          right: 16,
          fontSize: 12,
          color: "var(--text-secondary)",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <span>{asset.name}</span>
        <span>{(asset.size / 1024 / 1024).toFixed(2)} MB</span>
      </div>
    </div>
  );
};
