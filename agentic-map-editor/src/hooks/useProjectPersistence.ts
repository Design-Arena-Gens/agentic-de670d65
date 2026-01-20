'use client';

import { useEffect } from "react";
import localforage from "localforage";
import type { ProjectState } from "@/types/editor";
import { useEditorStore } from "@/store/useEditorStore";

const STORAGE_KEY = "agentic-map-editor:project";

localforage.config({
  name: "agentic-map-editor",
  storeName: "projects",
});

export const useProjectPersistence = () => {
  useEffect(() => {
    let mounted = true;
    localforage
      .getItem<ProjectState>(STORAGE_KEY)
      .then((data) => {
        if (!data || !mounted) return;
        const current = useEditorStore.getState();
        useEditorStore.getState().hydrate({
          ...data,
          meta: {
            ...data.meta,
            updatedAt: Date.now(),
          },
          timeline: {
            ...current.timeline,
            ...data.timeline,
            isPlaying: false,
            currentTime: 0,
          },
        });
      })
      .catch((error) => {
        console.warn("Unable to hydrate project", error);
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const unsubscribe = useEditorStore.subscribe((state) => {
      const project: ProjectState = {
        meta: state.meta,
        map: state.map,
        effects: state.effects,
        assets: state.assets,
        timeline: state.timeline,
        layers: state.layers,
        tutorialsCompleted: state.tutorialsCompleted,
        cameraSnapshot: state.cameraSnapshot,
      };
      localforage.setItem(STORAGE_KEY, project).catch((error) => {
        console.warn("Unable to persist project", error);
      });
    });

    return () => {
      unsubscribe();
    };
  }, []);
};
